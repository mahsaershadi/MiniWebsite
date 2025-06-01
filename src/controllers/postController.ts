import { Request, Response } from 'express';
import Post from '../models/post';
import Photo from '../models/photo';
import User from '../models/user';
import PostGallery from '../models/postGallery';
import Category from '../models/category';

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
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { title, price, categoryId, coverPhotoId, galleryPhotos, stock_quantity = 0 } = req.body;
    
    if (!title || !price) {
      return res.status(400).json({ message: 'Title and price are required' });
    }

    if (categoryId) {
      const category = await Category.findOne({
        where: { id: categoryId, status: 1 }
      });
      if (!category) {
        return res.status(404).json({ message: 'Category not found' });
      }
    }

    if (coverPhotoId) {
      const photo = await Photo.findOne({
        where: {
          id: coverPhotoId,
          status: 1
        }
      });
      if (!photo) {
        return res.status(404).json({ message: 'Cover photo not found' });
      }
    }

    if (galleryPhotos && galleryPhotos.length > 0) {
      const photoIds = galleryPhotos.map((p: { photoId: number }) => p.photoId);
      const photos = await Photo.findAll({
        where: {
          id: photoIds,
          status: 1
        }
      });

      if (photos.length !== photoIds.length) {
        return res.status(404).json({ message: 'One or more gallery photos not found' });
      }
    }

    const post = await Post.create({
      title,
      price,
      userId: req.user.id,
      categoryId: categoryId || null,
      cover_photo_id: coverPhotoId || null,
      status: 1,
      stock_quantity
    });

    // Add gallery photos with order
    if (galleryPhotos && galleryPhotos.length > 0) {
      await Promise.all(
        galleryPhotos.map((photo: { photoId: number, order: number }) =>
          PostGallery.create({
            postId: post.id,
            photoId: photo.photoId,
            order: photo.order,
            status: 1
          })
        )
      );
    }

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
          through: {
            attributes: ['order']
          }
        }
      ],
      order: [[{ model: Photo, as: 'galleryPhotos' }, PostGallery, 'order', 'ASC']]
    });

    res.status(201).json(createdPost);
  } catch (error) {
    console.error('Error creating post:', error);
    const errorMessage = error instanceof Error ? error.message : String(error); //debugging
    res.status(500).json({ message: 'Failed to create post', details: errorMessage }); //debugging
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
        model: Category,
        as: 'category',
        attributes: ['id', 'name']
      },
      {
        model: Photo,
        as: 'coverPhoto',
        attributes: ['id', 'filename'],
        where: { status: 1 },
        required: false 
      },
      {
        model: Photo,
        as: 'galleryPhotos',
        attributes: ['id', 'filename'],
        where: { status: 1 },
        through: {
          attributes: ['order'],
          where: { status: 1 }
        }
      }
    ],
    order: [[{ model: Photo, as: 'galleryPhotos' }, PostGallery, 'order', 'ASC']]
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
    const { title, price, coverPhotoId, galleryPhotos, stock_quantity } = req.body;

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
          status: 1
        }
      });
      if (!photo) {
        return res.status(404).json({ message: 'Cover photo not found' });
      }
    }

    // Update
    const updates: any = {};
    if (title !== undefined) updates.title = title;
    if (price !== undefined) updates.price = price;
    if (coverPhotoId !== undefined) updates.cover_photo_id = coverPhotoId;
    if (stock_quantity !== undefined) updates.stock_quantity = stock_quantity;
    await post.update(updates);

    // Update gallery photos
    if (galleryPhotos !== undefined) {
      await PostGallery.destroy({
        where: { postId: post.id }
      });

      if (galleryPhotos && galleryPhotos.length > 0) {
        const photoIds = galleryPhotos.map((p: { photoId: number }) => p.photoId);
        const photos = await Photo.findAll({
          where: {
            id: photoIds,
            status: 1
          }
        });

        if (photos.length !== photoIds.length) {
          return res.status(404).json({ message: 'One or more gallery photos not found' });
        }

        await Promise.all(
          galleryPhotos.map((photo: { photoId: number, order: number }) =>
            PostGallery.create({
              postId: post.id,
              photoId: photo.photoId,
              order: photo.order,
              status: 1
            })
          )
        );
      }
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
          through: {
            attributes: ['order']
          }
        }
      ],
      order: [[{ model: Photo, as: 'galleryPhotos' }, PostGallery, 'order', 'ASC']]
    });

    res.json(updatedPost);
  } catch (error) {
    console.error('Error updating post:', error);
    res.status(500).json({ message: 'Failed to update post' });
  }
};