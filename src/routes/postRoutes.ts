import express, { Request, Response, NextFunction, RequestHandler } from 'express';
import multer, { FileFilterCallback } from 'multer';
import path from 'path';
import Post from '../models/post';
import Photo from '../models/photo';

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});


const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// Create a post with cover photo
const createPostHandler: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title, price } = req.body;
    if (!req.file) throw new Error('عکس جلد الزامی است');
    const coverPhoto = req.file.filename;

    const post = await Post.create({ 
      title, 
      price, 
      coverPhoto, 
      //created_at: new Date(), 
      status: 1 
    });
    res.status(201).json(post);
  } catch (err) {
    next(err);
  }
};
router.post('/api/posts', upload.single('coverPhoto'), createPostHandler);

// Upload multiple photos for a post
const uploadPhotosHandler: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const postId = Number(req.params.postId);
    if (!req.files || req.files.length === 0) throw new Error('هیچ عکسی آپلود نشده است');
    const files = req.files as Express.Multer.File[];

    const photoRecords = await Promise.all(
      files.map(file => Photo.create({ postId, filename: file.filename }))
    );

    res.status(201).json({ message: 'Photos uploaded', photos: photoRecords });
  } catch (err) {
    next(err);
  }
};

router.post('/api/posts/:postId/photos', upload.array('photos', 10), uploadPhotosHandler);
// Fetch post with photo gallery
const getPostHandler: RequestHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const post = await Post.findByPk(req.params.postId, {
      include: [{ model: Photo, as: 'photos' }]
    });

    if (!post) {
      res.status(404).json({ error: 'Post not found' });
      return;
    }

    res.json(post);
  } catch (err) {
    next(err);
  }
};
router.get('/api/posts/:postId', getPostHandler);

export default router;