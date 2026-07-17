const FarmerProfile = require('../models/FarmerProfile');
const User = require('../models/User');

// @desc    Create or update farmer profile details
// @route   PUT /api/profile/farmer
// @access  Private (Farmer only)
exports.updateFarmerProfile = async (req, res) => {
  try {
    const {
      farmName,
      address,
      latitude,
      longitude,
      upiId,
      accountNumber,
      ifscCode,
      deliveryRadius,
      bio
    } = req.body;

    if (!farmName || !address || latitude === undefined || longitude === undefined || !upiId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide farmName, address, latitude, longitude, and upiId'
      });
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return res.status(400).json({ success: false, message: 'Invalid latitude or longitude coordinates' });
    }

    // Coordinates in GeoJSON Point format are [longitude, latitude]
    const coordinates = [lng, lat];

    let profile = await FarmerProfile.findOne({ user: req.user._id });

    const profileData = {
      user: req.user._id,
      farmName,
      address,
      location: {
        type: 'Point',
        coordinates
      },
      bankDetails: {
        upiId,
        accountNumber: accountNumber || '',
        ifscCode: ifscCode || ''
      },
      deliveryRadius: deliveryRadius ? parseFloat(deliveryRadius) : 15,
      bio: bio || ''
    };

    if (profile) {
      profile = await FarmerProfile.findOneAndUpdate(
        { user: req.user._id },
        profileData,
        { new: true, runValidators: true }
      );
    } else {
      profile = await FarmerProfile.create(profileData);
    }

    res.json({
      success: true,
      message: 'Farmer profile updated successfully',
      profile
    });
  } catch (error) {
    console.error('Update farmer profile error:', error);
    res.status(500).json({ success: false, message: 'Server error updating farmer profile' });
  }
};

// @desc    Update general user details (name, phone, avatar)
// @route   PUT /api/profile
// @access  Private
exports.updateUserProfile = async (req, res) => {
  try {
    const { name, phone, avatarUrl } = req.body;
    const updates = {};
    if (name) updates.name = name;
    if (phone) updates.phone = phone;
    if (avatarUrl !== undefined) updates.avatarUrl = avatarUrl;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user
    });
  } catch (error) {
    console.error('Update user profile error:', error);
    res.status(500).json({ success: false, message: 'Server error updating profile' });
  }
};
