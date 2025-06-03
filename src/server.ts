import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import postRoutes from './routes/postRoutes';
import galleryRoutes from './routes/photoRoutes';
import authRoutes from './routes/authRoutes';
import deleteRoutes from './routes/deleteRoutes';
import { sequelize } from './models';
import categoryRoutes from './routes/categoryRoutes';
import cartRoutes from './routes/cartRoutes';
import cors from 'cors';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api', postRoutes);
app.use('/api', galleryRoutes);
app.use('/api', authRoutes);
app.use('/api', deleteRoutes);
app.use('/api', categoryRoutes);
app.use('/api', cartRoutes);

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message || 'Server error' });
});

const PORT = process.env.PORT || 3000;
sequelize.sync({ force: false }).then(() => {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}).catch(err => {
  console.error('Unable to connect to the database:', err);
});

export default app;