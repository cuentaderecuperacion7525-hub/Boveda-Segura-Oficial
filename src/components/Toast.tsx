import React from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, Lock } from 'lucide-react';

export interface ToastData {
  id: string;
  message: string;
  type: 'info' | 'success' | 'alert' | 'error';
}

interface ToastProps {
  toasts: ToastData[];
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-5 left-1/2 -translate-x-1/2 z-70 flex flex-col gap-2 pointer-events-none w-full max-w-sm px-4">
      {toasts.map((t) => {
        let Icon = Info;
        let colorClass = 'text-indigo-400 border-indigo-500/30';

        if (t.type === 'success') {
          Icon = CheckCircle2;
          colorClass = 'text-emerald-400 border-emerald-500/30';
        } else if (t.type === 'alert') {
          Icon = AlertTriangle;
          colorClass = 'text-amber-400 border-amber-500/30';
        } else if (t.type === 'error') {
          Icon = AlertCircle;
          colorClass = 'text-rose-400 border-rose-500/30';
        }

        return (
          <div
            key={t.id}
            className={`bg-[#131c2e]/95 border ${colorClass} text-slate-100 px-4 py-3 rounded-2xl shadow-2xl backdrop-blur-xl flex items-center gap-3 text-xs font-medium animate-in fade-in slide-in-from-top-3 duration-200`}
          >
            <Icon className="w-4 h-4 shrink-0" />
            <span className="flex-1 leading-snug">{t.message}</span>
          </div>
        );
      })}
    </div>
  );
};
