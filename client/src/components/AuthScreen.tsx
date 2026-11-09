import React, { useState } from 'react';
import { 
  Wallet, 
  Crown, 
  Check, 
  Sparkles, 
  ShieldCheck, 
  ArrowRight, 
  Lock, 
  Mail, 
  User, 
  Hash, 
  AlertCircle,
  Coins
} from 'lucide-react';
import { useAuth, DEMO_PERSONAS } from '../context/AuthContext.js';
import { WalletTier } from '../types.js';

export const AuthScreen: React.FC = () => {
  const { registerUser, loginUser, loginAsDemo } = useAuth();
  const [mode, setMode] = useState<'register' | 'login'>('register');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [fullName, setFullName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedTier, setSelectedTier] = useState<WalletTier>('PRIME');
  const [initialBalance, setInitialBalance] = useState<number>(1000); // ₹1000 default

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await registerUser({
        full_name: fullName,
        student_id: studentId || undefined,
        email,
        password,
        tier: selectedTier,
        initial_balance_paise: initialBalance * 100
      });
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await loginUser(email, password);
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (demoEmail: string) => {
    setError(null);
    setLoading(true);
    try {
      await loginAsDemo(demoEmail);
    } catch (err: any) {
      setError(err.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  const tierPlans = [
    {
      id: 'BASIC' as WalletTier,
      name: 'BASIC',
      multiplier: '1.0× Rates & Caps',
      badge: 'Campus Standard',
      color: 'border-blue-200 bg-blue-50/40 text-blue-900',
      activeColor: 'border-blue-600 bg-blue-50/80 ring-2 ring-blue-500/30',
      rates: 'Canteen: 2.0% • Cap ₹50',
      desc: 'Standard student payment allowance with baseline monthly cashback limits.'
    },
    {
      id: 'PRIME' as WalletTier,
      name: 'PRIME',
      multiplier: '1.5× Rates & Caps',
      badge: 'Most Popular',
      color: 'border-amber-200 bg-amber-50/40 text-amber-900',
      activeColor: 'border-amber-600 bg-amber-50/80 ring-2 ring-amber-500/30',
      rates: 'Canteen: 3.0% • Cap ₹75',
      desc: '1.5× boost on all merchant categories with higher monthly cashback ceiling.'
    },
    {
      id: 'PREMIUM' as WalletTier,
      name: 'PREMIUM',
      multiplier: '2.0× Rates & Caps',
      badge: 'Elite Benefits',
      color: 'border-emerald-200 bg-emerald-50/40 text-emerald-900',
      activeColor: 'border-emerald-600 bg-emerald-50/80 ring-2 ring-emerald-500/30',
      rates: 'Canteen: 4.0% • Cap ₹100',
      desc: '2.0× double rate & double monthly cap across all campus purchases.'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      
      {/* Background glowing effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-xl relative z-10">
        
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 shadow-xl shadow-emerald-500/25 mb-4">
            <Wallet className="w-8 h-8 stroke-[2.5]" />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            FinPay Campus Digital Wallet
          </h1>
          <p className="text-sm text-slate-300 mt-1 max-w-sm mx-auto">
            AISD Laboratory 4 • Real-Time Cashback Engine, Idempotent Payments & Reconciliation
          </p>
        </div>

        {/* Card Container */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-2xl border border-white/20">
          
          {/* Mode Switch Tabs */}
          <div className="grid grid-cols-2 p-1.5 bg-slate-100 rounded-2xl mb-6">
            <button
              type="button"
              onClick={() => { setMode('register'); setError(null); }}
              className={`py-2.5 text-xs sm:text-sm font-extrabold rounded-xl transition-all ${
                mode === 'register'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Create Student Account
            </button>
            <button
              type="button"
              onClick={() => { setMode('login'); setError(null); }}
              className={`py-2.5 text-xs sm:text-sm font-extrabold rounded-xl transition-all ${
                mode === 'login'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Sign In to Wallet
            </button>
          </div>

          {error && (
            <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span className="font-semibold">{error}</span>
            </div>
          )}

          {/* REGISTER MODE */}
          {mode === 'register' ? (
            <form onSubmit={handleRegister} className="space-y-5">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rahul Sharma"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Student ID / SRN
                  </label>
                  <div className="relative">
                    <Hash className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      placeholder="e.g. PES1UG24CS101"
                      value={studentId}
                      onChange={(e) => setStudentId(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  University Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    placeholder="student@campus.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Account Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="Min 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* TIER SELECTION (Core Lab 4 Requirement) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Crown className="w-4 h-4 text-amber-500" />
                    Select Your Pay Type / Wallet Tier
                  </label>
                  <span className="text-[11px] font-semibold text-slate-500">Tier controls rates & monthly caps</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {tierPlans.map((plan) => {
                    const isSelected = selectedTier === plan.id;
                    return (
                      <div
                        key={plan.id}
                        onClick={() => setSelectedTier(plan.id)}
                        className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                          isSelected ? plan.activeColor : 'border-slate-200 bg-slate-50/50 hover:border-slate-300'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-extrabold text-slate-900 text-sm">{plan.name}</span>
                            {isSelected ? (
                              <div className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center">
                                <Check className="w-3 h-3 stroke-[3]" />
                              </div>
                            ) : (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-200 text-slate-700">
                                {plan.badge}
                              </span>
                            )}
                          </div>
                          <span className="text-xs font-extrabold text-emerald-700 block">
                            {plan.multiplier}
                          </span>
                          <span className="text-[11px] font-mono font-semibold text-slate-600 block mt-1">
                            {plan.rates}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-2 leading-tight">
                          {plan.desc}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Starting Balance */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Initial Starting Balance (₹)
                </label>
                <div className="flex items-center gap-2">
                  {[500, 1000, 2000, 5000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setInitialBalance(amt)}
                      className={`flex-1 py-2 rounded-xl text-xs font-extrabold transition-all border ${
                        initialBalance === amt
                          ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      ₹{amt}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-extrabold text-sm shadow-lg shadow-emerald-600/25 transition-all flex items-center justify-center gap-2"
              >
                {loading ? 'Creating Wallet...' : `Activate Wallet as ${selectedTier} Student`}
                <ArrowRight className="w-4 h-4" />
              </button>

            </form>
          ) : (
            /* LOGIN MODE */
            <div className="space-y-6">
              
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="email"
                      required
                      placeholder="student@campus.edu"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="password"
                      required
                      placeholder="Enter password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 px-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-sm shadow-md transition-all flex items-center justify-center gap-2"
                >
                  {loading ? 'Authenticating...' : 'Sign In to FinPay'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              {/* Fast 1-Click Demo Accounts */}
              <div className="pt-4 border-t border-slate-100">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2 text-center">
                  Or Test Instantly With Preloaded Tier Personas:
                </span>
                <div className="space-y-2">
                  {DEMO_PERSONAS.map((p) => (
                    <button
                      key={p.email}
                      type="button"
                      onClick={() => handleDemoLogin(p.email)}
                      disabled={loading}
                      className="w-full p-2.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50/80 hover:bg-slate-100 transition-all flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2 text-left">
                        <div className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-[11px]">
                          {p.name[0]}
                        </div>
                        <div>
                          <span className="font-extrabold text-slate-900">{p.name}</span>
                          <span className="text-slate-400 text-[10px] ml-1.5">{p.email}</span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-800">
                        {p.tier} ({p.badge.split(' ')[0]})
                      </span>
                    </button>
                  ))}
                </div>
              </div>

            </div>
          )}

        </div>

      </div>

    </div>
  );
};

