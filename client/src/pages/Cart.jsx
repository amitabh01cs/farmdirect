import React, { useContext, useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import api from '../utils/api';
import { Trash2, ShoppingBag, MapPin, CreditCard, Landmark, CheckCircle2, ArrowRight } from 'lucide-react';

export default function Cart() {
  const { cartItems, cartTotal, updateQuantity, removeFromCart, clearCart } = useContext(CartContext);
  const navigate = useNavigate();

  const [address, setAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [upiId, setUpiId] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  
  const [latitude, setLatitude] = useState(28.6139); // Default Central Delhi coordinates
  const [longitude, setLongitude] = useState(77.2090);
  
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [error, setError] = useState('');

  // Auto-detect browser location for delivery coordinates
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLatitude(pos.coords.latitude);
          setLongitude(pos.coords.longitude);
        },
        (err) => {
          console.warn('Geolocation failed for checkout, using defaults:', err.message);
        }
      );
    }
  }, []);

  const handleCheckout = async (e) => {
    e.preventDefault();
    setError('');

    if (!address) {
      setError('Please provide a delivery address.');
      return;
    }

    if (paymentMethod === 'UPI' && !upiId) {
      setError('Please enter your UPI ID.');
      return;
    }

    if (paymentMethod === 'CARD' && !cardNumber) {
      setError('Please enter your Card Number.');
      return;
    }

    setCheckoutLoading(true);

    try {
      const itemsPayload = cartItems.map((item) => ({
        product: item.product,
        quantity: item.quantity
      }));

      const res = await api.post('/orders', {
        items: itemsPayload,
        deliveryAddress: address,
        latitude,
        longitude,
        paymentMethod
      });

      if (res.data.success) {
        clearCart();
        // Redirect to order tracking page
        navigate(`/orders/${res.data.order._id}`);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error processing your checkout. Please check stock details.');
    } finally {
      setCheckoutLoading(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-[60vh] text-center flex flex-col items-center justify-center space-y-4">
        <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-400">
          <ShoppingBag className="h-8 w-8" />
        </div>
        <h3 className="text-xl font-bold text-slate-800">Your Cart is Empty</h3>
        <p className="text-slate-400 text-sm max-w-xs">
          Browse our direct agricultural marketplace to add fresh products.
        </p>
        <Link
          to="/browse"
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-all"
        >
          Browse Market
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <h1 className="text-3xl font-extrabold text-slate-800">Shopping Cart</h1>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-xl text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-8 items-start">
        {/* Left Columns: Items list */}
        <div className="md:col-span-2 space-y-4">
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-50 pb-3">
              Items from: <span className="text-emerald-700 font-semibold">{cartItems[0]?.farmName}</span>
            </h3>
            
            <div className="divide-y divide-slate-100">
              {cartItems.map((item) => (
                <div key={item.product} className="py-4 flex justify-between items-center gap-4">
                  <div className="flex items-center space-x-3">
                    <div className="h-14 w-14 rounded-lg bg-slate-50 overflow-hidden shrink-0">
                      <img
                        src={item.imageUrl || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=100&auto=format&fit=crop'}
                        alt={item.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-850 text-sm line-clamp-1">{item.name}</h4>
                      <p className="text-xs text-slate-400">₹{item.price} / {item.unit}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-6">
                    {/* Qty update controls */}
                    <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-white">
                      <button
                        onClick={() => updateQuantity(item.product, item.quantity - 1)}
                        className="px-2 py-1 text-slate-500 font-bold hover:bg-slate-50"
                      >
                        -
                      </button>
                      <span className="w-8 text-center text-xs font-bold">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.product, item.quantity + 1)}
                        className="px-2 py-1 text-slate-500 font-bold hover:bg-slate-50"
                      >
                        +
                      </button>
                    </div>

                    <div className="text-sm font-extrabold text-slate-800 min-w-[50px] text-right">
                      ₹{item.price * item.quantity}
                    </div>

                    <button
                      onClick={() => removeFromCart(item.product)}
                      className="text-slate-400 hover:text-red-500 transition-colors p-1"
                    >
                      <Trash2 className="h-4.5 w-4.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Checkout forms */}
        <form onSubmit={handleCheckout} className="md:col-span-1 bg-white p-6 border border-slate-100 rounded-2xl shadow-md space-y-6">
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider pb-3 border-b border-slate-50">
            Order Summary
          </h3>

          <div className="space-y-4">
            {/* Delivery address details */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-500 uppercase block">Delivery Address</label>
              <div className="relative">
                <MapPin className="absolute top-3 left-3 h-4 w-4 text-slate-400" />
                <textarea
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows="2"
                  placeholder="Street details, building, landmark, pincode..."
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-emerald-500/20 focus:outline-none focus:ring-2 resize-none"
                />
              </div>
            </div>

            {/* Payment Method selector */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-500 uppercase block">Payment Method</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('COD')}
                  className={`p-2.5 rounded-xl border text-center flex flex-col items-center justify-center space-y-1 transition-all ${
                    paymentMethod === 'COD'
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                      : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="text-[10px] font-bold">COD</span>
                </button>
                
                <button
                  type="button"
                  onClick={() => setPaymentMethod('UPI')}
                  className={`p-2.5 rounded-xl border text-center flex flex-col items-center justify-center space-y-1 transition-all ${
                    paymentMethod === 'UPI'
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                      : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  <Landmark className="h-4 w-4" />
                  <span className="text-[10px] font-bold">UPI</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('CARD')}
                  className={`p-2.5 rounded-xl border text-center flex flex-col items-center justify-center space-y-1 transition-all ${
                    paymentMethod === 'CARD'
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                      : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  <CreditCard className="h-4 w-4" />
                  <span className="text-[10px] font-bold">Card</span>
                </button>
              </div>
            </div>

            {/* Payment inputs simulator */}
            {paymentMethod === 'UPI' && (
              <div className="space-y-1.5 animate-fadeIn">
                <label className="text-[10px] font-bold text-slate-400 block uppercase">Enter UPI ID</label>
                <input
                  type="text"
                  required
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="username@okaxis"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:border-emerald-500 focus:outline-none"
                />
              </div>
            )}

            {paymentMethod === 'CARD' && (
              <div className="space-y-1.5 animate-fadeIn">
                <label className="text-[10px] font-bold text-slate-400 block uppercase">Card Number</label>
                <input
                  type="text"
                  required
                  maxLength="19"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  placeholder="4111 2222 3333 4444"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:border-emerald-500 focus:outline-none"
                />
              </div>
            )}

            {/* Total breakdown */}
            <div className="pt-4 border-t border-slate-100 flex justify-between items-center text-sm">
              <span className="font-bold text-slate-600">Total Price:</span>
              <span className="text-xl font-black text-emerald-600">₹{cartTotal}</span>
            </div>

            <button
              type="submit"
              disabled={checkoutLoading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl text-xs transition-all shadow-md flex justify-center items-center space-x-1.5 disabled:opacity-50"
            >
              {checkoutLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <>
                  <span>Place Direct Order</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
