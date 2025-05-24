import { Request, Response } from 'express';
import Post from '../models/post';
import Photo from '../models/photo';

export const createPost = async (req: Request, res: Response) => {
  try {
    const { title, price } = req.body;
    const file = req.file;

    if (!file) return res.status(400).json({ error: 'Cover photo required' });

    const post = await Post.create({
      title,
      price,
      coverPhoto: file.filename,
      //created_at: new Date(),
      status: 1
    });

    res.status(201).json(post);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create post' });
  }
};

export const uploadGalleryPhotos = async (req: Request, res: Response) => {
  try {
    const { postId } = req.params;
    const files = req.files as Express.Multer.File[];

    const photos = await Promise.all(files.map(file =>
      Photo.create({
        postId: Number(postId),
        filename: file.filename
      })
    ));

    res.status(201).json(photos);
  } catch (err) {
    res.status(500).json({ error: 'Failed to upload photos' });
  }
};

export const getPostWithPhotos = async (req: Request, res: Response) => {
  try {
    const { postId } = req.params;

    const post = await Post.findByPk(postId, {
      include: [{ model: Photo, as: 'photos' }]
    });

    if (!post) return res.status(404).json({ error: 'Post not found' });

    res.status(200).json(post);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch post' });
  }
};
