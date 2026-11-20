import React, { useMemo, useState } from "react";
import { PencilSimple, Plus, Trash } from "@phosphor-icons/react";
import { Header } from "@/src/components/ui/Header";
import { Card } from "@/src/components/ui/Card";
import { Modal } from "@/src/components/ui/Modal";
import { Button, DateField, MonthNavigator, NumberField, SelectField } from "@/src/components/ui/Inputs";
import { EmptyState, KeyValue, SectionTitle } from "@/src/components/ui/UIComponents";
import { useToast } from "@/src/components/ui/Toast";
import {
  addCancellation,
  listCancellation,
  listTeam,
  softDeleteCancellation,
  updateCancellation,
} from "@/src/db/repo";
import { cancellationCount } from "@/src/services/calc";
import { CancellationEntry, TeamMember } from "@/src/types";
import { currentYM, displayDate, monthStart, todayYMD } from "@/src/lib/date";
import { formatInt } from "@/src/lib/format";

export const CancellationScreen: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { confirm, showToast } = useToast();
  const [{ year, month }, setYM] = useState(currentYM());
  const [advisorId, setAdvisorId] = useState<number | null>(null);
  const [editing, setEditing] = useState<(CancellationEntry & { advisor_name: string }) | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const team = useMemo(() => listTeam(true), []);
  const list = listCancellation(year, month, advisorId ?? undefined);

  const todayCount = cancellationCount(year, month, advisorId ?? undefined, todayYMD());
  const monthTotal = cancellationCount(year, month, advisorId ?? undefined);

  const perMember = team
    .map((t) => ({ name: t.name, count: cancellationCount(year, month, t.id) }))
    .filter((x) => x.count > 0);

  const handleDelete = async (id: number) => {
    const ok = await confirm({
      title: "Hapus cancellation?",
      confirmText: "Hapus",
      destructive: true,
    });
    if (!ok) return;
    softDeleteCancellation(id);
    setRefreshKey((k) => k + 1);
    showToast("Dihapus", "success");
  };

  const teamOptions = [
    { label: "Semua anggota", value: 0 },
    ...team.map((t) => ({ label: t.name, value: t.id })),
  ];

  return (
    <div className="flex flex-col min-h-screen pb-24">
      <Header title="Cancellation" subtitle="Catatan pembatalan" onBack={onBack} />

      <main className="max-w-md mx-auto w-full px-4 pt-3 flex flex-col gap-3">
        <MonthNavigator year={year} month={month} onChange={(y, m) => setYM({ year: y, month: m })} />

        <SelectField
          label="Filter Anggota"
          value={advisorId ?? 0}
          options={teamOptions}
          onChange={(v) => setAdvisorId(v === 0 ? null : (v as number))}
          testID="cancel-filter"
        />

        <div className="grid grid-cols-2 gap-3">
          <Card className="p-3.5 text-center">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {formatInt(todayCount)}
            </span>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Hari ini</p>
          </Card>
          <Card className="p-3.5 text-center">
            <span className="text-2xl font-black text-[#DC2626] dark:text-[#EF4444]">
              {formatInt(monthTotal)}
            </span>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Bulan ini</p>
          </Card>
        </div>

        {perMember.length > 0 && (
          <Card testID="cancel-permember" className="divide-y divide-[#F3F4F6] dark:divide-[#2D3748] py-1">
            <SectionTitle className="mt-1">Per Anggota</SectionTitle>
            {perMember.map((p) => (
              <KeyValue key={p.name} label={p.name} value={`${formatInt(p.count)}×`} />
            ))}
          </Card>
        )}

        <SectionTitle>Riwayat Pembatalan ({list.length})</SectionTitle>
        {list.length === 0 ? (
          <EmptyState
            title="Belum ada cancellation"
            message="Tekan + untuk menambah catatan pembatalan."
          />
        ) : (
          <div className="flex flex-col gap-2">
            {list.map((e) => (
              <Card key={e.id} testID={`cancel-${e.id}`} className="p-3 flex items-center justify-between gap-3">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    {e.advisor_name}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">{displayDate(e.date)}</p>
                </div>
                <span className="text-sm font-bold text-[#DC2626] dark:text-[#EF4444]">
                  {formatInt(e.qty)}×
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    data-testid={`cancel-edit-${e.id}`}
                    onClick={() => setEditing(e)}
                    className="p-1.5 rounded-lg bg-slate-100 dark:bg-[#1E202B] text-slate-900 dark:text-[#38D9D9] hover:opacity-80 cursor-pointer"
                  >
                    <PencilSimple size={16} />
                  </button>
                  <button
                    type="button"
                    data-testid={`cancel-delete-${e.id}`}
                    onClick={() => handleDelete(e.id)}
                    className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-[#DC2626] dark:text-[#EF4444] hover:opacity-80 cursor-pointer"
                  >
                    <Trash size={16} />
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>

      <div className="fixed bottom-20 right-4 sm:right-auto sm:left-1/2 sm:translate-x-36 z-40">
        <button
          type="button"
          data-testid="cancel-add-fab"
          onClick={() => setIsAdding(true)}
          className="w-13 h-13 rounded-full bg-[#00A3A6] hover:bg-[#008F91] text-white font-black flex items-center justify-center shadow-lg shadow-[#00A3A6]/30 active:scale-95 transition-all cursor-pointer"
          title="Tambah Cancellation"
        >
          <Plus size={24} weight="bold" />
        </button>
      </div>

      {(isAdding || editing) && (
        <CancelEditor
          entry={editing}
          team={team}
          defaultDate={monthStart(year, month)}
          onClose={() => {
            setIsAdding(false);
            setEditing(null);
          }}
          onSaved={() => {
            setIsAdding(false);
            setEditing(null);
            setRefreshKey((k) => k + 1);
            showToast("Tersimpan", "success");
          }}
        />
      )}
    </div>
  );
};

function CancelEditor({
  entry,
  team,
  defaultDate,
  onClose,
  onSaved,
}: {
  entry: (CancellationEntry & { advisor_name: string }) | null;
  team: TeamMember[];
  defaultDate: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { showToast } = useToast();
  const [date, setDate] = useState(entry?.date ?? defaultDate);
  const [advId, setAdvId] = useState<number | null>(entry?.advisor_id ?? team[0]?.id ?? null);
  const [qty, setQty] = useState(entry?.qty ?? 1);

  const handleSave = () => {
    if (!advId) {
      showToast("Pilih anggota", "error");
      return;
    }
    if (qty <= 0) {
      showToast("Jumlah minimal 1", "error");
      return;
    }
    if (entry) updateCancellation(entry.id, date, advId, qty);
    else addCancellation(date, advId, qty);
    onSaved();
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={entry ? "Edit Cancellation" : "Cancellation Baru"}
      subtitle="Catat pembatalan per anggota"
      maxWidth="md"
    >
      <div className="flex flex-col gap-3">
        <DateField label="Tanggal" value={date} onChange={setDate} testID="cancel-date" />
        <SelectField
          label="Anggota"
          value={advId}
          options={team.map((t) => ({ label: t.name, value: t.id }))}
          onChange={(v) => setAdvId(v as number)}
          testID="cancel-advisor"
        />
        <NumberField label="Jumlah" value={qty} onChange={setQty} testID="cancel-qty" />

        <div className="flex gap-2 mt-3">
          <Button title="Batal" variant="ghost" onClick={onClose} className="flex-1" testID="cancel-cancel" />
          <Button title="Simpan" onClick={handleSave} className="flex-1" testID="cancel-save" />
        </div>
      </div>
    </Modal>
  );
}
