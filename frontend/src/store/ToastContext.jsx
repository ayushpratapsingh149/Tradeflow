import { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

let toastId = 0;

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = {
    success: (msg, dur) => addToast(msg, 'success', dur),
    error:   (msg, dur) => addToast(msg, 'error', dur),
    info:    (msg, dur) => addToast(msg, 'info', dur),
    warning: (msg, dur) => addToast(msg, 'warning', dur),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
};

const typeStyles = {
  success: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
  error:   'border-red-500/30 bg-red-500/10 text-red-300',
  info:    'border-brand-500/30 bg-brand-500/10 text-brand-300',
  warning: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
};

const typeIcons = {
  success: '✓',
  error:   '✕',
  info:    'ℹ',
  warning: '⚠',
};

const ToastContainer = ({ toasts, onRemove }) => (
  <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
    {toasts.map((t) => (
      <div
        key={t.id}
        onClick={() => onRemove(t.id)}
        className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl
          border text-sm font-medium backdrop-blur-sm shadow-2xl
          animate-slide-up cursor-pointer max-w-sm
          ${typeStyles[t.type]}`}
      >
        <span className="text-base leading-none">{typeIcons[t.type]}</span>
        <span>{t.message}</span>
      </div>
    ))}
  </div>
);

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
};
