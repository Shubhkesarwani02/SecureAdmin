const express = require('express');
const { 
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  getUserStats
} = require('../controllers/userController');
const { requireSuperAdmin } = require('../middleware/auth');

const router = express.Router();

// All user routes require superadmin access
router.use(requireSuperAdmin);

router.route('/')
  .get(getUsers)
  .post(createUser);

router.get('/stats', getUserStats);

router.route('/:id')
  .get(getUser)
  .put(updateUser)
  .delete(deleteUser);

module.exports = router;