import React, { useState } from "react";
import {
  Target,
  TrendUp,
  Users,
  CaretRight,
  ChartLine,
  SquaresFour,
  Sparkle,
  ArrowsInSimple,
} from "@phosphor-icons/react";
import { Card } from "@/src/components/ui/Card";
import { Header } from "@/src/components/ui/Header";
import { MonthNavigator } from "@/src/components/ui/Inputs";
import { ProgressBar, SectionTitle, StatCard } from "@/src/components/ui/UIComponents";
import { FunnelView } from "@/src/components/ui/FunnelView";
import { dashboard, memberSummaries, unitsNeeded, DashboardData, MemberSummary } from "@/src/services/calc";
import { listProducts } from "@/src/db/repo";
import { currentYM } from "@/src/lib/date";
import { formatCompactRupiah, formatInt, formatRupiah } from "@/src/lib/format";
import { MemberDetailModal } from "./MemberDetailModal";
import { AnalyticsView } from "@/src/components/analytics/AnalyticsView";

const COMPACT_STORAGE_KEY = "sa_dashboard_compact";

export const DashboardScreen: React.FC = () => {
  const [{ year, month }, setYM] = useState(currentYM());
  const [selectedMemberId, setSelectedMemberId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"summary" | "analytics">("summary");
  const [compact, setCompact] = useState<boolean>(() => {
    try {
      return typeof window !== "undefined" && window.localStorage.getItem(COMPACT_STORAGE_KEY) === "1";
    } catch {
      return false;
    }
  });

  const toggleCompact = () => {
    setCompact((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(COMPACT_STORAGE_KEY, next ? "1" : "0");
      } catch {
      }
      return next;
    });
  };

  const d: DashboardData = dashboard(year, month);
  const members: MemberSummary[] = memberSummaries(year, month);
  const targetUnit = d.targetUnit;
  const avgPrice = d.target.avgPrice;

  return (
    <div className="flex flex-col min-h-screen pb-24">
      <Header title="SA Summary" subtitle="Rockstar Academy · Performance Command Center" />

      <main
        className={`max-w-md mx-auto w-full flex flex-col ${
          compact ? "px-2.5 sm:px-4 pt-2 gap-1.5 sm:gap-2.5" : "px-4 pt-3 gap-3"
        }`}
      >
        <MonthNavigator year={year} month={month} onChange={(y, m) => setYM({ year: y, month: m })} />

        <div className="flex items-center gap-2">
          <div
            className={`flex-1 grid grid-cols-2 bg-slate-100 dark:bg-[#161722] border border-slate-200/90 dark:border-[#282A3A] shadow-xs ${
              compact ? "p-0.5 rounded-xl" : "p-1 rounded-2xl"
            }`}
          >
            <button
              type="button"
              data-testid="tab-summary"
              onClick={() => setActiveTab("summary")}
              className={`flex items-center justify-center gap-1.5 font-bold transition-all cursor-pointer ${
                compact ? "py-1.5 px-2 rounded-lg text-[11px]" : "py-2 px-3 rounded-xl text-xs"
              } ${
                activeTab === "summary"
                  ? "bg-[#00A3A6] text-white shadow-sm shadow-[#00A3A6]/20"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <SquaresFour size={compact ? 14 : 16} weight={activeTab === "summary" ? "fill" : "bold"} />
              <span>Ringkasan</span>
            </button>
            <button
              type="button"
              data-testid="tab-analytics"
              onClick={() => setActiveTab("analytics")}
              className={`flex items-center justify-center gap-1.5 font-bold transition-all cursor-pointer ${
                compact ? "py-1.5 px-2 rounded-lg text-[11px]" : "py-2 px-3 rounded-xl text-xs"
              } ${
                activeTab === "analytics"
                  ? "bg-[#00A3A6] text-white shadow-sm shadow-[#00A3A6]/20"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <ChartLine size={compact ? 14 : 16} weight={activeTab === "analytics" ? "fill" : "bold"} />
              <span>Analytics</span>
            </button>
          </div>

          <button
            type="button"
            data-testid="dashboard-compact-toggle"
            aria-pressed={compact}
            onClick={toggleCompact}
            title={compact ? "Nonaktifkan Compact Mode" : "Aktifkan Compact Mode untuk layar kecil"}
            className={`shrink-0 flex items-center gap-1 font-bold border transition-all cursor-pointer shadow-xs ${
              compact
                ? "py-2 px-2.5 rounded-xl text-[11px] bg-[#00A3A6]/15 text-[#00A3A6] dark:text-[#38D9D9] border-[#00A3A6]/40"
                : "py-2.5 px-3 rounded-2xl text-xs bg-white dark:bg-[#161722] text-slate-600 dark:text-slate-300 border-slate-200/90 dark:border-[#282A3A] hover:border-[#00A3A6]/40"
            }`}
          >
            <ArrowsInSimple size={compact ? 14 : 15} weight={compact ? "fill" : "bold"} />
            <span>Compact</span>
          </button>
        </div>

        {activeTab === "analytics" ? (
          <AnalyticsView selectedYear={year} selectedMonth={month} compact={compact} />
        ) : (
          <>
            <div className={`flex flex-col ${compact ? "gap-1.5 sm:gap-2.5" : "gap-3"}`}>
              <Card
                testID="dues-summary-card"
                className={`border-teal-500/30 dark:border-teal-500/20 shadow-xs ${
                  compact ? "!p-2.5 sm:!p-3" : ""
                }`}
              >
                <div
                  className={`flex items-center justify-between border-b border-slate-100 dark:border-[#282A3A] ${
                    compact ? "pb-1 sm:pb-1.5" : "pb-2"
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#00A3A6]" />
                    <h3
                      className={`font-black tracking-wider uppercase text-slate-900 dark:text-white ${
                        compact ? "text-[11px] sm:text-xs" : "text-xs"
                      }`}
                    >
                      Dues Membership
                    </h3>
                  </div>
                  <div className="flex items-center gap-1">
                    <span
                      className={`font-black rounded-md bg-[#00A3A6]/15 text-[#00A3A6] dark:text-[#38D9D9] ${
                        compact ? "text-[9px] sm:text-[10px] px-1.5 py-0.5" : "text-[10px] px-2 py-0.5"
                      }`}
                    >
                      Aktual: {d.duesAchPct != null ? `${d.duesAchPct.toFixed(1)}%` : "-"}
                    </span>
                    <span
                      className={`font-bold rounded-md bg-slate-100 dark:bg-[#1E202B] text-slate-600 dark:text-slate-300 ${
                        compact ? "text-[9px] sm:text-[10px] px-1.5 py-0.5" : "text-[10px] px-2 py-0.5"
                      }`}
                    >
                      Gross: {d.duesPct != null ? `${d.duesPct.toFixed(1)}%` : "-"}
                    </span>
                  </div>
                </div>

                <div className={`grid grid-cols-2 ${compact ? "gap-2 mt-1.5 sm:mt-2" : "gap-3 mt-2.5"}`}>
                  <div>
                    <span
                      className={`text-[#00A3A6] dark:text-[#38D9D9] uppercase font-bold block ${
                        compact ? "text-[9px] sm:text-[10px]" : "text-[10px]"
                      }`}
                    >
                      Dues Aktual (Status)
                    </span>
                    <p
                      className={`font-black text-slate-900 dark:text-white ${
                        compact ? "text-sm sm:text-base" : "text-base"
                      }`}
                    >
                      {formatRupiah(d.sales.duesAch)}
                    </p>
                    <span
                      className={`text-slate-500 block mt-0.5 ${
                        compact ? "text-[9px] sm:text-[10px]" : "text-[10px]"
                      }`}
                    >
                      Target: {formatRupiah(d.target.dues)}
                    </span>
                  </div>
                  <div>
                    <span
                      className={`text-slate-400 uppercase font-bold block ${
                        compact ? "text-[9px] sm:text-[10px]" : "text-[10px]"
                      }`}
                    >
                      Dues Gross & Unit
                    </span>
                    <p
                      className={`font-black text-slate-800 dark:text-slate-100 ${
                        compact ? "text-sm sm:text-base" : "text-base"
                      }`}
                    >
                      {formatRupiah(d.sales.duesGross)}
                    </p>
                    <span
                      className={`text-[#00A3A6] dark:text-[#38D9D9] font-bold block mt-0.5 ${
                        compact ? "text-[9px] sm:text-[10px]" : "text-[10px]"
                      }`}
                    >
                      {formatInt(d.sales.duesUnit)} / {formatInt(targetUnit)} unit
                    </span>
                  </div>
                </div>

                <div className={`flex flex-col ${compact ? "mt-1.5 sm:mt-2 gap-1" : "mt-3 gap-1.5"}`}>
                  <div>
                    <div
                      className={`flex justify-between text-slate-500 mb-0.5 ${
                        compact ? "text-[9px] sm:text-[10px]" : "text-[10px]"
                      }`}
                    >
                      <span className="font-semibold text-[#00A3A6] dark:text-[#38D9D9]">Progress Aktual (Status)</span>
                      <span className="font-bold">{d.duesAchPct != null ? `${d.duesAchPct.toFixed(1)}%` : "-"}</span>
                    </div>
                    <ProgressBar value={d.duesAchPct} />
                  </div>
                  <div>
                    <div
                      className={`flex justify-between text-slate-500 mb-0.5 ${
                        compact ? "text-[9px] sm:text-[10px]" : "text-[10px]"
                      }`}
                    >
                      <span className="font-semibold">Progress Gross</span>
                      <span className="font-bold">{d.duesPct != null ? `${d.duesPct.toFixed(1)}%` : "-"}</span>
                    </div>
                    <ProgressBar value={d.duesPct} barClassName="bg-slate-400 dark:bg-slate-500" />
                  </div>
                </div>

                <div
                  className={`grid grid-cols-2 gap-2 text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-[#282A3A] ${
                    compact ? "text-[10px] sm:text-[11px] mt-1.5 pt-1.5" : "text-[11px] mt-2.5 pt-2"
                  }`}
                >
                  <div>
                    <span className={`block ${compact ? "text-[9px] sm:text-[10px]" : "text-[10px]"}`}>
                      Sisa Target Aktual:
                    </span>
                    <span className="font-bold text-[#00A3A6] dark:text-[#38D9D9]">
                      {formatRupiah(Math.max(0, d.remainingAchTo100))}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className={`block ${compact ? "text-[9px] sm:text-[10px]" : "text-[10px]"}`}>
                      Sisa Target Gross:
                    </span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {formatRupiah(Math.max(0, d.remainingTo100))}
                    </span>
                  </div>
                </div>
              </Card>

              <Card
                testID="private-summary-card"
                className={`border-purple-500/30 dark:border-purple-500/20 shadow-xs ${
                  compact ? "!p-2.5 sm:!p-3" : ""
                }`}
              >
                <div
                  className={`flex items-center justify-between border-b border-slate-100 dark:border-[#282A3A] ${
                    compact ? "pb-1 sm:pb-1.5" : "pb-2"
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-purple-500" />
                    <h3
                      className={`font-black tracking-wider uppercase text-slate-900 dark:text-white ${
                        compact ? "text-[11px] sm:text-xs" : "text-xs"
                      }`}
                    >
                      Private Class
                    </h3>
                  </div>
                  <div className="flex items-center gap-1">
                    <span
                      className={`font-black rounded-md bg-purple-500/15 text-purple-600 dark:text-purple-400 ${
                        compact ? "text-[9px] sm:text-[10px] px-1.5 py-0.5" : "text-[10px] px-2 py-0.5"
                      }`}
                    >
                      Aktual: {d.privAchPct != null ? `${d.privAchPct.toFixed(1)}%` : "-"}
                    </span>
                    <span
                      className={`font-bold rounded-md bg-slate-100 dark:bg-[#1E202B] text-slate-600 dark:text-slate-300 ${
                        compact ? "text-[9px] sm:text-[10px] px-1.5 py-0.5" : "text-[10px] px-2 py-0.5"
                      }`}
                    >
                      Gross: {d.privPct != null ? `${d.privPct.toFixed(1)}%` : "-"}
                    </span>
                  </div>
                </div>

                <div className={`grid grid-cols-2 ${compact ? "gap-2 mt-1.5 sm:mt-2" : "gap-3 mt-2.5"}`}>
                  <div>
                    <span
                      className={`text-purple-600 dark:text-purple-400 uppercase font-bold block ${
                        compact ? "text-[9px] sm:text-[10px]" : "text-[10px]"
                      }`}
                    >
                      Private Aktual (Status)
                    </span>
                    <p
                      className={`font-black text-slate-900 dark:text-white ${
                        compact ? "text-sm sm:text-base" : "text-base"
                      }`}
                    >
                      {formatRupiah(d.sales.privAch)}
                    </p>
                    <span
                      className={`text-slate-500 block mt-0.5 ${
                        compact ? "text-[9px] sm:text-[10px]" : "text-[10px]"
                      }`}
                    >
                      Target: {formatRupiah(d.target.private)}
                    </span>
                  </div>
                  <div>
                    <span
                      className={`text-slate-400 uppercase font-bold block ${
                        compact ? "text-[9px] sm:text-[10px]" : "text-[10px]"
                      }`}
                    >
                      Private Gross
                    </span>
                    <p
                      className={`font-black text-slate-800 dark:text-slate-100 ${
                        compact ? "text-sm sm:text-base" : "text-base"
                      }`}
                    >
                      {formatRupiah(d.sales.privGross)}
                    </p>
                    <span
                      className={`text-slate-500 block mt-0.5 ${
                        compact ? "text-[9px] sm:text-[10px]" : "text-[10px]"
                      }`}
                    >
                      Proyeksi: {formatCompactRupiah(d.projPrivAch)} / {formatCompactRupiah(d.projPrivGross)}
                    </span>
                  </div>
                </div>

                <div className={`flex flex-col ${compact ? "mt-1.5 sm:mt-2 gap-1" : "mt-3 gap-1.5"}`}>
                  <div>
                    <div
                      className={`flex justify-between text-slate-500 mb-0.5 ${
                        compact ? "text-[9px] sm:text-[10px]" : "text-[10px]"
                      }`}
                    >
                      <span className="font-semibold text-purple-600 dark:text-purple-400">Progress Aktual (Status)</span>
                      <span className="font-bold">{d.privAchPct != null ? `${d.privAchPct.toFixed(1)}%` : "-"}</span>
                    </div>
                    <ProgressBar value={d.privAchPct} barClassName="bg-purple-500" />
                  </div>
                  <div>
                    <div
                      className={`flex justify-between text-slate-500 mb-0.5 ${
                        compact ? "text-[9px] sm:text-[10px]" : "text-[10px]"
                      }`}
                    >
                      <span className="font-semibold">Progress Gross</span>
                      <span className="font-bold">{d.privPct != null ? `${d.privPct.toFixed(1)}%` : "-"}</span>
                    </div>
                    <ProgressBar value={d.privPct} barClassName="bg-slate-400 dark:bg-slate-500" />
                  </div>
                </div>

                <div
                  className={`grid grid-cols-2 gap-2 text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-[#282A3A] ${
                    compact ? "text-[10px] sm:text-[11px] mt-1.5 pt-1.5" : "text-[11px] mt-2.5 pt-2"
                  }`}
                >
                  <div>
                    <span className={`block ${compact ? "text-[9px] sm:text-[10px]" : "text-[10px]"}`}>
                      Sisa Target Aktual:
                    </span>
                    <span className="font-bold text-purple-600 dark:text-purple-400">
                      {formatRupiah(Math.max(0, d.remainingPrivAch))}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className={`block ${compact ? "text-[9px] sm:text-[10px]" : "text-[10px]"}`}>
                      Sisa Target Gross:
                    </span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {formatRupiah(Math.max(0, d.remainingPriv))}
                    </span>
                  </div>
                </div>
              </Card>
            </div>

            <SectionTitle className={compact ? "!mt-2 !mb-1" : ""}>
              Kebutuhan Target & Unit (Dues Membership)
            </SectionTitle>
            <Card
              testID="target-gap"
              className={`divide-y divide-[#F3F4F6] dark:divide-[#282A3A] ${
                compact ? "!p-2.5 sm:!p-3 !py-0.5" : "py-1"
              }`}
            >
              <div className={`flex justify-between ${compact ? "py-1 text-[11px] sm:text-xs" : "py-2 text-xs"}`}>
                <span className="text-slate-500 dark:text-slate-400">Dues Aktual (Status)</span>
                <span className="font-bold text-[#00A3A6] dark:text-[#38D9D9]">{formatRupiah(d.sales.duesAch)}</span>
              </div>
              <div className={`flex justify-between ${compact ? "py-1 text-[11px] sm:text-xs" : "py-2 text-xs"}`}>
                <span className="text-slate-500 dark:text-slate-400">Dues Gross saat ini</span>
                <span className="font-semibold text-slate-900 dark:text-white">{formatRupiah(d.sales.duesGross)}</span>
              </div>
              <div className={`flex justify-between ${compact ? "py-1 text-[11px] sm:text-xs" : "py-2 text-xs"}`}>
                <span className="text-slate-500 dark:text-slate-400">Target 80% Dues</span>
                <span className="font-semibold text-slate-900 dark:text-white">{formatRupiah(d.target80)}</span>
              </div>
              <div className={`flex flex-col ${compact ? "py-1 text-[11px] sm:text-xs gap-1" : "py-2 text-xs gap-1.5"}`}>
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Menuju 80% (Aktual)</span>
                  <span className="font-bold text-[#00A3A6] dark:text-[#38D9D9]">
                    {d.target.dues > 0 ? `${formatRupiah(Math.max(0, d.remainingAchTo80))} • ${d.unitsAchTo80} unit` : "-"}
                  </span>
                </div>
                {d.unitOptionsAchTo80.length > 0 && d.remainingAchTo80 > 0 && (
                  <p className={`${compact ? "text-[10px]" : "text-[11px]"} text-slate-400 -mt-1`}>
                    Acuan Aktual: {d.unitOptionsAchTo80.map((u) => `${u.units} unit ${u.product.name}`).join(" • ")}
                  </p>
                )}
                <div className="flex justify-between items-center">
                  <span className="font-medium text-slate-500 dark:text-slate-400">Menuju 80% (Gross)</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-200">
                    {d.target.dues > 0 ? `${formatRupiah(Math.max(0, d.remainingTo80))} • ${d.unitsTo80} unit` : "-"}
                  </span>
                </div>
                {d.unitOptionsTo80.length > 0 && d.remainingTo80 > 0 && (
                  <p className={`${compact ? "text-[10px]" : "text-[11px]"} text-slate-400 -mt-1`}>
                    Acuan Gross: {d.unitOptionsTo80.map((u) => `${u.units} unit ${u.product.name}`).join(" • ")}
                  </p>
                )}
              </div>

              <div className={`flex justify-between ${compact ? "py-1 text-[11px] sm:text-xs" : "py-2 text-xs"}`}>
                <span className="text-slate-500 dark:text-slate-400">Target 100% Dues</span>
                <span className="font-semibold text-slate-900 dark:text-white">{formatRupiah(d.target100)}</span>
              </div>
              <div className={`flex flex-col ${compact ? "py-1 text-[11px] sm:text-xs gap-1" : "py-2 text-xs gap-1.5"}`}>
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Menuju 100% (Aktual)</span>
                  <span className="font-bold text-[#00A3A6] dark:text-[#38D9D9]">
                    {d.target.dues > 0 ? `${formatRupiah(Math.max(0, d.remainingAchTo100))} • ${d.unitsAchTo100} unit` : "-"}
                  </span>
                </div>
                {d.unitOptionsAchTo100.length > 0 && d.remainingAchTo100 > 0 && (
                  <p className={`${compact ? "text-[10px]" : "text-[11px]"} text-slate-400 -mt-1`}>
                    Acuan Aktual: {d.unitOptionsAchTo100.map((u) => `${u.units} unit ${u.product.name}`).join(" • ")}
                  </p>
                )}
                <div className="flex justify-between items-center">
                  <span className="font-medium text-slate-500 dark:text-slate-400">Menuju 100% (Gross)</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-200">
                    {d.target.dues > 0 ? `${formatRupiah(Math.max(0, d.remainingTo100))} • ${d.unitsTo100} unit` : "-"}
                  </span>
                </div>
                {d.unitOptionsTo100.length > 0 && d.remainingTo100 > 0 && (
                  <p className={`${compact ? "text-[10px]" : "text-[11px]"} text-slate-400 -mt-1`}>
                    Acuan Gross: {d.unitOptionsTo100.map((u) => `${u.units} unit ${u.product.name}`).join(" • ")}
                  </p>
                )}
              </div>
            </Card>

            <SectionTitle className={compact ? "!mt-2 !mb-1" : ""}>
              Projection Akhir Bulan (Gross & Aktual)
            </SectionTitle>
            <Card
              testID="projection"
              className={`divide-y divide-[#F3F4F6] dark:divide-[#282A3A] ${
                compact ? "!p-2.5 sm:!p-3 !py-0.5" : "py-1"
              }`}
            >
              <div className={`flex items-center justify-between ${compact ? "py-1.5" : "py-2"}`}>
                <div className="flex items-center gap-2 text-[#00A3A6] dark:text-[#38D9D9]">
                  <TrendUp size={compact ? 15 : 18} weight="bold" />
                  <span className={`${compact ? "text-[11px] sm:text-xs" : "text-xs"} font-bold text-slate-900 dark:text-white`}>
                    Proyeksi Pacing Akhir Bulan
                  </span>
                </div>
                <span className={`${compact ? "text-[10px]" : "text-[11px]"} font-bold text-slate-500 dark:text-slate-400`}>
                  {formatInt(d.projDuesUnit)} / {formatInt(targetUnit)} unit
                </span>
              </div>

              <div
                className={`grid grid-cols-12 gap-2 font-black uppercase tracking-wider text-slate-400 ${
                  compact ? "py-1 text-[9px] sm:text-[10px]" : "py-1.5 text-[10px]"
                }`}
              >
                <div className="col-span-4">Kategori</div>
                <div className="col-span-4 text-right">Proyeksi Gross</div>
                <div className="col-span-4 text-right text-[#00A3A6] dark:text-[#38D9D9]">Proyeksi Aktual</div>
              </div>

              <div
                className={`grid grid-cols-12 gap-2 items-start ${
                  compact ? "py-1.5 text-[11px] sm:text-xs" : "py-2 text-xs"
                }`}
              >
                <div className="col-span-4 font-semibold text-slate-700 dark:text-slate-300">
                  Dues
                  <span className={`block font-normal text-slate-400 ${compact ? "text-[9px] sm:text-[10px]" : "text-[10px]"}`}>
                    vs {formatCompactRupiah(d.target.dues)}
                  </span>
                </div>
                <div className="col-span-4 text-right">
                  <span className="font-bold text-slate-900 dark:text-white block">{formatCompactRupiah(d.projDuesGross)}</span>
                  {d.target.dues > 0 && (
                    <span
                      className={`font-semibold ${compact ? "text-[9px] sm:text-[10px]" : "text-[10px]"} ${
                        d.projDuesGross >= d.target.dues ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500"
                      }`}
                    >
                      {d.projDuesGross >= d.target.dues ? "+" : ""}{formatCompactRupiah(d.projDuesGross - d.target.dues)}
                    </span>
                  )}
                </div>
                <div className="col-span-4 text-right">
                  <span className="font-bold text-[#00A3A6] dark:text-[#38D9D9] block">{formatCompactRupiah(d.projDuesAch)}</span>
                  {d.target.dues > 0 && (
                    <span
                      className={`font-semibold ${compact ? "text-[9px] sm:text-[10px]" : "text-[10px]"} ${
                        d.projDuesAch >= d.target.dues ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500"
                      }`}
                    >
                      {d.projDuesAch >= d.target.dues ? "+" : ""}{formatCompactRupiah(d.projDuesAch - d.target.dues)}
                    </span>
                  )}
                </div>
              </div>

              <div
                className={`grid grid-cols-12 gap-2 items-start ${
                  compact ? "py-1.5 text-[11px] sm:text-xs" : "py-2 text-xs"
                }`}
              >
                <div className="col-span-4 font-semibold text-slate-700 dark:text-slate-300">
                  Private
                  <span className={`block font-normal text-slate-400 ${compact ? "text-[9px] sm:text-[10px]" : "text-[10px]"}`}>
                    vs {formatCompactRupiah(d.target.private)}
                  </span>
                </div>
                <div className="col-span-4 text-right">
                  <span className="font-bold text-purple-600 dark:text-purple-400 block">{formatCompactRupiah(d.projPrivGross)}</span>
                  {d.target.private > 0 && (
                    <span
                      className={`font-semibold ${compact ? "text-[9px] sm:text-[10px]" : "text-[10px]"} ${
                        d.projPrivGross >= d.target.private ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500"
                      }`}
                    >
                      {d.projPrivGross >= d.target.private ? "+" : ""}{formatCompactRupiah(d.projPrivGross - d.target.private)}
                    </span>
                  )}
                </div>
                <div className="col-span-4 text-right">
                  <span className="font-bold text-purple-600 dark:text-purple-400 block">{formatCompactRupiah(d.projPrivAch)}</span>
                  {d.target.private > 0 && (
                    <span
                      className={`font-semibold ${compact ? "text-[9px] sm:text-[10px]" : "text-[10px]"} ${
                        d.projPrivAch >= d.target.private ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500"
                      }`}
                    >
                      {d.projPrivAch >= d.target.private ? "+" : ""}{formatCompactRupiah(d.projPrivAch - d.target.private)}
                    </span>
                  )}
                </div>
              </div>
            </Card>

            <SectionTitle className={compact ? "!mt-2 !mb-1" : ""}>
              Funnel Analytics & Kebutuhan Pipeline
            </SectionTitle>
            <Card testID="funnel-card" className={compact ? "!p-2.5 sm:!p-3" : ""}>
              <FunnelView data={d.funnel} requirements={d.funnelRequirements} compact={compact} />
            </Card>

            <SectionTitle
              className={compact ? "!mt-2 !mb-1" : ""}
              action={
                <div className="flex items-center gap-1 text-slate-400">
                  <Users size={compact ? 14 : 16} />
                  <span className={`${compact ? "text-[11px]" : "text-xs"} font-medium`}>{members.length} anggota</span>
                </div>
              }
            >
              Team Achievement & Conversion Rate SA
            </SectionTitle>

            <div className={`flex flex-col ${compact ? "gap-1.5 sm:gap-2" : "gap-2.5"}`}>
              {members.map((m) => (
                <Card
                  key={m.id}
                  testID={`member-card-${m.id}`}
                  onClick={() => setSelectedMemberId(m.id)}
                  className={`flex flex-col hover:border-[#00A3A6]/40 transition-colors cursor-pointer ${
                    compact ? "!p-2.5 sm:!p-3 gap-1.5" : "gap-2.5"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4
                        className={`font-bold text-slate-900 dark:text-white ${
                          compact ? "text-xs sm:text-sm" : "text-sm"
                        }`}
                      >
                        {m.name} {!m.active && <span className="text-xs text-slate-400 font-normal">(nonaktif)</span>}
                      </h4>
                      <p className={`text-slate-500 dark:text-slate-400 ${compact ? "text-[10.5px] sm:text-xs" : "text-xs"}`}>
                        {m.position}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {m.leadsConv != null && (
                        <span
                          className={`font-black rounded-full bg-[#00A3A6]/15 text-[#00A3A6] dark:text-[#38D9D9] border border-[#00A3A6]/30 ${
                            compact ? "text-[9.5px] px-1.5 py-0.5" : "text-[10px] px-2 py-0.5"
                          }`}
                        >
                          Conv: {m.leadsConv.toFixed(1)}%
                        </span>
                      )}
                      <CaretRight size={compact ? 15 : 18} className="text-slate-400 shrink-0" />
                    </div>
                  </div>

                  {m.hasTarget ? (
                    <div className={`flex flex-col ${compact ? "gap-1.5" : "gap-2.5"}`}>
                      <div
                        className={`rounded-xl bg-teal-50/50 dark:bg-[#132225]/60 border border-teal-200/60 dark:border-teal-900/40 flex flex-col ${
                          compact ? "p-2 gap-1" : "p-2.5 gap-1.5"
                        }`}
                      >
                        <div className={`flex items-center justify-between ${compact ? "text-[11px] sm:text-xs" : "text-xs"}`}>
                          <span className="font-bold text-[#00A3A6] dark:text-[#38D9D9] flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#00A3A6]" />
                            Target Dues SA
                          </span>
                          <span className="font-extrabold text-[#00A3A6] dark:text-[#38D9D9]">
                            Akt: {m.duesAchPct == null ? "-" : `${m.duesAchPct.toFixed(1)}%`}
                            <span className="text-slate-400 font-semibold ml-1">
                              / Gr: {m.duesPct == null ? "-" : `${m.duesPct.toFixed(1)}%`}
                            </span>
                          </span>
                        </div>
                        <div className={`flex items-baseline justify-between ${compact ? "text-[11px] sm:text-xs" : "text-xs"}`}>
                          <div>
                            <span className="font-bold text-slate-800 dark:text-slate-200 block">
                              Akt: {formatRupiah(m.sales.duesAch)}
                            </span>
                            <span className={`${compact ? "text-[9.5px] sm:text-[10.5px]" : "text-[10.5px]"} text-slate-500 dark:text-slate-400`}>
                              Gross: {formatRupiah(m.sales.duesGross)}
                            </span>
                          </div>
                          <span className={`${compact ? "text-[10px] sm:text-[11px]" : "text-[11px]"} text-slate-500 dark:text-slate-400`}>
                            Target {formatCompactRupiah(m.personalDuesTarget)}
                          </span>
                        </div>
                        <ProgressBar value={m.duesAchPct} barClassName="bg-[#00A3A6]" />
                        <div className={`grid grid-cols-2 pt-1 ${compact ? "gap-1.5" : "gap-2"}`}>
                          <div
                            className={`bg-white/95 dark:bg-[#1E202B] rounded-xl border border-teal-200/90 dark:border-teal-900/60 shadow-2xs ${
                              compact ? "p-1.5 sm:p-2" : "p-2.5"
                            }`}
                          >
                            <span
                              className={`text-slate-500 dark:text-slate-400 block font-extrabold uppercase tracking-wider ${
                                compact ? "text-[9px] sm:text-[10px]" : "text-[10px]"
                              }`}
                            >
                              Butuh ke 80% Dues
                            </span>
                            {m.remainingDuesAchTo80 === 0 ? (
                              <span className={`${compact ? "text-[11px]" : "text-xs"} font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-0.5`}>
                                ✓ 80% Aktual Tercapai
                              </span>
                            ) : (
                              <div className="mt-0.5">
                                <div className="flex items-baseline gap-1">
                                  <span
                                    className={`font-black text-[#00A3A6] dark:text-[#38D9D9] ${
                                      compact ? "text-sm sm:text-base" : "text-base"
                                    }`}
                                  >
                                    {m.unitsDuesAchTo80}
                                  </span>
                                  <span className={`${compact ? "text-[11px]" : "text-xs"} font-bold text-[#00A3A6] dark:text-[#38D9D9]`}>
                                    unit (Akt)
                                  </span>
                                </div>
                                <span
                                  className={`text-slate-500 dark:text-slate-400 font-semibold block leading-tight ${
                                    compact ? "text-[9.5px] sm:text-[10.5px]" : "text-[10.5px]"
                                  }`}
                                >
                                  {formatCompactRupiah(m.remainingDuesAchTo80)}
                                </span>
                              </div>
                            )}
                            <span
                              className={`text-slate-400 block mt-1 pt-1 border-t border-slate-100 dark:border-slate-800 ${
                                compact ? "text-[9px] sm:text-[10px]" : "text-[10px]"
                              }`}
                            >
                              {m.remainingDuesTo80 === 0
                                ? "Gross: ✓ Tercapai"
                                : `Gross: ${m.unitsDuesTo80} unit (${formatCompactRupiah(m.remainingDuesTo80)})`}
                            </span>
                          </div>

                          <div
                            className={`bg-white/95 dark:bg-[#1E202B] rounded-xl border border-teal-200/90 dark:border-teal-900/60 shadow-2xs ${
                              compact ? "p-1.5 sm:p-2" : "p-2.5"
                            }`}
                          >
                            <span
                              className={`text-slate-500 dark:text-slate-400 block font-extrabold uppercase tracking-wider ${
                                compact ? "text-[9px] sm:text-[10px]" : "text-[10px]"
                              }`}
                            >
                              Butuh ke 100% Dues
                            </span>
                            {m.remainingDuesAchTo100 === 0 ? (
                              <span className={`${compact ? "text-[11px]" : "text-xs"} font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-0.5`}>
                                ✓ 100% Aktual Tercapai
                              </span>
                            ) : (
                              <div className="mt-0.5">
                                <div className="flex items-baseline gap-1">
                                  <span
                                    className={`font-black text-[#00A3A6] dark:text-[#38D9D9] ${
                                      compact ? "text-sm sm:text-base" : "text-base"
                                    }`}
                                  >
                                    {m.unitsDuesAchTo100}
                                  </span>
                                  <span className={`${compact ? "text-[11px]" : "text-xs"} font-bold text-[#00A3A6] dark:text-[#38D9D9]`}>
                                    unit (Akt)
                                  </span>
                                </div>
                                <span
                                  className={`text-slate-500 dark:text-slate-400 font-semibold block leading-tight ${
                                    compact ? "text-[9.5px] sm:text-[10.5px]" : "text-[10.5px]"
                                  }`}
                                >
                                  {formatCompactRupiah(m.remainingDuesAchTo100)}
                                </span>
                              </div>
                            )}
                            <span
                              className={`text-slate-400 block mt-1 pt-1 border-t border-slate-100 dark:border-slate-800 ${
                                compact ? "text-[9px] sm:text-[10px]" : "text-[10px]"
                              }`}
                            >
                              {m.remainingDuesTo100 === 0
                                ? "Gross: ✓ Tercapai"
                                : `Gross: ${m.unitsDuesTo100} unit (${formatCompactRupiah(m.remainingDuesTo100)})`}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div
                        className={`rounded-xl bg-purple-50/50 dark:bg-[#1F172C]/60 border border-purple-200/60 dark:border-purple-900/40 flex flex-col ${
                          compact ? "p-2 gap-1" : "p-2.5 gap-1.5"
                        }`}
                      >
                        <div className={`flex items-center justify-between ${compact ? "text-[11px] sm:text-xs" : "text-xs"}`}>
                          <span className="font-bold text-purple-600 dark:text-purple-400 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                            Target Private SA
                          </span>
                          <span className="font-extrabold text-purple-600 dark:text-purple-400">
                            Akt: {m.privAchPct == null ? "-" : `${m.privAchPct.toFixed(1)}%`}
                            <span className="text-slate-400 font-semibold ml-1">
                              / Gr: {m.privPct == null ? "-" : `${m.privPct.toFixed(1)}%`}
                            </span>
                          </span>
                        </div>
                        <div className={`flex items-baseline justify-between ${compact ? "text-[11px] sm:text-xs" : "text-xs"}`}>
                          <div>
                            <span className="font-bold text-slate-800 dark:text-slate-200 block">
                              Akt: {formatRupiah(m.sales.privAch)}
                            </span>
                            <span className={`${compact ? "text-[9.5px] sm:text-[10.5px]" : "text-[10.5px]"} text-slate-500 dark:text-slate-400`}>
                              Gross: {formatRupiah(m.sales.privGross)}
                            </span>
                          </div>
                          <span className={`${compact ? "text-[10px] sm:text-[11px]" : "text-[11px]"} text-slate-500 dark:text-slate-400`}>
                            Target {formatCompactRupiah(m.personalPrivTarget)}
                          </span>
                        </div>
                        <ProgressBar value={m.privAchPct} barClassName="bg-purple-500" />
                        <div className={`grid grid-cols-2 gap-1.5 pt-1 ${compact ? "text-[9.5px] sm:text-[10.5px]" : "text-[10.5px]"}`}>
                          <div className="bg-white/80 dark:bg-[#1E202B]/80 px-2 py-1 rounded-lg border border-purple-100 dark:border-purple-950">
                            <span className="text-slate-400 block text-[9.5px]">Butuh ke 80%:</span>
                            <span className="font-bold text-purple-600 dark:text-purple-400 block">
                              {m.remainingPrivAchTo80 === 0 ? "✓ Akt Tercapai" : `Akt: ${formatCompactRupiah(m.remainingPrivAchTo80)}`}
                            </span>
                            <span className="text-[9.5px] text-slate-400 block">
                              {m.remainingPrivTo80 === 0 ? "Gross: ✓" : `Gr: ${formatCompactRupiah(m.remainingPrivTo80)}`}
                            </span>
                          </div>
                          <div className="bg-white/80 dark:bg-[#1E202B]/80 px-2 py-1 rounded-lg border border-purple-100 dark:border-purple-950">
                            <span className="text-slate-400 block text-[9.5px]">Butuh ke 100%:</span>
                            <span className="font-bold text-purple-600 dark:text-purple-400 block">
                              {m.remainingPrivAchTo100 === 0 ? "✓ Akt Tercapai" : `Akt: ${formatCompactRupiah(m.remainingPrivAchTo100)}`}
                            </span>
                            <span className="text-[9.5px] text-slate-400 block">
                              {m.remainingPrivTo100 === 0 ? "Gross: ✓" : `Gr: ${formatCompactRupiah(m.remainingPrivTo100)}`}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div
                        className={`flex flex-col gap-0.5 px-1 text-slate-500 dark:text-slate-400 ${
                          compact ? "text-[9.5px] sm:text-[10.5px]" : "text-[10.5px]"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span>Proj Dues (Gr / Akt):</span>
                          <span>
                            <strong className="text-slate-700 dark:text-slate-200">{formatCompactRupiah(m.projDuesGross)}</strong>
                            {" / "}
                            <strong className="text-[#00A3A6] dark:text-[#38D9D9]">{formatCompactRupiah(m.projDuesAch)}</strong>
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Proj Private (Gr / Akt):</span>
                          <span>
                            <strong className="text-slate-700 dark:text-slate-200">{formatCompactRupiah(m.projPrivGross)}</strong>
                            {" / "}
                            <strong className="text-purple-600 dark:text-purple-400">{formatCompactRupiah(m.projPrivAch)}</strong>
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <span
                      className={`inline-block rounded-full font-semibold bg-[#00A3A6]/15 text-[#00A3A6] dark:text-[#38D9D9] w-fit ${
                        compact ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs"
                      }`}
                    >
                      Manager · Kontribusi team
                    </span>
                  )}

                  <div
                    className={`rounded-xl bg-slate-50 dark:bg-[#161722] border border-slate-200/80 dark:border-[#282A3A] ${
                      compact ? "p-1.5" : "p-2"
                    }`}
                  >
                    <div
                      className={`flex items-center justify-between font-bold text-slate-500 dark:text-slate-400 ${
                        compact ? "text-[9.5px] mb-1" : "text-[10px] mb-1.5"
                      }`}
                    >
                      <span className="uppercase tracking-wider">Conversion Rate Pipeline SA:</span>
                      <span className="text-slate-400 font-normal">
                        {m.prod.leads} Leads → {m.sales.duesUnit} Unit
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-1 text-center text-xs">
                      <div className={`${compact ? "p-0.5" : "p-1"} rounded-lg bg-white dark:bg-[#1E202B] border border-slate-200/60 dark:border-[#2D3748]`}>
                        <span className="text-[9px] text-slate-400 block font-semibold leading-tight">Lead→Appt</span>
                        <span className={`font-black text-[#00B5B5] ${compact ? "text-[10px]" : "text-[11px]"}`}>
                          {m.apptConv != null ? `${m.apptConv.toFixed(1)}%` : "—"}
                        </span>
                      </div>
                      <div className={`${compact ? "p-0.5" : "p-1"} rounded-lg bg-white dark:bg-[#1E202B] border border-slate-200/60 dark:border-[#2D3748]`}>
                        <span className="text-[9px] text-slate-400 block font-semibold leading-tight">Appt→Show</span>
                        <span className={`font-black text-[#FF6B35] ${compact ? "text-[10px]" : "text-[11px]"}`}>
                          {m.showRate != null ? `${m.showRate.toFixed(1)}%` : "—"}
                        </span>
                      </div>
                      <div className={`${compact ? "p-0.5" : "p-1"} rounded-lg bg-white dark:bg-[#1E202B] border border-slate-200/60 dark:border-[#2D3748]`}>
                        <span className="text-[9px] text-slate-400 block font-semibold leading-tight">Show→Int</span>
                        <span className={`font-black text-emerald-600 dark:text-emerald-400 ${compact ? "text-[10px]" : "text-[11px]"}`}>
                          {m.interviewRate != null ? `${m.interviewRate.toFixed(1)}%` : "—"}
                        </span>
                      </div>
                      <div className={`${compact ? "p-0.5" : "p-1"} rounded-lg bg-white dark:bg-[#1E202B] border border-slate-200/60 dark:border-[#2D3748]`}>
                        <span className="text-[9px] text-slate-400 block font-semibold leading-tight">Int→Close</span>
                        <span className={`font-black text-[#00A3A6] dark:text-[#38D9D9] ${compact ? "text-[10px]" : "text-[11px]"}`}>
                          {m.closeRate != null ? `${m.closeRate.toFixed(1)}%` : "—"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div
                    className={`grid grid-cols-3 gap-2 border-t border-slate-100 dark:border-[#282A3A] ${
                      compact ? "pt-1.5 text-[11px] sm:text-xs" : "pt-2 text-xs"
                    }`}
                  >
                    <div>
                      <p className={`${compact ? "text-[9px] sm:text-[10px]" : "text-[10px]"} text-slate-400 uppercase`}>
                        Dues (Akt/Gr)
                      </p>
                      <p className="font-bold text-[#00A3A6] dark:text-[#38D9D9]">
                        {formatCompactRupiah(m.sales.duesAch)}
                        <span className={`${compact ? "text-[9px] sm:text-[10px]" : "text-[10px]"} font-normal text-slate-400 block`}>
                          Gr: {formatCompactRupiah(m.sales.duesGross)}
                        </span>
                      </p>
                    </div>
                    <div>
                      <p className={`${compact ? "text-[9px] sm:text-[10px]" : "text-[10px]"} text-slate-400 uppercase`}>
                        Priv (Akt/Gr)
                      </p>
                      <p className="font-bold text-purple-600 dark:text-purple-400">
                        {formatCompactRupiah(m.sales.privAch)}
                        <span className={`${compact ? "text-[9px] sm:text-[10px]" : "text-[10px]"} font-normal text-slate-400 block`}>
                          Gr: {formatCompactRupiah(m.sales.privGross)}
                        </span>
                      </p>
                    </div>
                    <div>
                      <p className={`${compact ? "text-[9px] sm:text-[10px]" : "text-[10px]"} text-slate-400 uppercase`}>
                        Unit Dues
                      </p>
                      <p className="font-bold text-slate-900 dark:text-white">{formatInt(m.sales.duesUnit)}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}
      </main>

      {selectedMemberId && (
        <MemberDetailModal
          memberId={selectedMemberId}
          year={year}
          month={month}
          onClose={() => setSelectedMemberId(null)}
        />
      )}
    </div>
  );
};
