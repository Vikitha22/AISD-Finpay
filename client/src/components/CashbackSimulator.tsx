import React, { useState, useEffect } from 'react';
import { 
  Calculator, 
  Sparkles, 
  HelpCircle, 
  Check, 
  BookOpen, 
  ShieldCheck,
  Percent
} from 'lucide-react';
import { api } from '../services/api.js';
import { MerchantCategory, WalletTier } from '../types.js';

export const CashbackSimulator: React.FC = () => {
  const [amountRupees, setAmountRupees] = useState<string>('100');
  const [category, setCategory] = useState<MerchantCategory>('Canteen');
  const [tier, setTier] = useState<WalletTier>('BASIC');
  const [result, setResult] = useState<any>(null);

  const categories: MerchantCategory[] = ['Canteen', 'Stationery', 'Transport', 'Hostel', 'Online', 'Top-up'];
  const tiers: WalletTier[] = ['BASIC', 'PRIME', 'PREMIUM'];

  useEffect(() => {
    const amt = parseFloat(amountRupees);
    if (!isNaN(amt) && amt >= 0) {
      api.simulateCashback(amt, category, tier).then(setResult);
    }
  }, [amountRupees, category, tier]);

  // Quick preset test cases from Section B5 of the PDF
  const loadTestCase = (testCaseName: string) => {
    switch (testCaseName) {
      case 'b4_worked_example':
        setAmountRupees('100');
        setCategory('Canteen');
        setTier('BASIC');
        break;
      case 'floor_test_666':
        // 3.33 * 0.02 = 0.0666 -> 6.66 paise -> floor is 6
        setAmountRupees('3.33');
        setCategory('Canteen');
        setTier('BASIC');
        break;
      case 'prime_multiplier':
        setAmountRupees('100');
        setCategory('Canteen');
        setTier('PRIME');
        break;
      case 'premium_multiplier':
        setAmountRupees('100');
        setCategory('Canteen');
        setTier('PREMIUM');
        break;
      case 'topup_zero':
        setAmountRupees('500');
        setCategory('Top-up');
        setTier('PREMIUM');
        break;
      case 'transport_high_rate':
        setAmountRupees('100');
        setCategory('Transport');
        setTier('PREMIUM');
        break;
      default:
        break;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Simulator Playground Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                <Calculator className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-slate-900 text-xl tracking-tight">
                AI-Assisted Algorithm Simulator (Section B)
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Verify the pure calculation function <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-800 font-mono text-[11px]">calculate_cashback()</code> with zero DB side effects.
            </p>
          </div>

          <span className="self-start sm:self-auto px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
            Integer Paise & Math.floor()
          </span>
        </div>

        {/* Quick Test Presets from Lab 4 PDF Section B5 */}
        <div className="mb-6 bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/60">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
            Load Lab 4 Boundary & Test Cases (Section B5):
          </span>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => loadTestCase('b4_worked_example')}
              className="px-3 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 transition-all"
            >
              ₹100 Canteen (BASIC) → ₹2.00
            </button>
            <button
              onClick={() => loadTestCase('floor_test_666')}
              className="px-3 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 transition-all text-amber-700 border-amber-200"
            >
              FLOOR Test (6.66p → 6p)
            </button>
            <button
              onClick={() => loadTestCase('prime_multiplier')}
              className="px-3 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 transition-all"
            >
              PRIME (1.5× Multiplier)
            </button>
            <button
              onClick={() => loadTestCase('premium_multiplier')}
              className="px-3 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 transition-all"
            >
              PREMIUM (2.0× Multiplier)
            </button>
            <button
              onClick={() => loadTestCase('topup_zero')}
              className="px-3 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 transition-all"
            >
              Top-up (0% Rate)
            </button>
          </div>
        </div>

        {/* Input Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Payment Amount (₹)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold">₹</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={amountRupees}
                onChange={(e) => setAmountRupees(e.target.value)}
                className="w-full pl-8 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-extrabold text-base text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <span className="text-[11px] text-slate-400 font-mono mt-1 block">
              = {Math.round(parseFloat(amountRupees || '0') * 100)} integer paise
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as MerchantCategory)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Wallet Tier
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {tiers.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTier(t)}
                  className={`py-2 px-2 rounded-xl text-xs font-extrabold transition-all border ${
                    tier === t
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Calculation Result Breakdown */}
        {result && (
          <div className="bg-gradient-to-br from-slate-900 to-indigo-950 rounded-2xl p-6 text-white shadow-lg space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <span className="text-xs uppercase font-bold text-white/60 tracking-wider">
                Mathematical Evaluation Breakdown
              </span>
              <span className="font-mono text-xs text-emerald-400 font-bold">
                calculate_cashback() output
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-left">
              <div>
                <span className="text-[11px] text-white/50 block">BASIC Rate</span>
                <span className="text-lg font-bold text-white">{result.basic_rate_percent.toFixed(1)}%</span>
              </div>
              <div>
                <span className="text-[11px] text-white/50 block">Tier Multiplier</span>
                <span className="text-lg font-bold text-white">{result.rate_multiplier}×</span>
              </div>
              <div>
                <span className="text-[11px] text-white/50 block">Effective Rate</span>
                <span className="text-lg font-bold text-emerald-400">
                  {(result.effective_rate * 100).toFixed(1)}%
                </span>
              </div>
              <div>
                <span className="text-[11px] text-white/50 block">Effective Cap</span>
                <span className="text-lg font-bold text-white">₹{result.monthly_cap_rupees}</span>
              </div>
            </div>

            {/* Formula Step */}
            <div className="bg-white/5 p-4 rounded-xl border border-white/10 font-mono text-xs space-y-1.5">
              <div className="text-white/70">
                effective_rate = {result.basic_rate_percent / 100} × {result.rate_multiplier} = <span className="text-emerald-300 font-bold">{result.effective_rate}</span>
              </div>
              <div className="text-white/70">
                raw_cashback_paise = FLOOR({result.amount_paise} × {result.effective_rate})
              </div>
              <div className="text-white/70">
                exact_calculation = {(result.amount_paise * result.effective_rate).toFixed(4)} paise
              </div>
              <div className="text-emerald-400 font-bold text-sm pt-1 border-t border-white/10 flex items-center justify-between">
                <span>Final Output:</span>
                <span>{result.raw_cashback_paise} paise (= ₹{result.raw_cashback_rupees.toFixed(2)})</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* FinPay Appendix Rule Reference Table */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <BookOpen className="w-5 h-5 text-slate-700" />
          <h4 className="font-extrabold text-slate-900 text-lg">
            Appendix — FinPay Approved Rule Reference
          </h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Category Table */}
          <div className="overflow-hidden border border-slate-200 rounded-2xl">
            <div className="bg-slate-100 px-4 py-2.5 font-bold text-xs text-slate-700 uppercase tracking-wider">
              Category Rules (Base Tier)
            </div>
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4">Category</th>
                  <th className="py-2.5 px-4">BASIC Rate</th>
                  <th className="py-2.5 px-4">BASIC Monthly Cap</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr><td className="py-2.5 px-4 font-bold">Canteen</td><td className="py-2.5 px-4 text-emerald-600 font-semibold">2.0%</td><td className="py-2.5 px-4">₹50 (5,000p)</td></tr>
                <tr><td className="py-2.5 px-4 font-bold">Stationery</td><td className="py-2.5 px-4 text-emerald-600 font-semibold">1.0%</td><td className="py-2.5 px-4">₹20 (2,000p)</td></tr>
                <tr><td className="py-2.5 px-4 font-bold">Transport</td><td className="py-2.5 px-4 text-emerald-600 font-semibold">3.0%</td><td className="py-2.5 px-4">₹100 (10,000p)</td></tr>
                <tr><td className="py-2.5 px-4 font-bold">Hostel</td><td className="py-2.5 px-4 text-emerald-600 font-semibold">0.5%</td><td className="py-2.5 px-4">₹200 (20,000p)</td></tr>
                <tr><td className="py-2.5 px-4 font-bold">Online</td><td className="py-2.5 px-4 text-emerald-600 font-semibold">1.0%</td><td className="py-2.5 px-4">₹30 (3,000p)</td></tr>
                <tr className="bg-slate-50/50"><td className="py-2.5 px-4 font-bold text-slate-400">Top-up</td><td className="py-2.5 px-4 text-slate-400 font-semibold">0.0%</td><td className="py-2.5 px-4 text-slate-400">No cashback</td></tr>
              </tbody>
            </table>
          </div>

          {/* Tier Multipliers Table */}
          <div className="overflow-hidden border border-slate-200 rounded-2xl">
            <div className="bg-slate-100 px-4 py-2.5 font-bold text-xs text-slate-700 uppercase tracking-wider">
              Wallet Tier Multipliers
            </div>
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4">Tier</th>
                  <th className="py-2.5 px-4">Rate Multiplier</th>
                  <th className="py-2.5 px-4">Monthly-Cap Multiplier</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr><td className="py-3 px-4 font-bold text-blue-700">BASIC</td><td className="py-3 px-4 font-semibold">1.0×</td><td className="py-3 px-4">1.0×</td></tr>
                <tr><td className="py-3 px-4 font-bold text-amber-700">PRIME</td><td className="py-3 px-4 font-semibold">1.5×</td><td className="py-3 px-4">1.5×</td></tr>
                <tr><td className="py-3 px-4 font-bold text-emerald-700">PREMIUM</td><td className="py-3 px-4 font-semibold">2.0×</td><td className="py-3 px-4">2.0×</td></tr>
              </tbody>
            </table>
          </div>

        </div>
      </div>

    </div>
  );
};

