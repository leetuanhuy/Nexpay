import React, { useState } from 'react';
import { Mail, Lock, User as UserIcon, ArrowRight, Sparkles, AlertCircle } from 'lucide-react';
import { Modal } from '../../../shared/Modal';
import { Button } from '../../../shared/Button';
import { useAuthViewModel } from './useAuthViewModel';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [isRegister, setIsRegister] = useState<boolean>(false);
  const [email, setEmail] = useState<string>('docker.test@nexpay.com');
  const [password, setPassword] = useState<string>('SecurePassword123!');
  const [fullName, setFullName] = useState<string>('Nguyen Tuan Huy');

  const { login, register, loading, error, clearError } = useAuthViewModel();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isRegister) {
        await register({ email, password, fullName });
      } else {
        await login({ email, password });
      }
      onSuccess?.();
      onClose();
    } catch {
      // Error handled in hook
    }
  };

  const handleQuickDemo = () => {
    setEmail('demo.user@nexpay.com');
    setPassword('SecurePassword123!');
    setFullName('Demo FinTech User');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="md">
      {/* Tab Switcher */}
      <div className="flex p-1 bg-slate-800/80 rounded-2xl mb-6">
        <button
          type="button"
          onClick={() => {
            setIsRegister(false);
            clearError();
          }}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
            !isRegister ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          Sign In
        </button>
        <button
          type="button"
          onClick={() => {
            setIsRegister(true);
            clearError();
          }}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
            isRegister ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          Open Digital Wallet
        </button>
      </div>

      {/* Header */}
      <div className="mb-5 text-center">
        <h3 className="text-xl font-bold text-white">
          {isRegister ? 'Create Nexpay Account' : 'Welcome to Nexpay'}
        </h3>
        <p className="text-xs text-slate-400 mt-1">
          {isRegister
            ? 'Publishes RabbitMQ UserRegistered event to auto-provision your digital wallet.'
            : 'Access your double-entry ledger, digital wallet, and Saga checkout.'}
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-3.5">
        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {isRegister && (
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name</label>
            <div className="relative">
              <UserIcon className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Nguyen Tuan Huy"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500 transition"
              />
            </div>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@nexpay.com"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500 transition"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500 transition"
            />
          </div>
        </div>

        <div className="pt-2">
          <Button
            type="submit"
            loading={loading}
            className="w-full"
            icon={<ArrowRight className="h-4 w-4" />}
          >
            {isRegister ? 'Register & Provision Wallet' : 'Sign In to Wallet'}
          </Button>
        </div>
      </form>

      {/* Quick Demo Fill */}
      <div className="mt-5 pt-4 border-t border-slate-800 text-center">
        <button
          type="button"
          onClick={handleQuickDemo}
          className="text-xs text-slate-400 hover:text-emerald-400 flex items-center justify-center space-x-1.5 mx-auto transition cursor-pointer"
        >
          <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
          <span>Use Sample Demo Credentials</span>
        </button>
      </div>
    </Modal>
  );
};
