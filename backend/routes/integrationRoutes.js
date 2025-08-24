const express = require('express');
const router = express.Router();
const {
  getIntegrationSnippets,
  getIntegrationSnippet,
  generateIntegrationCode,
  updateIntegrationSnippet,
  deleteIntegrationSnippet,
  getIntegrationTemplates,
  getIntegrationStats
} = require('../controllers/integrationController');
const {
  verifyToken,
  requireAdmin,
  requireSuperAdmin,
  sensitiveOperationLimit
} = require('../middleware/auth');

// Apply authentication to all routes
router.use(verifyToken);

// Integration snippets routes
router.route('/snippets')
  .get(requireAdmin, getIntegrationSnippets)
  .post(requireAdmin, generateIntegrationCode);

router.route('/snippets/:id')
  .get(requireAdmin, getIntegrationSnippet)
  .put(requireAdmin, updateIntegrationSnippet)
  .delete(requireSuperAdmin, deleteIntegrationSnippet);

// Integration templates routes
router.route('/templates')
  .get(requireAdmin, getIntegrationTemplates);

// Integration statistics routes
router.route('/stats')
  .get(requireAdmin, getIntegrationStats);

module.exports = router;
