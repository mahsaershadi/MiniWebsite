import sequelize from '../utils/database';
import Post from './post';
import Photo from './photo';
import User from './user';
import PostGallery from './postGallery';
import Category from './category';

import dotenv from 'dotenv';
dotenv.config();

const models = {
  User,
  Post,
  Photo,
  PostGallery,
  Category
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

//category
Category.belongsTo(Category, { as: 'parent', foreignKey: 'parentId' });
Category.hasMany(Category, { as: 'subcategories', foreignKey: 'parentId' });
Category.hasMany(Post, { foreignKey: 'categoryId', as: 'posts' });
Post.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });

export { Post, Photo, User, PostGallery, Category, sequelize };