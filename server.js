const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const session = require('express-session');
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

// Middleware to check if user is logged in
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
    res.render('login');
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    
    if (user && await bcrypt.compare(password, user.password)) {
        req.session.userId = user._id;
        res.redirect('/');
    } else {
        res.redirect('/login');
    }
});

app.get('/signup', (req, res) => {
    res.render('signup');
});

app.post('/signup', async (req, res) => {
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, password: hashedPassword });
    
    await user.save();
    req.session.userId = user._id;
    res.redirect('/');
});

app.get('/create-post', isAuthenticated, (req, res) => {
    res.render('create-post');
});

app.post('/create-post', isAuthenticated, async (req, res) => {
    const post = new Post({
        content: req.body.content,
        user: req.session.userId
    });
    await post.save();
    res.redirect('/');
});

// Fixed like route
app.post('/like/:postId', isAuthenticated, async (req, res) => {
    try {
        const postId = req.params.postId; // Correctly access the postId from params
        const userId = req.session.userId;
        
        const post = await Post.findById(postId);
        if (!post) {
            return res.redirect('/');
        }

        // Check if user hasn't already liked the post
        if (!post.likes.includes(userId)) {
            post.likes.push(userId);
            await post.save();
        }
        
        res.redirect('/');
    } catch (error) {
        console.error(error);
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