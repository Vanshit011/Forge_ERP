import express from 'express';
import {
  getAllCutting,
  getCuttingById,
  calculateCutting,
  createCutting,
  updateCutting,
  deleteCutting,
  getCuttingByType,
  getCuttingByMonth,
  getMonthlyCuttingStats
} from '../controllers/cutting.controller.js';

const router = express.Router();

// Calculate route
router.post('/calculate', calculateCutting);

// Monthly stats route
router.get('/stats/monthly', getMonthlyCuttingStats);

// Month filter route
router.get('/month/:year/:month', getCuttingByMonth);

// Get by type route
router.get('/type/:type', getCuttingByType);

// Main routes
router.route('/')
  .get(getAllCutting)
  .post(createCutting);

// Single cutting routes
router.route('/:id')
  .get(getCuttingById)
  .put(updateCutting)
  .delete(deleteCutting);

export default router;
