import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../utils/database';
import User from './user';
import Post from './post';

interface PhotoAttributes {
  id: number;
  userId: number;
  filename: string;
  status: number;
}

interface PhotoCreationAttributes extends Optional<PhotoAttributes, 'id'> {}

class Photo extends Model<PhotoAttributes, PhotoCreationAttributes> implements PhotoAttributes {
  public id!: number;
  public userId!: number;
  public filename!: string;
  public status!: number;
  public readonly post?: any;
}

Photo.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  },
  filename: {
    type: DataTypes.STRING,
    allowNull: false
  },
  status: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1 // 1 = active, -1 = deleted
  }
}, {
  sequelize,
  tableName: 'photos'
});

export default Photo;