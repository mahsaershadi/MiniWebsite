import express, { Router, Request, Response, NextFunction } from 'express';
import { deletePost, deletePhoto } from '../controllers/deleteController';
import authenticateUser from '../Middleware/auth';

const router: Router = express.Router();

// Delete post
router.delete('/post/:postId', authenticateUser, async (req: Request, res: Response, next: NextFunction) => {
  try {
    await deletePost(req, res);
  } catch (error) {
    next(error);
  }
});

// Delete photo
router.delete('/photo/:photoId', authenticateUser, async (req: Request, res: Response, next: NextFunction) => {
  try {
    await deletePhoto(req, res);
  } catch (error) {
    next(error);
  }
});

export default router; 