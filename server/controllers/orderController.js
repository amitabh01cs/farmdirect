const Order = require('../models/Order');
const Product = require('../models/Product');
const FarmerProfile = require('../models/FarmerProfile');
const Review = require('../models/Review');
const Notification = require('../models/Notification');

// Helper to create notifications
const createNotification = async (recipient, title, message, type) => {
  try {
    await Notification.create({ recipient, title, message, type });
  } catch (error) {
    console.error('Error creating notification:', error);
  }
};

// @desc    Create a new order
// @route   POST /api/orders
// @access  Private (Customer only)
exports.createOrder = async (req, res) => {
  try {
    const { items, deliveryAddress, latitude, longitude, paymentMethod } = req.body;

    if (!items || items.length === 0 || !deliveryAddress || latitude === undefined || longitude === undefined || !paymentMethod) {
      return res.status(400).json({ success: false, message: 'Please provide all required checkout fields' });
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({ success: false, message: 'Invalid delivery coordinates' });
    }

    let orderItems = [];
    let totalPrice = 0;
    let farmerId = null;

    // Process each item
    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(404).json({ success: false, message: `Product with ID ${item.product} not found` });
      }

      // Check stock
      if (product.quantityAvailable < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for product "${product.name}". Available: ${product.quantityAvailable} ${product.unit}`
        });
      }

      // Ensure all items belong to the same farmer
      if (farmerId === null) {
        farmerId = product.farmer.toString();
      } else if (farmerId !== product.farmer.toString()) {
        return res.status(400).json({
          success: false,
          message: 'All items in a single order must be from the same farmer'
        });
      }

      // Deduct stock
      product.quantityAvailable -= item.quantity;
      if (product.quantityAvailable === 0) {
        product.status = 'SOLD_OUT';
      }
      await product.save();

      // Push to items array
      orderItems.push({
        product: product._id,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        unit: product.unit
      });

      totalPrice += product.price * item.quantity;
    }

    // Set paymentStatus
    const paymentStatus = paymentMethod === 'COD' ? 'PENDING' : 'PAID';

    const order = await Order.create({
      customer: req.user._id,
      farmer: farmerId,
      items: orderItems,
      totalPrice,
      deliveryAddress,
      deliveryCoordinates: {
        type: 'Point',
        coordinates: [lng, lat]
      },
      paymentMethod,
      paymentStatus,
      status: 'PENDING'
    });

    // Notify farmer of the new order
    await createNotification(
      farmerId,
      'New Order Received!',
      `You have a new order from ${req.user.name} worth ₹${totalPrice}.`,
      'NEW_ORDER'
    );

    res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      order
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ success: false, message: 'Server error processing order' });
  }
};

// @desc    Get customer order history
// @route   GET /api/orders/customer
// @access  Private (Customer only)
exports.getCustomerOrders = async (req, res) => {
  try {
    const orders = await Order.find({ customer: req.user._id })
      .populate('farmer', 'name phone avatarUrl')
      .sort({ createdAt: -1 });

    // Fetch and append farmer farm name
    const ordersWithFarmName = await Promise.all(
      orders.map(async (order) => {
        const profile = await FarmerProfile.findOne({ user: order.farmer._id });
        return {
          ...order.toObject(),
          farmName: profile ? profile.farmName : 'Local Farm'
        };
      })
    );

    res.json({
      success: true,
      count: ordersWithFarmName.length,
      orders: ordersWithFarmName
    });
  } catch (error) {
    console.error('Get customer orders error:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving order history' });
  }
};

// @desc    Get farmer incoming orders
// @route   GET /api/orders/farmer
// @access  Private (Farmer only)
exports.getFarmerOrders = async (req, res) => {
  try {
    const orders = await Order.find({ farmer: req.user._id })
      .populate('customer', 'name phone avatarUrl')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: orders.length,
      orders
    });
  } catch (error) {
    console.error('Get farmer orders error:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving farmer orders' });
  }
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('customer', 'name phone avatarUrl')
      .populate('farmer', 'name phone avatarUrl');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Verify authorized user (customer or farmer of this order)
    if (
      order.customer._id.toString() !== req.user._id.toString() &&
      order.farmer._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this order' });
    }

    const farmerProfile = await FarmerProfile.findOne({ user: order.farmer._id });

    res.json({
      success: true,
      order: {
        ...order.toObject(),
        farmName: farmerProfile ? farmerProfile.farmName : 'Local Farm',
        farmAddress: farmerProfile ? farmerProfile.address : '',
        farmCoordinates: farmerProfile ? farmerProfile.location.coordinates : null
      }
    });
  } catch (error) {
    console.error('Get order details error:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving order details' });
  }
};

// @desc    Update order status
// @route   PATCH /api/orders/:id/status
// @access  Private (Farmer or Customer)
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const userId = req.user._id.toString();
    const isCustomer = order.customer.toString() === userId;
    const isFarmer = order.farmer.toString() === userId;

    if (!isCustomer && !isFarmer) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this order status' });
    }

    // Status transition rules
    if (isCustomer) {
      if (status === 'CANCELLED') {
        if (order.status !== 'PENDING') {
          return res.status(400).json({ success: false, message: 'Order can only be cancelled while pending' });
        }
        // Restock items
        for (const item of order.items) {
          const product = await Product.findById(item.product);
          if (product) {
            product.quantityAvailable += item.quantity;
            if (product.status === 'SOLD_OUT') {
              product.status = 'ACTIVE';
            }
            await product.save();
          }
        }
        order.status = 'CANCELLED';
        await order.save();

        // Notify farmer
        await createNotification(
          order.farmer,
          'Order Cancelled',
          `Order ID #${order._id.toString().substring(18)} was cancelled by the customer.`,
          'ORDER_STATUS'
        );

        return res.json({ success: true, message: 'Order cancelled successfully', order });
      } else {
        return res.status(400).json({ success: false, message: 'Customers can only cancel pending orders' });
      }
    }

    if (isFarmer) {
      const allowedFarmerStatuses = ['ACCEPTED', 'REJECTED', 'OUT_FOR_DELIVERY', 'DELIVERED'];
      if (!allowedFarmerStatuses.includes(status)) {
        return res.status(400).json({ success: false, message: 'Invalid status update action' });
      }

      // Handle stock restoration on rejection
      if (status === 'REJECTED') {
        if (order.status !== 'PENDING') {
          return res.status(400).json({ success: false, message: 'Order can only be rejected if it is pending' });
        }
        // Restock items
        for (const item of order.items) {
          const product = await Product.findById(item.product);
          if (product) {
            product.quantityAvailable += item.quantity;
            if (product.status === 'SOLD_OUT') {
              product.status = 'ACTIVE';
            }
            await product.save();
          }
        }
      }

      // Handle delivery payout marker
      if (status === 'DELIVERED') {
        if (order.paymentMethod === 'COD') {
          order.paymentStatus = 'PAID';
        }
      }

      order.status = status;
      await order.save();

      // Notify customer
      let title = 'Order Update';
      let message = `Your order status has changed to ${status}.`;

      if (status === 'ACCEPTED') {
        title = 'Order Accepted!';
        message = 'The farmer has accepted your order and is preparing the items.';
      } else if (status === 'OUT_FOR_DELIVERY') {
        title = 'Out for Delivery!';
        message = 'Your fresh produce order is on its way to your delivery address!';
      } else if (status === 'DELIVERED') {
        title = 'Delivered!';
        message = 'Your order has been delivered. Enjoy your fresh products!';
      } else if (status === 'REJECTED') {
        title = 'Order Rejected';
        message = 'Unfortunately, the farmer had to decline your order. Any payments will be refunded.';
      }

      await createNotification(order.customer, title, message, 'ORDER_STATUS');

      return res.json({ success: true, message: `Order status updated to ${status}`, order });
    }
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ success: false, message: 'Server error updating order status' });
  }
};

// @desc    Add a review for a completed order
// @route   POST /api/orders/:id/review
// @access  Private (Customer only)
exports.createReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Verify Customer ownership
    if (order.customer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to review this order' });
    }

    // Verify order is delivered
    if (order.status !== 'DELIVERED') {
      return res.status(400).json({ success: false, message: 'You can only review delivered orders' });
    }

    // Check if review already exists
    const reviewExists = await Review.findOne({ order: order._id });
    if (reviewExists) {
      return res.status(400).json({ success: false, message: 'You have already reviewed this order' });
    }

    // Validate rating
    const ratingNum = parseInt(rating);
    if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be an integer between 1 and 5' });
    }

    const review = await Review.create({
      order: order._id,
      customer: req.user._id,
      farmer: order.farmer,
      rating: ratingNum,
      comment: comment || ''
    });

    // Recalculate farmer's trust score
    const reviews = await Review.find({ farmer: order.farmer });
    const averageRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    
    // Scale 1-5 rating to 0-100 trust score
    const newTrustScore = Math.min(100, Math.round(averageRating * 20));

    await FarmerProfile.findOneAndUpdate(
      { user: order.farmer },
      { trustScore: newTrustScore }
    );

    // Notify farmer of new review
    await createNotification(
      order.farmer,
      'New Review Received!',
      `A customer rated you ${ratingNum} stars: "${comment ? comment.substring(0, 30) + '...' : 'No comment'}"`,
      'NEW_REVIEW'
    );

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully',
      review
    });
  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({ success: false, message: 'Server error submitting review' });
  }
};
