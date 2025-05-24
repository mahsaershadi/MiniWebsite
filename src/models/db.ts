import { Sequelize } from 'sequelize';
import sequelize from '../utils/database';
import Post from './post';
import Photo from './photo';

export { Post, Photo, sequelize };

Post.hasMany(Photo, { foreignKey: 'postId', as: 'photos' });
Photo.belongsTo(Post, { foreignKey: 'postId', as: 'post' });


// const { Sequelize, DataTypes, Op } = require('sequelize');
// const path = require('path');

// const sequelize = new Sequelize('mini_website', 'postgres', '1363267469', {
//     host: 'localhost',
//     dialect: 'postgres',
//     logging: () => {}, 
// });

// const db = {};
// db.Sequelize = Sequelize;
// db.sequelize = sequelize;
// db.Op = Op;

// // Define models
// db.User = require('./user')(sequelize, Sequelize);
// db.Post = require('./post')(sequelize, Sequelize);
// db.Like = require('./like')(sequelize, DataTypes);
// db.Photo = require('./photo')(sequelize, Sequelize.DataTypes);

// // Define associations
// db.User.hasMany(db.Post, { foreignKey: 'user_id', as: 'AuthoredPosts' });
// db.Post.belongsTo(db.User, { foreignKey: 'user_id', as: 'Author' });
// db.User.belongsToMany(db.Post, { through: db.Like, foreignKey: 'user_id', as: 'LikedPosts' });
// db.Post.belongsToMany(db.User, { through: db.Like, foreignKey: 'post_id', as: 'LikedByUsers' });

// db.Post.hasMany(db.Like, { foreignKey: 'post_id', as: 'Likes', onDelete: 'CASCADE' });
// db.Like.belongsTo(db.Post, { foreignKey: 'post_id', onDelete: 'CASCADE' });
// db.Photo.belongsTo(db.User, { foreignKey: 'user_id', as: 'Author' });
// db.Photo.belongsTo(db.Post, { foreignKey: 'post_id', nDelete: 'CASCADE' });
// db.Post.hasMany(db.Photo, { foreignKey: 'post_id', onDelete: 'CASCADE' });


// Object.keys(db).forEach(modelName => {
//     if (db[modelName].associate) {
//         db[modelName].associate(db);
//     }
// });

// module.exports = db;