import { Response, NextFunction } from 'express';
import { AuthRequest } from '../Middleware/auth';
import { Photo, User } from '../models';


//upload pic
export const uploadGalleryPhotos = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const files = req.files as Express.Multer.File[];
    const userId = req.user?.id;

    if (!userId) return res.status(401).json({ error: 'User not authenticated' });
    if (!files || files.length === 0) return res.status(400).json({ error: 'No photos uploaded' });

    const photos = await Promise.all(
      files.map(file => Photo.create({
        filename: file.filename,
        userId,
        status: 1
      }))
    );

    res.status(201).json(photos);
  } catch (err) {
    next(err instanceof Error ? err : new Error('Failed to upload photos'));
  }
};


//get pics
export const getGalleryPhotos = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const photos = await Photo.findAll({
      where: { status: 1 },
      attributes: ['id', 'filename', 'createdAt'],
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json(photos);
  } catch (err) {
    next(err instanceof Error ? err : new Error('Failed to fetch gallery photos'));
  }
};