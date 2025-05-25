import { Request, Response } from 'express';
import Post from '../models/post';
import Photo from '../models/photo';
import User from '../models/user';

declare global {
  namespace Express {
    interface User {
      id: number;
    }
    interface Request {
      user?: User;
    }
  }
}

export const createPost = async (req: Request, res: Response) => {
  try {
    const { title, price, coverPhotoId } = req.body;
    
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Validate required fields
    if (!title || !price) {
      return res.status(400).json({ message: 'Title and price are required' });
    }

    // If coverPhotoId is provided, verify it exists and belongs to the user
    if (coverPhotoId) {
      const photo = await Photo.findByPk(coverPhotoId);
      if (!photo) {
        return res.status(404).json({ message: 'Photo not found' });
      }
      if (photo.userId !== req.user.id) {
        return res.status(403).json({ message: 'You do not own this photo' });
      }
    }

    // Create the post with cover photo if provided
    const post = await Post.create({
      title,
      price,
      userId: req.user.id,
      cover_photo_id: coverPhotoId || null,
      status: 1
    });

    // Return the post with cover photo information if it exists
    const createdPost = await Post.findByPk(post.id, {
      include: [{
        model: Photo,
        as: 'coverPhoto',
        attributes: ['id', 'filename']
      }]
    });

    res.status(201).json(createdPost);
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ message: 'Failed to create post' });
  }
};

export const setCoverPhoto = async (req: Request, res: Response) => {
  try {
    // Check authentication
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { postId } = req.params;
    const { photoId } = req.body;

    // Validate inputs
    if (!postId || !photoId) {
      return res.status(400).json({ message: 'Post ID and Photo ID are required' });
    }

    // Find the post
    const post = await Post.findByPk(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Check post ownership
    if (post.userId !== req.user.id) {
      return res.status(403).json({ message: 'You do not own this post' });
    }

    // Find and validate the photo
    const photo = await Photo.findByPk(photoId);
    if (!photo) {
      return res.status(404).json({ message: 'Photo not found' });
    }

    // Check photo ownership
    if (photo.userId !== req.user.id) {
      return res.status(403).json({ message: 'You do not own this photo' });
    }

    // Update the post with the cover photo
    post.cover_photo_id = photoId;
    await post.save();

    // Return the updated post with the cover photo information
    const updatedPost = await Post.findByPk(postId, {
      include: [{
        model: Photo,
        as: 'coverPhoto',
        attributes: ['id', 'filename']
      }]
    });

    res.json(updatedPost);
  } catch (error) {
    console.error('Error setting cover photo:', error);
    res.status(500).json({ message: 'Failed to set cover photo' });
  }
};

export const getUserPosts = async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  const posts = await Post.findAll({
    where: { userId: req.user.id },
    include: [
      {
        model: Photo,
        as: 'coverPhoto',
        attributes: ['filename'], // Add more fields if needed
      },
    ],
  });

  res.json(posts);
};