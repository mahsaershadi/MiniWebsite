import { Response, NextFunction } from 'express';
import { AuthRequest } from '../Middleware/auth';
import { Photo, User } from '../models';

export const uploadGalleryPhotos = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const files = req.files as Express.Multer.File[];
    const userId = req.user?.id;

    if (!userId) return res.status(401).json({ error: 'User not authenticated' });
    if (!files || files.length === 0) return res.status(400).json({ error: 'No photos uploaded' });

    const photos = await Promise.all(
      files.map(file => Photo.create({
        filename: file.filename,
        userId
      }))
    );

    res.status(201).json(photos);
  } catch (err) {
    next(err instanceof Error ? err : new Error('Failed to upload photos'));
  }
};

export const getGalleryPhotos = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'User not authenticated' });

    const photos = await Photo.findAll({
      where: { userId },
      include: [{ 
        model: User, 
        as: 'user', 
        attributes: ['id', 'username'] 
      }],
      attributes: ['id', 'filename', 'createdAt']
    });

    res.status(200).json(photos);
  } catch (err) {
    next(err instanceof Error ? err : new Error('Failed to fetch gallery photos'));
  }
};