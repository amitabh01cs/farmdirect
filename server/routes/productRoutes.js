const express = require('express');
const router = express.Router();
const {
  getProducts,
  getNearbyProducts,
  getFarmerProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
} = require('../controllers/productController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/', getProducts);
router.get('/nearby', getNearbyProducts);
router.get('/farmer', protect, authorize('FARMER'), getFarmerProducts);
router.get('/:id', getProductById);

const { validateProductListing } = require('../middleware/productValidation');

router.post('/', protect, authorize('FARMER'), upload.single('image'), validateProductListing, createProduct);
router.put('/:id', protect, authorize('FARMER'), upload.single('image'), validateProductListing, updateProduct);
router.delete('/:id', protect, authorize('FARMER'), deleteProduct);

module.exports = router;
