import { useState, useEffect, useCallback } from 'react';
import { Navbar } from './shared/Navbar';
import { useAuthViewModel } from './modules/auth/presentation/useAuthViewModel';
import { AuthModal } from './modules/auth/presentation/AuthModal';
import { useWalletViewModel } from './modules/wallet/presentation/useWalletViewModel';
import { useLedgerViewModel } from './modules/wallet/presentation/useLedgerViewModel';
import { VirtualCard } from './modules/wallet/presentation/VirtualCard';
import { TopUpModal } from './modules/wallet/presentation/TopUpModal';
import { LedgerTable } from './modules/wallet/presentation/LedgerTable';
import { usePaymentViewModel } from './modules/payment/presentation/usePaymentViewModel';
import { CheckoutSimulator } from './modules/payment/presentation/CheckoutSimulator';
import { OrdersHistory } from './modules/payment/presentation/OrdersHistory';
import { defaultHttpClient } from './core/http/HttpClient';
import { ShoppingCart, FileText, Package } from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = useState<'checkout' | 'ledger' | 'orders'>('checkout');
  const [isTopUpOpen, setIsTopUpOpen] = useState<boolean>(false);
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [gatewayConnected, setGatewayConnected] = useState<boolean>(false);

  // Modular View Models
  const authVM = useAuthViewModel();
  const walletVM = useWalletViewModel();
  const ledgerVM = useLedgerViewModel();

  const handleSagaSuccess = useCallback(() => {
    walletVM.fetchWallet();
    ledgerVM.fetchTransactions();
  }, [walletVM, ledgerVM]);

  const paymentVM = usePaymentViewModel(handleSagaSuccess);

  // Ping API Gateway health
  const checkGateway = useCallback(async () => {
    try {
      const res = await defaultHttpClient.get<{ service: string; status: string }>('/');
      setGatewayConnected(res.status === 'Healthy');
    } catch {
      setGatewayConnected(false);
    }
  }, []);

  useEffect(() => {
    checkGateway();
    const interval = setInterval(checkGateway, 15000);
    return () => clearInterval(interval);
  }, [checkGateway]);

  // Load user data upon authentication
  useEffect(() => {
    if (authVM.isAuthenticated) {
      walletVM.fetchWallet();
      ledgerVM.fetchTransactions();
      paymentVM.fetchOrders();
    } else if (!authVM.loading && !authVM.user) {
      setIsAuthOpen(true);
    }
  }, [authVM.isAuthenticated, authVM.loading]);

  const handleRefreshAll = () => {
    walletVM.fetchWallet();
    ledgerVM.fetchTransactions();
    paymentVM.fetchOrders();
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950">
      {/* Header */}
      <Navbar
        user={authVM.user}
        gatewayConnected={gatewayConnected}
        onLogout={authVM.logout}
        onOpenAuth={() => setIsAuthOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Virtual Card & Quick Top-Up */}
        <section>
          <VirtualCard
            wallet={walletVM.wallet}
            cardholderName={authVM.user?.fullName}
            loading={walletVM.loading}
            onTopUp={() => setIsTopUpOpen(true)}
            onRefresh={walletVM.fetchWallet}
          />
        </section>

        {/* Feature Tabs */}
        <section className="space-y-6">
          <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
            <button
              onClick={() => setActiveTab('checkout')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === 'checkout'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'bg-slate-900/60 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <ShoppingCart className="h-4 w-4" />
              <span>Checkout Simulator (Saga)</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('ledger');
                ledgerVM.fetchTransactions();
              }}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === 'ledger'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'bg-slate-900/60 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <FileText className="h-4 w-4" />
              <span>Double-Entry Ledger</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('orders');
                paymentVM.fetchOrders();
              }}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === 'orders'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'bg-slate-900/60 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <Package className="h-4 w-4" />
              <span>Orders History</span>
            </button>
          </div>

          {/* Tab Views */}
          <div>
            {activeTab === 'checkout' && (
              <CheckoutSimulator onOrderCompleted={handleRefreshAll} />
            )}

            {activeTab === 'ledger' && (
              <LedgerTable
                transactions={ledgerVM.transactions}
                loading={ledgerVM.loading}
              />
            )}

            {activeTab === 'orders' && (
              <OrdersHistory
                orders={paymentVM.orders}
                loading={paymentVM.loading}
              />
            )}
          </div>
        </section>
      </main>

      {/* Modals */}
      <TopUpModal
        isOpen={isTopUpOpen}
        onClose={() => setIsTopUpOpen(false)}
        onSuccess={handleRefreshAll}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={handleRefreshAll}
      />

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-6 mt-12 bg-slate-950/40 text-center text-xs text-slate-500">
        <p>Nexpay Microservices Ecosystem • .NET 10 • Clean Architecture • MassTransit Saga • SQL Server</p>
      </footer>
    </div>
  );
}

export default App;
