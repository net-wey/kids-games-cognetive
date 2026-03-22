const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  login,
  getMe,
  registerParent,
  registerChild,
  deleteChild
} = require('../controllers/authController');

router.post('/login', login);
router.get('/me', protect, getMe);
router.post('/register-parent', protect, authorize('admin'), registerParent);
router.post('/register-child', protect, authorize('parent'), registerChild);
router.delete('/child/:childId', protect, authorize('parent'), deleteChild);

module.exports = router;

