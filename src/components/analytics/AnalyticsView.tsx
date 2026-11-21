import React, { useState } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";
import {
  TrendUp,
  TrendDown,
  ChartBar,
  ChartLine,
  Target,
  Sparkle,
  Calendar,
  Flame,
  Lightbulb,
  WarningCircle,
  CheckCircle,
  Info,
} from "@phosphor-icons/react";
import { Card } from "@/src/components/ui/Card";
import {
  getMonthlyAnalyticsData,
  getDailyProductionCumulative,
  calculateFunnelRequirements,
  MonthlyClosingTrend,
  MonthlyProductionTrend,
} from "@/src/services/calc";
import { formatCompactRupiah, formatInt, formatRupiah } from "@/src/lib/format";
import { useAppTheme } from "@/src/lib/theme";

interface AnalyticsViewProps {
  selectedYear: number;
  selectedMonth: number;
  compact?: boolean;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  selectedYear,
  selectedMonth,
  compact = false,
}) => {
  const { activeTheme } = useAppTheme();
  const isDark = activeTheme === "dark";

  const [timeRange, setTimeRange] = useState<number>(6); // 3, 6, or 12 months
  const [closingMetric, setClosingMetric] = useState<"revenue" | "breakdown" | "units">("revenue");
  const [productionView, setProductionView] = useState<"monthly" | "daily">("monthly");

  const analytics = getMonthlyAnalyticsData(selectedYear, selectedMonth, timeRange);
  const dailyPoints = getDailyProductionCumulative(selectedYear, selectedMonth);
  const funnelReq = calculateFunnelRequirements(selectedYear, selectedMonth);

  const totalPeriodGross = analytics.closingTrends.reduce((acc, c) => acc + c.totalGross, 0);
  const totalPeriodAch = analytics.closingTrends.reduce((acc, c) => acc + c.totalAch, 0);
  const totalPeriodUnits = analytics.closingTrends.reduce((acc, c) => acc + c.duesUnit, 0);
  const totalPeriodLeads = analytics.productionTrends.reduce((acc, p) => acc + p.leads, 0);

  const avgMonthlyAch = analytics.closingTrends.length
    ? Math.round(totalPeriodAch / analytics.closingTrends.length)
    : 0;

  const rockstarTeal = "#00A3A6";
  const rockstarTealLight = "#38D9D9";
  const rockstarCoral = "#FF6B35";
  const rockstarDark = isDark ? "#282A3A" : "#1E202B";
  const rockstarCyan = "#00B5B5";
  const rockstarPurple = "#8B5CF6";
  const gridColor = isDark ? "#262837" : "#F1F5F9";
  const textColor = isDark ? "#94A3B8" : "#64748B";

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;
    return (
      <div className="bg-[#111116] text-white p-3 rounded-xl border border-[#00A3A6]/40 shadow-xl text-xs max-w-xs z-50">
        <p className="font-bold text-[#38D9D9] mb-1.5 flex items-center gap-1.5 border-b border-white/10 pb-1">
          <Calendar size={13} weight="fill" />
          {label}
        </p>
        <div className="flex flex-col gap-1">
          {payload.map((entry: any, index: number) => {
            const isRupiah =
              entry.dataKey.toLowerCase().includes("gross") ||
              entry.dataKey.toLowerCase().includes("ach") ||
              entry.dataKey.toLowerCase().includes("target") ||
              entry.dataKey.toLowerCase().includes("revenue");

            return (
              <div key={`tip-${index}`} className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-1.5 text-slate-300">
                  <span
                    className="w-2.5 h-2.5 rounded-full inline-block shrink-0"
                    style={{ backgroundColor: entry.color || entry.fill }}
                  />
                  {entry.name}:
                </span>
                <span className="font-semibold text-white">
                  {isRupiah ? formatRupiah(entry.value) : formatInt(entry.value)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className={`flex flex-col animate-fadeIn ${compact ? "gap-2" : "gap-3.5"}`}>
      <div className="flex items-center justify-between gap-2 px-0.5">
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-6 rounded-lg bg-[#00A3A6] text-white flex items-center justify-center font-black shadow-xs">
            <Flame size={14} weight="fill" />
          </div>
          <span className={`${compact ? "text-[11px]" : "text-xs"} font-black uppercase tracking-wider text-slate-800 dark:text-white`}>
            Performance Insights
          </span>
        </div>

        <div className="flex items-center p-0.5 bg-slate-100 dark:bg-[#1A1B24] rounded-xl border border-slate-200/80 dark:border-[#2A2B38]">
          {[
            { label: "3 Bln", val: 3 },
            { label: "6 Bln", val: 6 },
            { label: "12 Bln", val: 12 },
          ].map((r) => (
            <button
              key={r.val}
              onClick={() => setTimeRange(r.val)}
              className={`${compact ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs"} font-bold rounded-lg transition-all cursor-pointer ${
                timeRange === r.val
                  ? "bg-[#00A3A6] text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className={`grid grid-cols-2 ${compact ? "gap-1.5" : "gap-2.5"}`}>
        <Card className={`${compact ? "!p-2" : "p-3"} bg-gradient-to-br from-white to-teal-50/40 dark:from-[#0F172A] dark:to-[#0B2545]/40 border-[#00A3A6]/30`}>
          <div className={`flex items-center justify-between ${compact ? "text-[11px]" : "text-xs"}`}>
            <span className="text-slate-500 dark:text-slate-400 font-medium">Total Ach ({timeRange} Bln)</span>
            <div
              className={`flex items-center gap-0.5 font-bold ${compact ? "text-[10px]" : "text-[11px]"} px-1.5 py-0.5 rounded ${
                analytics.momRevenueGrowth >= 0
                  ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                  : "bg-rose-500/15 text-rose-600 dark:text-rose-400"
              }`}
            >
              {analytics.momRevenueGrowth >= 0 ? <TrendUp size={12} weight="bold" /> : <TrendDown size={12} weight="bold" />}
              <span>{analytics.momRevenueGrowth > 0 ? `+${analytics.momRevenueGrowth}%` : `${analytics.momRevenueGrowth}%`}</span>
            </div>
          </div>
          <p className={`${compact ? "text-base" : "text-lg"} font-black text-slate-900 dark:text-white mt-1 tracking-tight`}>
            {formatCompactRupiah(totalPeriodAch)}
          </p>
          <p className={`${compact ? "text-[10px]" : "text-[11px]"} text-slate-500 dark:text-slate-400 mt-0.5`}>
            Rata-rata {formatCompactRupiah(avgMonthlyAch)}/bln
          </p>
        </Card>

        <Card className={`${compact ? "!p-2" : "p-3"} bg-gradient-to-br from-white to-amber-50/40 dark:from-[#171821] dark:to-[#1E1B15] border-amber-400/20`}>
          <div className={`flex items-center justify-between ${compact ? "text-[11px]" : "text-xs"}`}>
            <span className="text-slate-500 dark:text-slate-400 font-medium">Produksi Leads</span>
            <div
              className={`flex items-center gap-0.5 font-bold ${compact ? "text-[10px]" : "text-[11px]"} px-1.5 py-0.5 rounded ${
                analytics.momLeadsGrowth >= 0
                  ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                  : "bg-rose-500/15 text-rose-600 dark:text-rose-400"
              }`}
            >
              {analytics.momLeadsGrowth >= 0 ? <TrendUp size={12} weight="bold" /> : <TrendDown size={12} weight="bold" />}
              <span>{analytics.momLeadsGrowth > 0 ? `+${analytics.momLeadsGrowth}%` : `${analytics.momLeadsGrowth}%`}</span>
            </div>
          </div>
          <p className={`${compact ? "text-base" : "text-lg"} font-black text-slate-900 dark:text-white mt-1 tracking-tight`}>
            {formatInt(totalPeriodLeads)}
          </p>
          <p className={`${compact ? "text-[10px]" : "text-[11px]"} text-slate-500 dark:text-slate-400 mt-0.5`}>
            {formatInt(totalPeriodUnits)} unit closing dues
          </p>
        </Card>
      </div>

      <Card className={`flex flex-col ${compact ? "!p-2.5 gap-2" : "p-3.5 gap-3"}`}>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <div className="flex items-center gap-1.5">
              <ChartBar size={18} weight="fill" className="text-[#00A3A6]" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Tren Closing Bulanan
              </h3>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Perkembangan penjualan & target MTD
            </p>
          </div>

          <div className="flex items-center p-0.5 bg-slate-100 dark:bg-[#1A1B24] rounded-lg border border-slate-200 dark:border-[#2A2B38] text-[11px]">
            <button
              onClick={() => setClosingMetric("revenue")}
              className={`px-2 py-0.5 font-bold rounded-md transition-all cursor-pointer ${
                closingMetric === "revenue"
                  ? "bg-[#00A3A6] text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400"
              }`}
            >
              Revenue
            </button>
            <button
              onClick={() => setClosingMetric("breakdown")}
              className={`px-2 py-0.5 font-bold rounded-md transition-all cursor-pointer ${
                closingMetric === "breakdown"
                  ? "bg-[#00A3A6] text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400"
              }`}
            >
              Dues vs Priv
            </button>
            <button
              onClick={() => setClosingMetric("units")}
              className={`px-2 py-0.5 font-bold rounded-md transition-all cursor-pointer ${
                closingMetric === "units"
                  ? "bg-[#00A3A6] text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400"
              }`}
            >
              Unit
            </button>
          </div>
        </div>

        <div className={`w-full ${compact ? "h-52" : "h-64"} mt-1`}>
          <ResponsiveContainer width="100%" height="100%">
            {closingMetric === "revenue" ? (
              <ComposedChart
                data={analytics.closingTrends}
                margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis dataKey="label" tick={{ fill: textColor, fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fill: textColor, fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(val) => formatCompactRupiah(val)}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }}
                  formatter={(value) => <span className="text-slate-700 dark:text-slate-300 font-medium">{value}</span>}
                />
                <Bar
                  dataKey="totalGross"
                  name="Gross Revenue"
                  fill={isDark ? "#333649" : "#E2E8F0"}
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="totalAch"
                  name="Achievement"
                  fill="#00A3A6"
                  radius={[4, 4, 0, 0]}
                />
                <Line
                  type="monotone"
                  dataKey="targetAcademy"
                  name="Target Akademi"
                  stroke="#EF4444"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={{ r: 3, fill: "#EF4444" }}
                />
              </ComposedChart>
            ) : closingMetric === "breakdown" ? (
              <ComposedChart
                data={analytics.closingTrends}
                margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis dataKey="label" tick={{ fill: textColor, fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fill: textColor, fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(val) => formatCompactRupiah(val)}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }}
                  formatter={(value) => <span className="text-slate-700 dark:text-slate-300 font-medium">{value}</span>}
                />
                <Bar dataKey="duesAch" name="Dues Ach" fill="#00A3A6" stackId="ach" radius={[0, 0, 0, 0]} />
                <Bar dataKey="privAch" name="Private Ach" fill="#FF6B35" stackId="ach" radius={[4, 4, 0, 0]} />
                <Line
                  type="monotone"
                  dataKey="targetDues"
                  name="Target Dues"
                  stroke="#F97316"
                  strokeWidth={2}
                  strokeDasharray="3 3"
                  dot={{ r: 3, fill: "#F97316" }}
                />
              </ComposedChart>
            ) : (
              <ComposedChart
                data={analytics.closingTrends}
                margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis dataKey="label" tick={{ fill: textColor, fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fill: textColor, fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }}
                  formatter={(value) => <span className="text-slate-700 dark:text-slate-300 font-medium">{value}</span>}
                />
                <Bar
                  dataKey="duesUnit"
                  name="Dues Unit Closed"
                  fill="#00A3A6"
                  radius={[5, 5, 0, 0]}
                />
              </ComposedChart>
            )}
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className={`flex flex-col ${compact ? "!p-2.5 gap-2" : "p-3.5 gap-3"}`}>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <div className="flex items-center gap-1.5">
              <ChartLine size={18} weight="fill" className="text-amber-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Pertumbuhan Produksi
              </h3>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Aktivitas pipeline & konversi tim
            </p>
          </div>

          <div className="flex items-center p-0.5 bg-slate-100 dark:bg-[#1A1B24] rounded-lg border border-slate-200 dark:border-[#2A2B38] text-[11px]">
            <button
              onClick={() => setProductionView("monthly")}
              className={`px-2 py-0.5 font-bold rounded-md transition-all cursor-pointer ${
                productionView === "monthly"
                  ? "bg-[#00A3A6] text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400"
              }`}
            >
              Bulanan
            </button>
            <button
              onClick={() => setProductionView("daily")}
              className={`px-2 py-0.5 font-bold rounded-md transition-all cursor-pointer ${
                productionView === "daily"
                  ? "bg-[#00A3A6] text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400"
              }`}
            >
              Kumulatif MTD
            </button>
          </div>
        </div>

        <div className={`w-full ${compact ? "h-52" : "h-64"} mt-1`}>
          <ResponsiveContainer width="100%" height="100%">
            {productionView === "monthly" ? (
              <ComposedChart
                data={analytics.productionTrends}
                margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis dataKey="label" tick={{ fill: textColor, fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: textColor, fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }}
                  formatter={(value) => <span className="text-slate-700 dark:text-slate-300 font-medium">{value}</span>}
                />
                <Area
                  type="monotone"
                  dataKey="leads"
                  name="Leads"
                  fill={isDark ? "rgba(0, 163, 166, 0.12)" : "rgba(0, 163, 166, 0.18)"}
                  stroke="#00A3A6"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="appointment"
                  name="Appt"
                  stroke="#00B5B5"
                  strokeWidth={2}
                  dot={{ r: 3, fill: "#00B5B5" }}
                />
                <Line
                  type="monotone"
                  dataKey="show"
                  name="Show"
                  stroke="#FF6B35"
                  strokeWidth={2}
                  dot={{ r: 3, fill: "#FF6B35" }}
                />
                <Line
                  type="monotone"
                  dataKey="interview"
                  name="Interview"
                  stroke="#10B981"
                  strokeWidth={2}
                  dot={{ r: 3, fill: "#10B981" }}
                />
                <Line
                  type="monotone"
                  dataKey="duesUnit"
                  name="Closing Unit"
                  stroke="#00A3A6"
                  strokeWidth={3}
                  dot={{ r: 4, fill: "#00A3A6" }}
                />
              </ComposedChart>
            ) : (
              <ComposedChart
                data={dailyPoints}
                margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fill: textColor, fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  interval={Math.ceil(dailyPoints.length / 7)}
                />
                <YAxis tick={{ fill: textColor, fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }}
                  formatter={(value) => <span className="text-slate-700 dark:text-slate-300 font-medium">{value}</span>}
                />
                <Area
                  type="monotone"
                  dataKey="cumLeads"
                  name="Kumulatif Leads"
                  fill={isDark ? "rgba(0, 163, 166, 0.12)" : "rgba(0, 163, 166, 0.18)"}
                  stroke="#00A3A6"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="cumAppt"
                  name="Kumulatif Appt"
                  stroke="#00B5B5"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="cumShow"
                  name="Kumulatif Show"
                  stroke="#FF6B35"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="cumClosings"
                  name="Kumulatif Closing"
                  stroke="#10B981"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: "#10B981" }}
                />
              </ComposedChart>
            )}
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className={`flex flex-col ${compact ? "!p-2.5 gap-2" : "p-3.5 gap-3"}`}>
        <div>
          <div className="flex items-center gap-1.5">
            <Sparkle size={18} weight="fill" className="text-[#00A3A6]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              Efisiensi Konversi (%)
            </h3>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Rasio kelolosan pipeline per bulan
          </p>
        </div>

        <div className={`w-full ${compact ? "h-44" : "h-52"}`}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={analytics.productionTrends}
              margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
              <XAxis dataKey="label" tick={{ fill: textColor, fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fill: textColor, fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                unit="%"
                domain={[0, "auto"]}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }}
                formatter={(value) => <span className="text-slate-700 dark:text-slate-300 font-medium">{value}</span>}
              />
              <Line
                type="monotone"
                dataKey="apptConv"
                name="Lead → Appt %"
                stroke="#00B5B5"
                strokeWidth={2}
                dot={{ r: 3, fill: "#00B5B5" }}
              />
              <Line
                type="monotone"
                dataKey="showRate"
                name="Appt → Show %"
                stroke="#FF6B35"
                strokeWidth={2}
                dot={{ r: 3, fill: "#FF6B35" }}
              />
              <Line
                type="monotone"
                dataKey="closeRate"
                name="Interview → Close %"
                stroke="#00A3A6"
                strokeWidth={2.5}
                dot={{ r: 4, fill: "#00A3A6" }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className={`flex flex-col ${compact ? "!p-2.5 gap-2" : "p-4 gap-3.5"} border-[#00A3A6]/30 bg-gradient-to-br from-white via-white to-teal-50/30 dark:from-[#171822] dark:via-[#171822] dark:to-[#0F172A]`}>
        <div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Target size={18} weight="bold" className="text-[#00A3A6]" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Kebutuhan Pipeline Berdasarkan Trend
              </h3>
            </div>
            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-[#00A3A6]/15 text-[#00A3A6] dark:text-[#38D9D9]">
              {funnelReq.daysRemaining} Hari Tersisa
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Estimasi volume produksi yang wajib dipenuhi untuk mencapai target sisa {formatInt(funnelReq.remainingUnit)} unit bulan ini
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#1E202B] border border-slate-200/80 dark:border-[#282A3A]">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Butuh Leads</span>
            <p className="text-xl font-black text-slate-900 dark:text-white mt-0.5">
              {formatInt(funnelReq.neededRemaining.leads)}
            </p>
            <p className="text-[10px] text-[#00A3A6] dark:text-[#38D9D9] font-bold mt-1">
              ~{funnelReq.dailyPacing.leads}/hari ({funnelReq.perAdvisorRemaining.leads}/SA)
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#1E202B] border border-slate-200/80 dark:border-[#282A3A]">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Butuh Appointment</span>
            <p className="text-xl font-black text-slate-900 dark:text-white mt-0.5">
              {formatInt(funnelReq.neededRemaining.appointment)}
            </p>
            <p className="text-[10px] text-[#00B5B5] font-bold mt-1">
              ~{funnelReq.dailyPacing.appointment}/hari ({funnelReq.perAdvisorRemaining.appointment}/SA)
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#1E202B] border border-slate-200/80 dark:border-[#282A3A]">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Butuh Show (Hadir)</span>
            <p className="text-xl font-black text-slate-900 dark:text-white mt-0.5">
              {formatInt(funnelReq.neededRemaining.show)}
            </p>
            <p className="text-[10px] text-[#FF6B35] font-bold mt-1">
              ~{funnelReq.dailyPacing.show}/hari ({funnelReq.perAdvisorRemaining.show}/SA)
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#1E202B] border border-slate-200/80 dark:border-[#282A3A]">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Butuh Interview</span>
            <p className="text-xl font-black text-slate-900 dark:text-white mt-0.5">
              {formatInt(funnelReq.neededRemaining.interview)}
            </p>
            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-1">
              ~{funnelReq.dailyPacing.interview}/hari ({funnelReq.perAdvisorRemaining.interview}/SA)
            </p>
          </div>
        </div>

        {funnelReq.bottleneck && (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2.5 text-xs">
            <WarningCircle size={18} weight="fill" className="text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-extrabold text-amber-800 dark:text-amber-400">
                Fokus Bottleneck Terbesar: {funnelReq.bottleneck.label}
              </p>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                Tahap <strong>{funnelReq.bottleneck.stage}</strong> saat ini berada di{" "}
                <strong>{funnelReq.bottleneck.currentRate}%</strong> (acuan benchmark: ≥{funnelReq.bottleneck.benchmarkRate}%).
              </p>
            </div>
          </div>
        )}

        <div className="pt-2 border-t border-slate-100 dark:border-[#282A3A]">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white mb-2">
            <Lightbulb size={16} weight="fill" className="text-[#00A3A6]" />
            <span>Saran & Action Plan Tim SA ({funnelReq.suggestions.length})</span>
          </div>

          <div className="flex flex-col gap-2">
            {funnelReq.suggestions.map((s, idx) => (
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
                      <WarningCircle size={14} weight="fill" className="text-rose-500" />
                    ) : s.status === "warning" ? (
                      <Info size={14} weight="fill" className="text-amber-500" />
                    ) : (
                      <CheckCircle size={14} weight="fill" className="text-emerald-500" />
                    )}
                    <span className="text-[11px] font-black uppercase text-slate-700 dark:text-slate-200">
                      {s.stage}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                    Aktual: {s.actualRate != null ? `${s.actualRate.toFixed(1)}%` : "—"} ({s.benchmark})
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
        </div>
      </Card>
    </div>
  );
};
