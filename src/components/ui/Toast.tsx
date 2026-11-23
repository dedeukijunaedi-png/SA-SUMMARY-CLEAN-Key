import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";
import { CheckCircle, WarningCircle, X, Info } from "@phosphor-icons/react";

export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastOptions {
  duration?: number;
  action?: ToastAction;
}

interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
  action?: ToastAction;
}

interface ConfirmOptions {
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType, options?: ToastOptions) => void;
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const [confirmDialog, setConfirmDialog] = useState<{
    options: ConfirmOptions;
    resolve: (val: boolean) => void;
  } | null>(null);

  useEffect(() => {
    return () => {
      timersRef.current.forEach((timer) => clearTimeout(timer));
      timersRef.current.clear();
    };
  }, []);

  const dismissToast = useCallback((id: string) => {
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = "info", options?: ToastOptions) => {
      const id = Math.random().toString(36).slice(2);
      const duration = options?.duration ?? 3200;
      setToasts((prev) => [...prev, { id, message, type, action: options?.action }]);
      const timer = setTimeout(() => {
        timersRef.current.delete(id);
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
      timersRef.current.set(id, timer);
    },
    [],
  );

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setConfirmDialog({ options, resolve });
    });
  }, []);

  const handleConfirm = (confirmed: boolean) => {
    if (confirmDialog) {
      confirmDialog.resolve(confirmed);
      setConfirmDialog(null);
    }
  };

  return (
    <ToastContext.Provider value={{ showToast, confirm }}>
      {children}

      <div className="fixed top-[calc(1rem+env(safe-area-inset-top,0px))] left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 w-full max-w-sm px-4 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-center gap-2.5 pl-4 pr-2 py-2 rounded-xl shadow-lg border text-sm font-medium transition-all transform animate-in fade-in slide-in-from-top-2 duration-200 ${
              t.type === "success"
                ? "bg-white dark:bg-[#161722] text-[#16A34A] dark:text-[#22C55E] border-slate-200 dark:border-[#282A3A]"
                : t.type === "error"
                ? "bg-white dark:bg-[#161722] text-[#DC2626] dark:text-[#EF4444] border-slate-200 dark:border-[#282A3A]"
                : t.type === "warning"
                ? "bg-white dark:bg-[#161722] text-[#D97706] dark:text-[#FBBF24] border-slate-200 dark:border-[#282A3A]"
                : "bg-white dark:bg-[#161722] text-[#00A3A6] dark:text-[#38D9D9] border-[#00A3A6]/30"
            }`}
          >
            {t.type === "success" && <CheckCircle size={20} weight="fill" className="shrink-0 text-[#16A34A] dark:text-[#22C55E]" />}
            {t.type === "error" && <WarningCircle size={20} weight="fill" className="shrink-0 text-[#DC2626] dark:text-[#EF4444]" />}
            {t.type === "warning" && <WarningCircle size={20} weight="fill" className="shrink-0 text-[#D97706] dark:text-[#FBBF24]" />}
            {t.type === "info" && <Info size={20} weight="fill" className="shrink-0 text-[#00A3A6] dark:text-[#38D9D9]" />}
            <span className="flex-1 text-slate-800 dark:text-slate-100">{t.message}</span>
            {t.action && (
              <button
                type="button"
                data-testid="toast-action"
                onClick={() => {
                  const act = t.action;
                  dismissToast(t.id);
                  act?.onClick();
                }}
                className="min-h-[44px] px-3 rounded-lg text-xs font-black uppercase tracking-wider text-[#00A3A6] dark:text-[#38D9D9] hover:bg-[#00A3A6]/10 active:scale-95 transition-all cursor-pointer shrink-0 flex items-center justify-center"
              >
                {t.action.label}
              </button>
            )}
            <button
              type="button"
              onClick={() => dismissToast(t.id)}
              aria-label="Tutup notifikasi"
              className="min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer shrink-0"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>

      {confirmDialog && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
        >
          <div className="bg-white dark:bg-[#161722] border border-slate-200 dark:border-[#282A3A] rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {confirmDialog.options.title}
            </h3>
            {confirmDialog.options.message && (
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                {confirmDialog.options.message}
              </p>
            )}
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => handleConfirm(false)}
                className="min-h-[44px] px-4 py-2 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-[#1E202B] hover:bg-slate-200 dark:hover:bg-[#282A3A] transition-colors cursor-pointer"
              >
                {confirmDialog.options.cancelText ?? "Batal"}
              </button>
              <button
                type="button"
                onClick={() => handleConfirm(true)}
                className={`min-h-[44px] px-4 py-2 rounded-xl text-sm font-bold shadow-sm transition-colors cursor-pointer ${
                  confirmDialog.options.destructive
                    ? "bg-[#DC2626] hover:bg-[#b91c1c] text-white"
                    : "bg-[#00A3A6] hover:bg-[#008F91] text-white font-extrabold"
                }`}
              >
                {confirmDialog.options.confirmText ?? "Ya, Lanjutkan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
};

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
