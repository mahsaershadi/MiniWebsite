import sequelize from '../utils/database';
import Post from './post';
import Photo from './photo';
import User from './user';
import PostGallery from './postGallery';

const models = {
  User,
  Post,
  Photo,
  PostGallery
};

// User 
User.hasMany(Photo, { foreignKey: 'userId', as: 'photos' });
User.hasMany(Post, { foreignKey: 'userId', as: 'posts' });

// Post 
Post.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Post.belongsTo(Photo, { foreignKey: 'cover_photo_id', as: 'coverPhoto' });
Post.belongsToMany(Photo, {
  through: PostGallery,
  as: 'galleryPhotos',
  foreignKey: 'postId',
  otherKey: 'photoId'
});

// Photo 
Photo.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Photo.hasMany(Post, { foreignKey: 'cover_photo_id', as: 'coverForPosts' });
Photo.belongsToMany(Post, {
  through: PostGallery,
  as: 'posts',
  foreignKey: 'photoId',
  otherKey: 'postId'
});

export { Post, Photo, User, PostGallery, sequelize };