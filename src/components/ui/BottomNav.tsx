import React from "react";
import { House, ChartBar, ListChecks, Receipt } from "@phosphor-icons/react";

export type TabId = "index" | "production" | "closing" | "more";

interface BottomNavProps {
  currentTab: TabId;
  onChangeTab: (tab: TabId) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onChangeTab }) => {
  const tabs = [
    { id: "index" as const, label: "Dashboard", Icon: House },
    { id: "production" as const, label: "Produksi", Icon: ChartBar },
    { id: "closing" as const, label: "Closing", Icon: ListChecks },
    { id: "more" as const, label: "Lainnya", Icon: Receipt },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#111116]/95 backdrop-blur-lg border-t border-slate-200 dark:border-[#242533] px-2 py-1.5 transition-colors">
      <div className="max-w-md mx-auto grid grid-cols-4 gap-1">
        {tabs.map(({ id, label, Icon }) => {
          const isActive = currentTab === id;
          return (
            <button
              key={id}
              onClick={() => onChangeTab(id)}
              className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all cursor-pointer ${
                isActive
                  ? "text-[#00A3A6] dark:text-[#38D9D9] font-black bg-[#00A3A6]/15 dark:bg-[#00A3A6]/20 shadow-2xs"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium"
              }`}
            >
              <Icon size={22} weight={isActive ? "fill" : "regular"} className={isActive ? "text-[#00A3A6] dark:text-[#38D9D9]" : ""} />
              <span className="text-[11px] mt-1 tracking-tight leading-none">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
