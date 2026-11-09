import React, { useState } from 'react';
import { 
  ArrowUpRight, 
  PlusCircle, 
  Sparkles, 
  Shield, 
  CreditCard, 
  RefreshCw,
  Crown,
  Check
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { WalletTier } from '../types.js';

interface BalanceCardProps {
  onOpenPayModal: () => void;
  onOpenTopUpModal: () => void;
}

export const BalanceCard: React.FC<BalanceCardProps> = ({ onOpenPayModal, onOpenTopUpModal }) => {
  const { student, wallet, refreshWallet, updateTier } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showTierModal, setShowTierModal] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshWallet();
    setTimeout(() => setIsRefreshing(false), 400);
  };

  const handleTierChange = async (newTier: WalletTier) => {
    await updateTier(newTier);
    setShowTierModal(false);
  };

  const balanceRupees = wallet ? (wallet.balance_paise / 100).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }) : '0.00';

  const tierColors: Record<WalletTier, { bg: string; badge: string; text: string }> = {
    BASIC: {
      bg: 'from-slate-900 via-slate-800 to-indigo-950',
      badge: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      text: '1.0× Rates & Caps'
    },
    PRIME: {
      bg: 'from-amber-950 via-slate-900 to-amber-900',
      badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      text: '1.5× Rates & Caps'
    },
    PREMIUM: {
      bg: 'from-emerald-950 via-slate-900 to-teal-950',
      badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      text: '2.0× Rates & Caps'
    }
  };

  const currentTier = wallet?.tier || 'BASIC';
  const tierStyle = tierColors[currentTier];

  return (
    <div className="relative">
      {/* Virtual Student Smart Card */}
      <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${tierStyle.bg} p-6 sm:p-8 text-white shadow-xl shadow-slate-900/15 border border-white/10`}>
        
        {/* Geometric pattern background */}
        <div className="absolute -right-12 -top-12 w-64 h-64 rounded-full bg-white/5 blur-2xl pointer-events-none" />
        <div className="absolute right-24 -bottom-16 w-48 h-48 rounded-full bg-emerald-500/10 blur-xl pointer-events-none" />

        <div className="relative z-10 flex flex-col justify-between h-full gap-8">
          
          {/* Card Top Row */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/15">
                <CreditCard className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-lg tracking-tight text-white/95">
                  {student?.full_name || 'Campus Student'}
                </h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="font-mono text-xs text-white/70 tracking-wider">
                    {student?.student_id || 'PES1UG20CS001'}
                  </span>
                  <span className="inline-block w-1 h-1 rounded-full bg-emerald-400" />
                  <span className="text-[11px] text-emerald-400 font-medium">Active Wallet</span>
                </div>
              </div>
            </div>

            {/* Tier Badge & Tier Selector */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowTierModal(true)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border backdrop-blur-md transition-all hover:scale-105 ${tierStyle.badge}`}
              >
                <Crown className="w-3.5 h-3.5" />
                <span>{currentTier}</span>
                <span className="opacity-75 font-normal">({tierStyle.text.split(' ')[0]})</span>
              </button>

              <button
                onClick={handleRefresh}
                title="Refresh balance"
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-all text-white/80 hover:text-white"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Balance Display */}
          <div>
            <span className="text-xs uppercase font-medium tracking-wider text-white/60">
              Total Spendable Balance
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white">
                ₹{balanceRupees}
              </span>
              <span className="text-xs font-mono text-white/50">
                ({wallet?.balance_paise.toLocaleString()} paise)
              </span>
            </div>
            <p className="text-xs text-white/60 mt-1 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              Preserved in integer paise • Zero floating-point rounding
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={onOpenPayModal}
              className="flex-1 min-w-[140px] flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-slate-950 font-bold py-3 px-5 rounded-2xl transition-all shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40"
            >
              <ArrowUpRight className="w-5 h-5 stroke-[2.5]" />
              <span>Pay Merchant</span>
            </button>

            <button
              onClick={onOpenTopUpModal}
              className="flex-1 min-w-[140px] flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 active:bg-white/15 text-white font-bold py-3 px-5 rounded-2xl transition-all border border-white/20 backdrop-blur-md"
            >
              <PlusCircle className="w-5 h-5" />
              <span>Top Up Wallet</span>
            </button>
          </div>

        </div>
      </div>

      {/* Tier Selection Modal */}
      {showTierModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-slate-900 font-extrabold text-lg">
                <Crown className="w-5 h-5 text-amber-500" />
                Select Wallet Tier
              </div>
              <button 
                onClick={() => setShowTierModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold"
              >
                ✕
              </button>
            </div>
            
            <p className="text-xs text-slate-500 mb-4">
              Wallet tiers scale both the cashback rate and the monthly category cap as defined in FinPay Appendix.
            </p>

            <div className="space-y-3">
              {(['BASIC', 'PRIME', 'PREMIUM'] as WalletTier[]).map((t) => {
                const isCurrent = currentTier === t;
                const multiplier = t === 'BASIC' ? '1.0×' : t === 'PRIME' ? '1.5×' : '2.0×';
                const desc = t === 'BASIC' 
                  ? 'Standard campus rates (e.g. Canteen 2%, Cap ₹50)'
                  : t === 'PRIME'
                  ? '1.5× boosted rates & caps (e.g. Canteen 3%, Cap ₹75)'
                  : '2.0× elite rates & caps (e.g. Canteen 4%, Cap ₹100)';

                return (
                  <button
                    key={t}
                    onClick={() => handleTierChange(t)}
                    className={`w-full text-left p-4 rounded-2xl border-2 transition-all flex items-center justify-between ${
                      isCurrent
                        ? 'border-emerald-500 bg-emerald-50/50 shadow-sm'
                        : 'border-slate-100 hover:border-slate-300 bg-slate-50/50'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-slate-900 text-sm">{t}</span>
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-200 text-slate-800">
                          {multiplier} Multiplier
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">{desc}</p>
                    </div>
                    {isCurrent && (
                      <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

