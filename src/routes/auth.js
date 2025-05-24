// const express = require('express');
// const router = express.Router();
// const { body, validationResult } = require('express-validator');
// const bcrypt = require('bcryptjs');
// const db = require('../models/db');
// const authenticateUser = require('../Middleware/auth');
// const { where } = require('sequelize');
// const JWT = require ('jsonwebtoken');

// //Get all users
// router.get('/all-users', async (req, res) => {
//     try {
//         const users = await db.User.findAll({
//             attributes: ['id', 'username', 'status'],
//             order: [['username', 'ASC']],
//             where: {
//                 status: 1
//             }
//         });
//         res.json({ userCount: users.length, users: users });
//     } catch (err) {
//         console.error(err);
//         res.status(500).json({ error: 'Server error' });
//     }
// });

// // Signup
// router.post('/signup', [
//     body('username')
//         .trim()
//         .notEmpty()
//         .withMessage('Username is required')
//         .isLength({ min: 3 })
//         .withMessage('Username must be at least 3 characters'),
//     body('password')
//         .notEmpty()
//         .withMessage('Password is required')
//         .isLength({ min: 6 })
//         .withMessage('Password must be at least 6 characters')
// ], async (req, res) => {
//     const errors = validationResult(req);
//     if (!errors.isEmpty()) {
//         return res.status(400).json({ errors: errors.array() });
//     }

//     const { username, password } = req.body;

//     try {
//         //checking
//         const existingUser = await db.User.findOne({where: {username}});
//         if (existingUser) {
//             return res.status(400).json({error: 'Username already exists'});
//         }

//         const user = await db.User.create({ username, password });

//         //token
//         const token = JWT.sign(
//             {userId: user.id},
//             process.env.ACCESS_TOKEN,
//             {expiresIn: '3h'}
//         );


//         res.status(201).json({ message: 'User created successfully', token });
//     } catch (err) {
//         console.error('Error in /signup route:', err);
//         res.status(500).json({ error: 'Server error', details: err.message });
//     }
// });

// // Login
// router.post('/login', [
//     body('username')
//         .trim()
//         .notEmpty()
//         .withMessage('Username is required'),
//     body('password')
//         .notEmpty()
//         .withMessage('Password is required')
// ], async (req, res) => {
//     const errors = validationResult(req);
//     if (!errors.isEmpty()) {
//         return res.status(400).json({ errors: errors.array() });
//     }

//     const { username, password } = req.body;
//     try {
//         const user = await db.User.findOne({
//             where: {
//                 username,
//                 status: 1
//             }
//         });
        
//         if (!user) {
//             return res.status(401).json({error: 'username or password is incorrect!'});
//         }

//         const isMatch = await bcrypt.compare(password, user.password);
//         if (!isMatch) {
//             return res.status(401).json({error: 'password is incorrect!'});
//         }

//         //token
//         const token = JWT.sign(
//             {userId: user.id},
//             process.env.ACCESS_TOKEN,
//             {expiresIn: '3h'}
//         );

//         res.json({message: 'logged in succesfully', token});
//     } catch (err) {
//         console.error('Error in /login route:', err);
//         res.status(500).json({ error: 'Server error', details: err.message });
//     }
// });

// //delete user (account)
// router.delete('/users/:id', authenticateUser, async (req, res) => {
//     const userIdFromHeader = parseInt(req.userId, 10); 
//     const userIdFromParams = parseInt(req.params.id, 10); 

//     // Check if the user is allowed to delete
//     if (isNaN(userIdFromParams)) {
//         return res.status(400).json({error: 'The user ID is invalid'});
//     }

//     try {
//         const user = await db.User.findOne({
//             where: {
//                 id: userIdFromParams,
//                 status: 1
//             }
//         });

//         if (!user) {
//             return res.status(404).json({ error: 'User not found' });
//         }

//         await db.User.update(
//             {status: -1},
//             {where: {id: userIdFromParams}}
//         );
//         res.json({ message: 'User deleted successfully' });
//     } catch (err) {
//         console.error('Error in /users/:id DELETE route:', err);
//         res.status(500).json({ error: 'Server error', details: err.message});
//     }
// });

// module.exports = router;