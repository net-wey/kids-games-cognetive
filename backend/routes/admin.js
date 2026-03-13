const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getAllUsers,
  deactivateUser,
  activateUser,
  getAppStatistics,
  deleteUser
} = require('../controllers/adminController');

router.get('/users', protect, authorize('admin'), getAllUsers);
router.put('/users/:userId/deactivate', protect, authorize('admin'), deactivateUser);
router.put('/users/:userId/activate', protect, authorize('admin'), activateUser);
router.get('/statistics', protect, authorize('admin'), getAppStatistics);
router.delete('/users/:userId', protect, authorize('admin'), deleteUser);

module.exports = router;

