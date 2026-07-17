import React, { useState, useContext, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Mail, Lock, User as UserIcon, Phone, ArrowRight, AlertCircle, Sprout, ShoppingBag } from 'lucide-react';

export default function Signup() {
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [role, setRole] = useState('CUSTOMER');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Auto-detect role query param (e.g. from hero CTA "Join as a Farmer")
  useEffect(() => {
    const roleParam = searchParams.get('role');
    if (roleParam === 'FARMER' || roleParam === 'CUSTOMER') {
      setRole(roleParam);
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!name || !email || !phone || !password) {
      setError('Please fill in all registration fields.');
      setLoading(false);
      return;
    }

    const res = await register(name, email, password, phone, role);
    setLoading(false);

    if (res.success) {
      if (role === 'FARMER') {
        navigate('/profile'); // Redirect to profile to setup farm name/location
      } else {
        navigate('/browse');
      }
    } else {
      setError(res.message);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-3xl border border-slate-100 shadow-xl">
        <div className="text-center space-y-2">
          <div className="mx-auto h-12 w-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
            <Sprout className="h-7 w-7 fill-emerald-50" />
          </div>
          <h2 className="text-3xl font-extrabold text-slate-800">Create Account</h2>
          <p className="text-slate-500 text-sm">Join the direct agricultural marketplace</p>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-xl flex items-center space-x-3 text-red-700 text-sm">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Role Selection Cards */}
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setRole('CUSTOMER')}
            className={`p-4 rounded-2xl border text-center flex flex-col items-center justify-center space-y-2 transition-all ${
              role === 'CUSTOMER'
                ? 'border-emerald-500 bg-emerald-50/40 text-emerald-700 ring-2 ring-emerald-500/20'
                : 'border-slate-200 hover:border-slate-300 text-slate-500 hover:bg-slate-50'
            }`}
          >
            <ShoppingBag className={`h-6 w-6 ${role === 'CUSTOMER' ? 'text-emerald-600' : 'text-slate-400'}`} />
            <span className="text-xs font-bold block">I want to Buy</span>
          </button>

          <button
            type="button"
            onClick={() => setRole('FARMER')}
            className={`p-4 rounded-2xl border text-center flex flex-col items-center justify-center space-y-2 transition-all ${
              role === 'FARMER'
                ? 'border-emerald-500 bg-emerald-50/40 text-emerald-700 ring-2 ring-emerald-500/20'
                : 'border-slate-200 hover:border-slate-300 text-slate-500 hover:bg-slate-50'
            }`}
          >
            <Sprout className={`h-6 w-6 ${role === 'FARMER' ? 'text-emerald-600' : 'text-slate-400'}`} />
            <span className="text-xs font-bold block">I want to Sell</span>
          </button>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-semibold text-slate-600 mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <UserIcon className="h-5 w-5" />
                </div>
                <input
                  id="name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-10 block w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:ring-emerald-500/20 focus:outline-none focus:ring-4 transition-all text-sm"
                  placeholder="John Doe"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-slate-600 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="h-5 w-5" />
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 block w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:ring-emerald-500/20 focus:outline-none focus:ring-4 transition-all text-sm"
                  placeholder="john@example.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-semibold text-slate-600 mb-1.5">
                Phone Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Phone className="h-5 w-5" />
                </div>
                <input
                  id="phone"
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="pl-10 block w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:ring-emerald-500/20 focus:outline-none focus:ring-4 transition-all text-sm"
                  placeholder="+91 9876543210"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-slate-600 mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 block w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:ring-emerald-500/20 focus:outline-none focus:ring-4 transition-all text-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  <span>Sign Up</span>
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </button>
          </div>
        </form>

        <div className="text-center text-sm text-slate-500 pt-4 border-t border-slate-50">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-emerald-600 hover:text-emerald-700 transition-colors">
            Log in here
          </Link>
        </div>
      </div>
    </div>
  );
}
