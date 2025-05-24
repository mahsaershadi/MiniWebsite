import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const {
  DB_NAME = 'mini_website',
  DB_USER = 'postgres',
  DB_PASSWORD = '1363267469',  
  DB_HOST = 'localhost',
  DB_PORT = '5432'
} = process.env;

const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
  host: DB_HOST,
  port: parseInt(DB_PORT),
  dialect: 'postgres',
  logging: () => {}, 
});

export default sequelize;