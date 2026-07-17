import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/api';
import {
  TrendingUp,
  Package,
  ListOrdered,
  Star,
  Plus,
  Mic,
  CheckCircle,
  XCircle,
  Truck,
  HelpCircle,
  MicOff,
  User,
  ShoppingBag,
  MapPin,
  FileSpreadsheet
} from 'lucide-react';

const CATEGORY_WHITELIST = {
  Vegetables: ['Root Vegetables', 'Leafy Greens', 'Nightshades', 'Cruciferous', 'Other'],
  Fruits: ['Citrus', 'Stone Fruits', 'Tropical', 'Berries', 'Pomes', 'Other'],
  Grains: ['Rice', 'Wheat', 'Pulses/Dals', 'Millets', 'Barley', 'Other'],
  Dairy: ['Milk', 'Ghee', 'Paneer', 'Butter'],
  Other: ['Raw Honey', 'Jaggery', 'Sugar Cane', 'Other']
};

export default function FarmerDashboard() {
  const { user } = useContext(AuthContext);

  const [activeTab, setActiveTab] = useState('overview');

  // Metrics states
  const [metrics, setMetrics] = useState({
    totalSales: 0,
    pendingPayout: 0,
    completedCount: 0,
    pendingCount: 0,
    avgRating: 5.0,
    reviewCount: 0
  });
  const [salesHistory, setSalesHistory] = useState([]);
  const [recentReviews, setRecentReviews] = useState([]);
  const [loadingMetrics, setLoadingMetrics] = useState(true);

  // Products CRUD states
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  // Form states
  const [prodName, setProdName] = useState('');
  const [prodDesc, setProdDesc] = useState('');
  const [prodCat, setProdCat] = useState('Vegetables');
  const [prodSubcat, setProdSubcat] = useState('Root Vegetables');
  const [prodVariety, setProdVariety] = useState('');
  const [prodPrice, setProdPrice] = useState('');
  const [prodUnit, setProdUnit] = useState('kg');
  const [prodQty, setProdQty] = useState('');
  const [prodHarvest, setProdHarvest] = useState('');
  const [prodImage, setProdImage] = useState(null);
  const [prodTags, setProdTags] = useState([]);
  
  // Voice listing states
  const [isListening, setIsListening] = useState(false);
  const [voiceTarget, setVoiceTarget] = useState(''); // 'name' or 'desc'

  // Sync subcategory on category change
  useEffect(() => {
    const subcats = CATEGORY_WHITELIST[prodCat] || [];
    if (subcats.length > 0) {
      setProdSubcat(subcats[0]);
    }
  }, [prodCat]);

  // Orders states
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  // Demand predictions states
  const [predictions, setPredictions] = useState([]);
  const [seasonName, setSeasonName] = useState('');
  const [loadingDemand, setLoadingDemand] = useState(true);

  // Fetch Dashboard Metrics
  const fetchMetrics = async () => {
    setLoadingMetrics(true);
    try {
      const res = await api.get('/dashboard/farmer');
      if (res.data.success) {
        setMetrics(res.data.metrics);
        setSalesHistory(res.data.salesHistory);
        setRecentReviews(res.data.recentReviews);
      }
    } catch (err) {
      console.error('Error fetching farmer dashboard metrics:', err);
    } finally {
      setLoadingMetrics(false);
    }
  };

  // Fetch Products
  const fetchProducts = async () => {
    setLoadingProducts(true);
    try {
      const res = await api.get('/products/farmer');
      if (res.data.success) {
        setProducts(res.data.products);
      }
    } catch (err) {
      console.error('Error fetching farmer products:', err);
    } finally {
      setLoadingProducts(false);
    }
  };

  // Fetch Orders
  const fetchOrders = async () => {
    setLoadingOrders(true);
    try {
      const res = await api.get('/orders/farmer');
      if (res.data.success) {
        setOrders(res.data.orders);
      }
    } catch (err) {
      console.error('Error fetching farmer orders:', err);
    } finally {
      setLoadingOrders(false);
    }
  };

  // Fetch Demand Predictions
  const fetchDemand = async () => {
    setLoadingDemand(true);
    try {
      const res = await api.get('/dashboard/demand');
      if (res.data.success) {
        setPredictions(res.data.predictions);
        setSeasonName(res.data.season);
      }
    } catch (err) {
      console.error('Error fetching demand predictions:', err);
    } finally {
      setLoadingDemand(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    fetchProducts();
    fetchOrders();
    fetchDemand();
  }, []);

  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setProdName('');
    setProdDesc('');
    setProdCat('Vegetables');
    setProdSubcat('Root Vegetables');
    setProdVariety('');
    setProdPrice('');
    setProdUnit('kg');
    setProdQty('');
    setProdHarvest('');
    setProdImage(null);
    setProdTags([]);
    setShowProductModal(true);
  };

  const handleOpenEditModal = (prod) => {
    setEditingProduct(prod);
    setProdName(prod.name);
    setProdDesc(prod.description);
    setProdCat(prod.category);
    setProdSubcat(prod.subcategory || 'Other');
    setProdVariety(prod.variety || '');
    setProdPrice(prod.price);
    setProdUnit(prod.unit);
    setProdQty(prod.quantityAvailable);
    setProdHarvest(new Date(prod.harvestDate).toISOString().substring(0, 10));
    setProdImage(null);
    setProdTags(prod.priceJustificationTags || []);
    setShowProductModal(true);
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('name', prodName);
    formData.append('description', prodDesc);
    formData.append('category', prodCat);
    formData.append('subcategory', prodSubcat);
    formData.append('variety', prodVariety);
    formData.append('price', prodPrice);
    formData.append('unit', prodUnit);
    formData.append('quantityAvailable', prodQty);
    formData.append('harvestDate', prodHarvest);
    formData.append('priceJustificationTags', JSON.stringify(prodTags));
    if (prodImage) {
      formData.append('image', prodImage);
    }

    try {
      let res;
      if (editingProduct) {
        res = await api.put(`/products/${editingProduct._id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        res = await api.post('/products', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      if (res.data.success) {
        setShowProductModal(false);
        fetchProducts();
      }
    } catch (err) {
      console.error('Error saving product:', err);
      alert('Failed to save product. Ensure all fields are filled.');
    }
  };

  const handleDeleteProduct = async (id) => {
    if (window.confirm('Are you sure you want to deactivate this listing?')) {
      try {
        const res = await api.delete(`/products/${id}`);
        if (res.data.success) {
          fetchProducts();
        }
      } catch (err) {
        console.error('Error deleting product:', err);
      }
    }
  };

  const handleOrderStatusUpdate = async (orderId, targetStatus) => {
    try {
      const res = await api.patch(`/orders/${orderId}/status`, { status: targetStatus });
      if (res.data.success) {
        fetchOrders();
        fetchMetrics(); // reload earnings if delivered
      }
    } catch (err) {
      console.error('Error updating order status:', err);
    }
  };

  // Voice Listing Recognition Helper
  const startSpeechRecognition = (field) => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Voice recognition not supported on this browser. Try Chrome/Safari.');
      return;
    }

    const rec = new SpeechRecognition();
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = 'en-IN'; // Standard Indian English, supports Hindi queries locally

    setVoiceTarget(field);
    setIsListening(true);

    rec.onstart = () => console.log('Listening...');
    
    rec.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      if (field === 'name') {
        setProdName(transcript);
      } else if (field === 'desc') {
        setProdDesc(transcript);
      }
      setIsListening(false);
    };

    rec.onerror = (err) => {
      console.error('Speech error:', err);
      setIsListening(false);
    };

    rec.onend = () => setIsListening(false);

    rec.start();
  };

  return (
    <div className="space-y-8">
      {/* Top Banner Dashboard header */}
      <section className="bg-emerald-900 text-white rounded-3xl p-6 md:p-8 flex flex-wrap justify-between items-center shadow-md gap-4">
        <div>
          <h1 className="text-2xl font-black">Farmer Management Console</h1>
          <p className="text-emerald-200 text-xs mt-1">
            Welcome back, <span className="font-semibold text-white">{user?.name}</span>. Manage crops and check payouts.
          </p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2.5 px-5 rounded-xl text-xs transition-all shadow flex items-center space-x-1"
        >
          <Plus className="h-4.5 w-4.5" />
          <span>Add New Crop</span>
        </button>
      </section>

      {/* Dashboard Sub-navigation Tabs */}
      <div className="flex border-b border-slate-200 overflow-x-auto pb-1 gap-4">
        {[
          { id: 'overview', label: 'Dashboard Overview', icon: TrendingUp },
          { id: 'products', label: 'Crops Listed', icon: Package },
          { id: 'orders', label: 'Incoming Orders', icon: ListOrdered },
          { id: 'demand', label: 'Demand Predictor', icon: FileSpreadsheet }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-1.5 pb-3 font-bold text-xs shrink-0 transition-all border-b-2 px-1 ${
                activeTab === tab.id
                  ? 'border-emerald-650 text-emerald-700'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              <Icon className="h-4.5 w-4.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB CONTENTS */}

      {/* 1. OVERVIEW VIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {loadingMetrics ? (
            <div className="h-64 bg-white rounded-3xl animate-pulse"></div>
          ) : (
            <>
              {/* Metrics Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Total Sales (Delivered)</span>
                  <p className="text-2xl font-black text-emerald-650">₹{metrics.totalSales}</p>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Pending Earnings</span>
                  <p className="text-2xl font-black text-amber-600">₹{metrics.pendingPayout}</p>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Fulfillment Count</span>
                  <p className="text-2xl font-black text-slate-800">{metrics.completedCount} orders</p>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Awaiting Action</span>
                  <p className="text-2xl font-black text-blue-600">{metrics.pendingCount} orders</p>
                </div>
              </div>

              {/* Lower Section: Chart mock & Reviews list */}
              <div className="grid md:grid-cols-3 gap-8">
                {/* Sales Chart Mock */}
                <div className="md:col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                  <h4 className="text-xs font-bold text-slate-700 uppercase">Weekly Sales Distribution (₹)</h4>
                  <div className="h-48 flex items-end justify-between gap-2 pt-4">
                    {salesHistory.map((s, i) => {
                      const maxVal = Math.max(...salesHistory.map(h => h.sales)) || 1;
                      const heightPercent = `${(s.sales / maxVal) * 80 + 5}%`;
                      return (
                        <div key={i} className="flex-grow flex flex-col items-center gap-1.5">
                          <span className="text-[10px] font-bold text-emerald-650">₹{s.sales}</span>
                          <div
                            style={{ height: heightPercent }}
                            className="w-full bg-emerald-500/10 hover:bg-emerald-500 rounded-t-lg transition-colors cursor-pointer border border-emerald-500/20"
                          ></div>
                          <span className="text-[9px] font-bold text-slate-400 uppercase">{s.day}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Reviews sidebar */}
                <div className="md:col-span-1 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                  <h4 className="text-xs font-bold text-slate-700 uppercase border-b border-slate-50 pb-2">
                    Recent Customer Ratings
                  </h4>
                  {recentReviews.length === 0 ? (
                    <div className="text-center py-8 text-xs text-slate-400">
                      No ratings received yet. Deliver orders to get rated!
                    </div>
                  ) : (
                    <div className="space-y-4 max-h-60 overflow-y-auto pr-1">
                      {recentReviews.map((rev) => (
                        <div key={rev._id} className="text-xs border-b border-slate-50 pb-3 space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-slate-800">{rev.customer?.name}</span>
                            <span className="flex items-center space-x-0.5 text-amber-500 bg-amber-50 px-1 rounded text-[10px] font-bold">
                              <Star className="h-2.5 w-2.5 fill-amber-400 stroke-none" />
                              <span>{rev.rating}</span>
                            </span>
                          </div>
                          <p className="text-slate-400 italic">"{rev.comment}"</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* 2. CROPS LIST CRUD VIEW */}
      {activeTab === 'products' && (
        <div className="space-y-6">
          {loadingProducts ? (
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-44 bg-white rounded-2xl animate-pulse"></div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center space-y-4">
              <Package className="h-10 w-10 text-slate-400 mx-auto" />
              <h3 className="text-lg font-bold text-slate-750">No crops listed</h3>
              <p className="text-slate-400 text-xs">List your harvest coordinates so local shoppers can purchase items.</p>
              <button
                onClick={handleOpenAddModal}
                className="bg-emerald-600 text-white text-xs px-4 py-2 rounded-xl font-bold"
              >
                List First Product
              </button>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
              {products.map((prod) => (
                <div key={prod._id} className="bg-white border border-slate-150 rounded-2xl p-5 shadow-sm space-y-4 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-450 uppercase">
                      <span>{prod.category}</span>
                      <span className={`px-2 py-0.5 rounded ${
                        prod.status === 'ACTIVE' 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : 'bg-slate-100 text-slate-500'
                      }`}>
                        {prod.status}
                      </span>
                    </div>
                    <h4 className="font-extrabold text-slate-800 text-base">{prod.name}</h4>
                    <p className="text-slate-400 text-xs line-clamp-2">{prod.description || 'No description listed.'}</p>
                    <div className="flex justify-between items-center pt-2 text-xs font-bold">
                      <span className="text-slate-500">Qty: {prod.quantityAvailable} {prod.unit}</span>
                      <span className="text-emerald-700 font-extrabold">₹{prod.price} / {prod.unit}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-50">
                    <button
                      onClick={() => handleOpenEditModal(prod)}
                      className="border border-slate-200 hover:bg-slate-50 text-slate-650 font-bold py-1.5 rounded-lg text-[10px]"
                    >
                      Edit Listing
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(prod._id)}
                      className="border border-red-200 hover:bg-red-50 text-red-650 font-bold py-1.5 rounded-lg text-[10px]"
                    >
                      Deactivate
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 3. INCOMING ORDERS TAB VIEW */}
      {activeTab === 'orders' && (
        <div className="space-y-6">
          {loadingOrders ? (
            <div className="h-44 bg-white rounded-2xl animate-pulse"></div>
          ) : orders.length === 0 ? (
            <div className="bg-white border border-slate-100 p-12 text-center rounded-2xl space-y-2 text-xs text-slate-400">
              <ListOrdered className="h-8 w-8 mx-auto text-slate-350" />
              <p className="font-bold text-slate-700">No incoming orders yet</p>
              <p>Keep your prices competitive and stock updated to invite buyers.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div key={order._id} className="bg-white border border-slate-150 p-6 rounded-2xl shadow-sm flex flex-col md:flex-row justify-between gap-6">
                  {/* Order metadata */}
                  <div className="space-y-3 flex-grow max-w-xl">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">ID: #{order._id.substring(18)}</span>
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded ${
                        order.status === 'PENDING' ? 'bg-amber-100 text-amber-800' :
                        order.status === 'ACCEPTED' ? 'bg-blue-100 text-blue-800' :
                        order.status === 'OUT_FOR_DELIVERY' ? 'bg-indigo-100 text-indigo-800' :
                        order.status === 'DELIVERED' ? 'bg-emerald-100 text-emerald-800' :
                        'bg-slate-100 text-slate-650'
                      }`}>
                        {order.status}
                      </span>
                    </div>

                    <div className="space-y-1 text-xs">
                      <p className="font-bold text-slate-800">
                        Customer: <span className="font-semibold text-slate-600">{order.customer?.name} ({order.customer?.phone})</span>
                      </p>
                      <p className="text-slate-400 font-semibold flex items-center space-x-0.5">
                        <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-300" />
                        <span>Address: {order.deliveryAddress}</span>
                      </p>
                    </div>

                    {/* Ordered crops list */}
                    <div className="bg-slate-50 p-3.5 rounded-xl text-xs space-y-1.5">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center text-slate-600 font-medium">
                          <span>{item.name} × {item.quantity} {item.unit}</span>
                          <span className="font-bold">₹{item.price * item.quantity}</span>
                        </div>
                      ))}
                      <div className="pt-2 border-t border-slate-200/50 flex justify-between items-center font-bold text-slate-800">
                        <span>Total Income:</span>
                        <span className="text-emerald-700">₹{order.totalPrice}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions column */}
                  <div className="shrink-0 flex md:flex-col justify-end gap-3 min-w-[150px]">
                    {order.status === 'PENDING' && (
                      <>
                        <button
                          onClick={() => handleOrderStatusUpdate(order._id, 'ACCEPTED')}
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-xl text-[10px] shadow flex items-center justify-center space-x-1"
                        >
                          <CheckCircle className="h-3.5 w-3.5" />
                          <span>Accept Order</span>
                        </button>
                        <button
                          onClick={() => handleOrderStatusUpdate(order._id, 'REJECTED')}
                          className="w-full border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold py-2 rounded-xl text-[10px]"
                        >
                          Decline
                        </button>
                      </>
                    )}

                    {order.status === 'ACCEPTED' && (
                      <button
                        onClick={() => handleOrderStatusUpdate(order._id, 'OUT_FOR_DELIVERY')}
                        className="w-full bg-indigo-650 hover:bg-indigo-700 text-white font-bold py-2 rounded-xl text-[10px] shadow flex items-center justify-center space-x-1"
                      >
                        <Truck className="h-3.5 w-3.5" />
                        <span>Ship Out</span>
                      </button>
                    )}

                    {order.status === 'OUT_FOR_DELIVERY' && (
                      <button
                        onClick={() => handleOrderStatusUpdate(order._id, 'DELIVERED')}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-xl text-[10px] shadow flex items-center justify-center space-x-1"
                      >
                        <CheckCircle className="h-3.5 w-3.5" />
                        <span>Mark Delivered</span>
                      </button>
                    )}

                    {(order.status === 'DELIVERED' || order.status === 'CANCELLED' || order.status === 'REJECTED') && (
                      <span className="text-[10px] text-center text-slate-400 font-bold py-2 uppercase tracking-wide">
                        Lifecycle Finished
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 4. DEMAND PREDICTOR TAB VIEW (PHASE 2) */}
      {activeTab === 'demand' && (
        <div className="space-y-6">
          <section className="bg-emerald-950 text-white p-6 md:p-8 rounded-3xl space-y-3 relative overflow-hidden shadow-inner">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_left_bottom,rgba(16,185,129,0.15),transparent)]"></div>
            <h3 className="text-xl font-bold relative z-10 flex items-center space-x-1.5">
              <span>Hyperlocal Demand Forecasting Report</span>
            </h3>
            <p className="text-emerald-255/80 text-xs max-w-xl leading-relaxed relative z-10">
              This dashboard combines regional seasonal agricultural calendars with local historical transaction volumes inside FarmDirect to forecast optimal crops to seed.
            </p>
          </section>

          {loadingDemand ? (
            <div className="h-44 bg-white rounded-2xl animate-pulse"></div>
          ) : (
            <div className="space-y-6">
              <div className="flex justify-between items-center text-xs font-bold text-slate-450 border-b border-slate-100 pb-2">
                <span>Predicting for Season: {seasonName}</span>
                <span>Data Confidence: High (Based on radius aggregation)</span>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {predictions.map((p, idx) => (
                  <div key={idx} className="bg-white border border-slate-150 p-5 rounded-2xl shadow-sm flex justify-between items-center">
                    <div className="space-y-1">
                      <h4 className="font-extrabold text-slate-800 text-sm">{p.name}</h4>
                      <p className="text-slate-400 text-[10px] font-semibold">Growth Cycle: {p.growthPeriod}</p>
                      <div className="flex items-center space-x-4 pt-1.5 text-[10px] text-slate-500 font-bold">
                        <span>Avg Price: ₹{p.avgPrice} / {p.unit}</span>
                        <span>Recent Orders: {p.pastOrdersCount} units</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold shadow-sm ${
                        p.demandLevel === 'HIGH' 
                          ? 'bg-red-50 text-red-700 border border-red-100' 
                          : 'bg-amber-50 text-amber-700 border border-amber-100'
                      }`}>
                        {p.demandLevel} DEMAND
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* PRODUCT LISTING ADD/EDIT MODAL */}
      {showProductModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 origin-center animate-fadeIn">
          <form
            onSubmit={handleProductSubmit}
            className="bg-white rounded-3xl max-w-md w-full p-6 border border-slate-100 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-800">
                {editingProduct ? 'Edit Crop Details' : 'List New Crop Harvest'}
              </h3>
              <button
                type="button"
                onClick={() => setShowProductModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3.5 text-xs text-slate-700">
              {/* Product Name */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-500 uppercase tracking-wide block">Crop Name</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={prodName}
                    onChange={(e) => setProdName(e.target.value)}
                    placeholder="Fresh Organic Potatoes"
                    className="flex-grow px-3 py-2 border border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => startSpeechRecognition('name')}
                    className={`px-3 rounded-xl border flex items-center justify-center transition-all ${
                      isListening && voiceTarget === 'name' 
                        ? 'bg-red-500 text-white border-red-500 animate-pulse' 
                        : 'border-slate-250 text-slate-500 hover:bg-slate-50'
                    }`}
                    title="Speak Crop Name"
                  >
                    {isListening && voiceTarget === 'name' ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Category */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-500 uppercase tracking-wide block">Category</label>
                <select
                  value={prodCat}
                  onChange={(e) => setProdCat(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-none"
                >
                  <option value="Vegetables">Vegetables</option>
                  <option value="Fruits">Fruits</option>
                  <option value="Grains">Grains</option>
                  <option value="Dairy">Dairy</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Subcategory */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-500 uppercase tracking-wide block">Subcategory</label>
                <select
                  value={prodSubcat}
                  onChange={(e) => setProdSubcat(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-none"
                >
                  {(CATEGORY_WHITELIST[prodCat] || []).map((sub) => (
                    <option key={sub} value={sub}>{sub}</option>
                  ))}
                </select>
              </div>

              {/* Variety */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-500 uppercase tracking-wide block">Crop Variety (e.g. Basmati, Hybrid)</label>
                <input
                  type="text"
                  value={prodVariety}
                  onChange={(e) => setProdVariety(e.target.value)}
                  placeholder="E.g., Basmati, Heirloom"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-none"
                />
              </div>

              {/* Pricing Justifications */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-500 uppercase tracking-wide block">Price Justification Tags</label>
                <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  {['Organic Certified', 'Premium Variety', 'Handpicked', 'Sortex Cleaned', 'Free Home Delivery'].map((tag) => {
                    const isChecked = prodTags.includes(tag);
                    return (
                      <label key={tag} className="flex items-center space-x-1.5 text-[10px] font-bold text-slate-600 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setProdTags([...prodTags, tag]);
                            } else {
                              setProdTags(prodTags.filter((t) => t !== tag));
                            }
                          }}
                          className="accent-emerald-600 rounded"
                        />
                        <span>{tag}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Price & Unit & Stock Qty */}
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-500 uppercase tracking-wide block">Price (₹)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={prodPrice}
                    onChange={(e) => setProdPrice(e.target.value)}
                    placeholder="30"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-500 uppercase tracking-wide block">Unit</label>
                  <select
                    value={prodUnit}
                    onChange={(e) => setProdUnit(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="kg">kg</option>
                    <option value="g">g</option>
                    <option value="litre">litre</option>
                    <option value="piece">piece</option>
                    <option value="bundle">bundle</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-500 uppercase tracking-wide block">Stock Qty</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={prodQty}
                    onChange={(e) => setProdQty(e.target.value)}
                    placeholder="50"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Harvest Date */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-500 uppercase tracking-wide block">Harvest Date</label>
                <input
                  type="date"
                  required
                  value={prodHarvest}
                  onChange={(e) => setProdHarvest(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-none"
                />
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-500 uppercase tracking-wide block">Description</label>
                <div className="relative">
                  <textarea
                    value={prodDesc}
                    onChange={(e) => setProdDesc(e.target.value)}
                    placeholder="Describe harvest method, organic inputs used..."
                    rows="2.5"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-none resize-none pr-9 text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => startSpeechRecognition('desc')}
                    className={`absolute bottom-3 right-3 h-7 w-7 rounded-lg border flex items-center justify-center transition-all ${
                      isListening && voiceTarget === 'desc' 
                        ? 'bg-red-500 text-white border-red-500' 
                        : 'border-slate-250 text-slate-500 hover:bg-slate-50'
                    }`}
                    title="Speak Description"
                  >
                    <Mic className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Image Input */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-500 uppercase tracking-wide block">Photo Upload</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setProdImage(e.target.files[0])}
                  className="w-full border border-slate-200 rounded-xl p-1 file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-none file:text-[10px] file:font-bold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex gap-3">
              <button
                type="button"
                onClick={() => setShowProductModal(false)}
                className="flex-grow border border-slate-200 hover:bg-slate-50 text-slate-650 font-bold py-2.5 rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-grow bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-xs shadow-md transition-all"
              >
                Save Listing
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
