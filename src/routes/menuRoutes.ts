import express, { Request, Response } from 'express';
import {
  createMenuItem,
  getAllMenuItems,
  updateMenuItem,
  deleteMenuItem,
  syncCategoriesWithMenu
} from '../controllers/menuController';
import { cacheMiddleware, clearCache } from '../utils/cache';

const router = express.Router();

// Menu routes with cache
router.get('/menu', cacheMiddleware(300), getAllMenuItems as express.RequestHandler);

// Routes that modify data should clear the cache
router.post('/menu', async (req, res, next) => {
  clearCache('/api/menu');
  next();
}, createMenuItem as express.RequestHandler);

router.put('/menu/:id', async (req, res, next) => {
  clearCache('/api/menu');
  next();
}, updateMenuItem as express.RequestHandler);

router.delete('/menu/:id', async (req, res, next) => {
  clearCache('/api/menu');
  next();
}, deleteMenuItem as express.RequestHandler);

router.post('/menu/sync-categories', async (req, res, next) => {
  clearCache('/api/menu');
  next();
}, syncCategoriesWithMenu as express.RequestHandler);

export default router; 