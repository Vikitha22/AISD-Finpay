import React, { useState, useEffect } from 'react';
import { 
  ArrowUpRight, 
  Store, 
  Sparkles, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  Copy,
  Receipt,
  RotateCw
} from 'lucide-react';
import { api } from '../services/api.js';
import { Merchant, PaymentPreview, PaymentResult } from '../types.js';
import { useAuth } from '../context/AuthContext.js';

interface QuickPayModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess: () => void;
  initialMerchantId?: string;
}

export const QuickPayModal: React.FC<QuickPayModalProps> = ({
  isOpen,
  onClose,
  onPaymentSuccess,
  initialMerchantId
}) => {
  const { student, wallet, refreshWallet } = useAuth();
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [selectedMerchantId, setSelectedMerchantId] = useState<string>('');
  const [amountRupees, setAmountRupees] = useState<string>('100');
  const [idempotencyKey, setIdempotencyKey] = useState<string>('');
  const [preview, setPreview] = useState<PaymentPreview | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<PaymentResult | null>(null);

  // Generate new idempotency key
  const generateNewKey = () => {
    const randomHex = Math.random().toString(36).substring(2, 9);
    setIdempotencyKey(`pay-${Date.now()}-${randomHex}`);
  };

  useEffect(() => {
    if (isOpen) {
      generateNewKey();
      setError(null);
      setSuccessResult(null);

      api.getMerchants().then((data) => {
        setMerchants(data);
        if (initialMerchantId) {
          setSelectedMerchantId(initialMerchantId);
        } else if (data.length > 0 && !selectedMerchantId) {
          setSelectedMerchantId(data[0].id);
        }
      });
    }
  }, [isOpen, initialMerchantId]);

  // Live preview as amount or merchant changes
  useEffect(() => {
    const amt = parseFloat(amountRupees);
    if (!selectedMerchantId || isNaN(amt) || amt <= 0) {
      setPreview(null);
      return;
    }

    let isMounted = true;
    setLoadingPreview(true);
    setError(null);

    const timer = setTimeout(async () => {
      try {
        const p = await api.previewPayment(selectedMerchantId, amt);
        if (isMounted) setPreview(p);
      } catch (err: any) {
        if (isMounted) setPreview(null);
      } finally {
        if (isMounted) setLoadingPreview(false);
      }
    }, 150);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [selectedMerchantId, amountRupees]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(amountRupees);
    if (isNaN(amt) || amt <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    if (!selectedMerchantId) {
      setError('Please select a campus merchant');
      return;
    }
    if (!idempotencyKey.trim()) {
      setError('Idempotency key is required');
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const result = await api.processPayment({
        merchant_id: selectedMerchantId,
        amount_rupees: amt,
        idempotency_key: idempotencyKey.trim()
      });

      setSuccessResult(result);
      await refreshWallet();
      onPaymentSuccess();
    } catch (err: any) {
      setError(err.message || 'Payment processing failed');
    } finally {
      setProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-100 relative my-8">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 font-bold p-1 rounded-full hover:bg-slate-100"
        >
          ✕
        </button>

        {!successResult ? (
          <div>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                <ArrowUpRight className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-xl tracking-tight">Pay Campus Merchant</h3>
                <p className="text-xs text-slate-500">Instant debit with real-time tiered cashback</p>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="font-medium">{error}</div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Merchant Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Select Merchant
                </label>
                <select
                  value={selectedMerchantId}
                  onChange={(e) => setSelectedMerchantId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {merchants.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.business_name} ({m.category})
                    </option>
                  ))}
                </select>
              </div>

              {/* Payment Amount */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Payment Amount (₹)
                  </label>
                  <span className="text-xs text-slate-500 font-medium">
                    Wallet: ₹{(wallet?.balance_paise ? wallet.balance_paise / 100 : 0).toFixed(2)}
                  </span>
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold text-base">₹</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={amountRupees}
                    onChange={(e) => setAmountRupees(e.target.value)}
                    placeholder="100.00"
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-4 py-2.5 text-base font-extrabold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Live Cashback Simulator Preview Card */}
              {preview && (
                <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 space-y-2.5 transition-all">
                  <div className="flex items-center justify-between text-xs font-bold text-emerald-900">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-emerald-600" />
                      Live Cashback Preview ({preview.tier} Tier)
                    </span>
                    <span className="text-emerald-700">
                      {preview.effective_rate_percent.toFixed(1)}% Effective Rate
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-emerald-200/60">
                    <div>
                      <span className="text-slate-500 block text-[11px]">Raw Cashback (Floored)</span>
                      <span className="font-bold text-slate-800">
                        ₹{(preview.raw_cashback_paise / 100).toFixed(2)} ({preview.raw_cashback_paise}p)
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">Monthly Cap Remaining</span>
                      <span className="font-bold text-slate-800">
                        ₹{(preview.remaining_cap_paise / 100).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-emerald-200/60 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-bold text-emerald-800 block uppercase">
                        Awarded Cashback
                      </span>
                      <span className="text-lg font-extrabold text-emerald-600">
                        +₹{preview.awarded_cashback_rupees.toFixed(2)}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] font-bold text-slate-600 block uppercase">
                        Net Wallet Deduction
                      </span>
                      <span className="text-base font-bold text-slate-900">
                        ₹{preview.net_deduction_rupees.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {!preview.has_sufficient_balance && (
                    <div className="text-[11px] font-bold text-rose-600 flex items-center gap-1 mt-1">
                      <AlertCircle className="w-3.5 h-3.5" /> Insufficient balance to process payment!
                    </div>
                  )}
                </div>
              )}

              {/* Idempotency Key Input & Refresh */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    Idempotency-Key
                  </label>
                  <button
                    type="button"
                    onClick={generateNewKey}
                    className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
                  >
                    <RotateCw className="w-3 h-3" /> New Key
                  </button>
                </div>
                <input
                  type="text"
                  value={idempotencyKey}
                  onChange={(e) => setIdempotencyKey(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-mono text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Prevents duplicate debits if retried over unstable networks.
                </span>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={processing || (preview !== null && !preview.has_sufficient_balance)}
                className={`w-full py-3.5 px-4 rounded-2xl font-bold text-sm transition-all shadow-md flex items-center justify-center gap-2 ${
                  processing || (preview !== null && !preview.has_sufficient_balance)
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white shadow-emerald-600/20'
                }`}
              >
                {processing ? 'Processing Payment...' : `Confirm Payment of ₹${parseFloat(amountRupees || '0').toFixed(2)}`}
              </button>

            </form>
          </div>
        ) : (
          /* Payment Success Receipt */
          <div className="text-center py-2 space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-xl font-extrabold text-slate-900">Payment Successful!</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {successResult.is_cached 
                  ? '⚡ Returned cached response (Idempotency Replay)' 
                  : 'Ledger updated atomically in integer paise'}
              </p>
            </div>

            {/* Receipt Card */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-left text-xs space-y-2 font-medium">
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">Merchant</span>
                <span className="font-bold text-slate-900">{successResult.merchant_name}</span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">Amount Paid</span>
                <span className="font-bold text-slate-900">₹{successResult.amount_rupees.toFixed(2)}</span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">Cashback Credited</span>
                <span className="font-bold text-emerald-600">
                  +₹{successResult.awarded_cashback_rupees.toFixed(2)} ({successResult.awarded_cashback_paise} paise)
                </span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">New Wallet Balance</span>
                <span className="font-bold text-slate-900">₹{successResult.balance_after_rupees.toFixed(2)}</span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">Remaining Category Cap</span>
                <span className="font-bold text-slate-700">₹{(successResult.remaining_cap_after_paise / 100).toFixed(2)}</span>
              </div>

              <div className="flex justify-between py-1 text-[11px] font-mono text-slate-400">
                <span>Idempotency Key</span>
                <span className="truncate max-w-[180px]">{successResult.idempotency_key}</span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-sm transition-all"
            >
              Done
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

