import React, { createContext, useContext, useState, ReactNode } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue>({
  showToast: () => {},
});

export const useToast = () => useContext(ToastContext);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = (message: string, type: ToastType = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast container */}
      <div className="fixed bottom-20 md:bottom-6 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-2">
        {toasts.map((toast) => {
          let bg = 'bg-[#15191F] border-[#2A3444] text-white';
          let icon = <Info className="w-4 h-4 text-[#FF6B2C] shrink-0" />;

          if (toast.type === 'success') {
            bg = 'bg-[#15191F] border-[#B7F56A]/40 text-[#F5F6F8]';
            icon = <CheckCircle2 className="w-4 h-4 text-[#B7F56A] shrink-0" />;
          } else if (toast.type === 'error') {
            bg = 'bg-[#15191F] border-red-500/40 text-[#F5F6F8]';
            icon = <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />;
          } else if (toast.type === 'warning') {
            bg = 'bg-[#15191F] border-yellow-500/40 text-[#F5F6F8]';
            icon = <AlertCircle className="w-4 h-4 text-yellow-400 shrink-0" />;
          }

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-center justify-between gap-3 p-3.5 rounded-xl border shadow-2xl backdrop-blur-md transition-all transform translate-y-0 opacity-100 ${bg}`}
            >
              <div className="flex items-center gap-2.5 text-xs font-medium">
                {icon}
                <span>{toast.message}</span>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-[#9299A5] hover:text-white p-1 rounded transition"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};
