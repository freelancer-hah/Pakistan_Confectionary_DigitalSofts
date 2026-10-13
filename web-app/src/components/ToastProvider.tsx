'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { 
  CheckCircle2, 
  AlertCircle, 
  ShoppingCart, 
  Info, 
  X, 
  Package,
  PackageCheck,
  Sparkles
} from 'lucide-react';

export type ToastType = 'success' | 'error' | 'cart' | 'info';

export interface ToastMessage {
  id: string;
  title: string;
  urduTitle?: string;
  message?: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (type: ToastType, title: string, urduTitle?: string, message?: string) => void;
  toast: {
    success: (title: string, urduTitle?: string, message?: string) => void;
    error: (title: string, urduTitle?: string, message?: string) => void;
    cart: (title: string, urduTitle?: string, message?: string) => void;
    info: (title: string, urduTitle?: string, message?: string) => void;
  };
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (type: ToastType, title: string, urduTitle?: string, message?: string) => {
      const id = `${Date.now()}-${Math.random()}`;
      const newToast: ToastMessage = { id, title, urduTitle, message, type };

      setToasts((prev) => [...prev.slice(-3), newToast]); // Keep maximum 4 active toasts

      setTimeout(() => {
        removeToast(id);
      }, 4000); // 4 seconds duration
    },
    [removeToast]
  );

  const toastHelpers = {
    success: (title: string, urduTitle?: string, message?: string) =>
      showToast('success', title, urduTitle, message),
    error: (title: string, urduTitle?: string, message?: string) =>
      showToast('error', title, urduTitle, message),
    cart: (title: string, urduTitle?: string, message?: string) =>
      showToast('cart', title, urduTitle, message),
    info: (title: string, urduTitle?: string, message?: string) =>
      showToast('info', title, urduTitle, message),
  };

  return (
    <ToastContext.Provider value={{ showToast, toast: toastHelpers }}>
      {children}

      {/* Floating Toast Notification Stack - Bottom Right on Desktop, Top Center on Mobile */}
      <div 
        aria-live="polite"
        className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto rounded-2xl p-4 shadow-[0_12px_35px_rgba(0,0,0,0.12)] border flex items-start gap-3 backdrop-blur-md transition-all duration-300 animate-in slide-in-from-bottom-5 fade-in ${
              t.type === 'success'
                ? 'bg-white/95 border-emerald-300 text-slate-900 shadow-emerald-500/10'
                : t.type === 'cart'
                ? 'bg-slate-950 text-white border-amber-400/80 shadow-amber-500/20'
                : t.type === 'error'
                ? 'bg-white/95 border-rose-300 text-slate-900 shadow-rose-500/10'
                : 'bg-white/95 border-slate-300 text-slate-900'
            }`}
          >
            {/* Icon Badge */}
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 font-bold ${
                t.type === 'success'
                  ? 'bg-emerald-100 text-emerald-700'
                  : t.type === 'cart'
                  ? 'bg-amber-400 text-slate-950'
                  : t.type === 'error'
                  ? 'bg-rose-100 text-rose-700'
                  : 'bg-slate-100 text-slate-700'
              }`}
            >
              {t.type === 'success' && <CheckCircle2 className="w-5 h-5" />}
              {t.type === 'cart' && <ShoppingCart className="w-4 h-4 stroke-[2.5]" />}
              {t.type === 'error' && <AlertCircle className="w-5 h-5" />}
              {t.type === 'info' && <Info className="w-5 h-5" />}
            </div>

            {/* Content Text */}
            <div className="flex-1 min-w-0 pt-0.5">
              <div className="flex items-center justify-between gap-2">
                <h4
                  className={`text-xs font-black tracking-tight ${
                    t.type === 'cart' ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  {t.title}
                </h4>
                {t.urduTitle && (
                  <span
                    className={`font-urdu text-[11px] leading-tight font-medium ${
                      t.type === 'cart' ? 'text-amber-300' : 'text-slate-500'
                    }`}
                  >
                    {t.urduTitle}
                  </span>
                )}
              </div>

              {t.message && (
                <p
                  className={`text-[11px] mt-1 line-clamp-2 leading-relaxed ${
                    t.type === 'cart' ? 'text-slate-300' : 'text-slate-600'
                  }`}
                >
                  {t.message}
                </p>
              )}
            </div>

            {/* Close Button */}
            <button
              onClick={() => removeToast(t.id)}
              className={`p-1 rounded-lg transition -mr-1 -mt-1 ${
                t.type === 'cart'
                  ? 'text-slate-400 hover:text-white hover:bg-slate-800'
                  : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
              }`}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
