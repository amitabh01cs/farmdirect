import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/api';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { Clock, CheckSquare, Truck, PackageCheck, Star, Calendar, MessageSquare, AlertTriangle } from 'lucide-react';

// Fix React-Leaflet default marker asset mapping
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow
});

export default function OrderTracking() {
  const { id } = useParams();
  const { user } = useContext(AuthContext);

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Review form states
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);

  const fetchOrderDetails = async () => {
    try {
      const res = await api.get(`/orders/${id}`);
      if (res.data.success) {
        setOrder(res.data.order);
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderDetails();
    let interval;
    if (order && order.status !== 'DELIVERED' && order.status !== 'CANCELLED' && order.status !== 'REJECTED') {
      // Poll order status every 15 seconds to simulate shipping updates
      interval = setInterval(fetchOrderDetails, 15000);
    }
    return () => clearInterval(interval);
  }, [id]);

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setReviewError('');
    setReviewLoading(true);

    try {
      const res = await api.post(`/orders/${id}/review`, { rating, comment });
      if (res.data.success) {
        setReviewSubmitted(true);
        setHasReviewed(true);
      }
    } catch (error) {
      setReviewError(error.response?.data?.message || 'Error submitting review.');
    } finally {
      setReviewLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-[70vh] text-center flex flex-col items-center justify-center space-y-4">
        <AlertTriangle className="h-12 w-12 text-amber-500" />
        <h3 className="text-xl font-bold text-slate-800">Order Not Found</h3>
        <p className="text-slate-400 text-sm">Verify the order ID or log back in.</p>
        <Link to="/profile" className="text-emerald-600 font-bold hover:underline">
          Go to my profile orders
        </Link>
      </div>
    );
  }

  // Map settings
  const customerCoords = order.deliveryCoordinates?.coordinates 
    ? [order.deliveryCoordinates.coordinates[1], order.deliveryCoordinates.coordinates[0]] // [lat, lng]
    : [28.6139, 77.2090];
    
  const farmCoords = order.farmCoordinates 
    ? [order.farmCoordinates[1], order.farmCoordinates[0]] // [lat, lng]
    : [28.6250, 77.2200];

  const mapCenter = [
    (customerCoords[0] + farmCoords[0]) / 2,
    (customerCoords[1] + farmCoords[1]) / 2
  ];

  // Status mapping
  const statuses = [
    { label: 'Pending', icon: Clock, desc: 'Awaiting farmer confirmation', key: 'PENDING' },
    { label: 'Accepted', icon: CheckSquare, desc: 'Farmer preparing harvest', key: 'ACCEPTED' },
    { label: 'Shipping', icon: Truck, desc: 'Out for delivery', key: 'OUT_FOR_DELIVERY' },
    { label: 'Delivered', icon: PackageCheck, desc: 'Delivered to your address', key: 'DELIVERED' }
  ];

  const getStatusIndex = (currentStatus) => {
    if (currentStatus === 'CANCELLED' || currentStatus === 'REJECTED') return -1;
    return statuses.findIndex(s => s.key === currentStatus);
  };

  const statusIdx = getStatusIndex(order.status);

  return (
    <div className="space-y-8 max-w-5xl mx-auto py-4">
      {/* Top Header Card */}
      <div className="bg-white border border-slate-100 rounded-3xl p-6 md:p-8 shadow-sm flex flex-wrap justify-between items-center gap-4">
        <div className="space-y-1">
          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Order ID: #{order._id.substring(18)}</p>
          <h1 className="text-2xl font-black text-slate-800">
            {order.status === 'CANCELLED' ? (
              <span className="text-red-650">Order Cancelled</span>
            ) : order.status === 'REJECTED' ? (
              <span className="text-slate-550">Order Declined</span>
            ) : (
              <span>Tracking Your Order</span>
            )}
          </h1>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-400 font-medium">Placed on: {new Date(order.createdAt).toLocaleDateString()}</p>
          <p className="text-lg font-black text-emerald-600">Total Price: ₹{order.totalPrice}</p>
        </div>
      </div>

      {/* Grid: Timeline Left / Map Right */}
      <div className="grid md:grid-cols-3 gap-8">
        {/* Timeline (Left Column) */}
        <div className="md:col-span-1 bg-white p-6 border border-slate-100 rounded-3xl shadow-sm space-y-6">
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider pb-3 border-b border-slate-50">
            Delivery Status
          </h3>

          {order.status === 'CANCELLED' || order.status === 'REJECTED' ? (
            <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-center space-y-2 text-xs">
              <AlertTriangle className="h-8 w-8 text-slate-400 mx-auto" />
              <p className="font-bold text-slate-700">This order was not fulfilled</p>
              <p className="text-slate-400">
                {order.status === 'CANCELLED' 
                  ? 'Cancelled by customer before acceptance.' 
                  : 'Declined by farmer. Payouts have been refunded.'}
              </p>
            </div>
          ) : (
            <div className="relative border-l-2 border-slate-100 ml-4 space-y-8 py-2">
              {statuses.map((s, idx) => {
                const isCompleted = idx <= statusIdx;
                const isCurrent = idx === statusIdx;
                const Icon = s.icon;
                
                return (
                  <div key={s.key} className="relative pl-7">
                    {/* Circle Node */}
                    <div className={`absolute -left-3.5 top-0.5 h-7 w-7 rounded-full border-2 flex items-center justify-center transition-all ${
                      isCurrent 
                        ? 'bg-emerald-600 border-emerald-600 text-white animate-pulse'
                        : isCompleted 
                        ? 'bg-emerald-50 border-emerald-600 text-emerald-600'
                        : 'bg-white border-slate-200 text-slate-400'
                    }`}>
                      <Icon className="h-3.5 w-3.5" />
                    </div>

                    <div className="space-y-0.5">
                      <h4 className={`text-sm font-bold ${isCompleted ? 'text-emerald-700' : 'text-slate-400'}`}>
                        {s.label}
                      </h4>
                      <p className="text-xs text-slate-400 leading-normal">{s.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Leaflet Map (Right Column) */}
        <div className="md:col-span-2 space-y-4">
          <div className="h-96 w-full bg-white rounded-3xl shadow-md border border-slate-100 overflow-hidden relative">
            <MapContainer center={mapCenter} zoom={12} scrollWheelZoom={false}>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <Marker position={farmCoords}>
                <Popup>
                  <div className="text-xs font-bold">
                    <p className="text-emerald-600">{order.farmName}</p>
                    <p className="text-[10px] text-slate-400">Seller Origin</p>
                  </div>
                </Popup>
              </Marker>
              <Marker position={customerCoords}>
                <Popup>
                  <div className="text-xs font-bold">
                    <p className="text-slate-800">Delivery Location</p>
                    <p className="text-[10px] text-slate-400">Customer Address</p>
                  </div>
                </Popup>
              </Marker>
              <Polyline positions={[farmCoords, customerCoords]} color="#10b981" weight={4} dashArray="8, 8" />
            </MapContainer>
          </div>
          <p className="text-[10px] text-center text-slate-400 font-semibold uppercase tracking-wider flex items-center justify-center space-x-1">
            <span>Direct logistical route mapping showing distance path</span>
          </p>
        </div>
      </div>

      {/* Lower Section: Items summary & Customer Feedback review box */}
      <div className="grid md:grid-cols-3 gap-8">
        {/* Items Summary (Left/Mid Columns) */}
        <div className="md:col-span-2 bg-white p-6 border border-slate-100 rounded-3xl shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider pb-3 border-b border-slate-50">
            Order Items Summary
          </h3>
          <div className="divide-y divide-slate-100">
            {order.items.map((item) => (
              <div key={item.product} className="py-3 flex justify-between items-center text-xs">
                <div>
                  <p className="font-bold text-slate-800">{item.name}</p>
                  <p className="text-slate-400 font-medium">₹{item.price} / {item.unit}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-slate-600">Qty: {item.quantity}</p>
                  <p className="font-bold text-emerald-600">₹{item.price * item.quantity}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="pt-4 border-t border-slate-100 flex justify-between items-center text-sm font-bold">
            <span className="text-slate-600">Method: {order.paymentMethod} ({order.paymentStatus})</span>
            <span className="text-emerald-600 text-lg font-black">Total Paid: ₹{order.totalPrice}</span>
          </div>
        </div>

        {/* Review Box (Right Column) */}
        <div className="md:col-span-1">
          {order.status === 'DELIVERED' && user?.role === 'CUSTOMER' && (
            <div className="bg-white p-6 border border-emerald-100 rounded-3xl shadow-md space-y-4">
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider pb-3 border-b border-slate-50 flex items-center space-x-1.5">
                <MessageSquare className="h-4.5 w-4.5 text-emerald-600" />
                <span>Rate Your Experience</span>
              </h3>

              {reviewError && (
                <div className="bg-red-50 p-2.5 rounded-lg text-red-700 text-xs font-semibold">
                  {reviewError}
                </div>
              )}

              {reviewSubmitted || hasReviewed ? (
                <div className="text-center py-4 space-y-2 text-xs">
                  <CheckSquare className="h-8 w-8 text-emerald-600 mx-auto" />
                  <p className="font-bold text-slate-700">Thank you for your rating!</p>
                  <p className="text-slate-400">Your feedback helps local farmers improve listing standards.</p>
                </div>
              ) : (
                <form onSubmit={handleReviewSubmit} className="space-y-4">
                  {/* Star selector */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 block uppercase">Select Stars</label>
                    <div className="flex space-x-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          className="p-1 focus:outline-none"
                        >
                          <Star className={`h-6 w-6 transition-all ${
                            star <= rating 
                              ? 'fill-amber-400 text-amber-400 scale-110' 
                              : 'text-slate-200 hover:text-slate-350'
                          }`} />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Comment */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 block uppercase">Write Comment</label>
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      rows="2"
                      placeholder="Was the crop fresh? How was the delivery?"
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-none resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={reviewLoading}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-xs shadow-md transition-all disabled:opacity-50"
                  >
                    {reviewLoading ? 'Submitting...' : 'Submit Feedback'}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
