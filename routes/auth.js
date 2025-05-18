const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const db = require('../models/db');
const authenticateUser = require('../middleware/auth');
const { where } = require('sequelize');

//Get all users
router.get('/all-users', async (req, res) => {
    try {
        const users = await db.User.findAll({
            attributes: ['id', 'username', 'status'],
            order: [['username', 'ASC']],
            where: {
                status: 1
            }
        });
        res.json({ userCount: users.length, users: users });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Signup
router.post('/signup', [
    body('username').trim().notEmpty().withMessage('Username is required')
        .isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
    body('password').notEmpty().withMessage('Password is required')
        .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        const user = await db.User.create({ username, password: hashedPassword });
        res.status(201).json({ message: 'User created successfully', userId: user.id });
    } catch (err) {
        res.status(400).json({ error: 'Username already exists' });
    }
});

// Login
router.post('/login', [
    body('username').trim().notEmpty().withMessage('Username is required'),
    body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { username, password } = req.body;
    try {
        const user = await db.User.findOne({ where: { username } });
        if (user && await bcrypt.compare(password, user.password)) {
            res.json({ message: 'Login successful', userId: user.id });
        } else {
            res.status(401).json({ error: 'Invalid credentials' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

//delete user (account)
router.delete('/users/:id', authenticateUser, async (req, res) => {
    const userIdFromHeader = parseInt(req.userId, 10); 
    const userIdFromParams = parseInt(req.params.id, 10); 

    const transaction = await db.sequelize.transaction();

    // Check if the user is allowed to delete
    if (userIdFromHeader !== userIdFromParams) {
        return res.status(403).json({ error: 'You can only delete your own account' });
    }

    try {
        const user = await db.User.findOne({
            where: {
                id: userIdFromParams,
                status: 1
            }
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        await db.User.update(
            {status: -1},
            {where: {id: userIdFromParams}}
        );
        res.json({ message: 'User deleted successfully' });
    } catch (err) {
        console.error('Error in /users/:id DELETE route:', err);
        res.status(500).json({ error: 'Server error', details: err.message});
    }
});

module.exports = router;