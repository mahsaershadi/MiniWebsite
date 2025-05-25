import express, { Request } from 'express';
import { body } from 'express-validator';
import { signupHandler, loginHandler } from '../controllers/authController';
import asyncHandler from '../Middleware/asyncHandler';

const router = express.Router();

router.post('/signup', [
  body('username')
    .trim()
    .notEmpty()
    .withMessage('Username is required')
    .isLength({ min: 3 })
    .withMessage('Username must be at least 3 characters'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters')
], asyncHandler(signupHandler as (req: Request, ...args: any[]) => Promise<any>));

router.post('/login', [
  body('username')
    .trim()
    .notEmpty()
    .withMessage('Username is required'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
], asyncHandler(loginHandler as (req: Request, ...args: any[]) => Promise<any>));

export default router;