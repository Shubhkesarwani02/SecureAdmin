const express = require('express');
const { 
  getAdminSettings,
  updateAdminSettings,
  getSystemLogs,
  getIntegrationCodes,
  generateIntegrationCode,
  deactivateIntegrationCode
} = require('../controllers/adminController');
const { requireSuperAdmin } = require('../middleware/auth');

const router = express.Router();

// All admin routes require superadmin access
router.use(requireSuperAdmin);

router.route('/settings')
  .get(getAdminSettings)
  .put(updateAdminSettings);

router.get('/logs', getSystemLogs);

router.route('/integration-codes')
  .get(getIntegrationCodes)
  .post(generateIntegrationCode);

router.delete('/integration-codes/:code', deactivateIntegrationCode);

module.exports = router;