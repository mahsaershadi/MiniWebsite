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

//create a post
export const createPost = async (req: Request, res: Response) => {
  try {
    const { title, price, coverPhotoId, galleryPhotoIds } = req.body;
    
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!title || !price) {
      return res.status(400).json({ message: 'Title and price are required' });
    }

    if (coverPhotoId) {
      const photo = await Photo.findOne({
        where: {
          id: coverPhotoId,
          userId: req.user.id,
          status: 1
        }
      });
      if (!photo) {
        return res.status(404).json({ message: 'Cover photo not found or unauthorized' });
      }
    }

    if (galleryPhotoIds && galleryPhotoIds.length > 0) {
      const photos = await Photo.findAll({
        where: {
          id: galleryPhotoIds,
          userId: req.user.id,
          status: 1
        }
      });

      if (photos.length !== galleryPhotoIds.length) {
        return res.status(404).json({ message: 'One or more gallery photos not found or unauthorized' });
      }
    }

    // Create the post
    const post = await Post.create({
      title,
      price,
      userId: req.user.id,
      cover_photo_id: coverPhotoId || null,
      status: 1
    });

    // Add gallery
    if (galleryPhotoIds && galleryPhotoIds.length > 0) {
      await post.addGalleryPhotos(galleryPhotoIds);
    }

    // Return the post
    const createdPost = await Post.findByPk(post.id, {
      include: [
        {
          model: Photo,
          as: 'coverPhoto',
          attributes: ['id', 'filename']
        },
        {
          model: Photo,
          as: 'galleryPhotos',
          attributes: ['id', 'filename'],
          through: { attributes: [] }
        }
      ]
    });

    res.status(201).json(createdPost);
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ message: 'Failed to create post' });
  }
};

//get posts
export const getUserPosts = async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  const posts = await Post.findAll({
    where: { userId: req.user.id, status: 1 },
    include: [
      {
        model: Photo,
        as: 'coverPhoto',
        attributes: ['id', 'filename']
      },
      {
        model: Photo,
        as: 'galleryPhotos',
        attributes: ['id', 'filename'],
        through: { attributes: [] }
      }
    ]
  });

  res.json(posts);
};


//updated post
export const updatePost = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { postId } = req.params;
    const { title, price, coverPhotoId, galleryPhotoIds } = req.body;

    // Find the post
    const post = await Post.findOne({
      where: {
        id: postId,
        userId: req.user.id,
        status: 1
      }
    });

    if (!post) {
      return res.status(404).json({ message: 'Post not found or unauthorized' });
    }

    if (coverPhotoId) {
      const photo = await Photo.findOne({
        where: {
          id: coverPhotoId,
          userId: req.user.id,
          status: 1
        }
      });
      if (!photo) {
        return res.status(404).json({ message: 'Cover photo not found or unauthorized' });
      }
    }

    if (galleryPhotoIds && galleryPhotoIds.length > 0) {
      const photos = await Photo.findAll({
        where: {
          id: galleryPhotoIds,
          userId: req.user.id,
          status: 1
        }
      });

      if (photos.length !== galleryPhotoIds.length) {
        return res.status(404).json({ message: 'One or more gallery photos not found or unauthorized' });
      }
    }

    const updates: any = {};
    if (title !== undefined) updates.title = title;
    if (price !== undefined) updates.price = price;
    if (coverPhotoId !== undefined) updates.cover_photo_id = coverPhotoId;

    // Apply updates
    await post.update(updates);

    if (galleryPhotoIds !== undefined) {
      await post.setGalleryPhotos(galleryPhotoIds || []);
    }

    const updatedPost = await Post.findByPk(post.id, {
      include: [
        {
          model: Photo,
          as: 'coverPhoto',
          attributes: ['id', 'filename']
        },
        {
          model: Photo,
          as: 'galleryPhotos',
          attributes: ['id', 'filename'],
          through: { attributes: [] }
        }
      ]
    });

    res.json(updatedPost);
  } catch (error) {
    console.error('Error updating post:', error);
    res.status(500).json({ message: 'Failed to update post' });
  }
};