import React from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  icon,
  className = '',
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-bold rounded-xl transition cursor-pointer select-none disabled:opacity-50 disabled:cursor-not-allowed';

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs space-x-1.5',
    md: 'px-4 py-2.5 text-xs sm:text-sm space-x-2',
    lg: 'px-6 py-3 text-sm sm:text-base space-x-2.5',
  };

  const variantStyles = {
    primary: 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20 active:scale-[0.98]',
    secondary: 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 active:scale-[0.98]',
    outline: 'border border-slate-700 hover:border-emerald-500/50 text-slate-300 hover:text-white bg-transparent active:scale-[0.98]',
    danger: 'bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 border border-rose-500/30 active:scale-[0.98]',
    ghost: 'hover:bg-slate-800/80 text-slate-400 hover:text-white',
  };

  return (
    <button
      disabled={disabled || loading}
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : icon}
      <span>{children}</span>
    </button>
  );
};

