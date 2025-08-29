const express = require('express');
const { 
  getClients,
  createClient,
  exportClients,
  getClientStats
} = require('../controllers/clientController_enhanced');
const { requireSuperAdmin, requireAuthenticated } = require('../middleware/auth');

const router = express.Router();

// All client routes require authentication
router.use(requireAuthenticated);

// Export endpoint (must be before /:id routes)
router.get('/export', exportClients);
router.get('/stats', getClientStats);

router.route('/')
  .get(getClients)
  .post(requireSuperAdmin, createClient);

// TODO: Implement these routes later
// router.route('/:id')
//   .get(getClient)
//   .put(updateClient)
//   .delete(deleteClient);

module.exports = router;