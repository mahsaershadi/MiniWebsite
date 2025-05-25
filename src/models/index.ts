import sequelize from '../utils/database';
import Post from './post';
import Photo from './photo';
import User from './user';

// User associations
User.hasMany(Photo, { foreignKey: 'userId', as: 'photos' });
User.hasMany(Post, { foreignKey: 'userId', as: 'posts' });

// Post associations
Post.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Post.belongsTo(Photo, { foreignKey: 'cover_photo_id', as: 'coverPhoto' });
Post.belongsToMany(Photo, { 
  through: 'PostPhotos',
  as: 'galleryPhotos',
  foreignKey: 'postId',
  otherKey: 'photoId'
});

// Photo associations
Photo.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Photo.hasMany(Post, { foreignKey: 'cover_photo_id', as: 'coverPosts' });
Photo.belongsToMany(Post, { 
  through: 'PostPhotos',
  as: 'posts',
  foreignKey: 'photoId',
  otherKey: 'postId'
});

export { Post, Photo, User, sequelize };