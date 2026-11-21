import React, { useState } from "react";
import {
  ArrowDown,
  TrendUp,
  Lightbulb,
  WarningCircle,
  CheckCircle,
  Info,
  Users,
  CalendarCheck,
  Target,
} from "@phosphor-icons/react";
import { Funnel as FunnelData, FunnelRequirements } from "@/src/services/calc";
import { formatInt } from "@/src/lib/format";

function pctLabel(v: number | null): string {
  return v == null ? "-" : `${v.toFixed(1)}%`;
}

export const FunnelView: React.FC<{
  data: FunnelData;
  requirements?: FunnelRequirements;
  compact?: boolean;
}> = ({ data, requirements, compact = false }) => {
  const [showTips, setShowTips] = useState(true);
  const max = Math.max(data.leads, data.appointment, data.show, data.interview, data.duesUnit, 1);

  const steps = [
    { label: "Leads", value: data.leads, color: "bg-slate-800 text-white dark:bg-slate-700" },
    { label: "Appointment", value: data.appointment, conv: data.apptConv, color: "bg-[#00B5B5] text-white font-bold" },
    { label: "Show", value: data.show, conv: data.showRate, color: "bg-[#FF6B35] text-white font-bold" },
    { label: "Interview", value: data.interview, conv: data.interviewRate, color: "bg-emerald-600 text-white font-bold" },
    { label: "Dues Unit", value: data.duesUnit, conv: data.closeRate, color: "bg-[#00A3A6] text-white font-black shadow-sm" },
  ];

  return (
    <div data-testid="funnel-view" className={`flex flex-col ${compact ? "py-0.5 gap-2" : "py-2 gap-4"}`}>
      <div>
        {steps.map((s, i) => {
          const width = `${Math.max(22, (s.value / max) * 100)}%`;
          return (
            <div key={s.label}>
              {i > 0 && (
                <div className={`flex items-center justify-center gap-1.5 text-slate-400 ${compact ? "py-0.5" : "py-1 gap-2"}`}>
                  <ArrowDown size={compact ? 11 : 14} weight="bold" />
                  {s.conv !== undefined && (
                    <span
                      className={`inline-flex items-center rounded-full font-extrabold bg-[#00A3A6]/15 text-[#00A3A6] dark:text-[#38D9D9] border border-[#00A3A6]/30 ${
                        compact ? "px-1.5 py-0 text-[10px]" : "px-2 py-0.5 text-[11px]"
                      }`}
                    >
                      {pctLabel(s.conv ?? null)}
                    </span>
                  )}
                </div>
              )}
              <div className={`flex items-center ${compact ? "gap-2" : "gap-3"}`}>
                <div
                  className={`${s.color} rounded-xl truncate shadow-2xs transition-all duration-300 font-bold ${
                    compact ? "py-1 px-2 text-[11px]" : "py-2 px-3 text-xs"
                  }`}
                  style={{ width }}
                >
                  {s.label}
                </div>
                <span
                  className={`font-extrabold text-slate-900 dark:text-white shrink-0 text-right ${
                    compact ? "text-xs min-w-[36px]" : "text-sm min-w-[48px]"
                  }`}
                >
                  {formatInt(s.value)}
                </span>
              </div>
            </div>
          );
        })}

        <div
          className={`flex items-center justify-between border-t border-slate-100 dark:border-[#282A3A] ${
            compact ? "mt-2 pt-1.5" : "mt-3 pt-2.5"
          }`}
        >
          <span className={`font-bold text-slate-600 dark:text-slate-400 ${compact ? "text-[11px]" : "text-xs"}`}>
            Total Leads → Closing Unit Conversion
          </span>
          <span className={`font-black text-[#00A3A6] dark:text-[#38D9D9] ${compact ? "text-xs" : "text-sm"}`}>
            {pctLabel(data.leadsConv)}
          </span>
        </div>
      </div>

      <div
        className={`grid grid-cols-2 sm:grid-cols-4 pt-1 border-t border-slate-100 dark:border-[#282A3A] ${
          compact ? "gap-1.5" : "gap-2"
        }`}
      >
        <div className={`${compact ? "p-1.5" : "p-2"} rounded-xl bg-slate-50 dark:bg-[#161722] border border-slate-200/80 dark:border-[#282A3A] text-center`}>
          <p className={`${compact ? "text-[9px]" : "text-[10px]"} text-slate-500 uppercase font-semibold`}>Lead → Appt</p>
          <p className={`${compact ? "text-xs" : "text-sm"} font-black text-[#00B5B5] mt-0.5`}>{pctLabel(data.apptConv)}</p>
        </div>
        <div className={`${compact ? "p-1.5" : "p-2"} rounded-xl bg-slate-50 dark:bg-[#161722] border border-slate-200/80 dark:border-[#282A3A] text-center`}>
          <p className={`${compact ? "text-[9px]" : "text-[10px]"} text-slate-500 uppercase font-semibold`}>Appt → Show</p>
          <p className={`${compact ? "text-xs" : "text-sm"} font-black text-[#FF6B35] mt-0.5`}>{pctLabel(data.showRate)}</p>
        </div>
        <div className={`${compact ? "p-1.5" : "p-2"} rounded-xl bg-slate-50 dark:bg-[#161722] border border-slate-200/80 dark:border-[#282A3A] text-center`}>
          <p className={`${compact ? "text-[9px]" : "text-[10px]"} text-slate-500 uppercase font-semibold`}>Show → Interview</p>
          <p className={`${compact ? "text-xs" : "text-sm"} font-black text-emerald-600 dark:text-emerald-400 mt-0.5`}>{pctLabel(data.interviewRate)}</p>
        </div>
        <div className={`${compact ? "p-1.5" : "p-2"} rounded-xl bg-slate-50 dark:bg-[#161722] border border-slate-200/80 dark:border-[#282A3A] text-center`}>
          <p className={`${compact ? "text-[9px]" : "text-[10px]"} text-slate-500 uppercase font-semibold`}>Interview → Close</p>
          <p className={`${compact ? "text-xs" : "text-sm"} font-black text-[#00A3A6] dark:text-[#38D9D9] mt-0.5`}>{pctLabel(data.closeRate)}</p>
        </div>
      </div>

      {requirements && (
        <div className={`flex flex-col border-t border-slate-100 dark:border-[#282A3A] ${compact ? "gap-1.5 pt-1.5" : "gap-2.5 pt-2"}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[#00A3A6] dark:text-[#38D9D9]">
              <Target size={compact ? 14 : 16} weight="bold" />
              <h4 className={`${compact ? "text-[11px]" : "text-xs"} font-bold uppercase tracking-wider text-slate-900 dark:text-white`}>
                Kebutuhan Pipeline Menuju Target Unit
              </h4>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#00A3A6]/15 text-[#00A3A6] dark:text-[#38D9D9]">
              Trend Bulan Ini
            </span>
          </div>

          <div className={`${compact ? "p-2" : "p-3"} rounded-2xl bg-gradient-to-br from-[#00A3A6]/10 via-teal-500/5 to-transparent border border-[#00A3A6]/30`}>
            <div className={`flex justify-between items-center border-b border-teal-500/20 ${compact ? "text-[11px] pb-1.5" : "text-xs pb-2"}`}>
              <span className="text-slate-600 dark:text-slate-300 font-semibold">
                Sisa Target Unit Dibutuhkan:
              </span>
              <span className={`${compact ? "text-xs" : "text-sm"} font-black text-[#00A3A6] dark:text-[#38D9D9]`}>
                {formatInt(requirements.remainingUnit)} Unit
              </span>
            </div>

            <p className={`${compact ? "text-[10px] my-1.5" : "text-[11px] my-2"} text-slate-500 dark:text-slate-400 leading-relaxed`}>
              Berdasarkan rasio konversi tim saat ini, untuk menghasilkan{" "}
              <strong>{formatInt(requirements.remainingUnit)} unit</strong> di sisa{" "}
              <strong>{requirements.daysRemaining} hari</strong>, tim membutuhkan:
            </p>

            <div className={`grid grid-cols-2 ${compact ? "gap-1.5 text-[11px]" : "gap-2 text-xs"}`}>
              <div className={`${compact ? "p-1.5" : "p-2"} rounded-xl bg-white dark:bg-[#1E202B] border border-slate-200/90 dark:border-[#282A3A] shadow-2xs`}>
                <span className={`${compact ? "text-[9px]" : "text-[10px]"} text-slate-400 uppercase font-semibold`}>Butuh Leads</span>
                <p className={`${compact ? "text-sm" : "text-base"} font-black text-slate-900 dark:text-white`}>
                  {formatInt(requirements.neededRemaining.leads)}
                </p>
                <p className={`${compact ? "text-[9.5px]" : "text-[10px]"} text-[#00A3A6] dark:text-[#38D9D9] font-bold mt-0.5`}>
                  ~{requirements.dailyPacing.leads}/hari ({requirements.perAdvisorRemaining.leads}/SA)
                </p>
              </div>

              <div className={`${compact ? "p-1.5" : "p-2"} rounded-xl bg-white dark:bg-[#1E202B] border border-slate-200/90 dark:border-[#282A3A] shadow-2xs`}>
                <span className={`${compact ? "text-[9px]" : "text-[10px]"} text-slate-400 uppercase font-semibold`}>Butuh Appointment</span>
                <p className={`${compact ? "text-sm" : "text-base"} font-black text-slate-900 dark:text-white`}>
                  {formatInt(requirements.neededRemaining.appointment)}
                </p>
                <p className={`${compact ? "text-[9.5px]" : "text-[10px]"} text-[#00B5B5] font-bold mt-0.5`}>
                  ~{requirements.dailyPacing.appointment}/hari ({requirements.perAdvisorRemaining.appointment}/SA)
                </p>
              </div>

              <div className={`${compact ? "p-1.5" : "p-2"} rounded-xl bg-white dark:bg-[#1E202B] border border-slate-200/90 dark:border-[#282A3A] shadow-2xs`}>
                <span className={`${compact ? "text-[9px]" : "text-[10px]"} text-slate-400 uppercase font-semibold`}>Butuh Show (Kehadiran)</span>
                <p className={`${compact ? "text-sm" : "text-base"} font-black text-slate-900 dark:text-white`}>
                  {formatInt(requirements.neededRemaining.show)}
                </p>
                <p className={`${compact ? "text-[9.5px]" : "text-[10px]"} text-[#FF6B35] font-bold mt-0.5`}>
                  ~{requirements.dailyPacing.show}/hari ({requirements.perAdvisorRemaining.show}/SA)
                </p>
              </div>

              <div className={`${compact ? "p-1.5" : "p-2"} rounded-xl bg-white dark:bg-[#1E202B] border border-slate-200/90 dark:border-[#282A3A] shadow-2xs`}>
                <span className={`${compact ? "text-[9px]" : "text-[10px]"} text-slate-400 uppercase font-semibold`}>Butuh Interview</span>
                <p className={`${compact ? "text-sm" : "text-base"} font-black text-slate-900 dark:text-white`}>
                  {formatInt(requirements.neededRemaining.interview)}
                </p>
                <p className={`${compact ? "text-[9.5px]" : "text-[10px]"} text-emerald-600 dark:text-emerald-400 font-bold mt-0.5`}>
                  ~{requirements.dailyPacing.interview}/hari ({requirements.perAdvisorRemaining.interview}/SA)
                </p>
              </div>
            </div>
          </div>

          {requirements.bottleneck && (
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2 text-xs">
              <WarningCircle size={18} weight="fill" className="text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-extrabold text-amber-700 dark:text-amber-400">
                  Prioritas Utama Perbaikan: {requirements.bottleneck.label}
                </p>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">
                  Tahap <strong>{requirements.bottleneck.stage}</strong> saat ini berada di{" "}
                  <strong>{requirements.bottleneck.currentRate}%</strong> (target acuan: ≥{requirements.bottleneck.benchmarkRate}%).
                  Perbaikan di tahap ini akan melipatgandakan closing unit secara tercepat.
                </p>
              </div>
            </div>
          )}

          <div className="mt-1">
            <button
              type="button"
              onClick={() => setShowTips(!showTips)}
              className="flex items-center justify-between w-full py-1 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer hover:text-[#00A3A6]"
            >
              <div className="flex items-center gap-1.5 text-[#00A3A6] dark:text-[#38D9D9]">
                <Lightbulb size={16} weight="fill" />
                <span>Saran & Action Plan Tim SA ({requirements.suggestions.length})</span>
              </div>
              <span className="text-[11px] text-slate-400">
                {showTips ? "Sembunyikan" : "Tampilkan"}
              </span>
            </button>

            {showTips && (
              <div className="flex flex-col gap-2 mt-2">
                {requirements.suggestions.map((s, idx) => (
                  <div
                    key={idx}
                    className={`p-2.5 rounded-xl border text-xs ${
                      s.status === "danger"
                        ? "bg-rose-500/10 border-rose-500/25 dark:bg-rose-950/20 text-slate-900 dark:text-white"
                        : s.status === "warning"
                        ? "bg-amber-500/10 border-amber-500/25 dark:bg-amber-950/20 text-slate-900 dark:text-white"
                        : "bg-emerald-500/10 border-emerald-500/25 dark:bg-emerald-950/20 text-slate-900 dark:text-white"
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold mb-1">
                      <div className="flex items-center gap-1.5">
                        {s.status === "danger" ? (
                          <WarningCircle size={15} weight="fill" className="text-rose-500" />
                        ) : s.status === "warning" ? (
                          <Info size={15} weight="fill" className="text-amber-500" />
                        ) : (
                          <CheckCircle size={15} weight="fill" className="text-emerald-500" />
                        )}
                        <span className="text-[11px] font-black uppercase text-slate-700 dark:text-slate-200">
                          {s.stage}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                        Aktual: {pctLabel(s.actualRate)} ({s.benchmark})
                      </span>
                    </div>

                    <p className="font-bold text-xs text-slate-900 dark:text-white leading-tight">
                      {s.title}
                    </p>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                      {s.desc}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
