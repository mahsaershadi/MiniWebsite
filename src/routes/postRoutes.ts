import express, { RequestHandler } from 'express';
import { createPost, getUserPosts, updatePost } from '../controllers/postController';
import authenticateUser from '../Middleware/auth';
import asyncHandler from '../Middleware/asyncHandler';
import { AuthRequest } from '../Middleware/auth';

const router = express.Router();

// Create post
router.post(
  '/posts', 
  authenticateUser as RequestHandler,
  asyncHandler<AuthRequest>(createPost)
);

// Update post
router.put(
  '/posts/:postId',
  authenticateUser as RequestHandler,
  asyncHandler<AuthRequest>(updatePost)
);

// Get user's posts
router.get(
  '/posts',
  authenticateUser as RequestHandler,
  asyncHandler<AuthRequest>(getUserPosts)
);

export default router;