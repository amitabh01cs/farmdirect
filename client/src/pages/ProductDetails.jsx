import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import api from '../utils/api';
import MarketPriceBadge from '../components/MarketPriceBadge';
import { ShoppingCart, Star, Calendar, ShieldCheck, MapPin, User, ChevronLeft, AlertTriangle } from 'lucide-react';

const getProductImage = (url, category) => {
  if (url) {
    if (url.startsWith('/uploads')) {
      const serverUrl = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : '';
      return `${serverUrl}${url}`;
    }
    return url;
  }
  const fallbacks = {
    Vegetables: 'https://images.unsplash.com/photo-1566385101042-1a010c129fae?w=800&auto=format&fit=crop&q=80',
    Fruits: 'https://images.unsplash.com/photo-1619546813926-a78fa6372cd2?w=800&auto=format&fit=crop&q=80',
    Grains: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=800&auto=format&fit=crop&q=80',
    Dairy: 'https://images.unsplash.com/photo-1528750997573-59b89d56f4f7?w=800&auto=format&fit=crop&q=80',
    Other: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&auto=format&fit=crop&q=80'
  };
  return fallbacks[category] || fallbacks.Other;
};

export default function ProductDetails() {
  const { id } = useParams();
  const { addToCart } = useContext(CartContext);

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [reviews, setReviews] = useState([]);
  const [feedback, setFeedback] = useState({ show: false, message: '', success: true });

  useEffect(() => {
    const fetchProductDetails = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/products/${id}`);
        if (res.data.success) {
          setProduct(res.data.product);
        }
      } catch (error) {
        console.error('Error fetching product details:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProductDetails();
  }, [id]);

  const handleQtyChange = (val) => {
    const safeVal = Math.max(1, Math.min(product.quantityAvailable, val));
    setQty(safeVal);
  };

  const handleAddToCart = () => {
    const res = addToCart(product, qty);
    setFeedback({
      show: true,
      message: res.success ? `Added ${qty} ${product.unit} to cart!` : res.message,
      success: res.success
    });

    setTimeout(() => {
      setFeedback(prev => ({ ...prev, show: false }));
    }, 4500);
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-[70vh] text-center flex flex-col items-center justify-center space-y-4">
        <AlertTriangle className="h-12 w-12 text-amber-500" />
        <h3 className="text-xl font-bold text-slate-800">Product Not Found</h3>
        <p className="text-slate-400 text-sm">This listing may have been deactivated by the farmer.</p>
        <Link to="/browse" className="text-emerald-600 font-bold hover:underline flex items-center space-x-1">
          <ChevronLeft className="h-4 w-4" />
          <span>Back to marketplace</span>
        </Link>
      </div>
    );
  }

  const daysAgo = Math.floor(Math.abs(new Date() - new Date(product.harvestDate)) / (1000 * 60 * 60 * 24));
  const harvestString = daysAgo === 0 ? 'Harvested today' : daysAgo === 1 ? 'Harvested yesterday' : `Harvested ${daysAgo} days ago`;

  return (
    <div className="space-y-10 py-4 max-w-6xl mx-auto">
      {/* Back button */}
      <Link to="/browse" className="inline-flex items-center space-x-1.5 text-slate-600 hover:text-emerald-600 font-bold transition-colors">
        <ChevronLeft className="h-4 w-4" />
        <span className="text-sm">Back to Marketplace</span>
      </Link>

      {/* Cart Addition Feedback Dialog */}
      {feedback.show && (
        <div className={`fixed bottom-5 right-5 z-50 p-4 rounded-xl border flex items-center space-x-2 shadow-2xl transition-all animate-bounce ${
          feedback.success 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
            : 'bg-amber-50 border-amber-200 text-amber-800'
        }`}>
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Top Section: Photo & Purchasing Controls */}
      <div className="grid md:grid-cols-2 gap-10 items-start">
        {/* Left Column: Image Card */}
        <div className="bg-white rounded-3xl overflow-hidden shadow-md border border-slate-100 p-3">
          <div className="relative h-96 w-full rounded-2xl overflow-hidden bg-slate-50">
            <img
              src={getProductImage(product.imageUrl, product.category)}
              alt={product.name}
              className="h-full w-full object-cover"
            />
            <span className="absolute top-4 left-4 bg-emerald-600 text-white text-xs uppercase px-3.5 py-1.5 rounded-full font-bold shadow-md">
              {product.category}
            </span>
          </div>
        </div>

        {/* Right Column: Descriptions & Adding to Cart */}
        <div className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-extrabold px-3 py-1 bg-emerald-50 text-emerald-700 rounded-lg flex items-center space-x-1">
                <Star className="h-3.5 w-3.5 fill-emerald-600 stroke-none" />
                <span>{product.farmerProfile?.trustScore || 100}% Trust Score</span>
              </span>
              <span className="text-xs font-semibold px-3 py-1 bg-orange-50 text-orange-700 rounded-lg flex items-center space-x-1">
                <Calendar className="h-3.5 w-3.5" />
                <span>{harvestString}</span>
              </span>
            </div>

            <h1 className="text-3xl font-black text-slate-800">{product.name}</h1>
            {product.variety && (
              <p className="text-xs font-bold text-slate-500">
                Variety: <span className="text-emerald-700 font-extrabold">{product.variety}</span> ({product.subcategory})
              </p>
            )}
            
            <div className="flex items-center space-x-4 flex-wrap gap-2">
              <div className="text-2xl font-black text-emerald-600">
                ₹{product.price} <span className="text-xs text-slate-400 font-bold">per {product.unit}</span>
              </div>
              <MarketPriceBadge price={product.price} deviationPercent={product.priceDeviationPercent} unit={product.unit} />
            </div>

            {product.priceJustificationTags && product.priceJustificationTags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {product.priceJustificationTags.map((tag, idx) => (
                  <span key={idx} className="bg-emerald-50 text-emerald-850 border border-emerald-100 text-[10px] font-extrabold px-2.5 py-0.5 rounded-lg shadow-sm">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="p-5 bg-slate-50 border border-slate-100 rounded-2xl space-y-4">
            <div className="flex justify-between items-center text-xs text-slate-500 font-semibold">
              <span>Stock Status:</span>
              {product.quantityAvailable > 0 ? (
                <span className="text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded font-bold">
                  {product.quantityAvailable} {product.unit} Available
                </span>
              ) : (
                <span className="text-red-700 bg-red-100 px-2 py-0.5 rounded font-bold">Sold Out</span>
              )}
            </div>

            {product.quantityAvailable > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-600">Select Quantity:</span>
                  <div className="flex items-center border border-slate-200 rounded-xl bg-white overflow-hidden">
                    <button
                      onClick={() => handleQtyChange(qty - 1)}
                      className="px-3.5 py-1.5 hover:bg-slate-50 text-slate-500 font-bold transition-colors"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      value={qty}
                      onChange={(e) => handleQtyChange(parseInt(e.target.value) || 1)}
                      className="w-12 text-center text-sm font-bold border-none focus:outline-none focus:ring-0"
                    />
                    <button
                      onClick={() => handleQtyChange(qty + 1)}
                      className="px-3.5 py-1.5 hover:bg-slate-50 text-slate-500 font-bold transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleAddToCart}
                  className="w-full flex justify-center items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all"
                >
                  <ShoppingCart className="h-5 w-5" />
                  <span>Add to Cart</span>
                </button>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Description</h3>
            <p className="text-slate-500 text-sm leading-relaxed">
              {product.description || 'No description listed for this crop.'}
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Section: Farmer Biography Details & Customer Reviews */}
      <div className="grid md:grid-cols-3 gap-8 pt-8 border-t border-slate-100">
        {/* Farmer Bio Details Card */}
        <div className="md:col-span-1 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider pb-2 border-b border-slate-50">
            About the Farmer
          </h3>
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 shrink-0">
              <User className="h-5 w-5" />
            </div>
            <div>
              <p className="font-bold text-slate-800">{product.farmer?.name}</p>
              <p className="text-xs text-slate-400 font-medium">{product.farmerProfile?.farmName}</p>
            </div>
          </div>

          <div className="space-y-2 text-xs text-slate-500">
            <div className="flex items-start space-x-2">
              <MapPin className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
              <span>{product.farmerProfile?.address}</span>
            </div>
            <div className="flex items-start space-x-2">
              <ShieldCheck className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
              <span>Delivers within {product.farmerProfile?.deliveryRadius} km</span>
            </div>
          </div>

          <p className="text-xs text-slate-400 italic bg-slate-50 p-3.5 rounded-xl leading-relaxed">
            {product.farmerProfile?.bio || 'Support your local agriculture directly by ordering today.'}
          </p>
        </div>

        {/* Reviews Feed Section */}
        <div className="md:col-span-2 space-y-4">
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider pb-2 border-b border-slate-50">
            Customer Reviews
          </h3>
          
          <div className="bg-slate-50 rounded-2xl border border-slate-100 p-6 text-center text-xs text-slate-400">
            No detailed reviews written for this product yet.
          </div>
        </div>
      </div>
    </div>
  );
}
