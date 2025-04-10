const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const { body, validationResult } = require('express-validator');
const User = require('./models/User');
const Post = require('./models/Post');

const app = express();

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/mini-website', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(session({
    secret: 'your-secret-key',
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
    const posts = await Post.find().populate('user').sort({ createdAt: -1 });
    const user = await User.findById(req.session.userId);
    res.render('home', { posts, user });
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
    const user = await User.findOne({ username });
    
    if (user && await bcrypt.compare(password, user.password)) {
        req.session.userId = user._id;
        res.redirect('/');
    } else {
        res.render('login', { errors: [{ msg: 'Invalid credentials' }] });
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
        const user = new User({ username, password: hashedPassword });
        await user.save();
        req.session.userId = user._id;
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

    const post = new Post({
        content: req.body.content,
        user: req.session.userId
    });
    await post.save();
    res.redirect('/');
});

app.post('/like/:postId', isAuthenticated, async (req, res) => {
    const post = await Post.findById(req.params.postId);
    if (!post.likes.includes(req.session.userId)) {
        post.likes.push(req.session.userId);
        await post.save();
    }
    res.redirect('/');
});

// New GET endpoint for user likes
app.get('/likes', isAuthenticated, async (req, res) => {
    const posts = await Post.find({ likes: req.session.userId })
        .populate('user')
        .sort({ createdAt: -1 });
    res.render('likes', { likes: posts });
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

app.listen(3000, () => {
    console.log('Server running on port 3000');
});