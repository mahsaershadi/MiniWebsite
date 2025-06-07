import { Request, Response } from 'express';
import CategoryFilter, { FilterType } from '../models/categoryFilter';
import Category from '../models/category';

//create
export const createCategoryFilter = async (req: Request, res: Response) => {
  try {
    const { category_id, name, type, options, min, max, required = false, order = 0 } = req.body;

    const category = await Category.findOne({
      where: { id: category_id, status: 1 }
    });

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    const validationErrors = validateFilterInput(type, { options, min, max });
    if (validationErrors.length > 0) {
      return res.status(400).json({ errors: validationErrors });
    }

    const filter = await CategoryFilter.create({
      category_id,
      name,
      type,
      options: type === FilterType.SELECT || type === FilterType.MULTISELECT ? options : null,
      min: type === FilterType.RANGE ? min : null,
      max: type === FilterType.RANGE ? max : null,
      required,
      order,
      status: 1
    });

    res.status(201).json(filter);
  } catch (error) {
    console.error('Error creating category filter:', error);
    res.status(500).json({ 
      message: 'Failed to create category filter',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

//get
export const getCategoryFilters = async (req: Request, res: Response) => {
  try {
    const { category_id } = req.params;
    const filters = await CategoryFilter.findAll({
      where: { 
        category_id,
        status: 1 
      },
      order: [['order', 'ASC']]
    });
    res.json(filters);
  } catch (error) {
    console.error('Error fetching category filters:', error);
    res.status(500).json({ 
      message: 'Failed to fetch category filters',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

//update
export const updateCategoryFilter = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, type, options, min, max, required, order } = req.body;

    const filter = await CategoryFilter.findOne({
      where: { 
        id,
        status: 1
      }
    });

    if (!filter) {
      return res.status(404).json({ message: 'Filter not found' });
    }

    const validationErrors = validateFilterInput(type, { options, min, max });
    if (validationErrors.length > 0) {
      return res.status(400).json({ errors: validationErrors });
    }

    await filter.update({
      name,
      type,
      options: type === FilterType.SELECT || type === FilterType.MULTISELECT ? options : null,
      min: type === FilterType.RANGE ? min : null,
      max: type === FilterType.RANGE ? max : null,
      required,
      order: order !== undefined ? order : filter.order
    });

    res.json(filter);
  } catch (error) {
    console.error('Error updating category filter:', error);
    res.status(500).json({ 
      message: 'Failed to update category filter',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

//delete
export const deleteCategoryFilter = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const filter = await CategoryFilter.findOne({
      where: { 
        id,
        status: 1
      }
    });
    
    if (!filter) {
      return res.status(404).json({ message: 'Filter not found' });
    }

    await filter.update({ status: 0 });
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting category filter:', error);
    res.status(500).json({ 
      message: 'Failed to delete category filter',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

function validateFilterInput(type: FilterType, data: any): string[] {
  const errors: string[] = [];

  switch (type) {
    case FilterType.SELECT:
    case FilterType.MULTISELECT:
      if (!Array.isArray(data.options) || data.options.length === 0) {
        errors.push('Options array is required for select/multiselect filters');
      }
      break;
    case FilterType.RANGE:
      if (typeof data.min !== 'number' || typeof data.max !== 'number') {
        errors.push('Min and max values are required for range filters');
      }
      if (data.min >= data.max) {
        errors.push('Min value must be less than max value');
      }
      break;
  }

  return errors;
} 