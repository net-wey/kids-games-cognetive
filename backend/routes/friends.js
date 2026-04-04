const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  sendFriendRequest,
  getFriendRequests,
  acceptFriendRequest,
  rejectFriendRequest,
  getFriends,
  removeFriend
} = require('../controllers/friendController');

router.post('/request', protect, authorize('child'), sendFriendRequest);
router.get('/requests', protect, authorize('child'), getFriendRequests);
router.put('/accept/:requestId', protect, authorize('child'), acceptFriendRequest);
router.put('/reject/:requestId', protect, authorize('child'), rejectFriendRequest);
router.get('/', protect, authorize('child'), getFriends);
router.delete('/:friendId', protect, authorize('child'), removeFriend);

module.exports = router;

