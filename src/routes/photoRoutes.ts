import express from 'express';
import multer from 'multer';
import { uploadGalleryPhotos, getGalleryPhotos } from '../controllers/photoController';
import authenticateUser from '../Middleware/auth';
import upload from '../Middleware/multer';
import asyncHandler from '../Middleware/asyncHandler';
import { AuthRequest } from '../Middleware/auth';
import { RequestHandler } from 'express';

const router = express.Router();

router.post(
  '/gallery/photos', 
  authenticateUser as RequestHandler, 
  upload.array('photos'), 
  asyncHandler<AuthRequest>(uploadGalleryPhotos)
);

router.get(
  '/gallery/photos', 
  authenticateUser as RequestHandler, 
  asyncHandler<AuthRequest>(getGalleryPhotos)
);

export default router;