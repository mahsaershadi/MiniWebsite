const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const sharp = require('sharp');
const { Photo, User } = require('../models/db');
const db = require('../models/db');
const authenticateUser = require('../Middleware/auth');
const { error } = require('console');
const { where } = require('sequelize');


// Set up multer storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

//File size limit
const uploads = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 } //Maximum file size: 5MB
});

const uploadErrorHandler = (req, res, next) => {
    uploads(req, res, (err) => {
        if (err) {
            if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({ error: 'The file size is greater than 5 MB.' });
            }
            return res.status(400).json({ error: err.message || 'Error uploading file' });
        }
        next(); 
    });
};

const upload = multer({ storage });

//upload a photo
router.post('/upload', authenticateUser, uploads.single('photo'), async (req, res) => {
    const userId = req.userId;
    const file = req.file;

    let originalPath, webpPath, thumbnailPath;
    try {
        //check for file existing
        if (!file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        // Check if file already exists
        const existingPhoto = await Photo.findOne({
            where: {
                filename: file.filename,
                user_id: userId
            }
        });

        if (existingPhoto) {
            return res.status(409).json({ error: 'This image has already been uploaded by the same user.' });
        }


        //main file path and thumbnail
        originalPath = file.path;
        const originalFilename = file.filename;
        const webpFilename = path.parse(file.filename).name + '.webp';
        webpPath = path.join('uploads', webpFilename);
        thumbnailPath = path.join('uploads', 'thumbnails', `thumb-${webpFilename}`);

        
        //thumbnails folder
        const thumbnailDir = path.join(__dirname, '..', 'uploads', 'thumbnails');
        await fs.mkdir(thumbnailDir, { recursive: true });
        
        // Convert to .webp
        await sharp(originalPath)
            .webp({ quality: 85, effort: 6 }) 
            .toFile(webpPath);


        //Generate thumbnail with smaller size
        await sharp(originalPath)
            .resize({ width: 200 })
            .webp({ quality: 70 }) 
            .toFile(thumbnailPath);
            
            
        //delete original file
        fs.unlink(originalPath);

        // Save to DB
        const newPhoto = await Photo.create({
            filename: webpFilename,
            path: webpPath,
            user_id: userId
        });

        res.status(201).json({
            message: 'Photo uploaded successfully.',
            photo: {
                id: newPhoto.id,
                filename: newPhoto.filename,
                originalPath: `/uploads/${webpFilename}`,
                thumbnailPath: `/uploads/thumbnails/thumb-${webpFilename}`
            }
        });
    } catch (err) {
        console.error('Upload error:', err);
        //Delete temporary files if an error occurs
        if (file) await fs.unlink(file.path).catch(() => {});
        if (fs.existsSync(webpPath)) await fs.unlink(webpPath).catch(() => {});
        if (fs.existsSync(thumbnailPath)) await fs.unlink(thumbnailPath).catch(() => {});
        res.status(500).json({ error: 'Server error', details: err.message });
    }
});


//get all the upload photos
router.get('/all-photos', async (req, res) => {
    try {
        const photos = await db.Photo.findAll({
                    where: {status: 1}, 
                
                    include: [
                        { model: db.User,as: 'Author', attributes: ['username'] }
                    ],
                    order: [['uploadedat', 'DESC']]
                });

                //Add thumbnail path to each image
                const photosWithThumbnails = photos.map(photo => {
                const webpFilename = photo.filename;
                return {
                    ...photo.toJSON(),
                    originalPath: `/uploads/${webpFilename}`,
                    thumbnailPath: `/uploads/thumbnails/thumb-${webpFilename}`
                };
        });

        res.json(photosWithThumbnails);
    } catch(err) {
        console.error('Error fetching photos:', err);
        res.status(500).json({ error: 'Server error' });
    }
})

//get photos by userId in header
router.get('/photos',authenticateUser, async (req, res) => {
    console.log('Inside /photos route, userId', req.userId);
    const userId = req.userId;

    try {
        // Check for user existence
        const user = await db.User.findByPk(userId);
        if (!user){
            return res.status(404).json({ error: 'there is no user with this user id'});
        }
        
        // Find user's photos
        const photos = await db.Photo.findAll({
            where: { user_id: userId, status: 1},
            include: [
                { model: db.User,as: 'Author', attributes: ['username'] }
            ],
            order: [['uploadedat', 'DESC']]
        });
        if (photos.length === 0) {
            return res.json({ message: 'No photo found for this user' });
        }
        //Add thumbnail path to each image
        const photosWithThumbnails = photos.map(photo => {
            const webpFilename = photo.filename;
            return {
                ...photo.toJSON(),
                originalPath: `/uploads/${webpFilename}`,
                thumbnailPath: `/uploads/thumbnails/thumb-${webpFilename}`
            };
        });

        res.json(photosWithThumbnails);
    } catch (err) {
        console.error('Error in /photos route',err);
        res.status(500).json({ error: 'Server error'});
    }
});

//delete a photo
router.delete('/photos/:id', authenticateUser, async (req, res) => {
    const userId = parseInt(req.userId, 10); //from header
    const photoId = parseInt(req.params.id, 10);

    try {
        const photo = await db.Photo.findOne({
                    where: {
                        id: photoId,
                        status: 1
                    }
                });

        if (!photo) {
            return res.status(404).json({error: 'photo not found'});
        }

        // Check if the user is allowed to delete
        if (photo.user_id !== userId) {
            return res.status(403).json({ error: 'You can only delete your own photos' });
        }
        
        //main file and thumbnail
        const webpFilename = photo.filename;
        const webpPath = path.join(__dirname, '..', 'uploads', webpFilename);
        const thumbnailPath = path.join(__dirname, '..', 'uploads', 'thumbnails', `thumb-${webpFilename}`);

        //deleting main file and thumbnail
        await Promise.all([
            fs.unlink(webpPath).catch(err => console.warn('File may not exist on disk:', err.message)),
            fs.unlink(thumbnailPath).catch(err => console.warn('Thumbnail may not exist on disk:', err.message))
        ]);
            
        // Delete from DB
        await db.Photo.update(
            {status: -1},
            {
                where: {
                    id: photoId,
                    user_id: userId,
                    status: 1
                }}
        );

        res.status(200).json({ message: 'Photo deleted successfully' });
    } catch (err) {
        console.error('Delete error:', err);
        res.status(500).json({ error: 'Server error', details: err.message });
    }
});

module.exports = router;
