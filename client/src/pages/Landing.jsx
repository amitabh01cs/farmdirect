import React from 'react';
import { Link } from 'react-router-dom';
import { Sprout, ShoppingBag, ArrowRight, ShieldCheck, MapPin, TrendingUp, Users } from 'lucide-react';

export default function Landing() {
  return (
    <div className="space-y-20 py-8">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-slate-900 text-white py-20 px-8 md:px-16 shadow-2xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(16,185,129,0.15),transparent)]"></div>
        <div className="relative max-w-3xl space-y-6">
          <div className="inline-flex items-center space-x-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide">
            <Sprout className="h-4 w-4" />
            <span>Eliminating Middlemen, Empowering Communities</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight">
            Fresh Produce, Straight From the <span className="text-emerald-400">Soil to Your Table</span>
          </h1>
          <p className="text-slate-300 text-lg md:text-xl font-normal max-w-2xl leading-relaxed">
            FarmDirect connects you directly with local farmers in your area. Get harvested-to-order organic vegetables, grains, and fruits while farmers keep 100% of their earnings.
          </p>
          <div className="pt-4 flex flex-wrap gap-4">
            <Link
              to="/browse"
              className="inline-flex items-center space-x-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all group"
            >
              <span>Browse Fresh Market</span>
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              to="/signup?role=FARMER"
              className="inline-flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-slate-600 font-semibold px-6 py-3 rounded-xl transition-all"
            >
              <span>Join as a Farmer</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Trust & Operations Summary cards */}
      <section className="space-y-12">
        <div className="text-center max-w-xl mx-auto space-y-3">
          <h2 className="text-3xl font-bold tracking-tight text-slate-800">Why FarmDirect?</h2>
          <p className="text-slate-500">A transparent supply chain built on trust, geolocation matching, and fair trade.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow space-y-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl w-fit">
              <MapPin className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-800">Hyperlocal Sourcing</h3>
            <p className="text-slate-500 leading-relaxed text-sm">
              Our geolocation algorithm matches you with farms within your immediate radius, ensuring minimal carbon footprint and ultra-fresh deliveries.
            </p>
          </div>

          <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow space-y-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl w-fit">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-800">Verified Quality & Trust</h3>
            <p className="text-slate-500 leading-relaxed text-sm">
              Farmers receive automated trust ratings based on delivery punctuality, order success, and verified customer reviews.
            </p>
          </div>

          <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow space-y-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl w-fit">
              <TrendingUp className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-800">Fair Payouts</h3>
            <p className="text-slate-500 leading-relaxed text-sm">
              No brokers or commission cuts. Farmers set their own pricing, receive customer payments directly, and see analytics through their dashboards.
            </p>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="bg-slate-50 p-8 md:p-16 rounded-3xl border border-slate-100 space-y-12">
        <div className="text-center max-w-xl mx-auto space-y-3">
          <h2 className="text-3xl font-bold text-slate-800">How It Works</h2>
          <p className="text-slate-500">Three simple steps to support local agriculture.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-12">
          {/* Customer Side */}
          <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm space-y-6">
            <h3 className="text-2xl font-bold text-emerald-600 flex items-center space-x-2">
              <ShoppingBag className="h-6 w-6" />
              <span>For Customers</span>
            </h3>
            <ol className="space-y-4 text-sm text-slate-600">
              <li className="flex items-start space-x-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 font-bold text-xs">1</span>
                <span>Set your location and browse nearby listings of freshly harvested produce.</span>
              </li>
              <li className="flex items-start space-x-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 font-bold text-xs">2</span>
                <span>Select your item quantity, add to cart, and checkout choosing Card, UPI, or Cash on Delivery.</span>
              </li>
              <li className="flex items-start space-x-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 font-bold text-xs">3</span>
                <span>Track the status of your order and rate the products once delivered.</span>
              </li>
            </ol>
          </div>

          {/* Farmer Side */}
          <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm space-y-6">
            <h3 className="text-2xl font-bold text-emerald-600 flex items-center space-x-2">
              <Sprout className="h-6 w-6" />
              <span>For Farmers</span>
            </h3>
            <ol className="space-y-4 text-sm text-slate-600">
              <li className="flex items-start space-x-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 font-bold text-xs">1</span>
                <span>Create an account, specify your farm location coordinates, and list your bank/UPI payment parameters.</span>
              </li>
              <li className="flex items-start space-x-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 font-bold text-xs">2</span>
                <span>Upload product photos, set the prices per unit, stock quantity, and specify harvest dates.</span>
              </li>
              <li className="flex items-start space-x-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 font-bold text-xs">3</span>
                <span>Manage incoming customer orders, update delivery status, and view weekly earnings analytics.</span>
              </li>
            </ol>
          </div>
        </div>
      </section>

      {/* CTA Footer banner */}
      <section className="bg-[linear-gradient(135deg,#059669,#10b981)] rounded-3xl p-12 text-center text-white space-y-6 shadow-xl">
        <h2 className="text-3xl md:text-4xl font-extrabold max-w-2xl mx-auto leading-tight">
          Ready to experience the shortest path from farm to kitchen?
        </h2>
        <p className="text-emerald-100 max-w-md mx-auto text-sm md:text-base">
          Sign up today to explore verified products near you or start selling your crops directly.
        </p>
        <div className="pt-2 flex justify-center gap-4">
          <Link
            to="/signup"
            className="bg-white hover:bg-slate-50 text-emerald-700 font-bold px-6 py-3 rounded-xl shadow-md transition-all"
          >
            Get Started
          </Link>
          <Link
            to="/login"
            className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold px-6 py-3 rounded-xl transition-all"
          >
            Log In
          </Link>
        </div>
      </section>
    </div>
  );
}
