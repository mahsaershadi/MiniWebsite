import express, { RequestHandler } from 'express';
import { 
  createPost, 
  getUserPosts, 
  updatePost, 
  searchPosts,
  getPostVersionHistory,
  getPostVersion,
  restorePostVersion
} from '../controllers/postController';
import authenticateUser from '../Middleware/auth';
import asyncHandler from '../Middleware/asyncHandler';
import { AuthRequest } from '../Middleware/auth';
import { cacheMiddleware } from '../utils/cache';

const router = express.Router();

//Create post
router.post(
  '/posts', 
  authenticateUser as RequestHandler,
  asyncHandler<AuthRequest>(createPost)
);

//Update post
router.put(
  '/posts/:postId',
  authenticateUser as RequestHandler,
  asyncHandler<AuthRequest>(updatePost)
);

//Get user's posts
router.get(
  '/posts',
  authenticateUser as RequestHandler,
  asyncHandler<AuthRequest>(getUserPosts)
);

//Search posts
router.get('/posts/search', 
  cacheMiddleware(30), 
  asyncHandler(searchPosts)
);

//Versioning

//Get version history for a post
router.get(
  '/posts/:id/versions',
  authenticateUser as RequestHandler,
  asyncHandler<AuthRequest>(getPostVersionHistory)
);

//Get a specific version
router.get(
  '/posts/:id/versions/:versionNumber',
  authenticateUser as RequestHandler,
  asyncHandler<AuthRequest>(getPostVersion)
);

//Restore a post to a specific version
router.post(
  '/posts/:id/versions/:versionNumber/restore',
  authenticateUser as RequestHandler,
  asyncHandler<AuthRequest>(restorePostVersion)
);

export default router;