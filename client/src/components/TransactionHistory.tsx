import React, { useState, useEffect } from 'react';
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  Receipt, 
  Clock, 
  Sparkles,
  Search,
  CheckCircle2,
  Tag
} from 'lucide-react';
import { api } from '../services/api.js';
import { Transaction } from '../types.js';

export const TransactionHistory: React.FC<{ refreshKey?: number }> = ({ refreshKey }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTx() {
      try {
        const list = await api.getTransactions();
        setTransactions(list);
      } catch (err) {
        console.error('Failed to load transactions:', err);
      } finally {
        setLoading(false);
      }
    }
    loadTx();
  }, [refreshKey]);

  const filtered = transactions.filter((t) => {
    const text = `${t.category} ${t.merchant_name || ''} ${t.type} ${t.idempotency_key}`.toLowerCase();
    return text.includes(search.toLowerCase());
  });

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h3 className="font-extrabold text-slate-900 text-lg tracking-tight">
            Transaction Ledger & History
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Immutable log of student debits, credits, and awarded cashbacks.
          </p>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search category, merchant..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
          />
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-slate-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-slate-100 rounded-2xl">
          <Receipt className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-bold text-slate-600">No transactions recorded yet</p>
          <p className="text-xs text-slate-400 mt-0.5">Make a merchant payment or top up your wallet</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100 overflow-hidden">
          {filtered.map((tx) => {
            const isTopUp = tx.type === 'TOPUP';
            const dateStr = new Date(tx.created_at).toLocaleString('en-IN', {
              day: 'numeric',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit'
            });

            return (
              <div 
                key={tx.id}
                className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 px-2 rounded-xl transition-all"
              >
                {/* Left side: Icon & Title */}
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                    isTopUp 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    {isTopUp ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-slate-900 text-sm">
                        {isTopUp ? 'Wallet Top-Up' : tx.merchant_name || 'Campus Merchant'}
                      </span>
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        {tx.category}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400">
                      <Clock className="w-3 h-3" />
                      <span>{dateStr}</span>
                      <span>•</span>
                      <span className="font-mono text-[10px] truncate max-w-[120px] sm:max-w-[200px]" title={tx.idempotency_key}>
                        {tx.idempotency_key}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right side: Amount & Cashback */}
                <div className="text-right sm:self-center pl-12 sm:pl-0 flex sm:flex-col items-center sm:items-end justify-between">
                  <div className="font-extrabold text-sm text-slate-900">
                    {isTopUp ? '+' : '-'}₹{(tx.amount_paise / 100).toFixed(2)}
                  </div>

                  {tx.awarded_cashback_paise > 0 ? (
                    <div className="text-xs font-bold text-emerald-600 flex items-center gap-1 mt-0.5">
                      <Sparkles className="w-3 h-3" />
                      +₹{(tx.awarded_cashback_paise / 100).toFixed(2)} cashback
                    </div>
                  ) : !isTopUp ? (
                    <span className="text-[10px] font-medium text-slate-400 mt-0.5">
                      No cashback awarded
                    </span>
                  ) : null}
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

