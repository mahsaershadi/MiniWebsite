import { Request, Response } from 'express';
import Post from '../models/post';
import Photo from '../models/photo';

//delete post
export const deletePost = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { postId } = req.params;

    // Check if post exists and belongs to user
    const post = await Post.findOne({
      where: {
        id: postId,
        userId: req.user.id,
        status: 1
      }
    });

    if (!post) {
      return res.status(404).json({ message: 'Post not found or unauthorized' });
    }

    // Soft delete
    await Post.update(
      { status: -1 },
      { where: { id: postId } }
    );

    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ message: 'Failed to delete post' });
  }
};

//delete photo
export const deletePhoto = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { photoId } = req.params;

    // Check if photo exists and belongs to user
    const photo = await Photo.findOne({
      where: {
        id: photoId,
        userId: req.user.id,
        status: 1
      }
    });

    if (!photo) {
      return res.status(404).json({ message: 'Photo not found or unauthorized' });
    }

    // Soft delete
    await Photo.update(
      { status: -1 },
      { where: { id: photoId } }
    );

    res.json({ message: 'Photo deleted successfully' });
  } catch (error) {
    console.error('Error deleting photo:', error);
    res.status(500).json({ message: 'Failed to delete photo' });
  }
}; 