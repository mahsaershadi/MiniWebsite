import express, { RequestHandler } from 'express';
import {
  createCategoryFilter,
  getCategoryFilters,
  updateCategoryFilter,
  deleteCategoryFilter
} from '../controllers/categoryFilterController';
import authenticate from '../Middleware/auth';

const router = express.Router();

router.use(authenticate);

//Create
router.post('/', createCategoryFilter as RequestHandler);

//Get
router.get('/category/:category_id', getCategoryFilters as RequestHandler);

//Update
router.put('/:id', updateCategoryFilter as RequestHandler);

//Delete
router.delete('/:id', deleteCategoryFilter as RequestHandler);

export default router; 