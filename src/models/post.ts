import { DataTypes, Model, Optional } from 'sequelize';
import sequelize  from '../utils/database';
import User from './user';
import Photo from './photo';

interface PostAttributes {
  id: number;
  title: string;
  price: number;
  userId: number;
  cover_photo_id?: number;
  categoryId: number | null;
  status: number;
  stock_quantity: number;
  color?: string;
  size?: string;
  brand?: string;
  type?: string;
  description?: string;
  specifications?: object;
}

interface PostCreationAttributes extends Optional<PostAttributes, 'id' | 'cover_photo_id' | 'color' | 'size' | 'brand' | 'type' | 'description' | 'specifications'> {}

class Post extends Model<PostAttributes, PostCreationAttributes> implements PostAttributes {
  public id!: number;
  public title!: string;
  public price!: number;
  public userId!: number;
  public cover_photo_id?: number;
  public categoryId!: number | null;
  public status!: number;
  public stock_quantity!: number;
  public color?: string;
  public size?: string;
  public brand?: string;
  public type?: string;
  public description?: string;
  public specifications?: object;
}

Post.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  price: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: User, key: 'id' }
  },
  cover_photo_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: Photo, key: 'id' }
  },
  categoryId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'categories',
      key: 'id'
    }
  },
  status: {
    type: DataTypes.INTEGER,
    defaultValue: 1 // 1 = active, -1 = deleted
  },
  stock_quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  color: {
    type: DataTypes.STRING,
    allowNull: true
  },
  size: {
    type: DataTypes.STRING,
    allowNull: true
  },
  brand: {
    type: DataTypes.STRING,
    allowNull: true
  },
  type: {
    type: DataTypes.STRING,
    allowNull: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  specifications: {
    type: DataTypes.JSONB,
    allowNull: true
  }
}, {
  sequelize,
  tableName: 'posts',
});


export default Post;