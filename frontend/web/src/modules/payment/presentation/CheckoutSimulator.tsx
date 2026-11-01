import React from 'react';
import { ShoppingCart, ArrowRight } from 'lucide-react';
import { CurrencyFormatter } from '../../../core/utils/formatters';
import { Button } from '../../../shared/Button';
import { SagaPipelineTracker } from './SagaPipelineTracker';
import { usePaymentViewModel } from './usePaymentViewModel';

interface CheckoutSimulatorProps {
  onOrderCompleted?: () => void;
}

interface DemoProduct {
  id: string;
  name: string;
  category: string;
  price: number;
  icon: string;
}

const DEMO_PRODUCTS: DemoProduct[] = [
  {
    id: 'prod-1',
    name: 'Apple iPhone 16 Pro Max 256GB',
    category: 'Electronics',
    price: 34990000,
    icon: '📱',
  },
  {
    id: 'prod-2',
    name: 'Sony WH-1000XM5 ANC Headphones',
    category: 'Audio',
    price: 7490000,
    icon: '🎧',
  },
  {
    id: 'prod-3',
    name: 'Mechanical Keyboard Keychron Q1 Max',
    category: 'Accessories',
    price: 4850000,
    icon: '⌨️',
  },
  {
    id: 'prod-4',
    name: 'Highlands Phin Coffee & Lotus Cake',
    category: 'Food & Beverage',
    price: 115000,
    icon: '☕',
  },
  {
    id: 'prod-5',
    name: 'CGV Cinema Gold Class Ticket',
    category: 'Entertainment',
    price: 300000,
    icon: '🍿',
  },
];

export const CheckoutSimulator: React.FC<CheckoutSimulatorProps> = ({ onOrderCompleted }) => {
  const { activeOrder, sagaStep, loading, error, checkout } = usePaymentViewModel(onOrderCompleted);

  const handleCheckout = async (product: DemoProduct) => {
    try {
      await checkout(product.price, `Purchase ${product.name}`);
    } catch {
      // Error handled in hook
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-white flex items-center space-x-2">
          <ShoppingCart className="h-5 w-5 text-emerald-400" />
          <span>E-Commerce Checkout & Saga Simulator</span>
        </h2>
        <p className="text-xs text-slate-400">
          Simulate distributed transactions across Payment and Wallet microservices coordinated via RabbitMQ.
        </p>
      </div>

      {/* Live Saga Tracker Pipeline */}
      {activeOrder && (
        <SagaPipelineTracker
          order={activeOrder}
          sagaStep={sagaStep}
          error={error}
        />
      )}

      {/* Product Catalog Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {DEMO_PRODUCTS.map((prod) => (
          <div
            key={prod.id}
            className="rounded-2xl p-5 bg-slate-900 border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between"
          >
            <div>
              <div className="h-16 w-16 rounded-2xl bg-slate-800/80 flex items-center justify-center text-3xl mb-3 shadow-inner">
                {prod.icon}
              </div>
              <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                {prod.category}
              </span>
              <h3 className="text-sm font-bold text-white mt-2 leading-snug">{prod.name}</h3>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between">
              <div>
                <p className="text-[10px] text-slate-400">Price</p>
                <p className="text-base font-extrabold text-white font-mono">
                  {CurrencyFormatter.formatVND(prod.price)}
                </p>
              </div>

              <Button
                onClick={() => handleCheckout(prod)}
                disabled={loading}
                variant="primary"
                size="sm"
                icon={<ArrowRight className="h-3.5 w-3.5" />}
              >
                Pay via Saga
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
