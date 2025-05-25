import express, { RequestHandler } from 'express';
import { createPost, setCoverPhoto, getUserPosts } from '../controllers/postController';
import authenticateUser from '../Middleware/auth';
import asyncHandler from '../Middleware/asyncHandler';
import { AuthRequest } from '../Middleware/auth';

const router = express.Router();

router.post(
  '/posts', 
  authenticateUser as RequestHandler,
  asyncHandler<AuthRequest>(createPost)
);

router.post(
  '/posts/:postId/cover-photo',
  authenticateUser as RequestHandler,
  asyncHandler<AuthRequest>(setCoverPhoto)
);

router.get(
  '/posts',
  authenticateUser as RequestHandler,
  asyncHandler<AuthRequest>(getUserPosts)
);

export default router;