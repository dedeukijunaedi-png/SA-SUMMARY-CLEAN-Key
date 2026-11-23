import React from "react";
import { CaretLeft, Moon, Sun, Star } from "@phosphor-icons/react";
import { useAppTheme } from "@/src/lib/theme";

interface HeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  showThemeToggle?: boolean;
  className?: string;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  onBack,
  showThemeToggle = true,
  className = "",
}) => {
  const { activeTheme, setTheme } = useAppTheme();

  return (
    <header
      className={`sticky top-0 z-30 bg-white/90 dark:bg-[#111116]/90 backdrop-blur-md border-b border-slate-200 dark:border-[#242533] px-4 pb-2.5 pt-[calc(0.625rem+env(safe-area-inset-top,0px))] flex items-center justify-between transition-colors ${className}`}
    >
      <div className="flex items-center gap-2.5">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="min-w-[44px] min-h-[44px] -ml-2 rounded-xl flex items-center justify-center hover:bg-slate-100 dark:hover:bg-[#1E202B] text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
            aria-label="Kembali"
          >
            <CaretLeft size={22} weight="bold" />
          </button>
        ) : (
          <div className="flex items-center gap-2 shrink-0">
            <img
              src="/rockstar-logo-trimmed.png"
              alt="Rockstar Academy"
              className="h-8 w-auto object-contain max-w-[120px]"
              onError={(e) => {
                (e.currentTarget as HTMLElement).style.display = 'none';
              }}
            />
          </div>
        )}

        <div>
          <div className="flex items-center gap-1.5">
            <h1 className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
              {title}
            </h1>
            {!onBack && (
              <span className="text-[9px] font-black tracking-wider uppercase px-1.5 py-0.5 rounded bg-[#00A3A6]/15 text-[#00A3A6] dark:bg-[#00A3A6]/25 dark:text-[#38D9D9] border border-[#00A3A6]/30">
                ACADEMY
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-tight mt-0.5 truncate max-w-[220px]">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        {showThemeToggle && (
          <button
            type="button"
            onClick={() => setTheme(activeTheme === "dark" ? "light" : "dark")}
            className="min-w-[44px] min-h-[44px] rounded-xl flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1E202B] transition-colors cursor-pointer"
            title={activeTheme === "dark" ? "Beralih ke tema terang" : "Beralih ke tema gelap"}
          >
            {activeTheme === "dark" ? (
              <Sun size={19} weight="fill" className="text-[#38D9D9]" />
            ) : (
              <Moon size={19} weight="fill" className="text-slate-700" />
            )}
          </button>
        )}
      </div>
    </header>
  );
};
