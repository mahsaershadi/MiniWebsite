import sequelize from '../utils/database';
import User from './user';
import Post from './post';
import Photo from './photo';

Post.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Post.belongsTo(Photo, { foreignKey: 'cover_photo_id', as: 'coverPhoto' });
// Post.belongsToMany(Photo, {
//   through: 'Photos',
//   as: 'Photos',
//   foreignKey: 'postId'
// });

Photo.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Photo.hasMany(Post, { foreignKey: 'cover_photo_id', as: 'posts' });
// Photo.belongsToMany(Post, {
//   through: 'Photos',
//   as: 'posts',
//   foreignKey: 'PhotoId'
// });