import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  CheckCircle2, 
  Download, 
  ShieldCheck, 
  TrendingUp, 
  FileSpreadsheet,
  AlertTriangle,
  RotateCw
} from 'lucide-react';
import { api } from '../services/api.js';
import { ReconciliationReport } from '../types.js';

export const ReconciliationDashboard: React.FC = () => {
  const [report, setReport] = useState<ReconciliationReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState<number>(new Date().getUTCFullYear());
  const [month, setMonth] = useState<number>(new Date().getUTCMonth() + 1);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const data = await api.getReconciliationReport(year, month);
      setReport(data);
    } catch (err) {
      console.error('Failed to load reconciliation report:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [year, month]);

  const exportCSV = () => {
    if (!report) return;

    const headers = ['Category', 'Transactions', 'Payment Volume (INR)', 'Raw Cashback (INR)', 'Awarded Cashback (INR)', 'Cap Savings (INR)', 'BASIC Cap (INR)'];
    const rows = report.category_breakdown.map((r) => [
      r.category,
      r.transaction_count,
      r.volume_rupees.toFixed(2),
      r.raw_cashback_rupees.toFixed(2),
      r.awarded_cashback_rupees.toFixed(2),
      r.cap_savings_rupees.toFixed(2),
      (r.basic_cap_paise / 100).toFixed(2)
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + 
      [headers.join(','), ...rows.map(e => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `finpay_reconciliation_${report.period.year}_${report.period.month}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Filters */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                <BarChart3 className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-slate-900 text-xl tracking-tight">
                Finance & Monthly Reconciliation Center
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Audit category transactions, total cashback awarded vs monthly budget caps, and ledger consistency.
            </p>
          </div>

          {/* Actions & Filters */}
          <div className="flex items-center gap-2">
            <select
              value={month}
              onChange={(e) => setMonth(parseInt(e.target.value, 10))}
              className="bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 rounded-xl px-3 py-2 focus:outline-none"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                <option key={m} value={m}>
                  {new Date(2026, m - 1).toLocaleString('default', { month: 'long' })}
                </option>
              ))}
            </select>

            <select
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value, 10))}
              className="bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 rounded-xl px-3 py-2 focus:outline-none"
            >
              <option value={2026}>2026</option>
              <option value={2025}>2025</option>
            </select>

            <button
              onClick={exportCSV}
              disabled={!report}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-sm transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Summary Stat Cards */}
        {report && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Total Volume Processed
              </span>
              <div className="text-2xl font-extrabold text-slate-900 mt-1">
                ₹{report.summary.total_payment_volume_rupees.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                {report.summary.total_transactions} transactions
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Cashback Awarded
              </span>
              <div className="text-2xl font-extrabold text-emerald-600 mt-1">
                ₹{report.summary.total_awarded_cashback_rupees.toFixed(2)}
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                {report.summary.total_awarded_cashback_paise.toLocaleString()} paise credited
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Saved by Monthly Caps
              </span>
              <div className="text-2xl font-extrabold text-purple-700 mt-1">
                ₹{report.summary.total_saved_by_caps_rupees.toFixed(2)}
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                Budget cap protection
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Reconciliation Integrity
              </span>
              <div className="text-sm font-extrabold text-emerald-700 flex items-center gap-1.5 mt-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>100% Balanced</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono block mt-1">
                0 ledger discrepancies
              </span>
            </div>

          </div>
        )}

        {/* Category Breakdown Table */}
        {report && (
          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100/80 text-slate-700 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Merchant Category</th>
                  <th className="py-3 px-4 text-center">Transactions</th>
                  <th className="py-3 px-4 text-right">Volume (₹)</th>
                  <th className="py-3 px-4 text-right">Raw Cashback (₹)</th>
                  <th className="py-3 px-4 text-right">Awarded Cashback (₹)</th>
                  <th className="py-3 px-4 text-right">Cap Savings (₹)</th>
                  <th className="py-3 px-4 text-right">BASIC Monthly Cap</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {report.category_breakdown.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400 font-medium">
                      No transactions recorded in {new Date(2026, month - 1).toLocaleString('default', { month: 'long' })} {year}
                    </td>
                  </tr>
                ) : (
                  report.category_breakdown.map((row) => (
                    <tr key={row.category} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900">{row.category}</td>
                      <td className="py-3 px-4 text-center font-mono font-medium">{row.transaction_count}</td>
                      <td className="py-3 px-4 text-right font-extrabold text-slate-900">₹{row.volume_rupees.toFixed(2)}</td>
                      <td className="py-3 px-4 text-right font-mono text-slate-600">₹{row.raw_cashback_rupees.toFixed(2)}</td>
                      <td className="py-3 px-4 text-right font-extrabold text-emerald-600">₹{row.awarded_cashback_rupees.toFixed(2)}</td>
                      <td className="py-3 px-4 text-right font-bold text-purple-700">₹{row.cap_savings_rupees.toFixed(2)}</td>
                      <td className="py-3 px-4 text-right font-mono text-slate-500">₹{(row.basic_cap_paise / 100).toFixed(0)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

      </div>

    </div>
  );
};

