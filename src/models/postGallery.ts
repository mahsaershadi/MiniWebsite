import { DataTypes, Model } from 'sequelize';
import sequelize from '../utils/database';

interface PostGalleryAttributes {
  postId: number;
  photoId: number;
  order: number; 
  status: number;
}

class PostGallery extends Model<PostGalleryAttributes> implements PostGalleryAttributes {
  public postId!: number;
  public photoId!: number;
  public order!: number;
  public status!: number;
}

PostGallery.init({
  postId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    references: {
      model: 'posts',
      key: 'id'
    }
  },
  photoId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    references: {
      model: 'photos',
      key: 'id'
    }
  },
  order: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  status: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  }
}, {
  sequelize,
  tableName: 'post_galleries',
  timestamps: true
});

export default PostGallery; 