import { Request, Response } from 'express';
import Category from '../models/category';
import { Post, Photo, PostGallery } from '../models';

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
        required: false
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

    const category = await Category.findOne({
      where: { 
        id: categoryId,
        status: 1
      }
    });

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    const posts = await Post.findAll({
      where: { 
        categoryId,
        status: 1
      },
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
          }
        },
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name']
        }
      ],
      order: [
        ['createdAt', 'DESC'],
        [{ model: Photo, as: 'galleryPhotos' }, PostGallery, 'order', 'ASC']
      ]
    });

    res.json(posts);
  } catch (error) {
    console.error('Error fetching posts by category:', error);
    res.status(500).json({ message: 'Failed to fetch posts' });
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

