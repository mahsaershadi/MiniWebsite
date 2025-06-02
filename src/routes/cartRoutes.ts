import express, { Request, Response } from 'express';
import { Op, Sequelize } from 'sequelize';
import CartItem from '../models/cart';
import Post from '../models/post';
import authenticateUser from '../Middleware/auth';
import sequelize from '../utils/database';

interface RequestUser {
  id: number;
}

interface CustomRequest extends Request {
  user?: RequestUser;
}

interface CartItemWithPost extends CartItem {
  Post: {
    id: number;
    title: string;
    price: number;
    stock_quantity: number;
  };
}

interface CartItemResult {
  id: number;
  userId: number;
  postId: number;
  quantity: number;
  'Post.id': number;
  'Post.title': string;
  'Post.price': number;
  'Post.stock_quantity': number;
  total: number;
}

const router = express.Router();

//Add item
router.post('/cart', authenticateUser, async (req: CustomRequest, res: Response): Promise<void> => {
  const t = await sequelize.transaction();
  
  try {
    const { postId, quantity } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }

    const product = await Post.findByPk(postId, { transaction: t, lock: true });
    if (!product) {
      await t.rollback();
      res.status(404).json({ message: 'Product not found' });
      return;
    }

    if (product.stock_quantity < quantity) {
      await t.rollback();
      res.status(400).json({ 
        message: `Not enough stock. Only ${product.stock_quantity} items available.` 
      });
      return;
    }

    let cartItem = await CartItem.findOne({
      where: { userId: userId, postId: postId },
      transaction: t
    });

    if (cartItem) {
      if (cartItem.quantity + quantity > product.stock_quantity) {
        await t.rollback();
        res.status(400).json({ 
          message: `Cannot add more items. Only ${product.stock_quantity} items available.` 
        });
        return;
      }
      cartItem.quantity += quantity;
      await cartItem.save({ transaction: t });
    } else {
      cartItem = await CartItem.create({
        userId: userId,
        postId: postId,
        quantity
      }, { transaction: t });
    }

    //Reducing
    await product.update({
      stock_quantity: product.stock_quantity - quantity
    }, { transaction: t });

    await t.commit();
    res.status(200).json(cartItem);
  } catch (error) {
    await t.rollback();
    res.status(500).json({ message: 'Error adding item to cart', error });
  }
});

//Get shopping list
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
        attributes: ['id', 'title', 'price', 'stock_quantity'],
        required: true
      }],
      attributes: [
        'id',
        'userId',
        'postId',
        'quantity',
        [
          Sequelize.literal('("CartItem".quantity * "Post".price)::numeric'),
          'total'
        ]
      ],
      group: ['CartItem.id', 'Post.id', 'Post.title', 'Post.price', 'Post.stock_quantity'],
      raw: true
    }) as unknown as CartItemResult[];


    const formattedItems = cartItems.map(item => ({
      id: item.id,
      userId: item.userId,
      postId: item.postId,
      quantity: item.quantity,
      Post: {
        id: item['Post.id'],
        title: item['Post.title'],
        price: item['Post.price'],
        stock_quantity: item['Post.stock_quantity']
      },
      total: Number((item['Post.price'] * item.quantity).toFixed(2))
    }));

    //Calculate
    const cartTotal = formattedItems.reduce((sum, item) => sum + item.total, 0);

    res.status(200).json({
      items: formattedItems,
      total: Number(cartTotal.toFixed(2))
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching cart', error });
  }
});


//Update cart item quantity
router.put('/cart/:postId', authenticateUser, async (req: CustomRequest, res: Response): Promise<void> => {
  const t = await sequelize.transaction();
  
  try {
    const { postId } = req.params;
    const { quantity } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      await t.rollback();
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }

    const product = await Post.findByPk(postId, { transaction: t, lock: true });
    if (!product) {
      await t.rollback();
      res.status(404).json({ message: 'Product not found' });
      return;
    }

    const cartItem = await CartItem.findOne({
      where: { userId: userId, postId: postId },
      transaction: t
    });

    if (!cartItem) {
      await t.rollback();
      res.status(404).json({ message: 'Item not found in cart' });
      return;
    }

    const stockChange = cartItem.quantity - quantity;
    const newStockQuantity = product.stock_quantity + stockChange;

    if (newStockQuantity < 0) {
      await t.rollback();
      res.status(400).json({ 
        message: `Cannot update quantity. Only ${product.stock_quantity + cartItem.quantity} items available.` 
      });
      return;
    }

    cartItem.quantity = quantity;
    await cartItem.save({ transaction: t });

    await product.update({
      stock_quantity: newStockQuantity
    }, { transaction: t });

    await t.commit();
    res.status(200).json(cartItem);
  } catch (error) {
    await t.rollback();
    res.status(500).json({ message: 'Error updating cart item', error });
  }
});

//Remove items from cart
router.delete('/cart/:postId', authenticateUser, async (req: CustomRequest, res: Response): Promise<void> => {
  const t = await sequelize.transaction();
  
  try {
    const { postId } = req.params;
    const { quantity } = req.body; 
    const userId = req.user?.id;

    if (!userId) {
      await t.rollback();
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }

    const cartItem = await CartItem.findOne({
      where: { userId: userId, postId: postId },
      transaction: t
    });

    if (!cartItem) {
      await t.rollback();
      res.status(404).json({ message: 'Item not found in cart' });
      return;
    }

    const product = await Post.findByPk(postId, { transaction: t, lock: true });
    if (!product) {
      await t.rollback();
      res.status(404).json({ message: 'Product not found' });
      return;
    }

    if (quantity && quantity > 0) {
      if (quantity > cartItem.quantity) {
        await t.rollback();
        res.status(400).json({ 
          message: `Cannot remove ${quantity} items. Only ${cartItem.quantity} items in cart.` 
        });
        return;
      }

      if (cartItem.quantity - quantity === 0) {
        await cartItem.destroy({ transaction: t });
      } else {
        cartItem.quantity -= quantity;
        await cartItem.save({ transaction: t });
      }


      await product.update({
        stock_quantity: product.stock_quantity + quantity
      }, { transaction: t });

      await t.commit();
      res.status(200).json({ 
        message: `Removed ${quantity} item(s) from cart`,
        remainingQuantity: cartItem.quantity - quantity
      });
    } else {
      await product.update({
        stock_quantity: product.stock_quantity + cartItem.quantity
      }, { transaction: t });

      //Remove the cart item
      await cartItem.destroy({ transaction: t });

      await t.commit();
      res.status(200).json({ message: 'Item removed from cart' });
    }
  } catch (error) {
    await t.rollback();
    res.status(500).json({ message: 'Error removing item from cart', error });
  }
});

export default router; 