import React, { useEffect, useState } from "react";
import {
  CalendarBlank,
  CheckCircle,
  Lightning,
  PencilSimple,
  Plus,
  Rows,
  Trash,
} from "@phosphor-icons/react";
import { Header } from "@/src/components/ui/Header";
import { Card } from "@/src/components/ui/Card";
import { Modal } from "@/src/components/ui/Modal";
import { Button, DateField, MonthNavigator, NumberField, SelectField } from "@/src/components/ui/Inputs";
import { EmptyState, KeyValue, SectionTitle } from "@/src/components/ui/UIComponents";
import { useToast } from "@/src/components/ui/Toast";
import {
  addCoed,
  getCoedByDate,
  listCoed,
  saveCoedBatchForDate,
  softDeleteCoed,
  updateCoed,
} from "@/src/db/repo";
import { coedTotals } from "@/src/services/calc";
import { CoedCategory, COED_CATEGORIES, CoedEntry } from "@/src/types";
import { currentYM, displayDate, monthStart, todayYMD } from "@/src/lib/date";
import { formatRupiah } from "@/src/lib/format";

const catLabel = (c: CoedCategory) =>
  COED_CATEGORIES.find((x) => x.key === c)?.label ?? c;

export const CoedScreen: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { confirm, showToast } = useToast();
  const [{ year, month }, setYM] = useState(currentYM());
  const [editing, setEditing] = useState<CoedEntry | null>(null);
  const [isAddingSingle, setIsAddingSingle] = useState(false);
  const [isBatchOpen, setIsBatchOpen] = useState(false);
  const [batchInitialDate, setBatchInitialDate] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const list = listCoed(year, month);
  const totals = coedTotals(year, month);

  const defaultDate = () => {
    const n = new Date();
    if (n.getFullYear() === year && n.getMonth() + 1 === month) {
      return todayYMD();
    }
    return monthStart(year, month);
  };

  const handleDelete = async (id: number) => {
    const ok = await confirm({
      title: "Hapus entri COED?",
      confirmText: "Hapus",
      destructive: true,
    });
    if (!ok) return;
    softDeleteCoed(id);
    setRefreshKey((k) => k + 1);
    showToast("Entri dihapus", "success");
  };

  const openBatch = (date?: string) => {
    setBatchInitialDate(date || defaultDate());
    setIsBatchOpen(true);
  };

  return (
    <div className="flex flex-col min-h-screen pb-24">
      <Header title="COED" subtitle="Collection & Earnings Data" onBack={onBack} />

      <main className="max-w-md mx-auto w-full px-4 pt-3 flex flex-col gap-3">
        <MonthNavigator year={year} month={month} onChange={(y, m) => setYM({ year: y, month: m })} />

        <div className="bg-gradient-to-r from-teal-500/15 to-emerald-500/10 border border-teal-500/30 rounded-2xl p-3.5 flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-teal-500 text-white flex items-center justify-center shrink-0 shadow-xs shadow-teal-500/30">
              <Lightning size={20} weight="fill" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white">Input Cepat Semua COED</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Isi langsung 4 kategori COED dalam satu tanggal
              </p>
            </div>
          </div>
          <button
            type="button"
            data-testid="coed-batch-open-btn"
            onClick={() => openBatch()}
            className="px-3 py-2 rounded-xl bg-[#00A3A6] hover:bg-[#008F91] text-white text-xs font-bold shrink-0 shadow-xs active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Plus size={14} weight="bold" />
            <span>Input Semua</span>
          </button>
        </div>

        <Card testID="coed-totals" className="divide-y divide-[#F3F4F6] dark:divide-[#2D3748] py-1">
          <SectionTitle className="mt-1">Total Bulanan</SectionTitle>
          {COED_CATEGORIES.map((c) => (
            <KeyValue key={c.key} label={c.label} value={formatRupiah(totals[c.key])} />
          ))}
          <div className="flex items-center justify-between py-2.5 font-bold text-sm">
            <span className="text-slate-900 dark:text-white">COED Total</span>
            <span className="text-[#00A3A6] dark:text-[#38D9D9] font-black">{formatRupiah(totals.total)}</span>
          </div>
        </Card>

        <div className="flex items-center justify-between mt-1">
          <SectionTitle className="my-0">Daftar Entri ({list.length})</SectionTitle>
          <button
            type="button"
            onClick={() => setIsAddingSingle(true)}
            className="text-xs text-[#00A3A6] dark:text-[#38D9D9] font-semibold hover:underline cursor-pointer"
          >
            + Entri Satuan
          </button>
        </div>

        {list.length === 0 ? (
          <EmptyState
            title="Belum ada entri COED"
            message="Tekan tombol 'Input Semua' atau '+' untuk menambah catatan COED bulan ini."
          />
        ) : (
          <div className="flex flex-col gap-2">
            {list.map((e) => (
              <Card key={e.id} testID={`coed-${e.id}`} className="p-3 flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                    {catLabel(e.category)}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-slate-400">{displayDate(e.date)}</span>
                    <button
                      type="button"
                      onClick={() => openBatch(e.date)}
                      className="text-[10px] text-teal-600 dark:text-teal-400 hover:underline cursor-pointer font-medium"
                      title="Buka semua kategori pada tanggal ini"
                    >
                      (Edit Tanggal Ini)
                    </button>
                  </div>
                </div>
                <span className="text-sm font-bold text-slate-900 dark:text-white shrink-0">
                  {formatRupiah(e.amount)}
                </span>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    data-testid={`coed-edit-${e.id}`}
                    onClick={() => setEditing(e)}
                    className="p-1.5 rounded-lg bg-slate-100 dark:bg-[#1E202B] text-slate-900 dark:text-[#38D9D9] hover:opacity-80 cursor-pointer"
                    title="Edit entri"
                  >
                    <PencilSimple size={16} />
                  </button>
                  <button
                    type="button"
                    data-testid={`coed-delete-${e.id}`}
                    onClick={() => handleDelete(e.id)}
                    className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-[#DC2626] dark:text-[#EF4444] hover:opacity-80 cursor-pointer"
                    title="Hapus entri"
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
          data-testid="coed-add-fab"
          onClick={() => openBatch()}
          className="w-13 h-13 rounded-full bg-[#00A3A6] hover:bg-[#008F91] text-white font-black flex items-center justify-center shadow-lg shadow-[#00A3A6]/30 active:scale-95 transition-all cursor-pointer"
          title="Input COED"
        >
          <Plus size={24} weight="bold" />
        </button>
      </div>

      {isBatchOpen && (
        <CoedBatchModal
          initialDate={batchInitialDate || defaultDate()}
          onClose={() => {
            setIsBatchOpen(false);
            setBatchInitialDate(null);
          }}
          onSaved={() => {
            setIsBatchOpen(false);
            setBatchInitialDate(null);
            setRefreshKey((k) => k + 1);
            showToast("Semua data COED tanggal ini berhasil disimpan", "success");
          }}
          onSwitchToSingle={() => {
            setIsBatchOpen(false);
            setBatchInitialDate(null);
            setIsAddingSingle(true);
          }}
        />
      )}

      {(isAddingSingle || editing) && (
        <CoedEditor
          entry={editing}
          defaultDate={defaultDate()}
          onClose={() => {
            setIsAddingSingle(false);
            setEditing(null);
          }}
          onSaved={() => {
            setIsAddingSingle(false);
            setEditing(null);
            setRefreshKey((k) => k + 1);
            showToast("Entri tersimpan", "success");
          }}
        />
      )}
    </div>
  );
};

function CoedBatchModal({
  initialDate,
  onClose,
  onSaved,
  onSwitchToSingle,
}: {
  initialDate: string;
  onClose: () => void;
  onSaved: () => void;
  onSwitchToSingle: () => void;
}) {
  const [date, setDate] = useState(initialDate);
  const [amounts, setAmounts] = useState<Record<CoedCategory, number>>({
    HO_AUTOPAY: 0,
    ADVANCE_PAYMENT: 0,
    ADVANCE_FREEZE: 0,
    COLLECTION: 0,
  });

  useEffect(() => {
    const existing = getCoedByDate(date);
    const newAmounts: Record<CoedCategory, number> = {
      HO_AUTOPAY: 0,
      ADVANCE_PAYMENT: 0,
      ADVANCE_FREEZE: 0,
      COLLECTION: 0,
    };
    for (const item of existing) {
      if (item.category in newAmounts) {
        newAmounts[item.category] = item.amount;
      }
    }
    setAmounts(newAmounts);
  }, [date]);

  const handleAmountChange = (cat: CoedCategory, val: number) => {
    setAmounts((prev) => ({
      ...prev,
      [cat]: Math.max(0, val),
    }));
  };

  const totalForDate = Object.values(amounts).reduce((acc, curr) => acc + (curr || 0), 0);

  const handleSave = () => {
    const items = COED_CATEGORIES.map((c) => ({
      category: c.key,
      amount: amounts[c.key] || 0,
    }));

    saveCoedBatchForDate(date, items);
    onSaved();
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Input Semua Jenis COED"
      subtitle="Input sekaligus 4 jenis COED pada tanggal yang sama"
      maxWidth="md"
    >
      <div className="flex flex-col gap-3.5">
        <div className="bg-slate-50 dark:bg-[#1E202B] p-2.5 rounded-xl border border-slate-200/70 dark:border-[#2D3748]">
          <DateField label="Tanggal COED" value={date} onChange={setDate} testID="batch-coed-date" />
        </div>

        <div className="flex flex-col gap-2.5">
          {COED_CATEGORIES.map((cat) => {
            const val = amounts[cat.key] || 0;
            return (
              <div
                key={cat.key}
                className="p-3 rounded-xl border border-slate-200/80 dark:border-[#2D3748] bg-white dark:bg-[#15171E] flex flex-col gap-1.5 shadow-2xs"
              >
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-900 dark:text-white">
                    {cat.label}
                  </label>
                  {val > 0 && (
                    <span className="text-[11px] font-bold text-teal-600 dark:text-teal-400">
                      {formatRupiah(val)}
                    </span>
                  )}
                </div>
                <NumberField
                  label=""
                  value={val}
                  placeholder="0"
                  onChange={(num) => handleAmountChange(cat.key, num)}
                  testID={`batch-coed-${cat.key}`}
                />
              </div>
            );
          })}
        </div>

        <div className="p-3 rounded-xl bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 block">
              Total COED Tanggal Ini
            </span>
            <span className="text-[11px] text-slate-400">
              {displayDate(date)}
            </span>
          </div>
          <span className="text-base font-black text-[#00A3A6] dark:text-[#38D9D9]">
            {formatRupiah(totalForDate)}
          </span>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
          <span>Kategori nominal 0 akan diabaikan</span>
          <button
            type="button"
            onClick={onSwitchToSingle}
            className="text-teal-600 dark:text-teal-400 hover:underline cursor-pointer"
          >
            Mode Satuan
          </button>
        </div>

        <div className="flex gap-2 mt-2">
          <Button title="Batal" variant="ghost" onClick={onClose} className="flex-1" testID="batch-coed-cancel" />
          <Button title="Simpan Semua" onClick={handleSave} className="flex-1" testID="batch-coed-save" />
        </div>
      </div>
    </Modal>
  );
}

function CoedEditor({
  entry,
  defaultDate,
  onClose,
  onSaved,
}: {
  entry: CoedEntry | null;
  defaultDate: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { showToast } = useToast();
  const [category, setCategory] = useState<CoedCategory>(entry?.category ?? "COLLECTION");
  const [date, setDate] = useState(entry?.date ?? defaultDate);
  const [amount, setAmount] = useState(entry?.amount ?? 0);

  const handleSave = () => {
    if (amount <= 0) {
      showToast("Nominal harus lebih dari 0", "error");
      return;
    }
    if (entry) updateCoed(entry.id, date, category, amount);
    else addCoed(date, category, amount);
    onSaved();
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={entry ? "Edit COED" : "COED Satuan Baru"}
      subtitle="Catat penerimaan dan pembayaran satuan"
      maxWidth="md"
    >
      <div className="flex flex-col gap-3">
        <SelectField
          label="Kategori"
          value={category}
          options={COED_CATEGORIES.map((c) => ({ label: c.label, value: c.key }))}
          onChange={(v) => setCategory(v as CoedCategory)}
          testID="coed-category"
        />
        <DateField label="Tanggal" value={date} onChange={setDate} testID="coed-date" />
        <NumberField
          label="Nominal (Rp)"
          value={amount}
          onChange={setAmount}
          testID="coed-amount"
        />

        <div className="flex gap-2 mt-3">
          <Button title="Batal" variant="ghost" onClick={onClose} className="flex-1" testID="coed-cancel" />
          <Button title="Simpan" onClick={handleSave} className="flex-1" testID="coed-save" />
        </div>
      </div>
    </Modal>
  );
}
