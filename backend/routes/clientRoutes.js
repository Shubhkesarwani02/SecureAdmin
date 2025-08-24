const express = require('express');
const { 
  getClients,
  getClient,
  addClient,
  updateClient,
  deleteClient,
  exportClientData,
  getClientStats
} = require('../controllers/clientController');
const { requireSuperAdmin } = require('../middleware/auth');

const router = express.Router();

// All client routes require superadmin access
router.use(requireSuperAdmin);

// Export endpoint (must be before /:id routes)
router.get('/export', exportClientData);
router.get('/stats', getClientStats);

router.route('/')
  .get(getClients)
  .post(addClient);

router.route('/:id')
  .get(getClient)
  .put(updateClient)
  .delete(deleteClient);

module.exports = router;