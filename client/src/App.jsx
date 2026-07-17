import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext } from './context/AuthContext';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Browse from './pages/Browse';
import ProductDetails from './pages/ProductDetails';
import Cart from './pages/Cart';
import OrderTracking from './pages/OrderTracking';
import FarmerDashboard from './pages/FarmerDashboard';
import Profile from './pages/Profile';
import Navbar from './components/Navbar';

// Private Route Guard
const PrivateRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }
  return user ? children : <Navigate to="/login" />;
};

// Farmer Only Route Guard
const FarmerRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }
  return user && user.role === 'FARMER' ? children : <Navigate to="/" />;
};

function App() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Navbar />
        <main className="flex-grow container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/browse" element={<Browse />} />
            <Route path="/products/:id" element={<ProductDetails />} />
            
            {/* Customer & General Private Routes */}
            <Route path="/cart" element={<PrivateRoute><Cart /></PrivateRoute>} />
            <Route path="/orders/:id" element={<PrivateRoute><OrderTracking /></PrivateRoute>} />
            <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
            
            {/* Farmer Dashboard Sub-routing */}
            <Route path="/farmer/*" element={<FarmerRoute><FarmerDashboard /></FarmerRoute>} />
            
            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
