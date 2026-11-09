import React from 'react';
import { 
  Wallet as WalletIcon, 
  Calculator, 
  Store, 
  BarChart3, 
  ShieldCheck, 
  LogOut,
  User,
  Crown
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';

interface NavbarProps {
  activeTab: 'wallet' | 'simulator' | 'merchant' | 'reconciliation' | 'idempotency';
  setActiveTab: (tab: 'wallet' | 'simulator' | 'merchant' | 'reconciliation' | 'idempotency') => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  const { student, wallet, logout } = useAuth();

  const tierColors: Record<string, string> = {
    BASIC: 'bg-blue-100 text-blue-800 border-blue-300',
    PRIME: 'bg-amber-100 text-amber-800 border-amber-300',
    PREMIUM: 'bg-emerald-100 text-emerald-800 border-emerald-300'
  };

  const currentTier = wallet?.tier || 'BASIC';

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <WalletIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                  FinPay
                </span>
                <span className="px-2 py-0.5 text-[11px] font-semibold tracking-wide uppercase bg-emerald-100 text-emerald-800 rounded-full">
                  Campus Wallet
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">AISD Lab 4 • Digital Payments</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200/60">
            <button
              onClick={() => setActiveTab('wallet')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'wallet'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <WalletIcon className="w-4 h-4 text-emerald-600" />
              Student Wallet
            </button>

            <button
              onClick={() => setActiveTab('simulator')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'simulator'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Calculator className="w-4 h-4 text-blue-600" />
              Cashback Lab
            </button>

            <button
              onClick={() => setActiveTab('merchant')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'merchant'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Store className="w-4 h-4 text-amber-600" />
              Merchant POS
            </button>

            <button
              onClick={() => setActiveTab('reconciliation')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'reconciliation'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BarChart3 className="w-4 h-4 text-purple-600" />
              Reconciliation
            </button>

            <button
              onClick={() => setActiveTab('idempotency')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'idempotency'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-rose-600" />
              Idempotency Lab
            </button>
          </nav>

          {/* User Account Info & Sign Out */}
          <div className="flex items-center gap-3">
            {student && (
              <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-2xl">
                <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                  {student.full_name[0]}
                </div>
                <div className="hidden sm:block text-left">
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-xs text-slate-900">{student.full_name}</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full border ${tierColors[currentTier]}`}>
                      {currentTier}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 block">{student.student_id}</span>
                </div>

                <button
                  onClick={logout}
                  title="Sign out of this student account"
                  className="ml-1 p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

        </div>

        {/* Mobile Navigation bar */}
        <div className="flex md:hidden overflow-x-auto gap-2 py-2 border-t border-slate-100 scrollbar-none">
          <button
            onClick={() => setActiveTab('wallet')}
            className={`px-3 py-1 rounded-md text-xs font-medium whitespace-nowrap ${
              activeTab === 'wallet' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700'
            }`}
          >
            Wallet
          </button>
          <button
            onClick={() => setActiveTab('simulator')}
            className={`px-3 py-1 rounded-md text-xs font-medium whitespace-nowrap ${
              activeTab === 'simulator' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'
            }`}
          >
            Cashback Lab
          </button>
          <button
            onClick={() => setActiveTab('merchant')}
            className={`px-3 py-1 rounded-md text-xs font-medium whitespace-nowrap ${
              activeTab === 'merchant' ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-700'
            }`}
          >
            Merchant POS
          </button>
          <button
            onClick={() => setActiveTab('reconciliation')}
            className={`px-3 py-1 rounded-md text-xs font-medium whitespace-nowrap ${
              activeTab === 'reconciliation' ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-700'
            }`}
          >
            Reconciliation
          </button>
          <button
            onClick={() => setActiveTab('idempotency')}
            className={`px-3 py-1 rounded-md text-xs font-medium whitespace-nowrap ${
              activeTab === 'idempotency' ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-700'
            }`}
          >
            Idempotency
          </button>
        </div>

      </div>
    </header>
  );
};
