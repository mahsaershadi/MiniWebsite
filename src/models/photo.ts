import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../utils/database';

interface PhotoAttributes {
  id: number;
  postId: number;
  filename: string;
}

interface PhotoCreationAttributes extends Optional<PhotoAttributes, 'id'> {}

class Photo extends Model<PhotoAttributes, PhotoCreationAttributes> implements PhotoAttributes {
  public id!: number;
  public postId!: number;
  public filename!: string;

  // تایپ رابطه (بدون تعریف مستقیم)
  public readonly post?: any; // این فقط برای تایپ است، رابطه تو index.ts تنظیم می‌شه
}

Photo.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  postId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'posts',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  filename: {
    type: DataTypes.STRING,
    allowNull: false
  }
}, {
  sequelize,
  tableName: 'photos'
});

export default Photo;