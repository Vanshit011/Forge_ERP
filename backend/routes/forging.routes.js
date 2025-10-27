import express from 'express';
import {
  getAllForging,
  getForgingById,
  createForging,
  updateForging,
  deleteForging,
  getForgingByMonth,
  getMonthlyForgingStats
} from '../controllers/forging.controller.js';

const router = express.Router();

// Monthly stats route
router.get('/stats/monthly', getMonthlyForgingStats);

// Month filter route
router.get('/month/:year/:month', getForgingByMonth);

// Main routes
router.route('/')
  .get(getAllForging)
  .post(createForging);

// Single forging routes
router.route('/:id')
  .get(getForgingById)
  .put(updateForging)
  .delete(deleteForging);

export default router;
