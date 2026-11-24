import { useEffect, useRef } from "react";
import { Capacitor, PluginListenerHandle } from "@capacitor/core";
import { App as CapApp } from "@capacitor/app";

export type BackPriority = "subscreen" | "modal" | "dialog";

const PRIORITY_WEIGHT: Record<BackPriority, number> = {
  subscreen: 1,
  modal: 2,
  dialog: 3,
};

interface BackEntry {
  id: number;
  priority: number;
  order: number;
  getHandler: () => () => void;
}

const registry: BackEntry[] = [];
let nextId = 1;
let nextOrder = 1;

export function useBackHandler(
  active: boolean,
  onBack: () => void,
  priority: BackPriority = "modal",
): void {
  const handlerRef = useRef(onBack);
  handlerRef.current = onBack;

  useEffect(() => {
    if (!active) return;
    const id = nextId++;
    const entry: BackEntry = {
      id,
      priority: PRIORITY_WEIGHT[priority],
      order: nextOrder++,
      getHandler: () => handlerRef.current,
    };
    registry.push(entry);

    return () => {
      const idx = registry.findIndex((e) => e.id === id);
      if (idx !== -1) {
        registry.splice(idx, 1);
      }
    };
  }, [active, priority]);
}

function dispatchTopBackHandler(): boolean {
  if (registry.length === 0) return false;
  let top = registry[0];
  for (let i = 1; i < registry.length; i++) {
    const candidate = registry[i];
    if (
      candidate.priority > top.priority ||
      (candidate.priority === top.priority && candidate.order > top.order)
    ) {
      top = candidate;
    }
  }
  top.getHandler()();
  return true;
}

interface UseAndroidBackButtonOptions {
  isAtRootDashboard: boolean;
  onNavigateToDashboard: () => void;
  onShowExitPrompt: () => void;
}

export function useAndroidBackButton({
  isAtRootDashboard,
  onNavigateToDashboard,
  onShowExitPrompt,
}: UseAndroidBackButtonOptions): void {
  const stateRef = useRef({
    isAtRootDashboard,
    onNavigateToDashboard,
    onShowExitPrompt,
  });
  stateRef.current = {
    isAtRootDashboard,
    onNavigateToDashboard,
    onShowExitPrompt,
  };

  const lastDashboardBackAtRef = useRef<number>(0);

  useEffect(() => {
    if (!isAtRootDashboard) {
      lastDashboardBackAtRef.current = 0;
    }
  }, [isAtRootDashboard]);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let disposed = false;
    let handle: PluginListenerHandle | null = null;

    const onBackButton = () => {
      try {
        if (dispatchTopBackHandler()) {
          lastDashboardBackAtRef.current = 0;
          return;
        }

        if (!stateRef.current.isAtRootDashboard) {
          lastDashboardBackAtRef.current = 0;
          stateRef.current.onNavigateToDashboard();
          return;
        }

        const now = Date.now();
        const elapsed = now - lastDashboardBackAtRef.current;
        if (lastDashboardBackAtRef.current > 0 && elapsed <= 2000) {
          lastDashboardBackAtRef.current = 0;
          CapApp.exitApp().catch((err) => {
            console.warn("CapApp.exitApp failed:", err);
          });
          return;
        }

        lastDashboardBackAtRef.current = now;
        stateRef.current.onShowExitPrompt();
      } catch (err) {
        console.error("Android backButton handler error:", err);
      }
    };

    try {
      CapApp.addListener("backButton", onBackButton)
        .then((listenerHandle) => {
          if (disposed) {
            listenerHandle.remove().catch(() => {});
          } else {
            handle = listenerHandle;
          }
        })
        .catch((err) => {
          console.warn("Failed to attach Android backButton listener:", err);
        });
    } catch (err) {
      console.warn("Android backButton plugin unavailable:", err);
    }

    return () => {
      disposed = true;
      if (handle) {
        handle.remove().catch(() => {});
        handle = null;
      }
    };
  }, []);
}
