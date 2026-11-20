import React from "react";
import { SalesStatus } from "@/src/types";

export const ProgressBar: React.FC<{
  value: number | null;
  className?: string;
  accent?: boolean;
  barClassName?: string;
}> = ({
  value,
  className = "",
  accent = false,
  barClassName = "",
}) => {
  const clamp = Math.max(0, Math.min(100, value ?? 0));
  return (
    <div className={`w-full h-2 bg-slate-100 dark:bg-[#1E202B] rounded-full overflow-hidden ${className}`}>
      <div
        className={`h-full rounded-full transition-all duration-300 ${
          barClassName
            ? barClassName
            : accent
            ? "bg-[#FF6B35]"
            : "bg-[#00A3A6] shadow-xs shadow-[#00A3A6]/20"
        }`}
        style={{ width: `${clamp}%` }}
      />
    </div>
  );
};

export const StatusPill: React.FC<{ status: SalesStatus; className?: string }> = ({
  status,
  className = "",
}) => {
  if (status === "Actual") {
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 ${className}`}
      >
        Actual · 100%
      </span>
    );
  }
  if (status === "Delay") {
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-800 ${className}`}
      >
        Delay · 50%
      </span>
    );
  }
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-800 ${className}`}
    >
      Decom · 0%
    </span>
  );
};

export const StatCard: React.FC<{
  label: string;
  value: string;
  sub?: string;
  progress?: number | null;
  accent?: boolean;
  testID?: string;
  className?: string;
}> = ({ label, value, sub, progress, accent, testID, className = "" }) => {
  return (
    <div
      data-testid={testID}
      className={`bg-white dark:bg-[#161722] rounded-2xl border border-slate-200 dark:border-[#282A3A] p-4 flex flex-col justify-between shadow-xs transition-all hover:border-[#00A3A6]/40 ${className}`}
    >
      <div>
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>
        <p
          className={`text-lg font-black mt-1 tracking-tight ${
            accent ? "text-[#00A3A6] dark:text-[#38D9D9]" : "text-slate-900 dark:text-white"
          }`}
        >
          {value}
        </p>
      </div>
      {(sub || progress != null) && (
        <div className="mt-3">
          {progress != null && <ProgressBar value={progress} className="mb-1.5" />}
          {sub && <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{sub}</p>}
        </div>
      )}
    </div>
  );
};

export const SectionTitle: React.FC<{
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}> = ({ children, className = "", action }) => {
  return (
    <div className={`flex items-center justify-between mb-2 mt-4 px-1 ${className}`}>
      <h3 className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-[#00A3A6] inline-block" />
        {children}
      </h3>
      {action && <div>{action}</div>}
    </div>
  );
};

export const KeyValue: React.FC<{
  label: string;
  value: string | number;
  valueColor?: string;
  className?: string;
}> = ({ label, value, valueColor, className = "" }) => {
  return (
    <div
      className={`flex items-center justify-between py-2 border-b border-slate-100 dark:border-[#282A3A] last:border-b-0 text-sm ${className}`}
    >
      <span className="text-slate-500 dark:text-slate-400 font-medium">{label}</span>
      <span
        className={`font-bold ${
          valueColor ? "" : "text-slate-900 dark:text-white"
        }`}
        style={valueColor ? { color: valueColor } : undefined}
      >
        {value}
      </span>
    </div>
  );
};

export const EmptyState: React.FC<{
  title: string;
  message?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}> = ({ title, message, icon, action, className = "" }) => {
  return (
    <div
      className={`flex flex-col items-center justify-center py-12 px-4 text-center rounded-2xl bg-white/50 dark:bg-[#161722]/50 border border-dashed border-slate-200 dark:border-[#282A3A] ${className}`}
    >
      {icon && <div className="mb-3 text-[#00A3A6] dark:text-[#38D9D9]">{icon}</div>}
      <h4 className="text-base font-bold text-slate-900 dark:text-white">{title}</h4>
      {message && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs">{message}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
};
