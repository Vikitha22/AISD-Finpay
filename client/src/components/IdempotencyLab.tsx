import React, { useState } from 'react';
import { 
  ShieldCheck, 
  RotateCcw, 
  Play, 
  AlertTriangle, 
  CheckCircle2, 
  Copy,
  Terminal,
  Clock
} from 'lucide-react';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.js';

export const IdempotencyLab: React.FC = () => {
  const { student, wallet, refreshWallet } = useAuth();
  const [idempotencyKey, setIdempotencyKey] = useState<string>(`lab-${Math.floor(1000 + Math.random() * 9000)}`);
  const [amountRupees, setAmountRupees] = useState<string>('50');
  const [selectedMerchantId, setSelectedMerchantId] = useState<string>('m-canteen-1');
  const [logs, setLogs] = useState<Array<{
    timestamp: string;
    requestKey: string;
    amount: number;
    status: number;
    cached: boolean;
    body: any;
    error?: string;
  }>>([]);
  const [loading, setLoading] = useState(false);

  const generateNewKey = () => {
    setIdempotencyKey(`lab-${Math.floor(1000 + Math.random() * 9000)}`);
  };

  const executeRequest = async () => {
    setLoading(true);
    const amt = parseFloat(amountRupees);
    const timestamp = new Date().toLocaleTimeString();

    try {
      const res = await api.processPayment({
        merchant_id: selectedMerchantId,
        amount_rupees: amt,
        idempotency_key: idempotencyKey
      });

      await refreshWallet();

      setLogs((prev) => [
        {
          timestamp,
          requestKey: idempotencyKey,
          amount: amt,
          status: 200,
          cached: !!res.is_cached,
          body: res
        },
        ...prev
      ]);
    } catch (err: any) {
      setLogs((prev) => [
        {
          timestamp,
          requestKey: idempotencyKey,
          amount: amt,
          status: err.status || 400,
          cached: false,
          body: null,
          error: err.message
        },
        ...prev
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Intro Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-slate-900 text-xl tracking-tight">
                Payment Idempotency & Fault-Tolerance Workbench
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Demonstrates exact behavior required by Lab 4: preventing double debit on network retry, and rejecting key conflicts.
            </p>
          </div>

          <span className="self-start sm:self-auto px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-800 border border-rose-200">
            DDR Section B5 & C Security
          </span>
        </div>

        {/* Experiment Steps Guide */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6 text-xs">
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="font-extrabold text-slate-900 block mb-1">Step 1: First Attempt</span>
            <p className="text-slate-600">
              Click <strong>"Send Payment Request"</strong> with amount ₹50. The transaction succeeds and is saved in the idempotency registry.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-emerald-950">
            <span className="font-extrabold text-emerald-900 block mb-1">Step 2: Identical Retry</span>
            <p className="text-emerald-800">
              Click <strong>"Send Payment Request"</strong> again WITHOUT changing the key or amount. Notice it returns <strong>200 OK (Cached HIT)</strong> with zero extra debit!
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 text-amber-950">
            <span className="font-extrabold text-amber-900 block mb-1">Step 3: Conflict Rejection</span>
            <p className="text-amber-800">
              Change the amount to ₹75 while keeping the SAME key. Notice the server instantly rejects with <strong>409 Conflict</strong>!
            </p>
          </div>
        </div>

        {/* Test Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Idempotency-Key
              </label>
              <button
                onClick={generateNewKey}
                className="text-[11px] font-semibold text-rose-700 hover:text-rose-800 flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" /> New Key
              </button>
            </div>
            <input
              type="text"
              value={idempotencyKey}
              onChange={(e) => setIdempotencyKey(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Payment Amount (₹)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold">₹</span>
              <input
                type="number"
                step="1"
                value={amountRupees}
                onChange={(e) => setAmountRupees(e.target.value)}
                className="w-full pl-8 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-extrabold text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>
          </div>

          <div className="flex items-end">
            <button
              onClick={executeRequest}
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md shadow-rose-600/20 transition-all flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4 fill-white" />
              {loading ? 'Sending Request...' : 'Send Payment Request'}
            </button>
          </div>
        </div>

        {/* Live Execution Logs */}
        <div className="bg-slate-900 rounded-2xl p-4 text-white font-mono text-xs shadow-inner">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
            <span className="text-slate-400 text-[11px] flex items-center gap-1.5 font-sans font-bold">
              <Terminal className="w-3.5 h-3.5 text-rose-400" />
              Live Request & Idempotency Audit Trail
            </span>
            <span className="text-slate-500 text-[10px]">{logs.length} events logged</span>
          </div>

          {logs.length === 0 ? (
            <p className="text-slate-500 italic py-4 text-center">
              No requests fired yet. Click "Send Payment Request" above to observe the idempotency mechanism.
            </p>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {logs.map((log, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60 space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 text-[10px]">{log.timestamp}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        log.status === 200 
                          ? 'bg-emerald-500/20 text-emerald-300' 
                          : 'bg-rose-500/20 text-rose-300'
                      }`}>
                        HTTP {log.status}
                      </span>
                      {log.cached && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300">
                          ⚡ CACHED REPLAY
                        </span>
                      )}
                    </div>
                    <span className="text-slate-400 text-[10px]">Key: {log.requestKey}</span>
                  </div>

                  <div className="text-slate-200">
                    Amount: ₹{log.amount} | Student: {student?.full_name}
                  </div>

                  {log.error ? (
                    <div className="text-rose-400 font-semibold pt-1">
                      ❌ {log.error}
                    </div>
                  ) : (
                    <div className="text-emerald-400 text-[11px] pt-1 flex items-center justify-between">
                      <span>Tx: {log.body?.transaction_id}</span>
                      <span>Cashback: +₹{log.body?.awarded_cashback_rupees.toFixed(2)}</span>
                      <span>Balance After: ₹{log.body?.balance_after_rupees.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
};

