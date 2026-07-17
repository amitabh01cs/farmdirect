import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/api';
import { User, MapPin, Landmark, Award, History, Check, ShieldAlert, Navigation } from 'lucide-react';

export default function Profile() {
  const { user, updateProfile, updateFarmerProfile } = useContext(AuthContext);
  const navigate = useNavigate();

  // User detail states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [userFeedback, setUserFeedback] = useState('');

  // FarmerProfile detail states
  const [farmName, setFarmName] = useState('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState(28.6139);
  const [longitude, setLongitude] = useState(77.2090);
  const [upiId, setUpiId] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [radius, setRadius] = useState(15);
  const [bio, setBio] = useState('');
  const [farmerFeedback, setFarmerFeedback] = useState('');
  const [locLoading, setLocLoading] = useState(false);

  // Customer order history states
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');

      if (user.role === 'FARMER' && user.farmerProfile) {
        const fp = user.farmerProfile;
        setFarmName(fp.farmName || '');
        setAddress(fp.address || '');
        setUpiId(fp.bankDetails?.upiId || '');
        setAccountNumber(fp.bankDetails?.accountNumber || '');
        setIfscCode(fp.bankDetails?.ifscCode || '');
        setRadius(fp.deliveryRadius || 15);
        setBio(fp.bio || '');

        if (fp.location?.coordinates) {
          setLongitude(fp.location.coordinates[0]);
          setLatitude(fp.location.coordinates[1]);
        }
      }

      if (user.role === 'CUSTOMER') {
        const fetchOrderHistory = async () => {
          try {
            const res = await api.get('/orders/customer');
            if (res.data.success) {
              setOrders(res.data.orders);
            }
          } catch (error) {
            console.error('Error fetching customer order history:', error);
          } finally {
            setOrdersLoading(false);
          }
        };
        fetchOrderHistory();
      }
    }
  }, [user]);

  const handleUserUpdate = async (e) => {
    e.preventDefault();
    setUserFeedback('');
    
    const res = await updateProfile({ name, phone });
    if (res.success) {
      setUserFeedback('General details updated successfully!');
      setTimeout(() => setUserFeedback(''), 3000);
    } else {
      setUserFeedback(res.message);
    }
  };

  const handleFarmerUpdate = async (e) => {
    e.preventDefault();
    setFarmerFeedback('');

    const res = await updateFarmerProfile({
      farmName,
      address,
      latitude,
      longitude,
      upiId,
      accountNumber,
      ifscCode,
      deliveryRadius: radius,
      bio
    });

    if (res.success) {
      setFarmerFeedback('Farmer details updated successfully!');
      setTimeout(() => setFarmerFeedback(''), 3000);
    } else {
      setFarmerFeedback(res.message);
    }
  };

  const detectFarmCoordinates = () => {
    setLocLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLatitude(pos.coords.latitude);
          setLongitude(pos.coords.longitude);
          setLocLoading(false);
          alert('GPS Coordinates mapped successfully!');
        },
        (err) => {
          console.warn('Geolocation mapping error:', err);
          alert('Failed to detect location. Please input coordinates manually.');
          setLocLoading(false);
        }
      );
    } else {
      alert('Browser geolocation unsupported.');
      setLocLoading(false);
    }
  };

  return (
    <div className="grid md:grid-cols-3 gap-8 items-start py-4 max-w-6xl mx-auto">
      {/* 1. General Profile details (Always visible on left) */}
      <div className="md:col-span-1 space-y-6">
        <div className="bg-white p-6 border border-slate-100 rounded-3xl shadow-sm space-y-5">
          <div className="flex items-center space-x-3.5 pb-3 border-b border-slate-50">
            <div className="h-10 w-10 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0">
              <User className="h-5.5 w-5.5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-800 text-base">{user?.name}</h3>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                {user?.role} ACCOUNT
              </span>
            </div>
          </div>

          {userFeedback && (
            <div className="bg-emerald-50 border-l-4 border-emerald-500 p-3 rounded-lg text-emerald-700 text-xs font-semibold">
              {userFeedback}
            </div>
          )}

          <form onSubmit={handleUserUpdate} className="space-y-4 text-xs text-slate-700">
            <div className="space-y-1">
              <label className="font-semibold text-slate-500 uppercase">Email (Read-only)</label>
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="w-full px-3 py-2 border border-slate-100 bg-slate-50 rounded-xl text-slate-400 focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-500 uppercase">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-500 uppercase">Phone Number</label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl transition-all shadow"
            >
              Update Profile
            </button>
          </form>
        </div>
      </div>

      {/* 2. Right Side: Farmer Setup Form OR Customer Orders history */}
      <div className="md:col-span-2">
        {user?.role === 'FARMER' ? (
          <div className="bg-white p-6 md:p-8 border border-slate-100 rounded-3xl shadow-md space-y-6">
            <div className="flex items-center space-x-2 pb-3 border-b border-slate-50 text-slate-800">
              <Landmark className="h-5.5 w-5.5 text-emerald-600" />
              <h2 className="text-lg font-black">Configure Farm Marketplace details</h2>
            </div>

            {farmerFeedback && (
              <div className="bg-emerald-50 border-l-4 border-emerald-500 p-3 rounded-lg text-emerald-700 text-xs font-semibold">
                {farmerFeedback}
              </div>
            )}

            {!user.farmerProfile && (
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-start space-x-2.5 text-xs text-amber-850">
                <ShieldAlert className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Farm Profile Incomplete</p>
                  <p className="mt-0.5 text-amber-700">
                    You must complete these details before listing crops so clients can discover and purchase products.
                  </p>
                </div>
              </div>
            )}

            <form onSubmit={handleFarmerUpdate} className="space-y-4 text-xs text-slate-700">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-500 uppercase">Farm Name</label>
                  <input
                    type="text"
                    required
                    value={farmName}
                    onChange={(e) => setFarmName(e.target.value)}
                    placeholder="Green Valley Farms"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-500 uppercase">Delivery Radius (km)</label>
                  <input
                    type="number"
                    required
                    min="5"
                    value={radius}
                    onChange={(e) => setRadius(parseInt(e.target.value) || 15)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-500 uppercase">Farm Address</label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Village Kheda, G.T. Road, Sonipat"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-none"
                />
              </div>

              {/* Coordinates Mapping */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-650">Geospatial Coordinates</span>
                  <button
                    type="button"
                    onClick={detectFarmCoordinates}
                    disabled={locLoading}
                    className="text-[10px] text-emerald-600 hover:text-emerald-700 font-extrabold flex items-center space-x-1 disabled:opacity-50"
                  >
                    <Navigation className={`h-3 w-3 ${locLoading ? 'animate-spin' : ''}`} />
                    <span>Auto-detect via GPS</span>
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-400 uppercase">Latitude</label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={latitude}
                      onChange={(e) => setLatitude(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-slate-200 bg-white rounded-xl focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-400 uppercase">Longitude</label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={longitude}
                      onChange={(e) => setLongitude(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-slate-200 bg-white rounded-xl focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Bank parameters */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-500 border-b border-slate-100 pb-1">Payment Payout details</h4>
                <div className="grid md:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-450 uppercase">UPI ID</label>
                    <input
                      type="text"
                      required
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      placeholder="farm@upi"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-450 uppercase">Account Number</label>
                    <input
                      type="text"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      placeholder="123456789"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-450 uppercase">IFSC Code</label>
                    <input
                      type="text"
                      value={ifscCode}
                      onChange={(e) => setIfscCode(e.target.value)}
                      placeholder="SBIN000123"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-500 uppercase">Farmer Biography (Bio)</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows="2"
                  placeholder="Tell clients about your organic methods, harvesting cycles..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-none resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition-all shadow-md"
              >
                Save Farmer settings
              </button>
            </form>
          </div>
        ) : (
          /* Customer order history list */
          <div className="bg-white p-6 md:p-8 border border-slate-100 rounded-3xl shadow-md space-y-6">
            <div className="flex items-center space-x-2 pb-3 border-b border-slate-50 text-slate-800">
              <History className="h-5.5 w-5.5 text-emerald-600" />
              <h2 className="text-lg font-black">My Order History</h2>
            </div>

            {ordersLoading ? (
              <div className="h-44 bg-slate-50 rounded-2xl animate-pulse"></div>
            ) : orders.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs space-y-2">
                <ShoppingBag className="h-8 w-8 mx-auto text-slate-300" />
                <p className="font-bold text-slate-650">No purchases yet</p>
                <Link to="/browse" className="text-emerald-600 font-bold hover:underline">
                  Browse items now
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div
                    key={order._id}
                    className="border border-slate-150 p-5 rounded-2xl flex justify-between items-center gap-4 hover:bg-slate-50/50 transition-colors"
                  >
                    <div className="space-y-1.5 text-xs">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-800">Order from: {order.farmName}</span>
                        <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded ${
                          order.status === 'PENDING' ? 'bg-amber-100 text-amber-800' :
                          order.status === 'ACCEPTED' ? 'bg-blue-100 text-blue-800' :
                          order.status === 'OUT_FOR_DELIVERY' ? 'bg-indigo-100 text-indigo-800' :
                          order.status === 'DELIVERED' ? 'bg-emerald-100 text-emerald-800' :
                          'bg-slate-100 text-slate-650'
                        }`}>
                          {order.status}
                        </span>
                      </div>
                      <p className="text-slate-400 font-medium">
                        {order.items.map(item => `${item.name} (${item.quantity} ${item.unit})`).join(', ')}
                      </p>
                      <span className="text-[10px] text-slate-400 block font-medium">
                        Placed on: {new Date(order.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="text-right flex flex-col items-end gap-2 shrink-0">
                      <span className="font-black text-slate-850 text-sm">₹{order.totalPrice}</span>
                      <Link
                        to={`/orders/${order._id}`}
                        className="bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all"
                      >
                        Track Status
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
