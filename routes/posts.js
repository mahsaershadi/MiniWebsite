const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const pool = require('../models/db');

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

// Like a Post API
router.post('/like/:postId', [
    body('userId').notEmpty().withMessage('User ID is required')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const postId = req.params.postId;
    const userId = req.body.userId;

    try {
        const existingLike = await pool.query(
            'SELECT * FROM likes WHERE post_id = $1 AND user_id = $2',
            [postId, userId]
        );

        if (existingLike.rows.length === 0) {
            await pool.query(
                'INSERT INTO likes (post_id, user_id) VALUES ($1, $2)',
                [postId, userId]
            );
            res.json({ message: 'Post liked successfully' });
        } else {
            res.status(400).json({ error: 'You already liked this post' });
        }
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

module.exports = router;