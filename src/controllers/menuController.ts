import { Request, Response } from 'express';
import Menu from '../models/Menu';
import Category from '../models/category';
import { Op } from 'sequelize';


//create
export const createMenuItem = async (req: Request, res: Response) => {
  try {
    const menuItem = await Menu.create(req.body);
    res.status(201).json(menuItem);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create menu item' });
  }
};

//get menu
export const getAllMenuItems = async (req: Request, res: Response) => {
  try {
    const menuItems = await Menu.findAll({
      order: [
        ['type', 'ASC'],  // Categories first
        ['parentId', 'ASC'],
        ['order', 'ASC'],
      ],
    });
    
    const menuTree = buildMenuTree(menuItems);
    res.json(menuTree);
  } catch (error) {
    console.error('Error fetching menu items:', error);
    res.status(500).json({ error: 'Failed to fetch menu items' });
  }
};

//update
export const updateMenuItem = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const menuItem = await Menu.findByPk(id);
    if (!menuItem) {
      return res.status(404).json({ error: 'Menu item not found' });
    }
    await menuItem.update(req.body);
    res.json(menuItem);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update menu item' });
  }
};


//delete
export const deleteMenuItem = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const menuItem = await Menu.findByPk(id);
    if (!menuItem) {
      return res.status(404).json({ error: 'Menu item not found' });
    }
    await menuItem.destroy();
    res.json({ message: 'Menu item deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete menu item' });
  }
};

//function to build menu tree
const buildMenuTree = (items: Menu[]) => {
  const itemMap = new Map();
  const roots: any[] = [];

  // Create a map of all items
  items.forEach(item => {
    itemMap.set(item.id, { ...item.toJSON(), children: [] });
  });

  // Build the tree structure
  items.forEach(item => {
    const node = itemMap.get(item.id);
    if (item.parentId === null) {
      roots.push(node);
    } else {
      const parent = itemMap.get(item.parentId);
      if (parent) {
        parent.children.push(node);
      }
    }
  });

  return roots;
};

export const syncCategoriesWithMenu = async (req: Request, res: Response) => {
  try {
    // First, get all existing menu items that are categories
    const existingMenuItems = await Menu.findAll({
      where: {
        type: 'category'
      }
    });

    // Delete existing category menu items
    for (const menuItem of existingMenuItems) {
      await menuItem.destroy();
    }

    // Get all categories
    const categories = await Category.findAll({
      where: { status: 1 },
      order: [
        ['parentId', 'ASC'], // This ensures parents come before children
        ['id', 'ASC']
      ]
    });

    // Create a map to store new menu item IDs
    const categoryToMenuMap = new Map<number, number>();

    // First pass: Create all root categories (no parent)
    for (const category of categories) {
      if (category.parentId === null) {
        const menuItem = await Menu.create({
          title: category.name,
          type: 'category',
          parentId: null,
          url: `/categories/${category.id}`,
          order: category.id,
          isActive: true
        });
        categoryToMenuMap.set(category.id, menuItem.id);
      }
    }

    // Second pass: Create all categories with parents
    for (const category of categories) {
      if (category.parentId !== null) {
        const parentMenuId = categoryToMenuMap.get(category.parentId);
        if (parentMenuId) {
          const menuItem = await Menu.create({
            title: category.name,
            type: 'category',
            parentId: parentMenuId, // Use the new menu item ID as parent
            url: `/categories/${category.id}`,
            order: category.id,
            isActive: true
          });
          categoryToMenuMap.set(category.id, menuItem.id);
        }
      }
    }

    // Get all menu items and build tree
    const menuItems = await Menu.findAll({
      order: [
        ['type', 'ASC'],  // Categories first
        ['parentId', 'ASC'],
        ['order', 'ASC'],
      ],
    });
    
    const menuTree = buildMenuTree(menuItems);
    res.json(menuTree);
  } catch (error) {
    console.error('Error syncing categories with menu:', error);
    res.status(500).json({ error: 'Failed to sync categories with menu' });
  }
}; 