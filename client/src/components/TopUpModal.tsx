import React, { useState } from 'react';
import { PlusCircle, Shield, AlertCircle, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.js';

interface TopUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const TopUpModal: React.FC<TopUpModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { wallet, refreshWallet } = useAuth();
  const [amountRupees, setAmountRupees] = useState<string>('500');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const presets = [100, 250, 500, 1000, 2000];

  const handleTopUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(amountRupees);
    if (isNaN(amt) || amt <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      await api.topUp(amt);
      await refreshWallet();
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onSuccess();
        onClose();
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Top-up failed');
    } finally {
      setProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100 relative">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 font-bold p-1 rounded-full hover:bg-slate-100"
        >
          ✕
        </button>

        {!success ? (
          <div>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                <PlusCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-xl tracking-tight">Top Up Wallet</h3>
                <p className="text-xs text-slate-500">Instant credit to student digital balance</p>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleTopUp} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Amount to Add (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold text-base">₹</span>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    value={amountRupees}
                    onChange={(e) => setAmountRupees(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-4 py-2.5 text-lg font-extrabold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex flex-wrap gap-2">
                {presets.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setAmountRupees(p.toString())}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                      amountRupees === p.toString()
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    +₹{p}
                  </button>
                ))}
              </div>

              {/* Rule Note */}
              <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/70 text-amber-900 text-xs flex items-start gap-2.5">
                <Shield className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="font-medium text-[11px] leading-relaxed">
                  FinPay Policy Rule: <strong>Top-up operations receive 0% cashback</strong>. Only merchant purchases qualify for tier-based cashback.
                </p>
              </div>

              <button
                type="submit"
                disabled={processing}
                className="w-full py-3.5 px-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-2"
              >
                {processing ? 'Processing Top-up...' : `Add ₹${parseFloat(amountRupees || '0').toFixed(2)} to Wallet`}
              </button>
            </form>
          </div>
        ) : (
          <div className="text-center py-6">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
            <h4 className="font-extrabold text-slate-900 text-lg">Top-Up Successful!</h4>
            <p className="text-xs text-slate-500 mt-1">Wallet balance updated.</p>
          </div>
        )}
      </div>
    </div>
  );
};

