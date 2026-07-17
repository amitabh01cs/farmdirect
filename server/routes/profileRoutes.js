const express = require('express');
const router = express.Router();
const { updateUserProfile, updateFarmerProfile } = require('../controllers/profileController');
const { protect, authorize } = require('../middleware/auth');

router.put('/', protect, updateUserProfile);
router.put('/farmer', protect, authorize('FARMER'), updateFarmerProfile);

module.exports = router;
