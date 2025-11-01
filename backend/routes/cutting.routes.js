import express from 'express';
import {
  calculateCutting,
  getAllCutting,
  getCuttingByType,
  createCutting,
  getCuttingByMonth,
  getMonthlyCuttingStats,
  deleteCutting
} from '../controllers/cutting.controller.js';

const router = express.Router();

// Special routes (must come before /:id)
router.post('/calculate', calculateCutting);
router.get('/stats/monthly', getMonthlyCuttingStats);
router.get('/month/:year/:month', getCuttingByMonth);
router.get('/type/:type', getCuttingByType);

// Main routes
router.route('/')
  .get(getAllCutting)
  .post(createCutting);

// Single cutting routes
router.route('/:id')
  .delete(deleteCutting);

export default router;
