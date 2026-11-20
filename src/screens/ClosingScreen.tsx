import React, { useState } from "react";
import { Receipt, Trash, Plus, ChartBar } from "@phosphor-icons/react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from "recharts";
import { Header } from "@/src/components/ui/Header";
import { Card } from "@/src/components/ui/Card";
import { MonthNavigator, SelectField } from "@/src/components/ui/Inputs";
import { EmptyState, StatusPill } from "@/src/components/ui/UIComponents";
import { useToast } from "@/src/components/ui/Toast";
import { listClosings, listTeam, softDeleteClosing, ClosingWithItems } from "@/src/db/repo";
import { currentYM, displayDateTime } from "@/src/lib/date";
import { formatInt, formatRupiah } from "@/src/lib/format";
import { useAppTheme } from "@/src/lib/theme";
import { ClosingFormModal } from "./ClosingFormModal";

interface ProductSummaryRow {
  kind: "DUES" | "PRIVATE";
  productName: string;
  quantity: number;
  actualQty: number;
  delayQty: number;
  decomQty: number;
  grossRevenue: number;
  achievementRevenue: number;
}

export const ClosingScreen: React.FC = () => {
  const { confirm, showToast } = useToast();
  const { activeTheme } = useAppTheme();
  const isDark = activeTheme === "dark";
  const [{ year, month }, setYM] = useState(currentYM());
  const [advisorId, setAdvisorId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const team = listTeam(true);
  const list: ClosingWithItems[] = listClosings(year, month, advisorId ?? undefined);

  const duesGross = list.reduce(
    (a, c) => a + c.items.filter((i) => i.kind === "DUES").reduce((s, i) => s + i.gross_revenue, 0),
    0
  );
  const duesAch = list.reduce(
    (a, c) => a + c.items.filter((i) => i.kind === "DUES").reduce((s, i) => s + i.achievement_revenue, 0),
    0
  );
  const duesUnits = list.reduce(
    (a, c) => a + c.items.filter((i) => i.kind === "DUES").reduce((s, i) => s + i.quantity, 0),
    0
  );
  const privGross = list.reduce(
    (a, c) => a + c.items.filter((i) => i.kind === "PRIVATE").reduce((s, i) => s + i.gross_revenue, 0),
    0
  );
  const privAch = list.reduce(
    (a, c) => a + c.items.filter((i) => i.kind === "PRIVATE").reduce((s, i) => s + i.achievement_revenue, 0),
    0
  );

  const productMap = new Map<string, ProductSummaryRow>();
  for (const c of list) {
    for (const item of c.items) {
      const kind: "DUES" | "PRIVATE" = item.kind === "PRIVATE" ? "PRIVATE" : "DUES";
      const key = `${kind}::${item.product_name}`;
      const cur = productMap.get(key) ?? {
        kind,
        productName: item.product_name,
        quantity: 0,
        actualQty: 0,
        delayQty: 0,
        decomQty: 0,
        grossRevenue: 0,
        achievementRevenue: 0,
      };
      const qty = Number(item.quantity ?? 0);
      cur.quantity += qty;
      if (item.status === "Actual") cur.actualQty += qty;
      else if (item.status === "Delay") cur.delayQty += qty;
      else if (item.status === "Decom") cur.decomQty += qty;
      cur.grossRevenue += Number(item.gross_revenue ?? 0);
      cur.achievementRevenue += Number(item.achievement_revenue ?? 0);
      productMap.set(key, cur);
    }
  }
  const productBreakdown = Array.from(productMap.values()).sort((a, b) => {
    if (a.kind !== b.kind) return a.kind === "DUES" ? -1 : 1;
    if (b.quantity !== a.quantity) return b.quantity - a.quantity;
    return a.productName.localeCompare(b.productName);
  });
  const privUnits = productBreakdown
    .filter((p) => p.kind === "PRIVATE")
    .reduce((s, p) => s + p.quantity, 0);

  const nameCounts = new Map<string, number>();
  for (const p of productBreakdown) {
    nameCounts.set(p.productName, (nameCounts.get(p.productName) ?? 0) + 1);
  }
  const chartData = productBreakdown.map((p) => ({
    ...p,
    chartLabel:
      (nameCounts.get(p.productName) ?? 0) > 1
        ? `${p.productName} (${p.kind === "PRIVATE" ? "Private" : "Dues"})`
        : p.productName,
    kindLabel: p.kind === "PRIVATE" ? "Private" : "Dues",
  }));
  const chartHeight = Math.max(120, chartData.length * 36 + 32);
  const gridColor = isDark ? "#262837" : "#E2E8F0";
  const axisTextColor = isDark ? "#CBD5E1" : "#334155";
  const barTeal = "#00A3A6";
  const barPurple = "#8B5CF6";

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const ok = await confirm({
      title: "Hapus closing?",
      message: "Closing akan dihapus dan tidak muncul di laporan.",
      confirmText: "Hapus",
      destructive: true,
    });
    if (!ok) return;
    softDeleteClosing(id);
    showToast("Closing dihapus", "success");
    setRefreshKey((k) => k + 1);
  };

  const teamOptions = [
    { label: "Semua SA", value: 0 },
    ...team.map((t) => ({ label: t.name, value: t.id })),
  ];

  return (
    <div className="flex flex-col min-h-screen pb-24">
      <Header title="Closing" subtitle="Catatan penjualan harian team" />

      <main className="max-w-md mx-auto w-full px-4 pt-3 flex flex-col gap-3">
        <MonthNavigator year={year} month={month} onChange={(y, m) => setYM({ year: y, month: m })} />

        <SelectField
          label="Filter SA"
          value={advisorId ?? 0}
          options={teamOptions}
          onChange={(v) => setAdvisorId(v === 0 ? null : (v as number))}
          testID="closing-filter-sa"
        />

        <Card testID="closing-summary" className="grid grid-cols-2 gap-3 p-3 border-[#00A3A6]/30">
          <div className="p-2.5 rounded-xl bg-teal-50/60 dark:bg-[#132225]/60 border border-teal-200/70 dark:border-teal-900/50">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#00A3A6] dark:text-[#38D9D9]">
                Dues Membership
              </span>
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                {duesUnits} unit
              </span>
            </div>
            <div className="flex flex-col gap-0.5">
              <div>
                <span className="text-[10px] text-slate-400 block">Gross</span>
                <p className="text-sm font-extrabold text-slate-900 dark:text-white">{formatRupiah(duesGross)}</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Achievement (Aktual)</span>
                <p className="text-sm font-black text-[#00A3A6] dark:text-[#38D9D9]">{formatRupiah(duesAch)}</p>
              </div>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-purple-50/60 dark:bg-[#1F172C]/60 border border-purple-200/70 dark:border-purple-900/50">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-purple-600 dark:text-purple-400">
                Private Class
              </span>
            </div>
            <div className="flex flex-col gap-0.5">
              <div>
                <span className="text-[10px] text-slate-400 block">Gross</span>
                <p className="text-sm font-extrabold text-slate-900 dark:text-white">{formatRupiah(privGross)}</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Achievement (Aktual)</span>
                <p className="text-sm font-black text-purple-600 dark:text-purple-400">{formatRupiah(privAch)}</p>
              </div>
            </div>
          </div>
        </Card>

        <Card testID="closing-product-chart" className="p-3.5">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-1.5">
              <ChartBar size={16} weight="fill" className="text-[#00A3A6] dark:text-[#38D9D9]" />
              <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-200">
                Grafik Distribusi Produk
              </span>
            </div>
            {chartData.length > 0 && (
              <div className="flex items-center gap-2.5 text-[10.5px] font-bold">
                <span className="inline-flex items-center gap-1 text-slate-700 dark:text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-xs inline-block bg-[#00A3A6]" />
                  Dues
                </span>
                <span className="inline-flex items-center gap-1 text-slate-700 dark:text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-xs inline-block bg-[#8B5CF6]" />
                  Private
                </span>
              </div>
            )}
          </div>

          {chartData.length === 0 ? (
            <p className="text-xs text-slate-400 dark:text-slate-500 py-1">Belum ada closing</p>
          ) : (
            <div className="w-full" style={{ height: `${chartHeight}px` }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  layout="vertical"
                  margin={{ top: 4, right: 18, left: 4, bottom: 4 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} horizontal={false} />
                  <XAxis
                    type="number"
                    allowDecimals={false}
                    tick={{ fill: axisTextColor, fontSize: 10.5 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="chartLabel"
                    width={116}
                    interval={0}
                    tick={{ fill: axisTextColor, fontSize: 10.5, fontWeight: 600 }}
                    tickFormatter={(v: string) => (v.length > 16 ? `${v.slice(0, 15)}…` : v)}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: isDark ? "rgba(255,255,255,0.05)" : "rgba(15,23,42,0.04)" }}
                    content={({ active, payload }) => {
                      if (!active || !payload || !payload.length) return null;
                      const d = payload[0].payload as (typeof chartData)[number];
                      return (
                        <div
                          className={`p-2.5 rounded-xl border shadow-lg text-xs max-w-[230px] ${
                            isDark
                              ? "bg-[#111116] text-white border-[#00A3A6]/40"
                              : "bg-white text-slate-900 border-slate-200"
                          }`}
                        >
                          <div className="flex items-center gap-1.5 font-bold mb-1">
                            <span
                              className="w-2.5 h-2.5 rounded-xs shrink-0"
                              style={{ backgroundColor: d.kind === "PRIVATE" ? barPurple : barTeal }}
                            />
                            <span className="break-words">{d.productName}</span>
                          </div>
                          <p className={`text-[10.5px] font-semibold mb-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                            Kategori: {d.kindLabel}
                          </p>
                          <div className="flex flex-col gap-0.5 text-[11px]">
                            <div className="flex justify-between gap-3">
                              <span className={isDark ? "text-slate-300" : "text-slate-600"}>Total Jumlah:</span>
                              <span className="font-black">{formatInt(d.quantity)} unit</span>
                            </div>
                            <div className="flex justify-between gap-3">
                              <span className={isDark ? "text-slate-300" : "text-slate-600"}>Actual / Delay / Decom:</span>
                              <span className="font-semibold">
                                {formatInt(d.actualQty)} / {formatInt(d.delayQty)} / {formatInt(d.decomQty)}
                              </span>
                            </div>
                            <div className="flex justify-between gap-3">
                              <span className={isDark ? "text-slate-300" : "text-slate-600"}>Achievement:</span>
                              <span className="font-bold text-[#00A3A6] dark:text-[#38D9D9]">
                                {formatRupiah(d.achievementRevenue)}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    }}
                  />
                  <Bar dataKey="quantity" name="Jumlah" radius={[0, 6, 6, 0]} barSize={20}>
                    {chartData.map((entry) => (
                      <Cell
                        key={`${entry.kind}::${entry.productName}`}
                        fill={entry.kind === "PRIVATE" ? barPurple : barTeal}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        <Card testID="closing-product-summary" className="p-3.5">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300">
              Daftar Produk Closing
            </span>
            {productBreakdown.length > 0 && (
              <span className="text-[11px] font-bold text-[#00A3A6] dark:text-[#38D9D9]">
                {formatInt(duesUnits)} Dues{privUnits > 0 ? ` · ${formatInt(privUnits)} Private` : ""}
              </span>
            )}
          </div>

          {productBreakdown.length === 0 ? (
            <p className="text-xs text-slate-400 dark:text-slate-500 py-1">Belum ada closing</p>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-[#282A3A]">
              {productBreakdown.map((p) => (
                <div key={`${p.kind}::${p.productName}`} className="py-2 first:pt-0 last:pb-0 flex flex-col gap-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span
                        className={`shrink-0 px-1.5 py-0.5 rounded text-[9.5px] font-bold uppercase ${
                          p.kind === "PRIVATE"
                            ? "bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60"
                            : "bg-teal-50 text-[#00A3A6] dark:bg-teal-950/50 dark:text-[#38D9D9] border border-teal-200 dark:border-teal-800/60"
                        }`}
                      >
                        {p.kind === "PRIVATE" ? "Private" : "Dues"}
                      </span>
                      <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {p.productName}
                      </span>
                    </div>
                    <span className="shrink-0 text-xs font-black text-slate-900 dark:text-white">
                      {formatInt(p.quantity)} unit
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2 text-[10.5px] text-slate-500 dark:text-slate-400">
                    <span>
                      Actual: <strong className="text-emerald-600 dark:text-emerald-400">{formatInt(p.actualQty)}</strong>
                      {" · "}Delay: <strong className="text-amber-600 dark:text-amber-400">{formatInt(p.delayQty)}</strong>
                      {" · "}Decom: <strong className="text-rose-600 dark:text-rose-400">{formatInt(p.decomQty)}</strong>
                    </span>
                    <span className="shrink-0 font-semibold text-slate-600 dark:text-slate-300">
                      {formatRupiah(p.achievementRevenue)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {list.length === 0 ? (
          <EmptyState
            title="Belum ada closing"
            message="Tekan tombol Tambah Closing untuk mencatat closing pertama."
            icon={<Receipt size={40} />}
          />
        ) : (
          <div className="flex flex-col gap-2.5">
            {list.map((c) => {
              const cDuesGross = c.items.filter((i) => i.kind === "DUES").reduce((s, i) => s + i.gross_revenue, 0);
              const cDuesAch = c.items.filter((i) => i.kind === "DUES").reduce((s, i) => s + i.achievement_revenue, 0);
              const cPrivGross = c.items.filter((i) => i.kind === "PRIVATE").reduce((s, i) => s + i.gross_revenue, 0);
              const cPrivAch = c.items.filter((i) => i.kind === "PRIVATE").reduce((s, i) => s + i.achievement_revenue, 0);
              const hasDues = c.items.some((i) => i.kind === "DUES");
              const hasPriv = c.items.some((i) => i.kind === "PRIVATE");

              return (
                <Card
                  key={c.id}
                  testID={`closing-${c.id}`}
                  onClick={() => setEditingId(c.id)}
                  className="flex flex-col gap-2 p-3.5 hover:border-[#00A3A6]/40 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        {c.advisor_name}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {displayDateTime(c.date, c.time)} · {c.type.replace("_", " + ")}
                      </p>
                    </div>
                    <div className="text-right flex flex-col gap-1">
                      {hasDues && (
                        <div>
                          <p className="text-xs font-bold text-slate-900 dark:text-white">
                            Dues: {formatRupiah(cDuesGross)}
                          </p>
                          <p className="text-[10.5px] font-bold text-[#00A3A6] dark:text-[#38D9D9]">
                            Ach {formatRupiah(cDuesAch)}
                          </p>
                        </div>
                      )}
                      {hasPriv && (
                        <div>
                          <p className="text-xs font-bold text-slate-900 dark:text-white">
                            Priv: {formatRupiah(cPrivGross)}
                          </p>
                          <p className="text-[10.5px] font-bold text-purple-600 dark:text-purple-400">
                            Ach {formatRupiah(cPrivAch)}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1 pt-2 border-t border-slate-100 dark:border-[#282A3A]">
                    {c.items.map((i) => (
                      <div key={i.id} className="flex items-center justify-between text-xs">
                        <span className="text-slate-700 dark:text-slate-300 font-medium truncate max-w-[200px]">
                          {i.kind === "PRIVATE" ? "🎯 " : ""}
                          {i.product_name} × {i.quantity}
                        </span>
                        <StatusPill status={i.status} />
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-1 text-xs">
                    {c.notes ? (
                      <span className="text-slate-400 italic text-[11px] truncate max-w-[200px]">
                        "{c.notes}"
                      </span>
                    ) : <span />}
                    <button
                      type="button"
                      data-testid={`closing-delete-${c.id}`}
                      onClick={(e) => handleDelete(c.id, e)}
                      className="inline-flex items-center gap-1 text-[#DC2626] dark:text-[#EF4444] font-semibold hover:underline cursor-pointer"
                    >
                      <Trash size={13} />
                      Hapus
                    </button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      <div className="fixed bottom-20 right-4 sm:right-auto sm:left-1/2 sm:translate-x-36 z-40">
        <button
          type="button"
          data-testid="closing-add-fab"
          onClick={() => setIsAdding(true)}
          className="w-13 h-13 rounded-full bg-[#00A3A6] hover:bg-[#008F91] text-white font-black flex items-center justify-center shadow-lg shadow-[#00A3A6]/30 active:scale-95 transition-all cursor-pointer"
          title="Tambah Closing Baru"
        >
          <Plus size={24} weight="bold" />
        </button>
      </div>

      {(isAdding || editingId !== null) && (
        <ClosingFormModal
          editId={editingId}
          onClose={() => {
            setIsAdding(false);
            setEditingId(null);
          }}
          onSaved={() => {
            setIsAdding(false);
            setEditingId(null);
            setRefreshKey((k) => k + 1);
          }}
        />
      )}
    </div>
  );
};
