const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const db = require('../models/db'); 
const authenticateUser = require('../Middleware/auth');
const { where } = require('sequelize');

//get all posts
router.get('/all-posts', async (req, res) => {
    try {
        const posts = await db.Post.findAll({
            where: {status: 1}, 
        
            include: [
                { model: db.User,as: 'Author', attributes: ['username'] }
            ],
            attributes: {
                include: [
                    [db.sequelize.literal('(SELECT COUNT(*) FROM likes WHERE likes.post_id = "Post"."id")'), 'like_count']
                ]
            },
            order: [['created_at', 'DESC']]
        });
        res.json(posts);
    } catch (err) {
        console.error('Error in /posts route',err);
        res.status(500).json({ error: 'Server error', details: err.message }); //debuging
    }
});

//get posts by userId in header
router.get('/posts',authenticateUser, async (req, res) => {
    console.log('Inside /posts route, userId', req.userId);
    const userId = req.userId;

    try {
        // Check for user existence
        const user = await db.User.findByPk(userId);
        if (!user){
            return res.status(404).json({ error: 'there is no user with this user id'});
        }
        
        // Find user's posts
        const posts = await db.Post.findAll({
            where: { user_id: userId, status: 1},
            include: [
                { model: db.User,as: 'Author', attributes: ['username'] }
            ],
            attributes: {
                include: [
                    [db.sequelize.literal('(SELECT COUNT(*) FROM "likes" WHERE "likes"."post_id" = "Post"."id")'), 'like_count']
                ]
            },
            order: [['created_at', 'DESC']]
        });
        if (posts.length === 0) {
            return res.json({ message: 'No posts found for this user' });
        }
        res.json(posts);
    } catch (err) {
        console.error('Error in /posts route',err);
        res.status(500).json({ error: 'Server error'});
    }
});

//create new post
router.post('/posts',authenticateUser, [
    body('content')
    .trim()
    .notEmpty()
    .withMessage('Content is required')
    .isLength({ max: 500 })
    .withMessage('Content must be less than 500 characters'),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { content } = req.body;
    const userId = parseInt(req.userId, 10);
    console.log('creating post with content:', content, 'and userId:', userId);
    try {
        const user = await db.User.findOne({
            where: {
                id: userId,
                status: 1
            }
        });
        if (!user) {
            return res.status(404).json({error: 'there is no user with this id'});
        }

        const post = await db.Post.create({ content, user_id: userId });
        res.status(201).json({ message: 'Post created successfully' });
    } catch (err) {
        console.error('error creating post:',err);
        res.status(500).json({ error: 'Server error'});
    }
});

//like a post
router.post('/like/:postId', authenticateUser, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const postId = parseInt(req.params.postId, 10);
    const userId = parseInt(req.userId, 10);

    
    try {
        const user = await db.User.findByPk(userId);
            if (!user) {
                return res.status(404).json({ error: 'کاربری با این آیدی وجود ندارد' });
            }

            //Check for the existence of the post
            const post = await db.Post.findByPk(postId);
            if (!post) {
                return res.status(404).json({ error: 'this user has not post anything yet!' });
            } 

            const existingLike = await db.Like.findOne({ where: { post_id: postId, user_id: userId } });
            if (existingLike) {
                return res.status(400).json({ error: 'you already has liked this post ' });
            }

            await db.Like.create({ post_id: postId, user_id: userId });
            res.json({ message: 'liked successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

//get all liked posts
router.get('/posts/liked', async (req, res) => {
    try {
        const likedPosts = await db.Post.findAll({
            include: [
                { 
                    model: db.User,
                    as: 'Author',
                    attributes: ['username'],
                    where: {status: 1}
                }
            ],
            attributes: {
                include: [
                    [db.sequelize.literal('(SELECT COUNT(*) FROM likes WHERE likes.post_id = "Post"."id")'), 'like_count']
                ]
            },
            where: {
                id: {
                    [db.Op.in]: db.sequelize.literal('(SELECT post_id FROM likes)')
                },
                status: 1,
                [db.Op.and]: [
                    db.sequelize.where(
                        db.sequelize.literal('(SELECT COUNT(*) FROM likes WHERE likes.post_id = "Post"."id")'),
                        '>',
                        0
                    )
                ]
            },
            group: ['Post.id', 'Author.id'],
            order: [['created_at', 'DESC']]
        });

        if (likedPosts.length === 0) {
            return res.json({ message: 'there is no liked post' });
        }
        res.json(likedPosts);
    } catch (err) {
        console.error('Error in /posts/liked route:', err);
        res.status(500).json({ error: 'Server error', details: err.message });
    }
});

//Get Posts Liked by a Specific User
router.get('/posts/liked-by-user', authenticateUser, async (req, res) => {
    console.log('Inside /posts/liked-by-user route, userId:', req.userId);
    const userId = req.userId;

    try {
        const likedPosts = await db.Post.findAll({
            include: [
                { model: db.User,as: 'Author', attributes: ['username'] }
            ],
            through: { where: { user_id: userId } },
            order: [['created_at', 'DESC']]
        });
        if (likedPosts.length === 0) {
            return res.json({ message: 'No posts liked by this user' });
        }
        res.json(likedPosts);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

//Get Users Who Liked a Specific Post
router.get('/posts/liked-users/:postId', async (req, res) => {
    const postId = req.params.postId;

    try {
        const likedUsers = await db.User.findAll({
            include: [
                { model: db.Like, where: { post_id: postId }, attributes: [] }
            ],
            attributes: ['id', 'username']
        });
        res.json({
            postId: postId,
            userCount: likedUsers.length,
            users: likedUsers
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

//deleting a post by user
router.delete('/posts/:id', authenticateUser, async (req, res) => {
    const userId = parseInt(req.userId, 10); //from header
    const postId = parseInt(req.params.id, 10); 

    try {
        const post = await db.Post.findOne({
            where: {
                id: postId,
                status: 1
            }
        });

        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }

        // Check if the user is allowed to delete
        if (post.user_id !== userId) {
            return res.status(403).json({ error: 'You can only delete your own posts' });
        }

        await db.Post.update(
            {status: -1},
            {
                where: {
                    id: postId,
                    user_id: userId,
                    status: 1
            }}
        );
        res.json({ message: 'Post deleted successfully' });
    } catch (err) {
        console.error('Error in /posts/:id DELETE route:', err);
        res.status(500).json({ error: 'Server error', details: err.message});
    }
});

//deleting a like by user
router.delete('/likes/:postId', authenticateUser, async(req, res) => {
    const userId = parseInt(req.userId, 10); //from header
    const postId = parseInt(req.params.postId, 10); 

    try {
        //finding like
        const like = await db.Like.findOne({
            where: {
                user_id: userId,
                post_id: postId
            }
        });

        if(!like) {
            return res.status(403).json({error: 'like not found'});
        }

        await like.destroy();
        res.json({message: 'Like removed successfully'});
    } catch (err) {
        console.error('Error in /likes/:postId DELETE route:', err);
        res.status(500).json({error: 'Server error'});
    }

});

module.exports = router;