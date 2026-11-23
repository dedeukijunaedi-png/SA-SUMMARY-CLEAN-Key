import React, { useEffect } from "react";
import { X } from "@phosphor-icons/react";
import { useKeyboardViewport } from "@/src/lib/useKeyboardViewport";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl";
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = "md",
}) => {
  const { isKeyboardOpen, viewportHeight } = useKeyboardViewport();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const widthClass = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
  }[maxWidth];

  const dynamicMaxHeight =
    isKeyboardOpen && viewportHeight
      ? `${Math.max(220, viewportHeight - 16)}px`
      : undefined;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        role="dialog"
        aria-modal="true"
        style={dynamicMaxHeight ? { maxHeight: dynamicMaxHeight } : undefined}
        className={`w-full ${widthClass} bg-white dark:bg-[#1E1E1E] rounded-t-3xl sm:rounded-3xl border border-[#E5E7EB] dark:border-[#2D3748] shadow-2xl flex flex-col max-h-[92dvh] sm:max-h-[85dvh] animate-in slide-in-from-bottom-4 duration-200`}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#F3F4F6] dark:border-[#2D3748] shrink-0">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h3>
            {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="min-w-[44px] min-h-[44px] -mr-2 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#2D2D2D] transition-colors cursor-pointer"
          >
            <X size={20} weight="bold" />
          </button>
        </div>

        <div
          className={`p-6 overflow-y-auto overscroll-contain ${
            isKeyboardOpen
              ? "pb-8"
              : "pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))]"
          }`}
        >
          {children}
        </div>
      </div>
    </div>
  );
};
