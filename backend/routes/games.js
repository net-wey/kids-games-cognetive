const express = require('express');
const router = express.Router();
const { protect, authorize, checkChildAccess } = require('../middleware/auth');
const {
  saveGameResult,
  getChildResults,
  getChildStatistics,
  getLeaderboard
} = require('../controllers/gameController');

router.post('/result', protect, authorize('child'), saveGameResult);
router.get('/results/:childId', protect, checkChildAccess, getChildResults);
router.get('/statistics/:childId', protect, checkChildAccess, getChildStatistics);
router.get('/leaderboard', protect, authorize('child'), getLeaderboard);

module.exports = router;

