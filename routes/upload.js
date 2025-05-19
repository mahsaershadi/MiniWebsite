const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { Photo, User } = require('../models/db');
const db = require('../models/db');
const authenticateUser = require('../Middleware/auth');
const { error } = require('console');
const { where } = require('sequelize');


// Set up multer storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname); 
    }
});

const upload = multer({ storage });

//upload a photo
router.post('/upload', authenticateUser, upload.single('photo'), async (req, res) => {
    const userId = req.userId;
    const file = req.file;

    try {
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

        const newPhoto = await Photo.create({
            filename: file.filename,
            path: file.path,
            user_id: userId
        });

        res.status(201).json({ message: 'Photo uploaded successfully', photo: newPhoto });
    } catch (err) {
        console.error('Upload error:', err);
        res.status(500).json({ error: 'Server error', details: err.message });
    }
});


//get all the upload photos
router.get('/photos', async (req, res) => {
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
