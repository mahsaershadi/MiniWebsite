import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../utils/database';
import User from './user';
import Post from './post';

interface CartItemAttributes {
  id: number;
  userId: number;
  postId: number;
  quantity: number;
}

interface CartItemCreationAttributes extends Optional<CartItemAttributes, 'id'> {}

class CartItem extends Model<CartItemAttributes, CartItemCreationAttributes> implements CartItemAttributes {
  public id!: number;
  public userId!: number;
  public postId!: number;
  public quantity!: number;
}

CartItem.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: User, key: 'id' },
    field: 'user_id'
  },
  postId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: Post, key: 'id' },
    field: 'post_id'
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1
  }
}, {
  sequelize,
  tableName: 'cart_items',
  timestamps: false,
  underscored: true
});

export default CartItem; 