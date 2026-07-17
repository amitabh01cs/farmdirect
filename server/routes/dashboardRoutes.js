const express = require('express');
const router = express.Router();
const { getFarmerDashboard, getDemandPrediction } = require('../controllers/dashboardController');
const { protect, authorize } = require('../middleware/auth');

router.get('/farmer', protect, authorize('FARMER'), getFarmerDashboard);
router.get('/demand', protect, authorize('FARMER'), getDemandPrediction);

module.exports = router;
