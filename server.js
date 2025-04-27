const express = require('express');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const { body, validationResult } = require('express-validator');
const pool = require('./models/db');

const app = express();

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(session({
    secret: 'k9z3m7p2q5x8v4n1t6r0w2j8y5h3l4f7',
    resave: false,
    saveUninitialized: false
}));
app.set('view engine', 'ejs');

// Authentication middleware
const isAuthenticated = (req, res, next) => {
    if (req.session.userId) {
        next();
    } else {
        res.redirect('/login');
    }
};

// Routes
app.get('/', isAuthenticated, async (req, res) => {
    try {
        const posts = await pool.query(`
            SELECT posts.*, users.username, COUNT(likes.id) as like_count
            FROM posts 
            JOIN users ON posts.user_id = users.id 
            LEFT JOIN likes ON posts.id = likes.post_id
            GROUP BY posts.id, users.username
            ORDER BY posts.created_at DESC
        `);
        const user = await pool.query('SELECT * FROM users WHERE id = $1', [req.session.userId]);

        // Add hasLiked status for each post
        const postsWithLikes = posts.rows.map(async post => {
            const hasLiked = await pool.query(
                'SELECT * FROM likes WHERE post_id = $1 AND user_id = $2',
                [post.id, req.session.userId]
            );
            return {
                ...post,
                hasLiked: hasLiked.rows.length > 0 // true if the user has liked the post
            };
        });

        // Wait for all hasLiked queries to resolve
        const resolvedPosts = await Promise.all(postsWithLikes);

        res.render('home', { posts: resolvedPosts, user: user.rows[0] });
    } catch (err) {
        console.error(err);
        res.redirect('/login');
    }
});

app.get('/login', (req, res) => {
    res.render('login', { errors: [] });
});

app.post('/login', [
    body('username').trim().notEmpty().withMessage('Username is required'),
    body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.render('login', { errors: errors.array() });
    }

    const { username, password } = req.body;
    try {
        const user = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
        if (user.rows.length && await bcrypt.compare(password, user.rows[0].password)) {
            req.session.userId = user.rows[0].id;
            res.redirect('/');
        } else {
            res.render('login', { errors: [{ msg: 'Invalid credentials' }] });
        }
    } catch (err) {
        console.error(err);
        res.render('login', { errors: [{ msg: 'An error occurred' }] });
    }
});

app.get('/signup', (req, res) => {
    res.render('signup', { errors: [] });
});

app.post('/signup', [
    body('username').trim().notEmpty().withMessage('Username is required')
        .isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
    body('password').notEmpty().withMessage('Password is required')
        .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.render('signup', { errors: errors.array() });
    }

    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    
    try {
        const user = await pool.query(
            'INSERT INTO users (username, password) VALUES ($1, $2) RETURNING *',
            [username, hashedPassword]
        );
        req.session.userId = user.rows[0].id;
        res.redirect('/');
    } catch (err) {
        res.render('signup', { errors: [{ msg: 'Username already exists' }] });
    }
});

app.get('/create-post', isAuthenticated, (req, res) => {
    res.render('create-post', { errors: [] });
});

app.post('/create-post', isAuthenticated, [
    body('content').trim().notEmpty().withMessage('Content is required')
        .isLength({ max: 500 }).withMessage('Content must be less than 500 characters')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.render('create-post', { errors: errors.array() });
    }

    try {
        await pool.query(
            'INSERT INTO posts (content, user_id) VALUES ($1, $2)',
            [req.body.content, req.session.userId]
        );
        res.redirect('/');
    } catch (err) {
        console.error(err);
        res.render('create-post', { errors: [{ msg: 'An error occurred' }] });
    }
});

app.post('/like/:postId', isAuthenticated, async (req, res) => {
    const postId = req.params.postId;
    const userId = req.session.userId;
    
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
        }
        res.redirect('/');
    } catch (err) {
        console.error(err);
        res.redirect('/');
    }
});

app.get('/likes', isAuthenticated, async (req, res) => {
    try {
        const likes = await pool.query(`
            SELECT posts.content, posts.created_at, users.username
            FROM likes 
            JOIN posts ON likes.post_id = posts.id 
            JOIN users ON posts.user_id = users.id
            WHERE likes.user_id = $1
            ORDER BY posts.created_at DESC
        `, [req.session.userId]);
        res.render('likes', { likes: likes.rows });
    } catch (err) {
        console.error(err);
        res.redirect('/');
    }
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

app.listen(3000, () => {
    console.log('Server running on port 3000');
});