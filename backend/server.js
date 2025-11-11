import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

app.use(cors({
  origin: "https://forgeerp.vercel.app/",
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

mongoose.connect(process.env.MONGODB_LIVE || 'mongodb://localhost:27017/forge_erp', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.log('❌ MongoDB Error:', err));

// Import routes
import authRoutes from './routes/auth.routes.js';
import incomingStockRoutes from './routes/incomingStock.routes.js';
import cuttingRoutes from './routes/cutting.routes.js';
import forgingRoutes from './routes/forging.routes.js';
// import dispatchRoutes from './routes/dispatch.routes.js';

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/incoming-stock', incomingStockRoutes);
app.use('/api/cutting', cuttingRoutes);
app.use('/api/forging', forgingRoutes);
// app.use('/api/dispatch', dispatchRoutes);

// Welcome route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Forge ERP API',
    version: '2.0.0',
    endpoints: {
      auth: '/api/auth',
      incomingStock: '/api/incoming-stock',
      cutting: '/api/cutting',
      forging: '/api/forging'
    }
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
