const cron = require('node-cron');
const MarketPrice = require('../models/MarketPrice');
const Product = require('../models/Product');
const FarmerProfile = require('../models/FarmerProfile');
const Notification = require('../models/Notification');

const startPriceSyncJob = () => {
  // Run daily at midnight (00:00)
  cron.schedule('0 0 * * *', async () => {
    console.log('Running daily Mandi price sync job...');
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Simulated daily मंडी (mandi) data values for common crops
      const mockMandiPrices = [
        { commodity: 'potatoes', state: 'Delhi', district: 'Delhi', averagePrice: 22 },
        { commodity: 'potatoes', state: 'Haryana', district: 'Sonipat', averagePrice: 20 },
        { commodity: 'tomatoes', state: 'Delhi', district: 'Delhi', averagePrice: 38 },
        { commodity: 'tomatoes', state: 'Haryana', district: 'Sonipat', averagePrice: 35 },
        { commodity: 'onions', state: 'Delhi', district: 'Delhi', averagePrice: 32 },
        { commodity: 'onions', state: 'Haryana', district: 'Sonipat', averagePrice: 28 },
        { commodity: 'rice', state: 'Punjab', district: 'Amritsar', averagePrice: 42 },
        { commodity: 'wheat', state: 'Punjab', district: 'Amritsar', averagePrice: 28 },
        { commodity: 'milk', state: 'Haryana', district: 'Sonipat', averagePrice: 60 }
      ];

      for (const mandiData of mockMandiPrices) {
        await MarketPrice.findOneAndUpdate(
          {
            commodity: mandiData.commodity,
            state: mandiData.state,
            district: mandiData.district,
            date: today
          },
          { ...mandiData, date: today },
          { upsert: true, new: true }
        );
      }

      // Recalculate price deviations for all listed products
      const activeProducts = await Product.find({ status: 'ACTIVE' });
      for (const prod of activeProducts) {
        const farmerProfile = await FarmerProfile.findOne({ user: prod.farmer });
        if (!farmerProfile) continue;

        // Match state/district based on farmer's address keyword
        const address = farmerProfile.address || '';
        const state = address.toLowerCase().includes('haryana') ? 'Haryana' : 'Delhi';
        const district = address.toLowerCase().includes('sonipat') ? 'Sonipat' : 'Delhi';

        // Extract commodity keyword
        const productName = prod.name.toLowerCase();
        let matchedCommodity = '';
        if (productName.includes('potato')) matchedCommodity = 'potatoes';
        else if (productName.includes('tomato')) matchedCommodity = 'tomatoes';
        else if (productName.includes('onion')) matchedCommodity = 'onions';
        else if (productName.includes('rice')) matchedCommodity = 'rice';
        else if (productName.includes('wheat')) matchedCommodity = 'wheat';
        else if (productName.includes('milk')) matchedCommodity = 'milk';

        if (matchedCommodity) {
          const refPrice = await MarketPrice.findOne({
            commodity: matchedCommodity,
            state,
            district
          }).sort({ date: -1 });

          if (refPrice) {
            const avg = refPrice.averagePrice;
            const deviation = ((prod.price - avg) / avg) * 100;
            
            prod.priceDeviationPercent = Math.round(deviation);
            
            // Handle suspiciously low thresholds (e.g. > 70% below average)
            if (deviation < -70) {
              prod.lastPriceCheckStatus = 'LOW_WARNING';
              // Auto-generate farmer notification warning
              await Notification.create({
                recipient: prod.farmer,
                title: 'Suspicious Price Deviation Warning',
                message: `Your listing price for "${prod.name}" (₹${prod.price}/${prod.unit}) is more than 70% below the local market average of ₹${avg}/${prod.unit}. Please double-check for typos.`,
                type: 'GENERAL'
              });
            } else if (deviation > 50) {
              prod.lastPriceCheckStatus = 'HIGH_FLAG';
            } else {
              prod.lastPriceCheckStatus = 'NORMAL';
            }

            await prod.save();
          }
        }
      }
      console.log('Daily Mandi price sync job completed successfully.');
    } catch (err) {
      console.error('Error in daily Mandi price sync job:', err);
    }
  });
};

module.exports = { startPriceSyncJob };
