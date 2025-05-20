const express = require('express');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const db = require('./models/db');
const JWT = require ('jsonwebtoken');
require ('dotenv').config();
const uploadRoute = require('./routes/upload');


const app = express ();

//middleware
app.use(express.json());

// ارائه فایل‌های استاتیک
app.use('/uploads', express.static('uploads'));
app.use('/thumbnails', express.static('thumbnails'));

// Sync Sequelize models
db.sequelize.sync({ force: false }) // Set force: true to drop and recreate tables (use cautiously)
    .then(() => console.log('Database synced'))
    .catch(err => console.error('Sync error:', err));

const authRouts = require('./routes/auth');
const postsRouts = require('./routes/posts');
const uploadRoutes = require('./routes/upload'); // مسیر درست
app.use('/api', authRouts);
app.use('/api', postsRouts);
app.use('/api', uploadRoutes);

app.listen(3000, () => {
    console.log('Server running on port 3000');
});