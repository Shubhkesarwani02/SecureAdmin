const express = require('express');
const { 
  getClients,
  getClient,
  createClient,
  updateClient,
  deleteClient,
  getClientStats
} = require('../controllers/clientController');
const { requireSuperAdmin } = require('../middleware/auth');

const router = express.Router();

// All client routes require superadmin access
router.use(requireSuperAdmin);

router.route('/')
  .get(getClients)
  .post(createClient);

router.get('/stats', getClientStats);

router.route('/:id')
  .get(getClient)
  .put(updateClient)
  .delete(deleteClient);

module.exports = router;