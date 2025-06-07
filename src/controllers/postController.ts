import { Request, Response } from 'express';
import Post from '../models/post';
import Photo from '../models/photo';
import User from '../models/user';
import PostGallery from '../models/postGallery';
import Category from '../models/category';
import { Op, Sequelize, QueryTypes } from 'sequelize';
import sequelize from '../utils/database';
import CategoryFilter from '../models/categoryFilter';

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

//get all subcategory ID
async function getAllSubcategoryIds(categoryId: number): Promise<number[]> {
  const subCategories = await Category.findAll({
    where: { parentId: categoryId, status: 1 }
  });

  const subCategoryIds = subCategories.map(cat => cat.id);
  for (const subCategory of subCategories) {
    const childIds = await getAllSubcategoryIds(subCategory.id);
    subCategoryIds.push(...childIds);
  }

  return subCategoryIds;
}

interface CreatePostBody {
  title: string;
  price: number;
  categoryId?: number;
  coverPhotoId?: number;
  galleryPhotos?: Array<{ photoId: number; order: number }>;
  stock_quantity?: number;
  description: string;
  attributes?: Record<string, any>;
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
      description,
      attributes = {}
    } = req.body as CreatePostBody;
    
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
      description,
      attributes
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
      'description',
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
      description,
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
    if (description !== undefined) updates.description = description;
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
      categoryIds,
      minPrice,
      maxPrice,
      sort = 'createdAt',
      order = 'DESC',
      page = '1',
      limit = '10',
      includeSubcategories = 'true',
      filters
    } = req.query as {
      query?: string;
      categoryIds?: string;
      minPrice?: string;
      maxPrice?: string;
      sort?: string;
      order?: string;
      page?: string;
      limit?: string;
      includeSubcategories?: string;
      filters?: string;
    };

    const whereClause: any = {
      status: 1
    };

    //Search in title and description
    if (query) {
      whereClause[Op.or] = [
        { title: { [Op.iLike]: `%${query}%` } },
        { description: { [Op.iLike]: `%${query}%` } }
      ];
    }

    //Category filtering
    if (categoryIds) {
      const selectedCategoryIds = categoryIds.split(',').map(id => parseInt(id));
      
      if (includeSubcategories === 'true') {
        const allCategoryIds = new Set<number>();
        
        for (const categoryId of selectedCategoryIds) {
          const subCategoryIds = await getAllSubcategoryIds(categoryId);
          subCategoryIds.forEach(id => allCategoryIds.add(id));
          allCategoryIds.add(categoryId);
        }
        
        whereClause.categoryId = {
          [Op.in]: Array.from(allCategoryIds)
        };
      } else {
        whereClause.categoryId = {
          [Op.in]: selectedCategoryIds
        };
      }
    }

    //filters
    if (filters) {
      try {
        const filterValues = JSON.parse(filters);
        const filterConditions: any[] = [];

        Object.entries(filterValues).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            if (key === 'price') {
              if (typeof value === 'object' && ('min' in value || 'max' in value)) {
                whereClause.price = {};
                if ('min' in value && value.min !== null) {
                  whereClause.price[Op.gte] = value.min;
                }
                if ('max' in value && value.max !== null) {
                  whereClause.price[Op.lte] = value.max;
                }
              }
            } else if (Array.isArray(value)) {
              filterConditions.push(
                sequelize.literal(
                  `attributes->>'${key}' IN (${value.map(v => `'${v}'`).join(',')}) OR ` +
                  `(attributes->'${key}' ?| array[${value.map(v => `'${v}'`).join(',')}])`
                )
              );
            } else if (typeof value === 'object' && ('min' in value || 'max' in value)) {
              //For range values
              const rangeConditions = [];
              if ('min' in value && value.min !== null) {
                rangeConditions.push(
                  sequelize.literal(`(attributes->>'${key}')::numeric >= ${value.min}`)
                );
              }
              if ('max' in value && value.max !== null) {
                rangeConditions.push(
                  sequelize.literal(`(attributes->>'${key}')::numeric <= ${value.max}`)
                );
              }
              if (rangeConditions.length > 0) {
                filterConditions.push({ [Op.and]: rangeConditions });
              }
            } else {
              filterConditions.push(
                sequelize.literal(`attributes->>'${key}' = '${value}'`)
              );
            }
          }
        });

        if (filterConditions.length > 0) {
          whereClause[Op.and] = filterConditions;
        }
      } catch (error) {
        console.error('Error parsing filters:', error);
        return res.status(400).json({ 
          message: 'Invalid filter format',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // // Add regular price range if provided separately
    // if (minPrice || maxPrice) {
    //   whereClause.price = whereClause.price || {};
    //   if (minPrice) whereClause.price[Op.gte] = parseFloat(minPrice);
    //   if (maxPrice) whereClause.price[Op.lte] = parseFloat(maxPrice);
    // }

    const offset = (Number(page) - 1) * Number(limit);
    const validSortFields = ['createdAt', 'price', 'title'] as const;
    type SortField = typeof validSortFields[number];
    
    const sortField = validSortFields.includes(sort as SortField) ? sort as SortField : 'createdAt';
    const sortOrder = order === 'ASC' ? 'ASC' : 'DESC';

    //Get posts with category information and filters
    const { count, rows: posts } = await Post.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name', 'parentId'],
          include: [
            {
              model: Category,
              as: 'parent',
              attributes: ['id', 'name']
            },
            {
              model: CategoryFilter,
              as: 'filters',
              attributes: ['id', 'category_id', 'name', 'type', 'options', 'min', 'max', 'required', 'order', 'status'],
              where: { status: 1 },
              required: false
            }
          ]
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

    res.json({
      posts,
      pagination: {
        total: count,
        page: Number(page),
        totalPages: Math.ceil(count / Number(limit))
      }
    });
    
  } catch (error) {
    console.error('Error searching posts:', error);
    res.status(500).json({ 
      message: 'Failed to search posts',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};