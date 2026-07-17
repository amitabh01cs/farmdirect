import React from 'react';
import { Info, TrendingDown, TrendingUp } from 'lucide-react';

export default function MarketPriceBadge({ price, deviationPercent, unit = 'kg' }) {
  // If deviationPercent is 0 or undefined, mandi match was not made
  if (deviationPercent === undefined || deviationPercent === 0) {
    return (
      <span className="inline-flex items-center space-x-1 bg-slate-100 text-slate-500 text-[10px] font-bold px-2 py-0.5 rounded">
        <Info className="h-3 w-3 shrink-0" />
        <span>Market price unavailable</span>
      </span>
    );
  }

  // Calculate market average dynamically
  const marketAverage = parseFloat((price / (1 + deviationPercent / 100)).toFixed(1));

  // 1. Below average (Green)
  if (deviationPercent < 0) {
    const absDeviation = Math.abs(deviationPercent);
    return (
      <div className="flex flex-col space-y-0.5 shrink-0">
        <span className="inline-flex items-center space-x-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-extrabold px-2 py-0.5 rounded-lg border border-emerald-105 w-fit">
          <TrendingDown className="h-3 w-3 text-emerald-600 shrink-0" />
          <span>{absDeviation}% below average</span>
        </span>
        <span className="text-[9px] text-slate-400 font-bold">Mandi avg: ₹{marketAverage}/{unit}</span>
      </div>
    );
  }

  // 2. Normal / Slightly Above average (Yellow)
  if (deviationPercent <= 30) {
    return (
      <div className="flex flex-col space-y-0.5 shrink-0">
        <span className="inline-flex items-center space-x-0.5 bg-amber-50 text-amber-800 text-[10px] font-extrabold px-2 py-0.5 rounded-lg border border-amber-105 w-fit">
          <Info className="h-3 w-3 text-amber-600 shrink-0" />
          <span>+{deviationPercent}% vs average</span>
        </span>
        <span className="text-[9px] text-slate-400 font-bold">Mandi avg: ₹{marketAverage}/{unit}</span>
      </div>
    );
  }

  // 3. High Deviation (Red)
  return (
    <div className="flex flex-col space-y-0.5 shrink-0">
      <span className="inline-flex items-center space-x-0.5 bg-rose-50 text-rose-700 text-[10px] font-extrabold px-2 py-0.5 rounded-lg border border-rose-105 w-fit">
        <TrendingUp className="h-3 w-3 text-rose-600 shrink-0" />
        <span>+{deviationPercent}% vs average</span>
      </span>
      <span className="text-[9px] text-slate-400 font-bold">Mandi avg: ₹{marketAverage}/{unit}</span>
    </div>
  );
}
