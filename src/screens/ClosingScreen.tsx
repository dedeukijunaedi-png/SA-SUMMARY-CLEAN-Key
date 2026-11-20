import React, { useState } from "react";
import { Receipt, Trash, Plus } from "@phosphor-icons/react";
import { Header } from "@/src/components/ui/Header";
import { Card } from "@/src/components/ui/Card";
import { MonthNavigator, SelectField } from "@/src/components/ui/Inputs";
import { EmptyState, StatusPill } from "@/src/components/ui/UIComponents";
import { useToast } from "@/src/components/ui/Toast";
import { listClosings, listTeam, softDeleteClosing, ClosingWithItems } from "@/src/db/repo";
import { currentYM, displayDateTime } from "@/src/lib/date";
import { formatRupiah } from "@/src/lib/format";
import { ClosingFormModal } from "./ClosingFormModal";

export const ClosingScreen: React.FC = () => {
  const { confirm, showToast } = useToast();
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
