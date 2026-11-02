import { useState, useEffect, useCallback } from 'react';
import { Navbar } from './shared/Navbar';
import { useAuthViewModel } from './modules/auth/presentation/useAuthViewModel';
import { AuthModal } from './modules/auth/presentation/AuthModal';
import { useWalletViewModel } from './modules/wallet/presentation/useWalletViewModel';
import { useLedgerViewModel } from './modules/wallet/presentation/useLedgerViewModel';
import { VirtualCard } from './modules/wallet/presentation/VirtualCard';
import { TopUpModal } from './modules/wallet/presentation/TopUpModal';
import { WithdrawModal } from './modules/wallet/presentation/WithdrawModal';
import { TransferModal } from './modules/wallet/presentation/TransferModal';
import { MyQrCodeModal } from './modules/wallet/presentation/MyQrCodeModal';
import { LedgerTable } from './modules/wallet/presentation/LedgerTable';
import { usePaymentViewModel } from './modules/payment/presentation/usePaymentViewModel';
import { CheckoutSimulator } from './modules/payment/presentation/CheckoutSimulator';
import { OrdersHistory } from './modules/payment/presentation/OrdersHistory';
import { ArchitectureTopology } from './shared/ArchitectureTopology';
import { useNotificationViewModel } from './modules/notification/presentation/useNotificationViewModel';
import { ToastNotification } from './modules/notification/presentation/ToastNotification';
import { signalRNotificationService } from './core/realtime/SignalRNotificationService';
import { defaultHttpClient } from './core/http/HttpClient';
import { CurrencyFormatter } from './core/utils/formatters';
import {
  ShoppingCart,
  FileText,
  Package,
  Network,
  Wallet as WalletIcon,
  RefreshCw,
  ShieldCheck,
  Radio,
} from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = useState<'checkout' | 'ledger' | 'orders' | 'architecture'>('checkout');
  const [isTopUpOpen, setIsTopUpOpen] = useState<boolean>(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState<boolean>(false);
  const [isTransferOpen, setIsTransferOpen] = useState<boolean>(false);
  const [isQrOpen, setIsQrOpen] = useState<boolean>(false);
  const [qrTransferData, setQrTransferData] = useState<{ recipientEmail?: string; amount?: number } | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [gatewayConnected, setGatewayConnected] = useState<boolean>(false);

  // Modular Clean Architecture View Models
  const authVM = useAuthViewModel();
  const walletVM = useWalletViewModel();
  const ledgerVM = useLedgerViewModel();

  const handleSagaSuccess = useCallback(() => {
    walletVM.fetchWallet();
    ledgerVM.fetchTransactions();
  }, [walletVM, ledgerVM]);

  const paymentVM = usePaymentViewModel(handleSagaSuccess);

  // Real-Time Notification & Balance Synchronization (Zero-Polling)
  const handleRealTimeBalanceUpdate = useCallback(() => {
    walletVM.fetchWallet();
    ledgerVM.fetchTransactions();
  }, [walletVM, ledgerVM]);

  const notificationVM = useNotificationViewModel(handleRealTimeBalanceUpdate);

  // Check for QR deep link (?transferTo=...&amount=...)
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const transferTo = params.get('transferTo');
      const amountStr = params.get('amount');
      if (transferTo) {
        setQrTransferData({
          recipientEmail: transferTo,
          amount: amountStr ? parseInt(amountStr) : undefined,
        });
        setIsTransferOpen(true);
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    } catch {
      // Ignore
    }
  }, []);

  // Ping API Gateway health (YARP :5000)
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

  // Load user data upon authentication & connect to SignalR WebSockets Hub
  useEffect(() => {
    if (authVM.isAuthenticated && authVM.user) {
      walletVM.fetchWallet();
      ledgerVM.fetchTransactions();
      paymentVM.fetchOrders();
      signalRNotificationService.startConnection('', authVM.user.id);
    } else if (!authVM.isAuthenticated) {
      signalRNotificationService.stopConnection();
      if (!authVM.loading && !authVM.user) {
        setIsAuthOpen(true);
      }
    }
  }, [authVM.isAuthenticated, authVM.user, authVM.loading]);

  const handleRefreshAll = () => {
    walletVM.fetchWallet();
    ledgerVM.fetchTransactions();
    paymentVM.fetchOrders();
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950 relative overflow-x-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-gradient-to-b from-emerald-500/10 via-teal-500/5 to-transparent blur-3xl pointer-events-none -z-10" />

      {/* Floating Real-Time Toast Notification */}
      <ToastNotification
        notification={notificationVM.activeToast}
        onDismiss={notificationVM.dismissToast}
      />

      {/* Header with Real-Time Notification Bell */}
      <Navbar
        user={authVM.user}
        gatewayConnected={gatewayConnected}
        unreadCount={notificationVM.unreadCount}
        notifications={notificationVM.notifications}
        onMarkAsRead={notificationVM.markAsRead}
        onMarkAllAsRead={notificationVM.markAllAsRead}
        onClearNotifications={notificationVM.clearNotifications}
        onLogout={authVM.logout}
        onOpenAuth={() => setIsAuthOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Quick Stats & Welcome Banner */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Balance */}
          <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 flex items-center justify-between shadow-lg">
            <div>
              <div className="flex items-center space-x-1.5 text-xs text-slate-400 font-semibold mb-1">
                <span>Total Balance</span>
                <button
                  onClick={handleRefreshAll}
                  disabled={walletVM.loading}
                  className="text-slate-500 hover:text-emerald-400 transition cursor-pointer"
                  title="Refresh Balance"
                >
                  <RefreshCw className={`h-3 w-3 ${walletVM.loading ? 'animate-spin' : ''}`} />
                </button>
              </div>
              <p className="text-xl sm:text-2xl font-black text-white font-mono">
                {CurrencyFormatter.formatVND(walletVM.wallet?.balance)}
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400">
              <WalletIcon className="h-6 w-6" />
            </div>
          </div>

          {/* Card 2: Transactions */}
          <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 flex items-center justify-between shadow-lg">
            <div>
              <span className="text-xs text-slate-400 font-semibold mb-1 block">Ledger Records</span>
              <p className="text-xl sm:text-2xl font-black text-white font-mono">
                {ledgerVM.transactions.length}
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-teal-500/10 text-teal-400">
              <FileText className="h-6 w-6" />
            </div>
          </div>

          {/* Card 3: Orders Placed */}
          <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 flex items-center justify-between shadow-lg">
            <div>
              <span className="text-xs text-slate-400 font-semibold mb-1 block">Saga Orders</span>
              <p className="text-xl sm:text-2xl font-black text-white font-mono">
                {paymentVM.orders.length}
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-400">
              <Package className="h-6 w-6" />
            </div>
          </div>

          {/* Card 4: SignalR & Architecture Status */}
          <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 flex items-center justify-between shadow-lg">
            <div>
              <div className="flex items-center space-x-1.5 text-xs text-slate-400 font-semibold mb-1">
                <Radio className="h-3.5 w-3.5 text-emerald-400 animate-pulse" />
                <span>SignalR WebSockets</span>
              </div>
              <p className="text-sm font-black text-emerald-400 flex items-center space-x-1.5 mt-1">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                <span>Live Event Stream Active</span>
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400">
              <ShieldCheck className="h-6 w-6" />
            </div>
          </div>
        </section>

        {/* Digital Virtual Card & Quick Top-Up */}
        <section>
          <VirtualCard
            wallet={walletVM.wallet}
            cardholderName={authVM.user?.fullName}
            loading={walletVM.loading}
            onTopUp={() => setIsTopUpOpen(true)}
            onWithdraw={() => setIsWithdrawOpen(true)}
            onTransfer={() => setIsTransferOpen(true)}
            onShowQr={() => setIsQrOpen(true)}
            onRefresh={walletVM.fetchWallet}
          />
        </section>

        {/* Feature Tabs Navigation */}
        <section className="space-y-6">
          <div className="flex items-center space-x-2 border-b border-slate-800/90 pb-3 overflow-x-auto scrollbar-thin">
            <button
              onClick={() => setActiveTab('checkout')}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                activeTab === 'checkout'
                  ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/25'
                  : 'bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <ShoppingCart className="h-4 w-4" />
              <span>E-Commerce & Saga Simulator</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('ledger');
                ledgerVM.fetchTransactions();
              }}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                activeTab === 'ledger'
                  ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/25'
                  : 'bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <FileText className="h-4 w-4" />
              <span>Double-Entry Ledger</span>
              {ledgerVM.transactions.length > 0 && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-black ${
                  activeTab === 'ledger' ? 'bg-slate-950 text-emerald-400' : 'bg-slate-800 text-slate-300'
                }`}>
                  {ledgerVM.transactions.length}
                </span>
              )}
            </button>

            <button
              onClick={() => {
                setActiveTab('orders');
                paymentVM.fetchOrders();
              }}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                activeTab === 'orders'
                  ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/25'
                  : 'bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <Package className="h-4 w-4" />
              <span>Order Tracking</span>
              {paymentVM.orders.length > 0 && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-black ${
                  activeTab === 'orders' ? 'bg-slate-950 text-emerald-400' : 'bg-slate-800 text-slate-300'
                }`}>
                  {paymentVM.orders.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('architecture')}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                activeTab === 'architecture'
                  ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/25'
                  : 'bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <Network className="h-4 w-4" />
              <span>Microservices Architecture</span>
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

            {activeTab === 'architecture' && <ArchitectureTopology />}
          </div>
        </section>
      </main>

      {/* Modals */}
      <TopUpModal
        isOpen={isTopUpOpen}
        onClose={() => setIsTopUpOpen(false)}
        onSuccess={handleRefreshAll}
      />

      <WithdrawModal
        isOpen={isWithdrawOpen}
        onClose={() => setIsWithdrawOpen(false)}
        currentBalance={walletVM.wallet?.balance}
        onSuccess={handleRefreshAll}
      />

      <TransferModal
        isOpen={isTransferOpen}
        onClose={() => {
          setIsTransferOpen(false);
          setQrTransferData(null);
        }}
        currentUserId={authVM.user?.id}
        currentBalance={walletVM.wallet?.balance}
        initialRecipient={
          qrTransferData?.recipientEmail
            ? { id: '', fullName: qrTransferData.recipientEmail, email: qrTransferData.recipientEmail }
            : undefined
        }
        initialAmount={qrTransferData?.amount}
        onSuccess={handleRefreshAll}
      />

      <MyQrCodeModal
        isOpen={isQrOpen}
        onClose={() => setIsQrOpen(false)}
        user={authVM.user}
        walletId={walletVM.wallet?.id}
        onOpenAuth={() => setIsAuthOpen(true)}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={handleRefreshAll}
      />

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-8 mt-16 bg-slate-950/60 text-center text-xs text-slate-500 space-y-1">
        <p className="font-semibold text-slate-400">
          Nexpay Enterprise Microservices Ecosystem • .NET 10 • Clean Architecture • SignalR Real-Time
        </p>
        <p className="text-[11px] text-slate-500">
          Identity (5248) • Wallet (5249) • Payment (5251) • Notification (5250) • Gateway (5000) • RabbitMQ (15672) • Seq (5341)
        </p>
      </footer>
    </div>
  );
}

export default App;
