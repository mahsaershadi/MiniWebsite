const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const pool = require('../models/db');

// Middleware for userId in header
const authenticateUser = (req, res, next) => {
    const userId = req.headers['user-id'];
    if (!userId) {
        return res.status(401).json({ error: 'User ID is required in header' });
    }
    req.userId = userId;
    next();
};

// Get all posts
router.get('/posts', async (req, res) => {
    try {
        const posts = await pool.query(`
            SELECT posts.*, users.username, COUNT(likes.id) as like_count
            FROM posts 
            JOIN users ON posts.user_id = users.id 
            LEFT JOIN likes ON posts.id = likes.post_id
            GROUP BY posts.id, users.username
            ORDER BY posts.created_at DESC
        `);
        res.json(posts.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Create Post API
router.post('/posts', [
    body('content').trim().notEmpty().withMessage('Content is required')
        .isLength({ max: 500 }).withMessage('Content must be less than 500 characters'),
    body('userId').notEmpty().withMessage('User ID is required')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { content, userId } = req.body;
    try {
        await pool.query(
            'INSERT INTO posts (content, user_id) VALUES ($1, $2)',
            [content, userId]
        );
        res.status(201).json({ message: 'Post created successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get Liked Posts API
router.get('/likes', async (req, res) => {
    const userId = req.query.userId;
    if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
    }

    try {
        const likes = await pool.query(`
            SELECT posts.content, posts.created_at, users.username
            FROM likes 
            JOIN posts ON likes.post_id = posts.id 
            JOIN users ON posts.user_id = users.id
            WHERE likes.user_id = $1
            ORDER BY posts.created_at DESC
        `, [userId]);
        res.json(likes.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

//Get Posts Liked by a Specific User
router.get('/posts/liked-by-user', authenticateUser, async (req, res) => {
    const userId = req.userId;

    try {
        const likedPosts = await pool.query(`
            SELECT posts.*, users.username, COUNT(likes.id) as like_count
            FROM likes
            JOIN posts ON likes.post_id = posts.id
            JOIN users ON posts.user_id = users.id
            WHERE likes.user_id = $1
            GROUP BY posts.id, users.username
            ORDER BY posts.created_at DESC
        `, [userId]);
        res.json(likedPosts.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

//Get Users Who Liked a Specific Post
router.get('/posts/liked-users/:postId', async (req, res) => {
    const postId = req.params.postId;

    try {
        const likedUsers = await pool.query(`
            SELECT users.id, users.username
            FROM likes
            JOIN users ON likes.user_id = users.id
            WHERE likes.post_id = $1
            ORDER BY users.username
        `, [postId]);
        res.json({
            postId: postId,
            userCount: likedUsers.rows.length,
            users: likedUsers.rows
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;