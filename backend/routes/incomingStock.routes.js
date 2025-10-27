import express from 'express';
import {
  getAllStock,
  getStockById,
  createStock,
  updateStock,
  deleteStock,
  searchStock,
  getStockByMonth,
  getMonthlyStats
} from '../controllers/incomingStock.controller.js';

const router = express.Router();

// Monthly stats route
router.get('/stats/monthly', getMonthlyStats);

// Month filter route
router.get('/month/:year/:month', getStockByMonth);

// Search route
router.get('/search', searchStock);

// Main routes
router.route('/')
  .get(getAllStock)
  .post(createStock);

// Single stock routes
router.route('/:id')
  .get(getStockById)
  .put(updateStock)
  .delete(deleteStock);

export default router;
