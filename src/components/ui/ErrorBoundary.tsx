import React from "react";
import { ArrowClockwise, DownloadSimple, WarningCircle } from "@phosphor-icons/react";
import { runBackupAndRecord } from "@/src/lib/backupReminder";

interface ErrorBoundaryProps {
  children: React.ReactNode;
  screenName?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
  backingUp: boolean;
  backupFeedback: { ok: boolean; message: string } | null;
}

function truncateErrorMessage(raw: string, maxLen = 160): string {
  const clean = raw.replace(/\s+/g, " ").trim();
  if (!clean) return "Kesalahan tidak diketahui";
  return clean.length > maxLen ? `${clean.slice(0, maxLen - 1)}…` : clean;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    hasError: false,
    errorMessage: "",
    backingUp: false,
    backupFeedback: null,
  };

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      errorMessage: truncateErrorMessage(String(error?.message || error || "")),
      backupFeedback: null,
    };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error(`ErrorBoundary (${this.props.screenName || "Screen"}):`, error, info);
  }

  private handleRetry = () => {
    this.setState({
      hasError: false,
      errorMessage: "",
      backingUp: false,
      backupFeedback: null,
    });
  };

  private handleBackup = async () => {
    if (this.state.backingUp) return;
    this.setState({ backingUp: true, backupFeedback: null });
    try {
      await runBackupAndRecord();
      this.setState({
        backingUp: false,
        backupFeedback: {
          ok: true,
          message: "Backup JSON berhasil dibuat dan tanggal backup tercatat.",
        },
      });
    } catch (err: any) {
      this.setState({
        backingUp: false,
        backupFeedback: {
          ok: false,
          message: `Gagal backup: ${truncateErrorMessage(String(err?.message || err || "tidak diketahui"), 100)}`,
        },
      });
    }
  };

  render(): React.ReactNode {
    if (!this.state.hasError) {
      return this.props.children;
    }

    const { screenName } = this.props;
    const { errorMessage, backingUp, backupFeedback } = this.state;

    return (
      <div
        role="alert"
        data-testid="screen-error-boundary"
        className="min-h-screen bg-[#F8FAFC] dark:bg-[#0A1118] text-slate-900 dark:text-slate-100 flex items-center justify-center px-4 pt-[calc(1.5rem+env(safe-area-inset-top,0px))] pb-[calc(6.5rem+env(safe-area-inset-bottom,0px))]"
      >
        <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[#161722] border border-slate-200 dark:border-[#282A3A] p-5 shadow-sm flex flex-col gap-3.5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
              <WarningCircle size={22} weight="fill" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-sm font-extrabold text-slate-900 dark:text-white leading-snug">
                {screenName ? `Layar ${screenName} bermasalah` : "Terjadi gangguan pada layar ini"}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Tampilan gagal dimuat, namun data Anda tetap tersimpan. Silakan coba lagi atau buat backup data.
              </p>
            </div>
          </div>

          {errorMessage && (
            <div className="rounded-xl bg-slate-50 dark:bg-[#10121B] border border-slate-200/80 dark:border-[#242636] px-3 py-2">
              <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400 break-words leading-snug">
                {errorMessage}
              </p>
            </div>
          )}

          {backupFeedback && (
            <div
              className={`rounded-xl px-3 py-2 text-xs font-semibold border ${
                backupFeedback.ok
                  ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60"
                  : "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/60"
              }`}
            >
              {backupFeedback.message}
            </div>
          )}

          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <button
              type="button"
              data-testid="error-boundary-retry"
              onClick={this.handleRetry}
              className="min-h-[44px] px-3 py-2 rounded-xl bg-[#00A3A6] hover:bg-[#008F91] active:scale-[0.99] text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
            >
              <ArrowClockwise size={16} weight="bold" />
              <span>Coba Lagi</span>
            </button>
            <button
              type="button"
              data-testid="error-boundary-backup"
              onClick={this.handleBackup}
              disabled={backingUp}
              className="min-h-[44px] px-3 py-2 rounded-xl bg-slate-100 dark:bg-[#1E202B] hover:bg-slate-200 dark:hover:bg-[#282B3A] disabled:opacity-60 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-[#2D3145] text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <DownloadSimple size={16} weight="bold" />
              <span>{backingUp ? "Menyimpan..." : "Backup Data"}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }
}
