const express = require('express');
const router = express.Router();
const {
  createOrder,
  getCustomerOrders,
  getFarmerOrders,
  getOrderById,
  updateOrderStatus,
  createReview
} = require('../controllers/orderController');
const { protect, authorize } = require('../middleware/auth');

router.post('/', protect, authorize('CUSTOMER'), createOrder);
router.get('/customer', protect, authorize('CUSTOMER'), getCustomerOrders);
router.get('/farmer', protect, authorize('FARMER'), getFarmerOrders);
router.get('/:id', protect, getOrderById);
router.patch('/:id/status', protect, updateOrderStatus);
router.post('/:id/review', protect, authorize('CUSTOMER'), createReview);

module.exports = router;
