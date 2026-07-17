import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Mail, Lock, ArrowRight, AlertCircle, Sprout } from 'lucide-react';

export default function Login() {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!email || !password) {
      setError('Please enter both email and password.');
      setLoading(false);
      return;
    }

    const res = await login(email, password);
    setLoading(false);

    if (res.success) {
      if (res.user.role === 'FARMER') {
        navigate('/farmer');
      } else {
        navigate('/browse');
      }
    } else {
      setError(res.message);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-3xl border border-slate-100 shadow-xl">
        <div className="text-center space-y-2">
          <div className="mx-auto h-12 w-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
            <Sprout className="h-7 w-7 fill-emerald-50" />
          </div>
          <h2 className="text-3xl font-extrabold text-slate-800">Welcome Back</h2>
          <p className="text-slate-500 text-sm">
            Sign in to access your FarmDirect account
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-xl flex items-center space-x-3 text-red-700 text-sm">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
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
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 block w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:ring-emerald-500/20 focus:outline-none focus:ring-4 transition-all text-sm"
                  placeholder="name@example.com"
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
                  name="password"
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
                  <span>Sign In</span>
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </button>
          </div>
        </form>

        <div className="text-center text-sm text-slate-500 pt-4 border-t border-slate-50">
          Don't have an account?{' '}
          <Link to="/signup" className="font-semibold text-emerald-600 hover:text-emerald-700 transition-colors">
            Sign up here
          </Link>
        </div>
      </div>
    </div>
  );
}
