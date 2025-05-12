const express = require('express');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const pool = require('./models/db');

const app = express ();

//middleware
app.use(express.json());

const authRouts = require('./routes/auth');
const postsRouts = require('./routes/posts');
app.use('/api', authRouts);
app.use('/api', postsRouts);

app.listen(3000, () => {
    console.log('Server running on port 3000');
});