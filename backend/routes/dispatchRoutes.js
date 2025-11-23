import express from 'express';
import { 
  createDispatch, 
  getAllDispatches, 
  getAvailableForgingStock, 
  deleteDispatch 
} from '../controllers/dispatchController.js';

const router = express.Router();

router.post('/', createDispatch);
router.get('/', getAllDispatches);
router.get('/available-stock', getAvailableForgingStock);
router.delete('/:id', deleteDispatch);

export default router;