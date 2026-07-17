const FarmerProfile = require('../models/FarmerProfile');

// Category Whitelist Taxonomy
const CATEGORY_WHITELIST = {
  Vegetables: ['Root Vegetables', 'Leafy Greens', 'Nightshades', 'Cruciferous', 'Other'],
  Fruits: ['Citrus', 'Stone Fruits', 'Tropical', 'Berries', 'Pomes', 'Other'],
  Grains: ['Rice', 'Wheat', 'Pulses/Dals', 'Millets', 'Barley', 'Other'],
  Dairy: ['Milk', 'Ghee', 'Paneer', 'Butter'],
  Other: ['Raw Honey', 'Jaggery', 'Sugar Cane', 'Other']
};

// Keyword Blacklist for auto-flagging
const KEYWORD_BLACKLIST = [
  /\bpesticide\b/i,
  /\balcohol\b/i,
  /\bwine\b/i,
  /\bbeer\b/i,
  /\bmarijuana\b/i,
  /\bweed\b/i,
  /\bdrugs\b/i,
  /\bfertilizer\b/i,
  /\biphone\b/i,
  /\bshirt\b/i,
  /\bshoes\b/i,
  /\bplastic\b/i
];

const validateProductListing = async (req, res, next) => {
  try {
    const { name, category, subcategory, description } = req.body;

    if (!name || !category) {
      return res.status(400).json({ success: false, message: 'Please provide name and category.' });
    }

    // 1. Category whitelist checks
    if (!CATEGORY_WHITELIST[category]) {
      return res.status(400).json({
        success: false,
        message: `Category '${category}' is not allowed on FarmDirect.`
      });
    }

    if (subcategory && !CATEGORY_WHITELIST[category].includes(subcategory)) {
      return res.status(400).json({
        success: false,
        message: `Subcategory '${subcategory}' does not exist under '${category}' taxonomy.`
      });
    }

    // 2. Dairy gating check
    if (category === 'Dairy') {
      const profile = await FarmerProfile.findOne({ user: req.user._id });
      if (!profile || !profile.isFssaiVerified) {
        return res.status(403).json({
          success: false,
          message: 'Selling dairy products requires a verified FSSAI hygiene certificate. Please upload details in profile settings first.'
        });
      }
    }

    // 3. Keyword blacklist screening
    const combinedText = `${name} ${description || ''}`;
    let isFlagged = false;
    let flagReason = '';

    for (const pattern of KEYWORD_BLACKLIST) {
      if (pattern.test(combinedText)) {
        isFlagged = true;
        flagReason = `Flagged due to restricted term: ${pattern.toString().replace(/\//g, '')}`;
        break;
      }
    }

    req.moderationFlag = isFlagged
      ? { status: 'PENDING_REVIEW', reason: flagReason }
      : { status: 'ACTIVE', reason: '' };

    next();
  } catch (error) {
    console.error('Moderation validation middleware error:', error);
    res.status(500).json({ success: false, message: 'Server validation error' });
  }
};

module.exports = { validateProductListing, CATEGORY_WHITELIST };
