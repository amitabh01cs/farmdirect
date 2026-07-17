import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import api from '../utils/api';
import MarketPriceBadge from '../components/MarketPriceBadge';
import { Search, MapPin, SlidersHorizontal, Star, ShoppingCart, RefreshCw, Sparkles } from 'lucide-react';

// Dynamic Unsplash categories for beautiful fallback graphics
const getProductImage = (url, category) => {
  if (url) {
    if (url.startsWith('/uploads')) {
      const serverUrl = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : '';
      return `${serverUrl}${url}`;
    }
    return url;
  }
  const fallbacks = {
    Vegetables: 'https://images.unsplash.com/photo-1566385101042-1a010c129fae?w=500&auto=format&fit=crop&q=60',
    Fruits: 'https://images.unsplash.com/photo-1619546813926-a78fa6372cd2?w=500&auto=format&fit=crop&q=60',
    Grains: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=500&auto=format&fit=crop&q=60',
    Dairy: 'https://images.unsplash.com/photo-1528750997573-59b89d56f4f7?w=500&auto=format&fit=crop&q=60',
    Other: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop&q=60'
  };
  return fallbacks[category] || fallbacks.Other;
};

// Freshness Badge Helper (Phase 2 feature)
const getFreshnessDetails = (harvestDate) => {
  const diffTime = Math.abs(new Date() - new Date(harvestDate));
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return { label: 'Harvested Today', style: 'bg-orange-500 text-white font-bold' };
  if (diffDays === 1) return { label: 'Harvested Yesterday', style: 'bg-amber-500 text-white font-bold' };
  if (diffDays <= 3) return { label: `Harvested ${diffDays} days ago`, style: 'bg-emerald-500 text-white font-semibold' };
  return { label: `Harvested ${diffDays} days ago`, style: 'bg-slate-400 text-white font-medium' };
};

export default function Browse() {
  const { addToCart } = useContext(CartContext);

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [radius, setRadius] = useState(15);

  // Geolocation parameters: default is Central Delhi (lat: 28.6139, lng: 77.2090)
  const [coords, setCoords] = useState({ latitude: 28.6139, longitude: 77.2090 });
  const [locLoading, setLocLoading] = useState(false);
  const [locationStatus, setLocationStatus] = useState('Default location: Central Delhi');
  const [cartFeedback, setCartFeedback] = useState({ show: false, message: '', success: true });

  const categories = ['All', 'Vegetables', 'Fruits', 'Grains', 'Dairy', 'Other'];

  const fetchProducts = async (latitude, longitude) => {
    setLoading(true);
    try {
      const res = await api.get('/products/nearby', {
        params: {
          latitude: latitude || coords.latitude,
          longitude: longitude || coords.longitude,
          radius,
          category: category !== 'All' ? category : undefined,
          search: search || undefined
        }
      });
      if (res.data.success) {
        setProducts(res.data.products);
      }
    } catch (error) {
      console.error('Error fetching nearby products:', error);
    } finally {
      setLoading(false);
    }
  };

  // Attempt to read geolocation coordinates on load
  const detectLocation = () => {
    setLocLoading(true);
    setLocationStatus('Accessing browser geolocation...');
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setCoords({ latitude, longitude });
          setLocationStatus('Coordinates mapped from browser GPS');
          setLocLoading(false);
          fetchProducts(latitude, longitude);
        },
        (error) => {
          console.warn('Geolocation blocked or failed:', error.message);
          setLocationStatus('Permission denied. Using default coordinates.');
          setLocLoading(false);
          fetchProducts(coords.latitude, coords.longitude);
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      setLocationStatus('Geolocation unsupported. Using default coordinates.');
      setLocLoading(false);
      fetchProducts(coords.latitude, coords.longitude);
    }
  };

  useEffect(() => {
    detectLocation();
  }, [category, radius]); // Refetch on radius or category swap

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchProducts();
  };

  const handleAddToCartClick = (product) => {
    const res = addToCart(product, 1);
    
    // UI feedback alert popup
    setCartFeedback({
      show: true,
      message: res.success ? `Added ${product.name} to cart!` : res.message,
      success: res.success
    });

    setTimeout(() => {
      setCartFeedback(prev => ({ ...prev, show: false }));
    }, 4000);
  };

  return (
    <div className="space-y-8">
      {/* Search Header Banner */}
      <section className="bg-emerald-950 text-white rounded-3xl p-8 md:p-12 shadow-xl space-y-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_right_bottom,rgba(16,185,129,0.18),transparent)]"></div>
        <div className="relative max-w-2xl space-y-4">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
            Find Fresh Food In Your Neighborhood
          </h1>
          <p className="text-emerald-100 text-sm md:text-base leading-relaxed">
            Specify matching distance boundaries to source crops directly from farmers located around your current area.
          </p>
        </div>

        {/* Search controls */}
        <form onSubmit={handleSearchSubmit} className="relative flex flex-col sm:flex-row gap-3 max-w-3xl z-10">
          <div className="relative flex-grow">
            <Search className="absolute inset-y-0 left-0 pl-3.5 h-full w-5 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search farm fresh potatoes, apples, grains..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white text-slate-800 rounded-xl text-sm border-none focus:outline-none focus:ring-4 focus:ring-emerald-500/30 transition-all font-medium"
            />
          </div>
          <button
            type="submit"
            className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 px-6 rounded-xl text-sm transition-all shadow-md hover:shadow-lg"
          >
            Find Produce
          </button>
        </form>

        {/* Geolocation status widget */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-emerald-900/50 relative z-10 text-xs">
          <div className="flex items-center space-x-2 text-emerald-200">
            <MapPin className="h-4 w-4 text-emerald-400 shrink-0" />
            <span className="font-semibold">{locationStatus}</span>
            <span className="text-emerald-500 font-medium">({coords.latitude.toFixed(4)}, {coords.longitude.toFixed(4)})</span>
          </div>
          <button
            type="button"
            onClick={detectLocation}
            disabled={locLoading}
            className="flex items-center space-x-1.5 text-emerald-400 hover:text-emerald-300 font-bold transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${locLoading ? 'animate-spin' : ''}`} />
            <span>Auto-detect GPS</span>
          </button>
        </div>
      </section>

      {/* Cart Addition Feedback Dialog */}
      {cartFeedback.show && (
        <div className={`fixed bottom-5 right-5 z-50 p-4 rounded-xl border flex items-center space-x-2 shadow-2xl transition-all animate-bounce ${
          cartFeedback.success 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
            : 'bg-amber-50 border-amber-200 text-amber-800'
        }`}>
          <span>{cartFeedback.message}</span>
        </div>
      )}

      {/* Filter and Grid Area */}
      <div className="grid lg:grid-cols-4 gap-8">
        {/* Left Side: Desktop Filter Sidebar */}
        <aside className="lg:col-span-1 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6 h-fit sticky top-24">
          <div className="flex items-center space-x-2 text-slate-800 font-bold border-b border-slate-100 pb-3">
            <SlidersHorizontal className="h-5 w-5 text-emerald-600" />
            <span>Search Filter Settings</span>
          </div>

          {/* Location Radius filter */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Max Distance: {radius} km
            </label>
            <input
              type="range"
              min="5"
              max="100"
              step="5"
              value={radius}
              onChange={(e) => setRadius(parseInt(e.target.value))}
              className="w-full accent-emerald-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-bold">
              <span>5 km</span>
              <span>50 km</span>
              <span>100 km</span>
            </div>
          </div>
        </aside>

        {/* Right Side: Category tabs and Product listings Grid */}
        <main className="lg:col-span-3 space-y-6">
          {/* Category selection bar */}
          <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-thin">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat === 'All' ? '' : cat)}
                className={`px-4 py-2 rounded-xl text-xs font-bold shrink-0 transition-all ${
                  (cat === 'All' && !category) || category === cat
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Listings count details */}
          <div className="flex justify-between items-center text-xs text-slate-400 font-semibold">
            <span>Found {products.length} products within {radius}km of your location</span>
          </div>

          {/* Product Grid */}
          {loading ? (
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white border border-slate-100 rounded-2xl h-80 animate-pulse"></div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center space-y-4">
              <div className="mx-auto h-12 w-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
                <Search className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-700">No active products found</h3>
              <p className="text-slate-400 text-xs max-w-sm mx-auto">
                No farmers inside a {radius}km radius have listed items. Try expanding your search radius or changing the category filter.
              </p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
              {products.map((prod) => {
                const fresh = getFreshnessDetails(prod.harvestDate);
                return (
                  <div
                    key={prod._id}
                    className="bg-white border border-slate-150 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all flex flex-col group"
                  >
                    {/* Image Header with Badges */}
                    <div className="relative h-44 w-full bg-slate-100 overflow-hidden shrink-0">
                      <img
                        src={getProductImage(prod.imageUrl, prod.category)}
                        alt={prod.name}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      
                      {/* Freshness Badge */}
                      <span className={`absolute top-3 left-3 text-[10px] uppercase px-2.5 py-1 rounded-full shadow-md ${fresh.style}`}>
                        {fresh.label}
                      </span>

                      {/* Distance Badge */}
                      <span className="absolute bottom-3 right-3 text-[10px] font-bold bg-white/95 backdrop-blur-sm text-slate-800 px-2 py-0.5 rounded-md shadow-sm flex items-center space-x-0.5">
                        <MapPin className="h-3 w-3 text-emerald-600 shrink-0" />
                        <span>{prod.distance} km</span>
                      </span>
                    </div>

                    {/* Card Body */}
                    <div className="p-5 flex-grow flex flex-col justify-between space-y-4">
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          <span>{prod.category}</span>
                          <span className="flex items-center space-x-0.5 text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                            <Star className="h-2.5 w-2.5 fill-emerald-600 stroke-none" />
                            <span>{prod.trustScore}% trust</span>
                          </span>
                        </div>
                        
                        <Link to={`/products/${prod._id}`} className="block group-hover:text-emerald-600 transition-colors">
                          <h4 className="text-base font-bold text-slate-800 leading-snug line-clamp-1">{prod.name}</h4>
                        </Link>

                        <p className="text-[11px] text-slate-400 font-medium">
                          Listed by <span className="font-semibold text-slate-500">{prod.farmName}</span>
                        </p>

                        {prod.priceJustificationTags && prod.priceJustificationTags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {prod.priceJustificationTags.map((tag, idx) => (
                              <span key={idx} className="bg-emerald-50 text-emerald-850 text-[8px] font-extrabold px-1.5 py-0.5 rounded border border-emerald-100">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                        <div className="space-y-1">
                          <div className="text-slate-800">
                            <span className="text-lg font-black text-emerald-600">₹{prod.price}</span>
                            <span className="text-[10px] text-slate-400 font-bold"> / {prod.unit}</span>
                          </div>
                          <MarketPriceBadge price={prod.price} deviationPercent={prod.priceDeviationPercent} unit={prod.unit} />
                        </div>

                        <button
                          type="button"
                          onClick={() => handleAddToCartClick(prod)}
                          className="bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white p-2 rounded-xl transition-all focus:outline-none"
                          title="Add one unit to cart"
                        >
                          <ShoppingCart className="h-4.5 w-4.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
