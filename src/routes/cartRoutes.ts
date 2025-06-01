import express, { Request, Response } from 'express';
import { Op } from 'sequelize';
import CartItem from '../models/cart';
import Post from '../models/post';
import authenticateUser from '../Middleware/auth';

interface RequestUser {
  id: number;
}

interface CustomRequest extends Request {
  user?: RequestUser;
}

const router = express.Router();

// Add item to cart
router.post('/cart', authenticateUser, async (req: CustomRequest, res: Response): Promise<void> => {
  try {
    const { postId, quantity } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }

    const product = await Post.findByPk(postId);
    if (!product) {
      res.status(404).json({ message: 'Product not found' });
      return;
    }

    if (product.stock_quantity < quantity) {
      res.status(400).json({ 
        message: `Not enough stock. Only ${product.stock_quantity} items available.` 
      });
      return;
    }

    let cartItem = await CartItem.findOne({
      where: { userId: userId, postId: postId }
    });

    if (cartItem) {
      if (cartItem.quantity + quantity > product.stock_quantity) {
        res.status(400).json({ 
          message: `Cannot add more items. Only ${product.stock_quantity} items available.` 
        });
        return;
      }
      cartItem.quantity += quantity;
      await cartItem.save();
    } else {
      cartItem = await CartItem.create({
        userId: userId,
        postId: postId,
        quantity
      });
    }

    res.status(200).json(cartItem);
  } catch (error) {
    res.status(500).json({ message: 'Error adding item to cart', error });
  }
});

// Get user's shopping cart with total price
router.get('/cart', authenticateUser, async (req: CustomRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }
    
    const cartItems = await CartItem.findAll({
      where: { userId: userId },
      include: [{
        model: Post,
        attributes: ['id', 'title', 'price', 'stock_quantity']
      }]
    });

    // Calculate total price
    const total = cartItems.reduce((sum, item: any) => {
      const post = item.get({ plain: true }).Post;
      return sum + (post.price * item.quantity);
    }, 0);

    res.status(200).json({
      items: cartItems,
      total: total
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching cart', error });
  }
});

// Update cart item quantity
router.put('/cart/:postId', authenticateUser, async (req: CustomRequest, res: Response): Promise<void> => {
  try {
    const { postId } = req.params;
    const { quantity } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }

    const product = await Post.findByPk(postId);
    if (!product) {
      res.status(404).json({ message: 'Product not found' });
      return;
    }

    if (quantity > product.stock_quantity) {
      res.status(400).json({ 
        message: `Cannot update quantity. Only ${product.stock_quantity} items available.` 
      });
      return;
    }

    const cartItem = await CartItem.findOne({
      where: { userId: userId, postId: postId }
    });

    if (!cartItem) {
      res.status(404).json({ message: 'Item not found in cart' });
      return;
    }

    cartItem.quantity = quantity;
    await cartItem.save();

    res.status(200).json(cartItem);
  } catch (error) {
    res.status(500).json({ message: 'Error updating cart item', error });
  }
});

// Remove item from cart
router.delete('/cart/:postId', authenticateUser, async (req: CustomRequest, res: Response): Promise<void> => {
  try {
    const { postId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }

    const result = await CartItem.destroy({
      where: { userId: userId, postId: postId }
    });

    if (result === 0) {
      res.status(404).json({ message: 'Item not found in cart' });
      return;
    }

    res.status(200).json({ message: 'Item removed from cart' });
  } catch (error) {
    res.status(500).json({ message: 'Error removing item from cart', error });
  }
});

export default router; 