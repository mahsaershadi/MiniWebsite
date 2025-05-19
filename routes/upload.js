const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { Photo } = require('../models/db');
const db = require('../models/db');
const authenticateUser = require('../Middleware/auth');

// Set up multer storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage });

// Route: upload a photo
router.post('/upload',authenticateUser, upload.single('photo'), async (req, res) => {
    const userId = req.userId;
    
    try {
        const user = await db.User.findByPk(userId);
                if (!user){
                    return res.status(404).json({ error: 'there is no user with this user id'});
                }

        const file = req.file;
        if (!file) return res.status(400).json({ error: 'No file uploaded' });

        const newPhoto = await Photo.create({
            filename: file.filename,
            path: file.path
        });

        res.status(201).json({ message: 'Photo uploaded successfully', photo: newPhoto });
    } catch (err) {
        console.error('Upload error:', err);
        res.status(500).json({ error: 'Server error', details: err.message });
    }
});

module.exports = router;
