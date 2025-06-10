import express from 'express';
import { RequestHandler } from 'express';
import { 
  createCategory, 
  getCategories, 
  deleteCategory,
  getPostsByCategory 
} from '../controllers/categoryController';
import { cacheMiddleware } from '../utils/cache';

const router = express.Router();
//cache for 5 min
router.get('/categories', cacheMiddleware(300), getCategories as RequestHandler);
router.post('/categories', createCategory as RequestHandler);
router.delete('/categories/:id', deleteCategory as RequestHandler);
//caching posts for 2 min
router.get('/categories/:categoryId/posts', cacheMiddleware(120), getPostsByCategory as RequestHandler);

export default router;