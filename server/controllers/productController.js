const Product = require('../models/Product');
const FarmerProfile = require('../models/FarmerProfile');

// Helper for Haversine distance calculation in km
const getDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// @desc    Create a product listing
// @route   POST /api/products
// @access  Private (Farmer only)
exports.createProduct = async (req, res) => {
  try {
    const { name, description, category, subcategory, variety, price, unit, quantityAvailable, harvestDate, priceJustificationTags } = req.body;

    if (!name || !category || !price || !unit || quantityAvailable === undefined || !harvestDate) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields' });
    }

    // Check if farmer has a profile completed
    const farmerProfile = await FarmerProfile.findOne({ user: req.user._id });
    if (!farmerProfile) {
      return res.status(400).json({
        success: false,
        message: 'Please complete your farm profile before listing products'
      });
    }

    let imageUrl = '';
    if (req.file) {
      imageUrl = `/uploads/${req.file.filename}`;
    }

    // Safe parsing of justification tags
    let tags = [];
    if (priceJustificationTags) {
      if (Array.isArray(priceJustificationTags)) {
        tags = priceJustificationTags;
      } else {
        try {
          tags = JSON.parse(priceJustificationTags);
        } catch (e) {
          tags = priceJustificationTags.split(',').map((t) => t.trim()).filter(Boolean);
        }
      }
    }

    const product = await Product.create({
      farmer: req.user._id,
      name,
      description: description || '',
      category,
      subcategory: subcategory || 'Other',
      variety: variety || '',
      price: parseFloat(price),
      unit,
      quantityAvailable: parseInt(quantityAvailable),
      imageUrl,
      harvestDate: new Date(harvestDate),
      status: req.moderationFlag?.status || 'ACTIVE',
      flaggedReason: req.moderationFlag?.reason || '',
      priceJustificationTags: tags
    });

    const isPending = product.status === 'PENDING_REVIEW';
    res.status(201).json({
      success: true,
      message: isPending 
        ? 'Product listed, but flagged for manual admin verification due to restricted content.'
        : 'Product created successfully',
      product
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ success: false, message: 'Server error listing product' });
  }
};

// @desc    Update a product listing
// @route   PUT /api/products/:id
// @access  Private (Farmer only)
exports.updateProduct = async (req, res) => {
  try {
    const { name, description, category, subcategory, variety, price, unit, quantityAvailable, harvestDate, status, priceJustificationTags } = req.body;
    let product = await Product.findById(req.id || req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Ensure logged in user is the owner
    if (product.farmer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to edit this product' });
    }

    // Safe parsing of justification tags
    let tags = product.priceJustificationTags;
    if (priceJustificationTags !== undefined) {
      if (Array.isArray(priceJustificationTags)) {
        tags = priceJustificationTags;
      } else {
        try {
          tags = JSON.parse(priceJustificationTags);
        } catch (e) {
          tags = priceJustificationTags.split(',').map((t) => t.trim()).filter(Boolean);
        }
      }
    }

    const updates = {
      name: name || product.name,
      description: description !== undefined ? description : product.description,
      category: category || product.category,
      subcategory: subcategory || product.subcategory,
      variety: variety !== undefined ? variety : product.variety,
      price: price !== undefined ? parseFloat(price) : product.price,
      unit: unit || product.unit,
      quantityAvailable: quantityAvailable !== undefined ? parseInt(quantityAvailable) : product.quantityAvailable,
      harvestDate: harvestDate ? new Date(harvestDate) : product.harvestDate,
      priceJustificationTags: tags,
      // Apply moderation check on status
      status: req.moderationFlag?.status === 'PENDING_REVIEW' ? 'PENDING_REVIEW' : (status || product.status),
      flaggedReason: req.moderationFlag?.status === 'PENDING_REVIEW' ? req.moderationFlag.reason : (status ? '' : product.flaggedReason)
    };

    if (req.file) {
      updates.imageUrl = `/uploads/${req.file.filename}`;
    }

    product = await Product.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: product.status === 'PENDING_REVIEW'
        ? 'Product updated, but flagged for admin moderation review.'
        : 'Product updated successfully',
      product
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ success: false, message: 'Server error updating product' });
  }
};

// @desc    Delete/Deactivate a product listing
// @route   DELETE /api/products/:id
// @access  Private (Farmer only)
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Ensure logged in user is the owner
    if (product.farmer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this product' });
    }

    // Soft delete by setting status to INACTIVE
    product.status = 'INACTIVE';
    await product.save();

    res.json({
      success: true,
      message: 'Product listing deactivated successfully'
    });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ success: false, message: 'Server error deactivating product' });
  }
};

// @desc    Get all active products with filters
// @route   GET /api/products
// @access  Public
exports.getProducts = async (req, res) => {
  try {
    const { category, search, minPrice, maxPrice } = req.query;

    const query = { status: 'ACTIVE', quantityAvailable: { $gt: 0 } };

    if (category) {
      query.category = category;
    }

    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }

    const products = await Product.find(query)
      .populate('farmer', 'name avatarUrl')
      .sort({ createdAt: -1 });

    // For each product, attach farmer profile details if needed
    const productsWithFarmerDetails = await Promise.all(
      products.map(async (prod) => {
        const profile = await FarmerProfile.findOne({ user: prod.farmer._id });
        return {
          ...prod.toObject(),
          farmName: profile ? profile.farmName : 'Local Farm',
          farmAddress: profile ? profile.address : '',
          trustScore: profile ? profile.trustScore : 100
        };
      })
    );

    res.json({
      success: true,
      count: productsWithFarmerDetails.length,
      products: productsWithFarmerDetails
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving products' });
  }
};

// @desc    Get products near a customer
// @route   GET /api/products/nearby
// @access  Public
exports.getNearbyProducts = async (req, res) => {
  try {
    const { latitude, longitude, radius, category, search } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({ success: false, message: 'Latitude and longitude are required' });
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    const radKm = parseFloat(radius) || 15; // default 15km

    // Find farmer profiles within the specified radius
    // MongoDB $near works on 2dsphere index (coordinates: [lng, lat])
    const nearbyFarmers = await FarmerProfile.find({
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [lng, lat]
          },
          $maxDistance: radKm * 1000 // radius in meters
        }
      }
    }).populate('user', 'name phone avatarUrl');

    if (nearbyFarmers.length === 0) {
      return res.json({ success: true, count: 0, products: [] });
    }

    const farmerMap = {};
    nearbyFarmers.forEach((farmer) => {
      const distance = getDistance(lat, lng, farmer.location.coordinates[1], farmer.location.coordinates[0]);
      farmerMap[farmer.user._id.toString()] = {
        farmName: farmer.farmName,
        address: farmer.address,
        trustScore: farmer.trustScore,
        distance: parseFloat(distance.toFixed(1)),
        userName: farmer.user.name,
        avatarUrl: farmer.user.avatarUrl
      };
    });

    const farmerIds = Object.keys(farmerMap);

    const productQuery = {
      farmer: { $in: farmerIds },
      status: 'ACTIVE',
      quantityAvailable: { $gt: 0 }
    };

    if (category) {
      productQuery.category = category;
    }

    if (search) {
      productQuery.name = { $regex: search, $options: 'i' };
    }

    const products = await Product.find(productQuery);

    const productsWithDistance = products.map((prod) => {
      const farmerInfo = farmerMap[prod.farmer.toString()];
      return {
        ...prod.toObject(),
        farmName: farmerInfo.farmName,
        farmAddress: farmerInfo.address,
        trustScore: farmerInfo.trustScore,
        distance: farmerInfo.distance,
        farmerName: farmerInfo.userName,
        farmerAvatar: farmerInfo.avatarUrl
      };
    });

    // Sort by distance
    productsWithDistance.sort((a, b) => a.distance - b.distance);

    res.json({
      success: true,
      count: productsWithDistance.length,
      products: productsWithDistance
    });
  } catch (error) {
    console.error('Get nearby products error:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving nearby products' });
  }
};

// @desc    Get all products for the logged in farmer
// @route   GET /api/products/farmer
// @access  Private (Farmer only)
exports.getFarmerProducts = async (req, res) => {
  try {
    const products = await Product.find({ farmer: req.user._id }).sort({ createdAt: -1 });

    res.json({
      success: true,
      count: products.length,
      products
    });
  } catch (error) {
    console.error('Get farmer products error:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving farmer products' });
  }
};

// @desc    Get product details by ID
// @route   GET /api/products/:id
// @access  Public
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('farmer', 'name phone avatarUrl');

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const farmerProfile = await FarmerProfile.findOne({ user: product.farmer._id });

    res.json({
      success: true,
      product: {
        ...product.toObject(),
        farmerProfile: farmerProfile
          ? {
              farmName: farmerProfile.farmName,
              address: farmerProfile.address,
              location: farmerProfile.location,
              trustScore: farmerProfile.trustScore,
              deliveryRadius: farmerProfile.deliveryRadius,
              bio: farmerProfile.bio
            }
          : null
      }
    });
  } catch (error) {
    console.error('Get product by ID error:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving product details' });
  }
};
