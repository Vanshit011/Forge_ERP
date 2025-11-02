import express from 'express';
import {
  getAllForging,
  getForgingById,
  createForging,
  updateForging,
  deleteForging,
  getForgingStock,
  getAvailableCuttingRecords,
  getForgingByMonth,
  getMonthlyForgingStats
} from '../controllers/forging.controller.js';

const router = express.Router();

// Stock and statistics routes (MUST come before :id routes to avoid conflicts)
router.get('/stock/summary', getForgingStock);
router.get('/available/cutting-records', getAvailableCuttingRecords);
router.get('/stats/monthly', getMonthlyForgingStats);
router.get('/month/:year/:month', getForgingByMonth);

// CRUD routes
router.get('/', getAllForging);
router.post('/', createForging);
router.get('/:id', getForgingById);
router.put('/:id', updateForging);
router.delete('/:id', deleteForging);

export default router;
