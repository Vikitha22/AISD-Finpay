import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { AuthScreen } from './components/AuthScreen.js';
import { Navbar } from './components/Navbar.js';
import { BalanceCard } from './components/BalanceCard.js';
import { CategoryCapProgress } from './components/CategoryCapProgress.js';
import { TransactionHistory } from './components/TransactionHistory.js';
import { QuickPayModal } from './components/QuickPayModal.js';
import { TopUpModal } from './components/TopUpModal.js';
import { CashbackSimulator } from './components/CashbackSimulator.js';
import { MerchantTerminal } from './components/MerchantTerminal.js';
import { ReconciliationDashboard } from './components/ReconciliationDashboard.js';
import { IdempotencyLab } from './components/IdempotencyLab.js';

function DashboardContent() {
  const { student, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<'wallet' | 'simulator' | 'merchant' | 'reconciliation' | 'idempotency'>('wallet');
  const [isPayOpen, setIsPayOpen] = useState(false);
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [preselectedMerchantId, setPreselectedMerchantId] = useState<string | undefined>(undefined);
  const [refreshKey, setRefreshKey] = useState(0);

  const triggerRefresh = () => {
    setRefreshKey((k) => k + 1);
  };

  const handleOpenMerchantPay = (merchantId: string) => {
    setPreselectedMerchantId(merchantId);
    setIsPayOpen(true);
  };

  // If loading session, show clean loading skeleton
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto animate-pulse">
            <span className="font-extrabold text-xl">₹</span>
          </div>
          <p className="text-sm font-bold text-slate-400">Loading FinPay Wallet...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, show Create Account / Sign In screen first
  if (!student) {
    return <AuthScreen />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {activeTab === 'wallet' && (
          <div className="space-y-8 animate-fadeIn">
            {/* Top row: Balance card and quick actions */}
            <BalanceCard 
              onOpenPayModal={() => {
                setPreselectedMerchantId(undefined);
                setIsPayOpen(true);
              }}
              onOpenTopUpModal={() => setIsTopUpOpen(true)}
            />

            {/* Category Cap Progress Bars */}
            <CategoryCapProgress refreshKey={refreshKey} />

            {/* Transaction Ledger */}
            <TransactionHistory refreshKey={refreshKey} />
          </div>
        )}

        {activeTab === 'simulator' && (
          <div className="animate-fadeIn">
            <CashbackSimulator />
          </div>
        )}

        {activeTab === 'merchant' && (
          <div className="animate-fadeIn">
            <MerchantTerminal onTriggerPayment={handleOpenMerchantPay} />
          </div>
        )}

        {activeTab === 'reconciliation' && (
          <div className="animate-fadeIn">
            <ReconciliationDashboard />
          </div>
        )}

        {activeTab === 'idempotency' && (
          <div className="animate-fadeIn">
            <IdempotencyLab />
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/80 bg-white py-6 text-center text-xs text-slate-500 font-medium">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>FinPay Campus Digital Wallet • AISD Laboratory 4 Detailed Design Implementation</span>
          <span>Verified Relational Schema (BCNF) • Pure Algorithm Design • Zero Float Rounding</span>
        </div>
      </footer>

      {/* Modals */}
      <QuickPayModal
        isOpen={isPayOpen}
        onClose={() => setIsPayOpen(false)}
        onPaymentSuccess={triggerRefresh}
        initialMerchantId={preselectedMerchantId}
      />

      <TopUpModal
        isOpen={isTopUpOpen}
        onClose={() => setIsTopUpOpen(false)}
        onSuccess={triggerRefresh}
      />
    </div>
  );
}

export function App() {
  return (
    <AuthProvider>
      <DashboardContent />
    </AuthProvider>
  );
}

export default App;
