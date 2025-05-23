import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../utils/database';

interface PostAttributes {
  id: number;
  title: string;
  price: number;
  coverPhoto: string;
  //created_at: Date;
  status: number;
}

type PostCreationAttributes = Optional<PostAttributes, 'id'>;

class Post extends Model<PostAttributes, PostCreationAttributes> implements PostAttributes {
  public id!: number;
  public title!: string;
  public price!: number;
  public coverPhoto!: string;
  //public created_at!: Date;
  public status!: number;

  public readonly photos?: any[];
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
  coverPhoto: {
    type: DataTypes.STRING,
    allowNull: true
  },
  // created_at: {
  //   type: DataTypes.DATE,
  //   allowNull: false,
  //   defaultValue: DataTypes.NOW
  // },
  status: {
    type: DataTypes.INTEGER,
    defaultValue: 1 // 1 = active, -1 = deleted
  }
}, {
  sequelize,
  tableName: 'posts',
  timestamps: false 
});

export default Post;