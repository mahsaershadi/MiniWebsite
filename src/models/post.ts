import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../utils/database";
import Category from "./category";
import User from "./user";

interface PostAttributes {
  id: number;
  title: string;
  description: string;
  price: number;
  userId: number;
  categoryId: number | null;
  cover_photo_id: number | null;
  status: number;
  stock_quantity: number;
  attributes: Record<string, any>;
  createdAt?: Date;
  updatedAt?: Date;
}

interface PostCreationAttributes extends Optional<PostAttributes, 'id'> {}

class Post extends Model<PostAttributes, PostCreationAttributes> implements PostAttributes {
  public id!: number;
  public title!: string;
  public description!: string;
  public price!: number;
  public userId!: number;
  public categoryId!: number | null;
  public cover_photo_id!: number | null;
  public status!: number;
  public stock_quantity!: number;
  public attributes!: Record<string, any>;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Post.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: User,
        key: 'id',
      },
    },
    categoryId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: Category,
        key: 'id',
      },
    },
    cover_photo_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    status: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
    },
    stock_quantity: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    attributes: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
      validate: {
        isValidAttributes(value: any) {
        }
      }
    },
  },
  {
    sequelize,
    tableName: 'posts',
    timestamps: true,
  }
);

export default Post;