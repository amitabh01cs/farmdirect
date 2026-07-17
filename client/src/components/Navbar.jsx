import React, { useContext, useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { CartContext } from '../context/CartContext';
import api from '../utils/api';
import { ShoppingCart, Bell, User as UserIcon, LogOut, Menu, X, Landmark, Home, Sprout } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const { cartCount } = useContext(CartContext);
  const navigate = useNavigate();

  const [notifs, setNotifs] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Fetch notifications
  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const res = await api.get('/notifications');
      if (res.data.success) {
        setNotifs(res.data.notifications);
        setUnreadCount(res.data.notifications.filter(n => !n.read).length);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    let interval;
    if (user) {
      // Poll notifications every 30 seconds
      interval = setInterval(fetchNotifications, 30000);
    }
    return () => clearInterval(interval);
  }, [user]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowNotifDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      const res = await api.patch('/notifications/read');
      if (res.data.success) {
        setUnreadCount(0);
        setNotifs(prev => prev.map(n => ({ ...n, read: true })));
      }
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  };

  const handleLogoutClick = () => {
    logout();
    setMobileMenuOpen(false);
    navigate('/');
  };

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-slate-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2 text-emerald-600 font-extrabold text-2xl tracking-tight">
              <Sprout className="h-8 w-8 text-emerald-600 fill-emerald-100" />
              <span>FarmDirect</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <Link to="/browse" className="text-slate-600 hover:text-emerald-600 font-medium transition-colors">
              Browse Market
            </Link>

            {user ? (
              <>
                {user.role === 'FARMER' ? (
                  <Link to="/farmer" className="text-slate-600 hover:text-emerald-600 font-medium transition-colors flex items-center space-x-1">
                    <Landmark className="h-4 w-4" />
                    <span>Farmer Dashboard</span>
                  </Link>
                ) : (
                  <Link to="/profile" className="text-slate-600 hover:text-emerald-600 font-medium transition-colors">
                    My Orders
                  </Link>
                )}

                {/* Cart link (Customers only) */}
                {user.role === 'CUSTOMER' && (
                  <Link to="/cart" className="relative p-2 text-slate-600 hover:text-emerald-600 transition-colors">
                    <ShoppingCart className="h-6 w-6" />
                    {cartCount > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white ring-2 ring-white">
                        {cartCount}
                      </span>
                    )}
                  </Link>
                )}

                {/* Notifications Bell */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                    className="relative p-2 text-slate-600 hover:text-emerald-600 transition-colors focus:outline-none"
                  >
                    <Bell className="h-6 w-6" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {showNotifDropdown && (
                    <div className="absolute right-0 mt-2 w-80 rounded-xl bg-white shadow-xl ring-1 ring-slate-100 py-2 origin-top-right focus:outline-none border border-slate-50 z-50">
                      <div className="px-4 py-2 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-t-xl">
                        <span className="font-semibold text-slate-700 text-sm">Notifications</span>
                        {unreadCount > 0 && (
                          <button
                            onClick={handleMarkAllRead}
                            className="text-xs font-semibold text-emerald-600 hover:text-emerald-700"
                          >
                            Mark all read
                          </button>
                        )}
                      </div>
                      <div className="max-h-64 overflow-y-auto">
                        {notifs.length === 0 ? (
                          <div className="px-4 py-6 text-center text-xs text-slate-400">
                            No notifications yet.
                          </div>
                        ) : (
                          notifs.map((notif) => (
                            <div
                              key={notif._id}
                              className={`px-4 py-3 border-b border-slate-50 text-xs transition-colors hover:bg-slate-50 ${
                                !notif.read ? 'bg-emerald-50/30 font-medium' : ''
                              }`}
                            >
                              <p className="text-slate-800 font-semibold">{notif.title}</p>
                              <p className="text-slate-500 mt-0.5">{notif.message}</p>
                              <span className="text-[10px] text-slate-400 block mt-1">
                                {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Profile Link */}
                <Link to="/profile" className="flex items-center space-x-1 text-slate-600 hover:text-emerald-600 transition-colors font-medium">
                  <UserIcon className="h-5 w-5" />
                  <span className="max-w-[100px] truncate">{user.name}</span>
                </Link>

                {/* Logout */}
                <button
                  onClick={handleLogoutClick}
                  className="flex items-center space-x-1 px-4 py-2 border border-slate-200 hover:border-red-200 hover:bg-red-50 text-slate-600 hover:text-red-600 rounded-lg text-sm font-medium transition-all"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Log Out</span>
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-slate-600 hover:text-emerald-600 font-medium transition-colors">
                  Log In
                </Link>
                <Link
                  to="/signup"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-5 py-2 rounded-lg shadow-sm hover:shadow-md transition-all"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger menu */}
          <div className="flex items-center md:hidden">
            {user && user.role === 'CUSTOMER' && (
              <Link to="/cart" className="relative p-2 mr-2 text-slate-600">
                <ShoppingCart className="h-6 w-6" />
                {cartCount > 0 && (
                  <span className="absolute top-0 right-0 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-bold text-white">
                    {cartCount}
                  </span>
                )}
              </Link>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md text-slate-400 hover:text-slate-500 hover:bg-slate-100 focus:outline-none"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Panel */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white px-2 pt-2 pb-4 space-y-1 shadow-inner">
          <Link
            to="/browse"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:text-emerald-600 hover:bg-slate-50"
          >
            Browse Market
          </Link>

          {user ? (
            <>
              {user.role === 'FARMER' ? (
                <Link
                  to="/farmer"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:text-emerald-600 hover:bg-slate-50"
                >
                  Farmer Dashboard
                </Link>
              ) : (
                <Link
                  to="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:text-emerald-600 hover:bg-slate-50"
                >
                  My Orders
                </Link>
              )}

              <Link
                to="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:text-emerald-600 hover:bg-slate-50"
              >
                Profile Settings ({user.name})
              </Link>

              <button
                onClick={handleLogoutClick}
                className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-600 hover:bg-red-50"
              >
                Log Out
              </button>
            </>
          ) : (
            <div className="pt-4 pb-2 border-t border-slate-100 px-3 flex flex-col space-y-2">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="text-center w-full px-4 py-2 border border-slate-200 text-slate-700 rounded-md font-medium"
              >
                Log In
              </Link>
              <Link
                to="/signup"
                onClick={() => setMobileMenuOpen(false)}
                className="text-center w-full px-4 py-2 bg-emerald-600 text-white rounded-md font-medium"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
