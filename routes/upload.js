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

const upload = multer({ storage });

//upload a photo
router.post('/upload', authenticateUser, upload.single('photo'), async (req, res) => {
    const userId = req.userId;
    const file = req.file;

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

        // Convert to .webp
            const originalPath = file.path;
            const webpFilename = path.parse(file.filename).name + '.webp';
            const webpPath = path.join('uploads', webpFilename);

            await sharp(originalPath)
                .webp({ quality: 80 })
                .toFile(webpPath);

            // Optionally delete original file
            fs.unlinkSync(originalPath);

            // Save to DB
            const newPhoto = await Photo.create({
                filename: webpFilename,
                path: webpPath,
                user_id: userId
            });

        res.status(201).json({ message: 'Photo uploaded successfully', photo: newPhoto });
    } catch (err) {
        console.error('Upload error:', err);
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
                res.json(photos);
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
        res.json(photos);
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
        
        // Delete file from disk
        fs.unlink(photo.path, async (err) => {
            if (err) console.warn('File may not exist on disk:', err.message);
            
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
        });
    } catch (err) {
        console.error('Delete error:', err);
        res.status(500).json({ error: 'Server error', details: err.message });
    }
});

module.exports = router;
