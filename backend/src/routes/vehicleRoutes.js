import express from 'express';
import {
  addVehicle,
  getVehicles,
  getVehicle,
  editVehicle,
  removeVehicle,
} from '../controllers/vehicleController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authMiddleware);

router.post('/', addVehicle);
router.get('/', getVehicles);
router.get('/:id', getVehicle);
router.put('/:id', editVehicle);
router.delete('/:id', removeVehicle);

export default router;
