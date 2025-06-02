import { Request, Response } from 'express';
import Category from '../models/category';
import { Post, Photo, PostGallery } from '../models';
import { Op } from 'sequelize';
import { Sequelize } from 'sequelize';

interface CategoryWithParent extends Category {
  parent?: {
    id: number;
    name: string;
  } | null;
}

interface CategoryWithSubcategories extends Category {
  subcategories?: CategoryWithSubcategories[];
}

//subs
const getAllSubcategoryIds = async (categoryId: number): Promise<number[]> => {
  const allIds: number[] = [];
  
  const subcategories = await Category.findAll({
    where: {
      parentId: categoryId,
      status: 1
    }
  });

  for (const sub of subcategories) {
    allIds.push(sub.id);
    const childIds = await getAllSubcategoryIds(sub.id);
    allIds.push(...childIds);
  }

  return allIds;
};

//Create category
export const createCategory = async (req: Request, res: Response) => {
  try {
    const { name, parentId } = req.body;
    
    if (parentId) {
      const parentCategory = await Category.findOne({
        where: { id: parentId, status: 1 }
      });
      if (!parentCategory) {
        return res.status(404).json({ message: 'Parent category not found' });
      }
    }

    const category = await Category.create({
      name,
      parentId: parentId || null
    });

    res.status(201).json(category);
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ message: 'Failed to create category' });
  }
};

//Get all categories
export const getCategories = async (req: Request, res: Response) => {
  try {
    const categories = await Category.findAll({
      where: { 
        parentId: null, 
        status: 1 
      },
      include: [{
        model: Category,
        as: 'subcategories',
        where: { status: 1 },
        required: false,
        include: [{
          model: Category,
          as: 'subcategories',
          where: { status: 1 },
          required: false
        }]
      }]
    });

    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ message: 'Failed to fetch categories' });
  }
};

//Get posts by category
export const getPostsByCategory = async (req: Request, res: Response) => {
  try {
    const { categoryId } = req.params;
    const { ispost, limit = '10', orderby = 'desc' } = req.query;
    
    let parsedLimit: number;
    try {
      parsedLimit = parseInt(limit as string);
      if (isNaN(parsedLimit) || parsedLimit < 1) {
        return res.status(400).json({ message: 'Limit must be a positive number' });
      }
    } catch (error) {
      console.error('Error parsing limit:', error);
      return res.status(400).json({ message: 'Invalid limit parameter' });
    }

    const order = (orderby as string)?.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    const allCategoryIds = await getAllSubcategoryIds(parseInt(categoryId));
    allCategoryIds.push(parseInt(categoryId)); 

    let category = null;
    if (ispost !== 'true') {
      category = await Category.findOne({
        where: { 
          id: categoryId,
          status: 1
        },
        include: [{
          model: Category,
          as: 'subcategories',
          where: { status: 1 },
          required: false,
          include: [{
            model: Category,
            as: 'subcategories',
            where: { status: 1 },
            required: false
          }]
        }]
      });

      if (!category) {
        return res.status(404).json({ message: 'Category not found' });
      }
    } else {
      const categoryExists = await Category.findOne({
        where: { 
          id: categoryId,
          status: 1
        }
      });

      if (!categoryExists) {
        return res.status(404).json({ message: 'Category not found' });
      }
    }

    const whereClause = {
      categoryId: {
        [Op.in]: allCategoryIds
      },
      status: 1
    };

    const posts = await Post.findAll({
      where: whereClause,
      include: [
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
          },
          required: false
        },
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name', 'parentId'],
          where: { status: 1 },
          required: true
        }
      ],
      order: [
        ['createdAt', order],
        [{ model: Photo, as: 'galleryPhotos' }, PostGallery, 'order', 'ASC']
      ],
      limit: parsedLimit
    });

    if (ispost === 'true') {
      res.json({
        posts
      });
    } else {
      res.json({
        category,
        posts
      });
    }
  } catch (error) {
    console.error('Error fetching posts by category:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ 
      message: 'Failed to fetch posts',
      details: errorMessage
    });
  }
};

//Delete category
export const deleteCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const category = await Category.findByPk(id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    await Category.update(
      { status: -1 },
      { where: { id } }
    );

    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ message: 'Failed to delete category' });
  }
};

