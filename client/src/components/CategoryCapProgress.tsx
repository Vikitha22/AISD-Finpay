import React, { useEffect, useState } from 'react';
import { 
  Utensils, 
  BookOpen, 
  Bus, 
  Home, 
  Globe, 
  ArrowDownCircle,
  Percent,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { api } from '../services/api.js';
import { CategoryCapProgress as ICategoryCapProgress, MerchantCategory } from '../types.js';
import { useAuth } from '../context/AuthContext.js';

const categoryIcons: Record<MerchantCategory, React.ReactNode> = {
  'Canteen': <Utensils className="w-4 h-4 text-orange-600" />,
  'Stationery': <BookOpen className="w-4 h-4 text-blue-600" />,
  'Transport': <Bus className="w-4 h-4 text-green-600" />,
  'Hostel': <Home className="w-4 h-4 text-purple-600" />,
  'Online': <Globe className="w-4 h-4 text-indigo-600" />,
  'Top-up': <ArrowDownCircle className="w-4 h-4 text-slate-600" />
};

export const CategoryCapProgress: React.FC<{ refreshKey?: number }> = ({ refreshKey }) => {
  const { wallet } = useAuth();
  const [caps, setCaps] = useState<ICategoryCapProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCaps() {
      try {
        const data = await api.getCategoryCaps();
        setCaps(data);
      } catch (err) {
        console.error('Failed to load category cap progress:', err);
      } finally {
        setLoading(false);
      }
    }
    loadCaps();
  }, [wallet?.tier, wallet?.balance_paise, refreshKey]);

  if (loading && caps.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm animate-pulse">
        <div className="h-6 w-48 bg-slate-200 rounded mb-4" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-28 bg-slate-100 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
        <div>
          <h3 className="font-extrabold text-slate-900 text-lg tracking-tight">
            Monthly Cashback Caps & Category Tracking
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time tracking of accumulated cashback against category monthly caps for <span className="font-semibold text-slate-700">{wallet?.tier}</span> tier.
          </p>
        </div>
        <span className="self-start sm:self-auto px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
          Calendar Month Bounds (UTC/Campus)
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {caps.map((item) => {
          const isTopUp = item.category === 'Top-up';
          const isFull = !isTopUp && item.remaining_cap_paise === 0;

          return (
            <div 
              key={item.category}
              className={`p-4 rounded-2xl border transition-all ${
                isFull 
                  ? 'bg-rose-50/40 border-rose-200/80' 
                  : isTopUp 
                  ? 'bg-slate-50/60 border-slate-200' 
                  : 'bg-slate-50/50 border-slate-200/80 hover:border-slate-300'
              }`}
            >
              {/* Category Header */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-white shadow-xs border border-slate-200/60 flex items-center justify-center">
                    {categoryIcons[item.category]}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">{item.category}</h4>
                    <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-0.5">
                      <Percent className="w-3 h-3" />
                      {item.effective_rate_percent.toFixed(1)}% rate
                    </span>
                  </div>
                </div>

                {isFull ? (
                  <span className="flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full">
                    <AlertTriangle className="w-3 h-3" /> Cap Full
                  </span>
                ) : isTopUp ? (
                  <span className="text-[11px] font-medium text-slate-400 bg-slate-200 px-2 py-0.5 rounded-full">
                    No Cashback
                  </span>
                ) : (
                  <span className="text-xs font-bold text-slate-700">
                    ₹{item.earned_this_month_rupees.toFixed(2)} / ₹{item.monthly_cap_rupees.toFixed(0)}
                  </span>
                )}
              </div>

              {/* Progress Bar */}
              {!isTopUp ? (
                <div className="mt-3">
                  <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        isFull ? 'bg-rose-500' : 'bg-gradient-to-r from-emerald-500 to-teal-500'
                      }`}
                      style={{ width: `${Math.min(100, item.percent_used)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1.5 font-medium">
                    <span>{item.percent_used}% consumed</span>
                    <span className={isFull ? 'text-rose-600 font-bold' : 'text-emerald-700 font-bold'}>
                      ₹{item.remaining_cap_rupees.toFixed(2)} remaining
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-[11px] text-slate-400 mt-3 italic">
                  Top-up operations receive 0% cashback as per campus policy.
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

