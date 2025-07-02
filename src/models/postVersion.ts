import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../utils/database";
import Post from "./post";
import User from "./user";

interface PostVersionAttributes {
  id: number;
  postId: number;
  versionNumber: number;
  title: string;
  description: string;
  price: number;
  userId: number;
  categoryId: number | null;
  cover_photo_id: number | null;
  status: number;
  stock_quantity: number;
  attributes: Record<string, any>;
  changedBy: number;
  changeType: 'CREATE' | 'UPDATE' | 'DELETE';
  changeReason?: string;
  createdAt?: Date;
}

interface PostVersionCreationAttributes extends Optional<PostVersionAttributes, 'id' | 'createdAt'> {}

class PostVersion extends Model<PostVersionAttributes, PostVersionCreationAttributes> implements PostVersionAttributes {
  public id!: number;
  public postId!: number;
  public versionNumber!: number;
  public title!: string;
  public description!: string;
  public price!: number;
  public userId!: number;
  public categoryId!: number | null;
  public cover_photo_id!: number | null;
  public status!: number;
  public stock_quantity!: number;
  public attributes!: Record<string, any>;
  public changedBy!: number;
  public changeType!: 'CREATE' | 'UPDATE' | 'DELETE';
  public changeReason?: string;
  public readonly createdAt!: Date;
}

PostVersion.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    postId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Post,
        key: 'id',
      },
    },
    versionNumber: {
      type: DataTypes.INTEGER,
      allowNull: false,
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
    },
    changedBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: User,
        key: 'id',
      },
    },
    changeType: {
      type: DataTypes.ENUM('CREATE', 'UPDATE', 'DELETE'),
      allowNull: false,
    },
    changeReason: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'post_versions',
    timestamps: true,
    indexes: [
      {
        fields: ['postId', 'versionNumber'],
        unique: true,
      },
      {
        fields: ['postId'],
      },
      {
        fields: ['changedBy'],
      },
    ],
  }
);

export default PostVersion; 