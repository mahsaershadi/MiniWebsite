import express, { RequestHandler } from 'express';
import {
  createCategoryFilter,
  getCategoryFilters,
  updateCategoryFilter,
  deleteCategoryFilter
} from '../controllers/categoryFilterController';
import authenticate from '../Middleware/auth';

const router = express.Router();

// Middleware to ensure user is authenticated for all routes
router.use(authenticate);

// Create new category filter
router.post('/', createCategoryFilter as RequestHandler);

// Get all filters for a category
router.get('/category/:category_id', getCategoryFilters as RequestHandler);

// Update existing filter
router.put('/:id', updateCategoryFilter as RequestHandler);

// Delete filter
router.delete('/:id', deleteCategoryFilter as RequestHandler);

export default router; 