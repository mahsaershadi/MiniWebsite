import express from 'express';
import { RequestHandler } from 'express';
import { 
  createCategory, 
  getCategories, 
  deleteCategory,
  getPostsByCategory 
} from '../controllers/categoryController';

const router = express.Router();
router.post('/categories', createCategory as RequestHandler);
router.get('/categories', getCategories as RequestHandler);
router.delete('/categories/:id', deleteCategory as RequestHandler);
router.get('/categories/:categoryId/posts', getPostsByCategory as RequestHandler);

export default router;