import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className = '', glow = false }) => {
  return (
    <div
      className={`rounded-2xl p-6 bg-slate-900 border border-slate-800 shadow-xl relative overflow-hidden ${
        glow ? 'border-emerald-500/30 shadow-emerald-950/20' : ''
      } ${className}`}
    >
      {glow && (
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
      )}
      <div className="relative z-10">{children}</div>
    </div>
  );
};

