import React, { useState } from 'react';
import {
  ShoppingCart,
  ArrowRight,
  Star,
  CheckCircle,
  Sparkles,
  Zap,
  Filter,
} from 'lucide-react';
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
  description: string;
  price: number;
  imageUrl: string;
  rating: number;
  reviewsCount: number;
  tag: string;
}

const DEMO_PRODUCTS: DemoProduct[] = [
  {
    id: 'prod-iphone-16',
    name: 'Apple iPhone 16 Pro Max 256GB',
    category: 'Electronics',
    description: 'Grade 5 Titanium design with 48MP Fusion camera system and A18 Pro chip.',
    price: 34990000,
    imageUrl: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=700&q=80',
    rating: 4.9,
    reviewsCount: 1240,
    tag: 'Flagship',
  },
  {
    id: 'prod-sony-wh1000xm5',
    name: 'Sony WH-1000XM5 Noise Canceling',
    category: 'Audio',
    description: 'Industry-leading noise cancellation with 8 microphones & Auto NC Optimizer.',
    price: 7490000,
    imageUrl: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=700&q=80',
    rating: 4.8,
    reviewsCount: 890,
    tag: 'Best Seller',
  },
  {
    id: 'prod-apple-watch-ultra',
    name: 'Apple Watch Ultra 2 GPS + Cellular',
    category: 'Wearables',
    description: 'Rugged 49mm titanium case, precision dual-frequency GPS, up to 72h battery.',
    price: 21490000,
    imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=700&q=80',
    rating: 4.9,
    reviewsCount: 420,
    tag: 'Premium',
  },
  {
    id: 'prod-keychron-q1',
    name: 'Keychron Q1 Max Wireless Mechanical',
    category: 'Accessories',
    description: 'Full aluminum custom mechanical keyboard with double-gasket & QMK/VIA support.',
    price: 4850000,
    imageUrl: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=700&q=80',
    rating: 4.7,
    reviewsCount: 310,
    tag: 'Popular',
  },
  {
    id: 'prod-highlands-combo',
    name: 'Highlands Coffee Phin & Lotus Cake Set',
    category: 'Food & Beverage',
    description: 'Traditional slow-dripped Vietnamese iced milk coffee served with golden lotus pastry.',
    price: 115000,
    imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=700&q=80',
    rating: 4.9,
    reviewsCount: 2450,
    tag: 'Daily Pick',
  },
  {
    id: 'prod-cgv-imax',
    name: 'CGV IMAX Laser VIP Recliner Ticket',
    category: 'Entertainment',
    description: 'Next-generation 4K IMAX Laser projection ticket with plush leather recliner.',
    price: 320000,
    imageUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=700&q=80',
    rating: 5.0,
    reviewsCount: 680,
    tag: 'Instant Pass',
  },
];

export const CheckoutSimulator: React.FC<CheckoutSimulatorProps> = ({ onOrderCompleted }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedProduct, setSelectedProduct] = useState<DemoProduct | null>(null);

  const { activeOrder, sagaStep, loading, error, checkout } = usePaymentViewModel(onOrderCompleted);

  const categories = ['All', 'Electronics', 'Audio', 'Wearables', 'Accessories', 'Food & Beverage', 'Entertainment'];

  const filteredProducts = selectedCategory === 'All'
    ? DEMO_PRODUCTS
    : DEMO_PRODUCTS.filter((p) => p.category === selectedCategory);

  const handleCheckout = async (product: DemoProduct) => {
    setSelectedProduct(product);
    try {
      await checkout(product.price, `Order ${product.name}`);
    } catch {
      // Error handled in hook
    }
  };

  return (
    <div className="space-y-7">
      {/* Header and Explanation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/40 border border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <ShoppingCart className="h-5 w-5" />
            </span>
            <h2 className="text-lg font-bold text-white tracking-tight">
              E-Commerce Store & Saga Choreography
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Simulate real checkout purchases. Orders trigger distributed transactions coordinated between{' '}
            <strong className="text-slate-200">Payment.API</strong> and{' '}
            <strong className="text-slate-200">Wallet.API</strong> via{' '}
            <strong className="text-emerald-400">RabbitMQ</strong> messages.
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs text-slate-400 bg-slate-950/60 px-3.5 py-2 rounded-xl border border-slate-800 shrink-0">
          <Zap className="h-4 w-4 text-emerald-400 animate-pulse" />
          <span>MassTransit Saga Orchestrator</span>
        </div>
      </div>

      {/* Live Saga Tracker Pipeline */}
      {activeOrder && (
        <SagaPipelineTracker
          order={activeOrder}
          sagaStep={sagaStep}
          error={error}
        />
      )}

      {/* Category Filter Bar */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-thin">
        <Filter className="h-4 w-4 text-slate-500 shrink-0" />
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer border ${
              selectedCategory === cat
                ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-sm shadow-emerald-500/20'
                : 'bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white border-slate-800'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Product Catalog Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.map((prod) => {
          const isCurrentItemLoading = loading && selectedProduct?.id === prod.id;

          return (
            <div
              key={prod.id}
              className="group rounded-3xl bg-slate-900/90 border border-slate-800 hover:border-emerald-500/40 hover:shadow-xl hover:shadow-emerald-950/20 transition-all duration-300 flex flex-col justify-between overflow-hidden"
            >
              {/* Product Image with Gradient and Tag */}
              <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-950">
                <img
                  src={prod.imageUrl}
                  alt={prod.name}
                  className="h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-80" />

                {/* Floating Tag */}
                <div className="absolute top-3 left-3 flex items-center space-x-1.5">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-300 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-full border border-emerald-500/30 shadow-md">
                    {prod.tag}
                  </span>
                </div>

                {/* In Stock Badge */}
                <div className="absolute top-3 right-3 flex items-center space-x-1 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] text-slate-300 font-medium border border-slate-700">
                  <CheckCircle className="h-3 w-3 text-emerald-400" />
                  <span>In Stock</span>
                </div>
              </div>

              {/* Product Info */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                    <span className="font-semibold text-emerald-400/90 text-[11px] uppercase tracking-wider">
                      {prod.category}
                    </span>
                    <div className="flex items-center space-x-1 text-amber-400 font-bold text-[11px]">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      <span>{prod.rating}</span>
                      <span className="text-slate-500 font-normal">({prod.reviewsCount})</span>
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-white group-hover:text-emerald-300 transition-colors leading-snug">
                    {prod.name}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
                    {prod.description}
                  </p>
                </div>

                {/* Price and Checkout Button */}
                <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-semibold">Total Price</span>
                    <span className="text-base sm:text-lg font-black text-white font-mono tracking-tight">
                      {CurrencyFormatter.formatVND(prod.price)}
                    </span>
                  </div>

                  <Button
                    onClick={() => handleCheckout(prod)}
                    disabled={loading}
                    variant="primary"
                    size="sm"
                    className="shadow-md shadow-emerald-500/10 cursor-pointer"
                    icon={isCurrentItemLoading ? <Sparkles className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                  >
                    {isCurrentItemLoading ? 'Processing...' : 'Pay with Saga'}
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
