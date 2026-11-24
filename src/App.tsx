import React, { useEffect, useState } from "react";
import { Spinner } from "@phosphor-icons/react";
import { ToastProvider } from "@/src/components/ui/Toast";
import { ThemeProvider } from "@/src/lib/theme";
import { BottomNav, TabId } from "@/src/components/ui/BottomNav";
import { ErrorBoundary } from "@/src/components/ui/ErrorBoundary";
import { initDatabase, subscribeDatabase } from "@/src/db/database";
import { DashboardScreen } from "@/src/screens/DashboardScreen";
import { ProductionScreen } from "@/src/screens/ProductionScreen";
import { ClosingScreen } from "@/src/screens/ClosingScreen";
import { MoreScreen } from "@/src/screens/MoreScreen";
import { useKeyboardViewport } from "@/src/lib/useKeyboardViewport";

function PersistWarning() {
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const onStatus = (e: Event) => {
      const ok = (e as CustomEvent).detail?.ok !== false;
      setFailed(!ok);
    };
    window.addEventListener("sa-persist-status", onStatus);
    return () => window.removeEventListener("sa-persist-status", onStatus);
  }, []);
  if (!failed) return null;
  return (
    <div
      role="alert"
      data-testid="persist-warning"
      className="fixed top-0 inset-x-0 z-[100] bg-rose-600 text-white text-xs font-bold text-center px-3 pb-2 pt-[calc(0.5rem+env(safe-area-inset-top,0px))]"
    >
      Data gagal disimpan di HP. Segera ekspor Backup dari menu Data, lalu tutup dan buka lagi aplikasi.
    </div>
  );
}

function DbGate({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, setDbVersion] = useState(0);

  useEffect(() => {
    let unmounted = false;
    (async () => {
      try {
        await initDatabase();
        if (!unmounted) setReady(true);
      } catch (err: any) {
        console.error("DB initialization failed", err);
        if (!unmounted) setError(err?.message ?? "Gagal inisialisasi database");
      }
    })();

    const unsubscribe = subscribeDatabase(() => {
      setDbVersion((v) => v + 1);
    });

    return () => {
      unmounted = true;
      unsubscribe();
    };
  }, []);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center bg-[#F8F9FA] dark:bg-[#0D0E12] text-slate-800 dark:text-slate-100">
        <h2 className="text-lg font-bold text-rose-600 dark:text-rose-400 mb-2">
          Terjadi Kesalahan Database
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 max-w-sm mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 rounded-xl bg-[#00A3A6] hover:bg-[#008F91] text-white text-sm font-extrabold transition-colors cursor-pointer shadow-md shadow-[#00A3A6]/20"
        >
          Muat Ulang
        </button>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#F8FAFC] dark:bg-[#0A1118] gap-4">
        <div className="w-16 h-16 rounded-2xl bg-white dark:bg-[#162032] p-2 flex items-center justify-center shadow-lg border border-slate-200 dark:border-slate-800 animate-pulse">
          <img src="/rockstar-logo-trimmed.png" alt="Rockstar Academy" className="w-full h-full object-contain" />
        </div>
        <div className="flex items-center gap-2">
          <Spinner size={18} className="animate-spin text-[#00A3A6]" />
          <p className="text-xs font-bold text-slate-700 dark:text-slate-300 tracking-wider uppercase">
            Memuat Rockstar Academy SA Summary...
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <PersistWarning />
      {children}
    </>
  );
}

export default function App() {
  const [currentTab, setCurrentTab] = useState<TabId>("index");
  const { isKeyboardOpen } = useKeyboardViewport();

  return (
    <ThemeProvider>
      <ToastProvider>
        <DbGate>
          <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0A1118] text-[#0F172A] dark:text-[#F1F5F9] transition-colors selection:bg-[#00A3A6]/25">
            {currentTab === "index" && (
              <ErrorBoundary key="index" screenName="Dashboard">
                <DashboardScreen />
              </ErrorBoundary>
            )}
            {currentTab === "production" && (
              <ErrorBoundary key="production" screenName="Produksi">
                <ProductionScreen />
              </ErrorBoundary>
            )}
            {currentTab === "closing" && (
              <ErrorBoundary key="closing" screenName="Closing">
                <ClosingScreen />
              </ErrorBoundary>
            )}
            {currentTab === "more" && (
              <ErrorBoundary key="more" screenName="Lainnya">
                <MoreScreen />
              </ErrorBoundary>
            )}

            {!isKeyboardOpen && <BottomNav currentTab={currentTab} onChangeTab={setCurrentTab} />}
          </div>
        </DbGate>
      </ToastProvider>
    </ThemeProvider>
  );
}
