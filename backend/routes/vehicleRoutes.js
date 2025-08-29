const express = require('express');
const { 
  getVehicles,
  getVehicle,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  getVehicleStats
} = require('../controllers/vehicleController_enhanced');
const { requireSuperAdmin } = require('../middleware/auth');

const router = express.Router();

// All vehicle routes require superadmin access
router.use(requireSuperAdmin);

router.route('/')
  .get(getVehicles)
  .post(createVehicle);

router.get('/stats', getVehicleStats);

router.route('/:id')
  .get(getVehicle)
  .put(updateVehicle)
  .delete(deleteVehicle);

module.exports = router;