import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';
import { User } from '../models';

export const signupHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, password } = req.body as { username: string; password: string };

    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    const user = await User.create({
      username, password,
      status: 1
    });

    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.ACCESS_TOKEN ?? 'default_secret',
      { expiresIn: '4h' }
    );

    return res.status(201).json({ message: 'User created successfully', token });
  } catch (err) {
    next(err instanceof Error ? err : new Error('Failed to signup'));
  }
};

export const loginHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, password } = req.body as { username: string; password: string };

    const user = await User.findOne({ where: { username } });
    if (!user) {
      return res.status(401).json({ error: 'Username or password is incorrect' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Password is incorrect' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.ACCESS_TOKEN ?? 'default_secret',
      { expiresIn: '3h' }
    );

    return res.json({ message: 'Logged in successfully', token });
  } catch (err) {
    next(err instanceof Error ? err : new Error('Failed to login'));
  }
};