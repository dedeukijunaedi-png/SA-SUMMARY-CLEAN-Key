import React from "react";
import { CaretLeft, CaretRight, Plus, Minus, Spinner, Calendar } from "@phosphor-icons/react";
import { monthLabel } from "@/src/lib/date";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  title?: string;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  loading?: boolean;
  icon?: React.ReactNode;
  testID?: string;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  variant = "primary",
  loading = false,
  icon,
  testID,
  children,
  className = "",
  disabled,
  ...props
}) => {
  const base =
    "inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all shadow-xs active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none cursor-pointer";
  const variants = {
    primary:
      "bg-[#00A3A6] hover:bg-[#008F91] text-white font-extrabold shadow-sm shadow-[#00A3A6]/25 dark:bg-[#00A3A6] dark:hover:bg-[#008F91] dark:text-white",
    secondary:
      "bg-slate-100 hover:bg-slate-200 text-slate-900 dark:bg-[#1E202B] dark:hover:bg-[#282A3A] dark:text-white border border-slate-200 dark:border-[#282A3A]",
    ghost:
      "bg-transparent hover:bg-slate-100 dark:hover:bg-[#1E202B] text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-[#282A3A]",
    danger: "bg-[#DC2626] hover:bg-[#b91c1c] text-white",
  };

  return (
    <button
      data-testid={testID}
      disabled={disabled || loading}
      className={`${base} ${variants[variant]} ${className}`}
      {...props}
    >
      {loading ? (
        <Spinner size={18} className="animate-spin text-inherit" />
      ) : (
        icon && <span className="shrink-0">{icon}</span>
      )}
      {title || children}
    </button>
  );
};

export const MonthNavigator: React.FC<{
  year: number;
  month: number;
  onChange: (year: number, month: number) => void;
  className?: string;
}> = ({ year, month, onChange, className = "" }) => {
  const prev = () => {
    if (month === 1) onChange(year - 1, 12);
    else onChange(year, month - 1);
  };
  const next = () => {
    if (month === 12) onChange(year + 1, 1);
    else onChange(year, month + 1);
  };

  return (
    <div
      className={`flex items-center justify-between bg-white dark:bg-[#161722] border border-slate-200 dark:border-[#282A3A] rounded-2xl px-3 py-2 shadow-xs ${className}`}
    >
      <button
        type="button"
        onClick={prev}
        aria-label="Bulan sebelumnya"
        className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-[#1E202B] text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
      >
        <CaretLeft size={18} weight="bold" />
      </button>

      <div className="flex items-center gap-1.5 font-extrabold text-sm text-slate-900 dark:text-white">
        <Calendar size={16} className="text-[#00A3A6] dark:text-[#38D9D9]" weight="fill" />
        <span>{monthLabel(year, month)}</span>
      </div>

      <button
        type="button"
        onClick={next}
        aria-label="Bulan berikutnya"
        className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-[#1E202B] text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
      >
        <CaretRight size={18} weight="bold" />
      </button>
    </div>
  );
};

export const TextField: React.FC<{
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  testID?: string;
  className?: string;
}> = ({ label, value, onChangeText, placeholder, testID, className = "" }) => {
  return (
    <div className={`mb-3.5 ${className}`}>
      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
        {label}
      </label>
      <input
        type="text"
        data-testid={testID}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChangeText(e.target.value)}
        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#282A3A] bg-white dark:bg-[#161722] text-slate-900 dark:text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-[#00A3A6]/40 dark:focus:ring-[#00A3A6]/30 focus:border-[#00A3A6] transition-all placeholder:text-slate-400"
      />
    </div>
  );
};

export const NumberField: React.FC<{
  label: string;
  value: number;
  onChange: (v: number) => void;
  placeholder?: string;
  testID?: string;
  className?: string;
}> = ({ label, value, onChange, placeholder, testID, className = "" }) => {
  return (
    <div className={`mb-3.5 ${className}`}>
      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
        {label}
      </label>
      <input
        type="number"
        data-testid={testID}
        value={value === 0 ? "" : value}
        placeholder={placeholder ?? "0"}
        onChange={(e) => {
          const val = e.target.value === "" ? 0 : parseInt(e.target.value, 10);
          onChange(isNaN(val) ? 0 : val);
        }}
        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#282A3A] bg-white dark:bg-[#161722] text-slate-900 dark:text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-[#00A3A6]/40 dark:focus:ring-[#00A3A6]/30 focus:border-[#00A3A6] transition-all placeholder:text-slate-400"
      />
    </div>
  );
};

export const DateField: React.FC<{
  label: string;
  value: string;
  onChange: (v: string) => void;
  testID?: string;
  className?: string;
}> = ({ label, value, onChange, testID, className = "" }) => {
  return (
    <div className={`mb-3.5 ${className}`}>
      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
        {label}
      </label>
      <input
        type="date"
        data-testid={testID}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#282A3A] bg-white dark:bg-[#161722] text-slate-900 dark:text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-[#00A3A6]/40 dark:focus:ring-[#00A3A6]/30 focus:border-[#00A3A6] transition-all"
      />
    </div>
  );
};

export const TimeField: React.FC<{
  label: string;
  value: string;
  onChange: (v: string) => void;
  testID?: string;
  className?: string;
}> = ({ label, value, onChange, testID, className = "" }) => {
  return (
    <div className={`mb-3.5 ${className}`}>
      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
        {label}
      </label>
      <input
        type="time"
        data-testid={testID}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#282A3A] bg-white dark:bg-[#161722] text-slate-900 dark:text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-[#00A3A6]/40 dark:focus:ring-[#00A3A6]/30 focus:border-[#00A3A6] transition-all"
      />
    </div>
  );
};

export interface SelectOption<T = any> {
  label: string;
  value: T;
  sub?: string;
}

export const SelectField: React.FC<{
  label: string;
  value: any;
  options: SelectOption[];
  onChange: (v: any) => void;
  testID?: string;
  className?: string;
}> = ({ label, value, options, onChange, testID, className = "" }) => {
  return (
    <div className={`mb-3.5 ${className}`}>
      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
        {label}
      </label>
      <select
        data-testid={testID}
        value={value ?? ""}
        onChange={(e) => {
          const raw = e.target.value;
          const parsed = isNaN(Number(raw)) || raw === "" ? raw : Number(raw);
          onChange(parsed);
        }}
        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#282A3A] bg-white dark:bg-[#161722] text-slate-900 dark:text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-[#00A3A6]/40 dark:focus:ring-[#00A3A6]/30 focus:border-[#00A3A6] transition-all cursor-pointer"
      >
        {options.map((opt, i) => (
          <option key={i} value={opt.value}>
            {opt.label} {opt.sub ? `(${opt.sub})` : ""}
          </option>
        ))}
      </select>
    </div>
  );
};

export const Stepper: React.FC<{
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  testID?: string;
  className?: string;
}> = ({ value, onChange, min = 1, max = 999, testID, className = "" }) => {
  return (
    <div
      data-testid={testID}
      className={`inline-flex items-center border border-slate-200 dark:border-[#282A3A] bg-white dark:bg-[#161722] rounded-xl overflow-hidden shadow-2xs ${className}`}
    >
      <button
        type="button"
        disabled={value <= min}
        onClick={() => onChange(Math.max(min, value - 1))}
        className="px-2.5 py-2 hover:bg-slate-100 dark:hover:bg-[#1E202B] text-slate-600 dark:text-slate-300 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
      >
        <Minus size={14} weight="bold" />
      </button>
      <span className="px-3 font-bold text-sm text-slate-900 dark:text-white min-w-[32px] text-center">
        {value}
      </span>
      <button
        type="button"
        disabled={value >= max}
        onClick={() => onChange(Math.min(max, value + 1))}
        className="px-2.5 py-2 hover:bg-slate-100 dark:hover:bg-[#1E202B] text-slate-600 dark:text-slate-300 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
      >
        <Plus size={14} weight="bold" />
      </button>
    </div>
  );
};

export const Switch: React.FC<{
  checked: boolean;
  onChange: (v: boolean) => void;
  testID?: string;
  className?: string;
}> = ({ checked, onChange, testID, className = "" }) => {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      data-testid={testID}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
        checked ? "bg-[#00A3A6]" : "bg-slate-300 dark:bg-slate-700"
      } ${className}`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full ${
          checked ? "bg-white translate-x-5 shadow-xs" : "bg-white translate-x-0 shadow-xs"
        } ring-0 transition duration-200 ease-in-out`}
      />
    </button>
  );
};
