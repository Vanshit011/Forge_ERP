import express from 'express';
import {
  getAllStock,
  getStockById,
  createStock,
  updateStock,
  deleteStock,
  getStockByMonth,
  getMonthlyStockStats,
  getMaterialsInfo,
  getStockByMaterial,
  getStockByColor,
  getStockSummary
} from '../controllers/incomingStock.controller.js';

const router = express.Router();

// Special routes (must come before /:id)
router.get('/stats/monthly', getMonthlyStockStats);
router.get('/materials', getMaterialsInfo);
router.get('/summary', getStockSummary);
router.get('/month/:year/:month', getStockByMonth);
router.get('/material/:material', getStockByMaterial);
router.get('/color/:color', getStockByColor);

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
