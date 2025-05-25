import multer from 'multer';
import path from 'path';
import { Request, Response, NextFunction } from 'express';
import sharp from 'sharp';
import fs from 'fs/promises';

// File size limit (5MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Thumbnail size
const THUMBNAIL_SIZE = 200;

// Allowed file types
const ALLOWED_FILE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif'
];

// Ensure upload directories exist
const createUploadDirs = async () => {
  const dirs = ['uploads', 'uploads/thumbnails'];
  for (const dir of dirs) {
    try {
      await fs.access(dir);
    } catch {
      await fs.mkdir(dir, { recursive: true });
    }
  }
};

// Create upload directories on startup
createUploadDirs().catch(console.error);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    // Keep original extension temporarily
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Check file type
  if (!ALLOWED_FILE_TYPES.includes(file.mimetype)) {
    cb(new Error('Invalid file type. Only JPEG, PNG, GIF and WebP images are allowed.'));
    return;
  }

  // Check file size
  if (parseInt(req.headers['content-length'] || '0') > MAX_FILE_SIZE) {
    cb(new Error('File size too large. Maximum size is 5MB.'));
    return;
  }

  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE
  }
});

// Middleware to convert uploaded images to WebP and create thumbnails
export const convertToWebP = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.files || !Array.isArray(req.files)) {
      return next();
    }

    const files = req.files as Express.Multer.File[];
    
    // Process each uploaded file
    await Promise.all(files.map(async (file) => {
      try {
        const webpFilename = file.filename.replace(/\.[^/.]+$/, '.webp');
        const webpPath = path.join('uploads', webpFilename);
        
        // Read the uploaded file
        const image = sharp(file.path);
        
        // Get image metadata
        const metadata = await image.metadata();
        
        // Convert main image to WebP
        await image
          .webp({
            quality: 80,
            lossless: false
          })
          .resize({
            width: metadata.width,
            height: metadata.height,
            fit: 'contain',
          })
          .toFile(webpPath);

        // Generate thumbnail
        const thumbnailPath = path.join('uploads/thumbnails', `thumb_${webpFilename}`);
        await sharp(file.path)
          .webp({
            quality: 60,
            lossless: false
          })
          .resize({
            width: THUMBNAIL_SIZE,
            height: THUMBNAIL_SIZE,
            fit: 'cover',
            position: 'centre'
          })
          .toFile(thumbnailPath);

        // Delete the original file
        await fs.unlink(file.path);

        // Update file information
        file.filename = webpFilename;
        file.path = webpPath;
        file.mimetype = 'image/webp';
      } catch (error) {
        console.error(`Error processing file ${file.originalname}:`, error);
        throw error;
      }
    }));

    next();
  } catch (error) {
    next(error);
  }
};

export default upload;
