import { Request, Response, NextFunction, RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/user';

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

export type AuthRequest = Request & {
  user?: User;
};

const authenticateUser: RequestHandler = async (req, res, next): Promise<void> => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.replace('Bearer ', '') : null;

  if (!token) {
    res.status(401).json({ error: 'No token provided' });
    return;
  }

  try {
    const secret = process.env.ACCESS_TOKEN ?? 'default_secret';
    const decoded = jwt.verify(token, secret) as { id: number; username: string };

    // Fetch the user from the database
    const user = await User.findByPk(decoded.id);
    if (!user) {
      res.status(401).json({ error: 'User not found' });
      return;
    }

    req.user = user;
    next();
  } catch (err) {
    console.error('Token verification error:', err);
    res.status(401).json({ error: 'Invalid token' });
    return;
  }
};

export default authenticateUser;