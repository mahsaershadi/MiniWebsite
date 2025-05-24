import express, { ErrorRequestHandler } from 'express';
import path from 'path';
import sequelize from './utils/database';
import postRoutes from './routes/postRoutes';
import Post from './models/post';
import Photo from './models/photo';

const app = express();

app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));
app.use('/thumbnails', express.static(path.join(__dirname, '..', 'thumbnails')));
app.use(postRoutes);

const errorHandler: ErrorRequestHandler = (err: Error, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message || 'Server Error' });
};
app.use(errorHandler);

sequelize.sync({ alter: true }).then(() => {
  app.listen(3000, () => console.log('Server running on http://localhost:5432'));
}).catch(err => {
  console.error('Failed to sync database:', err);
  process.exit(1);
});