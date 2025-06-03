import { Request, Response } from 'express';
import Post from '../models/post';
import Photo from '../models/photo';
import User from '../models/user';
import PostGallery from '../models/postGallery';
import Category from '../models/category';
import { Op, Sequelize, QueryTypes } from 'sequelize';
import sequelize from '../utils/database';

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

    const { 
      title, 
      price, 
      categoryId, 
      coverPhotoId, 
      galleryPhotos, 
      stock_quantity = 0,
      color,
      size,
      brand,
      type,
      description,
      specifications
    } = req.body;
    
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
      stock_quantity,
      color,
      size,
      brand,
      type,
      description,
      specifications
    });

    //Add gallery photos
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
    const errorMessage = error instanceof Error ? error.message : String(error);
    res.status(500).json({ message: 'Failed to create post', details: errorMessage });
  }
};

//get posts
export const getUserPosts = async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  const posts = await Post.findAll({
    where: { userId: req.user.id, status: 1 },
    attributes: [
      'id',
      'title',
      'price',
      'userId',
      'cover_photo_id',
      'categoryId',
      'status',
      'stock_quantity',
      'color',
      'size',
      'brand',
      'type',
      'description',
      'specifications',
      'createdAt',
      'updatedAt'
    ],
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
    order: [
      ['createdAt', 'DESC'],
      [{ model: Photo, as: 'galleryPhotos' }, PostGallery, 'order', 'ASC']
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
    const { 
      title, 
      price, 
      coverPhotoId, 
      galleryPhotos, 
      stock_quantity,
      color,
      size,
      brand,
      type,
      description,
      specifications,
      categoryId
    } = req.body;

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

    //Update all fields
    const updates: any = {};
    if (title !== undefined) updates.title = title;
    if (price !== undefined) updates.price = price;
    if (coverPhotoId !== undefined) updates.cover_photo_id = coverPhotoId;
    if (stock_quantity !== undefined) updates.stock_quantity = stock_quantity;
    if (color !== undefined) updates.color = color;
    if (size !== undefined) updates.size = size;
    if (brand !== undefined) updates.brand = brand;
    if (type !== undefined) updates.type = type;
    if (description !== undefined) updates.description = description;
    if (specifications !== undefined) updates.specifications = specifications;
    if (categoryId !== undefined) updates.categoryId = categoryId;

    await post.update(updates);

    //Update gallery photos
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
          model: Category,
          as: 'category',
          attributes: ['id', 'name']
        },
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

//search posts with filters
export const searchPosts = async (req: Request, res: Response) => {
  try {
    const {
      query,
      categoryId,
      color,
      size,
      brand,
      type,
      minPrice,
      maxPrice,
      sort = 'createdAt',
      order = 'DESC',
      page = '1',
      limit = '10'
    } = req.query as {
      query?: string;
      categoryId?: string;
      color?: string;
      size?: string;
      brand?: string;
      type?: string;
      minPrice?: string;
      maxPrice?: string;
      sort?: string;
      order?: string;
      page?: string;
      limit?: string;
    };

    
    const whereClause: any = {
      status: 1
    };

    //search in title and description
    if (query) {
      whereClause[Op.or] = [
        { title: { [Op.iLike]: `%${query}%` } },
        { description: { [Op.iLike]: `%${query}%` } },
        sequelize.literal(`exists (select 1 from jsonb_each_text("specifications") where value ILIKE '%${query}%')`)
      ];
    }

    //Add filters
    if (categoryId) whereClause.categoryId = parseInt(categoryId);
    if (color) {
      const colorsArray = color.split(',');
      whereClause.color = {
        [Op.or]: [
          { [Op.in]: colorsArray },
          ...colorsArray.map(c => ({
            [Op.iLike]: `%${c}%`    
          }))
        ]
      };
    }
    if (size) whereClause.size = { [Op.iLike]: size };
    if (brand) whereClause.brand = { [Op.iLike]: brand };
    if (type) whereClause.type = { [Op.iLike]: type };

    //Price range
    if (minPrice || maxPrice) {
      whereClause.price = {};
      if (minPrice) whereClause.price[Op.gte] = parseFloat(minPrice);
      if (maxPrice) whereClause.price[Op.lte] = parseFloat(maxPrice);
    }

    //offset
    const offset = (Number(page) - 1) * Number(limit);

    //sort field
    const validSortFields = ['price', 'createdAt', 'title'] as const;
    type SortField = typeof validSortFields[number];
    const sortField = validSortFields.includes(sort as SortField) ? sort as SortField : 'createdAt';
    const sortOrder = order === 'ASC' ? 'ASC' : 'DESC';

    const { count, rows: posts } = await Post.findAndCountAll({
      where: whereClause,
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
        }
      ],
      order: [[sortField, sortOrder]],
      limit: Number(limit),
      offset: offset
    });

    
    const filterQueries = [];
    const filterResults = {};

    if (color) {
      filterQueries.push(
        sequelize.query(
          'SELECT DISTINCT color FROM posts WHERE status = 1 AND color ILIKE :color',
          { 
            replacements: { color: `%${color}%` },
            type: QueryTypes.SELECT 
          }
        )
      );
    }

    if (size) {
      filterQueries.push(
        sequelize.query(
          'SELECT DISTINCT size FROM posts WHERE status = 1 AND size ILIKE :size',
          { 
            replacements: { size: `%${size}%` },
            type: QueryTypes.SELECT 
          }
        )
      );
    }

    if (brand) {
      filterQueries.push(
        sequelize.query(
          'SELECT DISTINCT brand FROM posts WHERE status = 1 AND brand ILIKE :brand',
          { 
            replacements: { brand: `%${brand}%` },
            type: QueryTypes.SELECT 
          }
        )
      );
    }

    if (type) {
      filterQueries.push(
        sequelize.query(
          'SELECT DISTINCT type FROM posts WHERE status = 1 AND type ILIKE :type',
          { 
            replacements: { type: `%${type}%` },
            type: QueryTypes.SELECT 
          }
        )
      );
    }

    const results = await Promise.all(filterQueries);
    
    
    const filters: any = {};
    let resultIndex = 0;

    if (color) {
      filters.colors = (results[resultIndex] as Array<{ color: string }>)
        .map(item => item.color)
        .filter(Boolean);
      resultIndex++;
    }

    if (size) {
      filters.sizes = (results[resultIndex] as Array<{ size: string }>)
        .map(item => item.size)
        .filter(Boolean);
      resultIndex++;
    }

    if (brand) {
      filters.brands = (results[resultIndex] as Array<{ brand: string }>)
        .map(item => item.brand)
        .filter(Boolean);
      resultIndex++;
    }

    if (type) {
      filters.types = (results[resultIndex] as Array<{ type: string }>)
        .map(item => item.type)
        .filter(Boolean);
    }

    res.json({
      posts,
      filters,
      pagination: {
        total: count,
        page: Number(page),
        totalPages: Math.ceil(count / Number(limit))
      }
    });

  } catch (error) {
    console.error('Error searching posts:', error);
    res.status(500).json({ 
      message: 'Error searching posts',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};