import { Request, Response } from 'express';
import Post from '../models/post';
import Photo from '../models/photo';
import User from '../models/user';
import PostGallery from '../models/postGallery';
import Category from '../models/category';
import { Op, QueryTypes } from 'sequelize';
import sequelize from '../utils/database';
import CategoryFilter from '../models/categoryFilter';
import { validateAttributes } from '../utils/validateAttributes';

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

interface FilterValue {
  type: 'exact' | 'range' | 'multiselect';
  value?: string | number | boolean;
  values?: (string | number)[];
  range?: {
    min?: number;
    max?: number;
  };
}

interface SearchFilters {
  [key: string]: FilterValue;
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

      //Validate attributes
      const validationErrors = await validateAttributes(categoryId, attributes);
      if (validationErrors.length > 0) {
        return res.status(400).json({ 
          message: 'Invalid attributes',
          errors: validationErrors
        });
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

    const postId = parseInt(req.params.id);
    const { 
      title, 
      price, 
      categoryId, 
      coverPhotoId,
      stock_quantity,
      description,
      attributes 
    } = req.body;

    const post = await Post.findOne({
      where: { 
        id: postId,
        userId: req.user.id,
        status: 1
      }
    });

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (attributes && categoryId) {
      // Validate attributes against category filters
      const validationErrors = await validateAttributes(categoryId, attributes);
      if (validationErrors.length > 0) {
        return res.status(400).json({ 
          message: 'Invalid attributes',
          errors: validationErrors
        });
      }
    }

    // Update post
    await post.update({
      title: title || post.title,
      price: price || post.price,
      categoryId: categoryId || post.categoryId,
      cover_photo_id: coverPhotoId || post.cover_photo_id,
      stock_quantity: stock_quantity || post.stock_quantity,
      description: description || post.description,
      attributes: attributes || post.attributes
    });

    res.json(post);
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
      sort = 'createdAt',
      order = 'DESC',
      page = '1',
      limit = '10',
      includeSubcategories = 'true'
    } = req.query as {
      query?: string;
      categoryIds?: string;
      sort?: string;
      order?: string;
      page?: string;
      limit?: string;
      includeSubcategories?: string;
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

    const filterConditions: any[] = [];
    
    //Define field name mappings
    const fieldMappings = {
      'color': ['color', 'colors', 'Color', 'Colors'],
      'size': ['size', 'sizes', 'Size', 'Sizes'],
      'skintypes': ['skintypes', 'SkinTypes', 'skinTypes']
    };
    
    const arrayFields = ['color', 'size', 'skintypes'];
        
    const groupedFilters: { [key: string]: any[] } = {};
    
    for (const [key, value] of Object.entries(req.query)) {      
      if (!key.startsWith('filter_') || !value) continue;
      
      const parts = key.split('_');
      if (parts.length < 2) continue;
      
      const fieldRaw = parts[1];
      const filterType = parts.length > 2 ? parts[2] : null;
      
      //Skip empty values
      if (value === '') continue;

      if (fieldRaw === 'price') {
        whereClause.price = whereClause.price || {};
        if (filterType === 'min') {
          whereClause.price[Op.gte] = parseFloat(value as string);
        } else if (filterType === 'max') {
          whereClause.price[Op.lte] = parseFloat(value as string);
        }
        continue;
      }

      //Initialize group
      if (!groupedFilters[fieldRaw]) {
        groupedFilters[fieldRaw] = [];
      }

      if (value.toString().includes(',')) {
        const values = (value as string).split(',').map(v => v.trim().toLowerCase());
        if (arrayFields.includes(fieldRaw)) {
          const possibleFieldNames = fieldMappings[fieldRaw as keyof typeof fieldMappings] || [fieldRaw];
          
          const valueConditions = values.map(val => {
            return `(
              ${possibleFieldNames.map(fieldName => `
                (
                  (jsonb_typeof(attributes->'${fieldName}') = 'array' AND 
                  EXISTS (
                    SELECT 1
                    FROM jsonb_array_elements_text(attributes->'${fieldName}') as elem
                    WHERE LOWER(elem::text) = '${val}'
                  ))
                  OR
                  (jsonb_typeof(attributes->'${fieldName}') = 'string' AND 
                  LOWER(attributes->>'${fieldName}') = '${val}')
                )
              `).join(' OR ')}
            )`;
          });
          
          groupedFilters[fieldRaw].push(sequelize.literal(`(${valueConditions.join(' AND ')})`));
        } else {
          values.forEach(val => {
            groupedFilters[fieldRaw].push(
              sequelize.where(
                sequelize.fn('LOWER', sequelize.col(`attributes->>'${fieldRaw}'`)),
                val
              )
            );
          });
        }
      } else {
        const singleValue = value.toString().toLowerCase();
        if (arrayFields.includes(fieldRaw)) {
          const possibleFieldNames = fieldMappings[fieldRaw as keyof typeof fieldMappings] || [fieldRaw];
          
          const condition = `(
            ${possibleFieldNames.map(fieldName => `
              (
                (jsonb_typeof(attributes->'${fieldName}') = 'array' AND 
                EXISTS (
                  SELECT 1
                  FROM jsonb_array_elements_text(attributes->'${fieldName}') as elem
                  WHERE LOWER(elem::text) = '${singleValue}'
                ))
                OR
                (jsonb_typeof(attributes->'${fieldName}') = 'string' AND 
                LOWER(attributes->>'${fieldName}') = '${singleValue}')
              )
            `).join(' OR ')}
          )`;
          
          groupedFilters[fieldRaw].push(sequelize.literal(condition));
        } else {
          groupedFilters[fieldRaw].push(
            sequelize.where(
              sequelize.fn('LOWER', sequelize.col(`attributes->>'${fieldRaw}'`)),
              singleValue
            )
          );
        }
      }
    }

    if (Object.keys(groupedFilters).length > 0) {
      filterConditions.push(...Object.values(groupedFilters).flat());
    }

    if (filterConditions.length > 0) {
      whereClause[Op.and] = filterConditions;
    }

    const offset = (Number(page) - 1) * Number(limit);
    const validSortFields = ['createdAt', 'price', 'title'] as const;
    type SortField = typeof validSortFields[number];
    
    const sortField = validSortFields.includes(sort as SortField) ? sort as SortField : 'createdAt';
    const sortOrder = order === 'ASC' ? 'ASC' : 'DESC';

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
      offset: offset,
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
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};