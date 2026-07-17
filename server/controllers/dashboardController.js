const Order = require('../models/Order');
const Product = require('../models/Product');
const Review = require('../models/Review');

// @desc    Get dashboard metrics for a farmer
// @route   GET /api/dashboard/farmer
// @access  Private (Farmer only)
exports.getFarmerDashboard = async (req, res) => {
  try {
    const farmerId = req.user._id;

    // Fetch all orders for this farmer
    const orders = await Order.find({ farmer: farmerId });

    let totalSales = 0;
    let pendingPayout = 0;
    let completedCount = 0;
    let pendingCount = 0;

    orders.forEach((order) => {
      if (order.status === 'DELIVERED') {
        totalSales += order.totalPrice;
        completedCount++;
      } else if (['PENDING', 'ACCEPTED', 'OUT_FOR_DELIVERY'].includes(order.status)) {
        pendingPayout += order.totalPrice;
        pendingCount++;
      }
    });

    // Fetch farmer reviews
    const reviews = await Review.find({ farmer: farmerId })
      .populate('customer', 'name avatarUrl')
      .sort({ createdAt: -1 });

    const avgRating =
      reviews.length > 0
        ? parseFloat((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1))
        : 5.0;

    // Weekly sales distribution (last 7 days helper)
    const salesHistory = [];
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Grouping sales by day for the chart
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateString = date.toLocaleDateString('en-US', { weekday: 'short' });
      
      let dailyVal = 0;
      orders.forEach((o) => {
        if (o.status === 'DELIVERED') {
          const oDate = new Date(o.createdAt);
          if (oDate.toDateString() === date.toDateString()) {
            dailyVal += o.totalPrice;
          }
        }
      });
      salesHistory.push({ day: dateString, sales: dailyVal });
    }

    res.json({
      success: true,
      metrics: {
        totalSales,
        pendingPayout,
        completedCount,
        pendingCount,
        avgRating,
        reviewCount: reviews.length
      },
      recentReviews: reviews.slice(0, 5),
      salesHistory
    });
  } catch (error) {
    console.error('Farmer dashboard metrics error:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving dashboard metrics' });
  }
};

// @desc    Get demand prediction report (Phase 2 feature)
// @route   GET /api/dashboard/demand
// @access  Private (Farmer only)
exports.getDemandPrediction = async (req, res) => {
  try {
    // 1. Analyze historical order data globally or regionally to determine trends
    const allOrders = await Order.find({ status: 'DELIVERED' });

    // Aggregate quantities by product name/category
    const demandMap = {};

    allOrders.forEach((order) => {
      order.items.forEach((item) => {
        const key = item.name.toLowerCase();
        if (!demandMap[key]) {
          demandMap[key] = {
            name: item.name,
            quantity: 0,
            unit: item.unit,
            totalRevenue: 0
          };
        }
        demandMap[key].quantity += item.quantity;
        demandMap[key].totalRevenue += item.price * item.quantity;
      });
    });

    const historicalTrends = Object.values(demandMap).sort((a, b) => b.quantity - a.quantity);

    // 2. Define seasonal/regional mock recommendations as fallbacks/augmentations
    const currentMonth = new Date().getMonth(); // 0-11
    let seasonalCrops = [];

    // Simple North Indian seasonal calendar simulation
    if (currentMonth >= 2 && currentMonth <= 5) {
      // Summer
      seasonalCrops = [
        { name: 'Onions', demandLevel: 'HIGH', avgPrice: 30, unit: 'kg', growthPeriod: '90 days' },
        { name: 'Tomatoes', demandLevel: 'HIGH', avgPrice: 40, unit: 'kg', growthPeriod: '75 days' },
        { name: 'Okra (Bhindi)', demandLevel: 'MEDIUM', avgPrice: 35, unit: 'kg', growthPeriod: '60 days' },
        { name: 'Watermelon', demandLevel: 'HIGH', avgPrice: 20, unit: 'piece', growthPeriod: '80 days' }
      ];
    } else if (currentMonth >= 6 && currentMonth <= 9) {
      // Monsoon / Kharif
      seasonalCrops = [
        { name: 'Rice / Paddy', demandLevel: 'HIGH', avgPrice: 45, unit: 'kg', growthPeriod: '120 days' },
        { name: 'Maize', demandLevel: 'MEDIUM', avgPrice: 25, unit: 'kg', growthPeriod: '90 days' },
        { name: 'Potatoes', demandLevel: 'HIGH', avgPrice: 25, unit: 'kg', growthPeriod: '100 days' },
        { name: 'Green Chillies', demandLevel: 'MEDIUM', avgPrice: 60, unit: 'kg', growthPeriod: '60 days' }
      ];
    } else {
      // Winter / Rabi
      seasonalCrops = [
        { name: 'Wheat', demandLevel: 'HIGH', avgPrice: 30, unit: 'kg', growthPeriod: '130 days' },
        { name: 'Mustard Seeds', demandLevel: 'MEDIUM', avgPrice: 80, unit: 'kg', growthPeriod: '110 days' },
        { name: 'Carrots', demandLevel: 'HIGH', avgPrice: 35, unit: 'kg', growthPeriod: '75 days' },
        { name: 'Cauliflower', demandLevel: 'HIGH', avgPrice: 40, unit: 'piece', growthPeriod: '80 days' }
      ];
    }

    // Combine historical orders and seasonal data
    const finalReport = seasonalCrops.map((crop) => {
      const hist = historicalTrends.find((h) => h.name.toLowerCase() === crop.name.toLowerCase());
      return {
        ...crop,
        pastOrdersCount: hist ? hist.quantity : Math.floor(Math.random() * 20) + 5 // simulated order density if fresh DB
      };
    });

    res.json({
      success: true,
      season: currentMonth >= 2 && currentMonth <= 5 ? 'Summer' : currentMonth >= 6 && currentMonth <= 9 ? 'Monsoon' : 'Winter',
      predictions: finalReport
    });
  } catch (error) {
    console.error('Demand prediction error:', error);
    res.status(500).json({ success: false, message: 'Server error generating demand predictions' });
  }
};
