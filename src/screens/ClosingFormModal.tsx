import React, { useMemo, useState } from "react";
import { Plus, Trash } from "@phosphor-icons/react";
import { Modal } from "@/src/components/ui/Modal";
import { Card } from "@/src/components/ui/Card";
import { Button, DateField, NumberField, SelectField, Stepper, TextField, TimeField } from "@/src/components/ui/Inputs";
import { useToast } from "@/src/components/ui/Toast";
import {
  ClosingItemInput,
  createClosing,
  getClosing,
  listProducts,
  listTeam,
  updateClosing,
} from "@/src/db/repo";
import { STATUS_PCT, SALES_STATUS, ClosingType, SalesStatus } from "@/src/types";
import { toHM, todayYMD } from "@/src/lib/date";
import { formatRupiah } from "@/src/lib/format";

type Item = ClosingItemInput & { key: string };
function newKey() {
  return Math.random().toString(36).slice(2);
}

interface ClosingFormModalProps {
  editId: number | null;
  onClose: () => void;
  onSaved: () => void;
}

export const ClosingFormModal: React.FC<ClosingFormModalProps> = ({
  editId,
  onClose,
  onSaved,
}) => {
  const { showToast } = useToast();
  const team = useMemo(() => listTeam(true), []);
  const duesProducts = useMemo(() => listProducts(false, "DUES"), []);

  const existing = useMemo(() => (editId ? getClosing(editId) : null), [editId]);

  const [advisorId, setAdvisorId] = useState<number | null>(
    existing?.advisor_id ?? team[0]?.id ?? null
  );
  const [date, setDate] = useState(existing?.date ?? todayYMD());
  const [time, setTime] = useState(existing?.time ?? toHM(new Date()));
  const [notes, setNotes] = useState(existing?.notes ?? "");
  const [items, setItems] = useState<Item[]>(
    existing
      ? existing.items.map((i) => ({
          key: newKey(),
          kind: i.kind,
          product_id: i.product_id,
          product_name: i.product_name,
          sessions: i.sessions,
          unit_price: i.unit_price,
          quantity: i.quantity,
          status: i.status,
        }))
      : []
  );

  const addDues = () => {
    const p = duesProducts[0];
    setItems((prev) => [
      ...prev,
      {
        key: newKey(),
        kind: "DUES",
        product_id: p?.id ?? null,
        product_name: p?.name ?? "Dues",
        sessions: null,
        unit_price: p?.price ?? 0,
        quantity: 1,
        status: "Actual",
      },
    ]);
  };

  const addPrivate = () => {
    setItems((prev) => [
      ...prev,
      {
        key: newKey(),
        kind: "PRIVATE",
        product_id: null,
        product_name: "Private",
        sessions: 1,
        unit_price: 0,
        quantity: 1,
        status: "Actual",
      },
    ]);
  };

  const updateItem = (key: string, patch: Partial<Item>) => {
    setItems((prev) => prev.map((it) => (it.key === key ? { ...it, ...patch } : it)));
  };

  const removeItem = (key: string) => {
    setItems((prev) => prev.filter((it) => it.key !== key));
  };

  const derivedType = (): ClosingType => {
    const hasD = items.some((i) => i.kind === "DUES");
    const hasP = items.some((i) => i.kind === "PRIVATE");
    if (hasD && hasP) return "DUES_PRIVATE";
    if (hasP) return "PRIVATE";
    return "DUES";
  };

  const totalGross = items.reduce((a, i) => a + i.unit_price * i.quantity, 0);
  const totalAch = items.reduce(
    (a, i) => a + Math.round(i.unit_price * i.quantity * STATUS_PCT[i.status]),
    0
  );

  const handleSave = () => {
    if (!advisorId) {
      showToast("Pilih SA terlebih dahulu", "error");
      return;
    }
    if (items.length === 0) {
      showToast("Tambahkan minimal satu item", "error");
      return;
    }
    const payload = {
      date,
      time,
      advisor_id: advisorId,
      type: derivedType(),
      notes: notes || null,
      items: items.map(({ key, ...rest }) => rest),
    };
    if (editId) updateClosing(editId, payload);
    else createClosing(payload);
    showToast(editId ? "Closing diperbarui" : "Closing tersimpan", "success");
    onSaved();
  };

  const statusOptions = SALES_STATUS.map((s) => ({
    label: `${s} (${STATUS_PCT[s] * 100}%)`,
    value: s,
  }));
  const productOptions = duesProducts.map((p) => ({
    label: p.name,
    value: p.id,
    sub: formatRupiah(p.price),
  }));

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={editId ? "Edit Closing" : "Closing Baru"}
      subtitle="Catat penjualan Dues / Private"
      maxWidth="lg"
    >
      <div className="flex flex-col gap-3">
        <SelectField
          label="Student Advisor (SA)"
          value={advisorId}
          options={team.map((t) => ({ label: `${t.name} · ${t.position}`, value: t.id }))}
          onChange={setAdvisorId}
          testID="form-sa"
        />

        <div className="grid grid-cols-2 gap-3">
          <DateField label="Tanggal" value={date} onChange={setDate} testID="form-date" />
          <TimeField label="Waktu" value={time} onChange={setTime} testID="form-time" />
        </div>

        <TextField
          label="Catatan (Opsional)"
          placeholder="Contoh: member transfer BCA / promo"
          value={notes}
          onChangeText={setNotes}
          testID="form-notes"
        />

        <div className="flex items-center justify-between mt-2">
          <span className="text-xs font-bold uppercase text-slate-500 tracking-wider">
            Item Closing ({items.length})
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={addDues}
              className="min-h-[44px] text-xs font-bold px-3 py-1.5 rounded-lg bg-[#00A3A6]/15 text-[#00A3A6] dark:text-[#38D9D9] border border-[#00A3A6]/30 hover:opacity-80 transition-opacity flex items-center gap-1 cursor-pointer"
            >
              <Plus size={12} weight="bold" /> + Dues
            </button>
            <button
              type="button"
              onClick={addPrivate}
              className="min-h-[44px] text-xs font-bold px-3 py-1.5 rounded-lg bg-[#FF6B35]/15 text-[#FF6B35] dark:text-[#FF8C61] border border-[#FF6B35]/30 hover:opacity-80 transition-opacity flex items-center gap-1 cursor-pointer"
            >
              <Plus size={12} weight="bold" /> + Private
            </button>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="border border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-6 text-center text-xs text-slate-400">
            Belum ada item closing. Tekan tombol <b>+ Dues</b> atau <b>+ Private</b> di atas.
          </div>
        ) : (
          items.map((it, idx) => (
            <Card key={it.key} testID={`item-${idx}`} className="p-3 bg-slate-50/60 dark:bg-[#1A1B25]/60 border-slate-200 dark:border-[#282A3A]">
              <div className="flex items-center justify-between mb-2 pb-1 border-b border-slate-200 dark:border-[#282A3A]">
                <span className="text-xs font-bold text-[#00A3A6] dark:text-[#38D9D9]">
                  {it.kind === "DUES" ? "Membership Dues" : "🎯 Private Training"}
                </span>
                <button
                  type="button"
                  data-testid={`item-remove-${idx}`}
                  onClick={() => removeItem(it.key)}
                  aria-label="Hapus item"
                  className="min-w-[44px] min-h-[44px] -mr-1.5 flex items-center justify-center rounded-lg text-rose-500 hover:text-rose-700 cursor-pointer"
                >
                  <Trash size={16} />
                </button>
              </div>

              {it.kind === "DUES" ? (
                <SelectField
                  label="Pilih Produk"
                  value={it.product_id}
                  options={productOptions}
                  onChange={(pid) => {
                    const p = duesProducts.find((x) => x.id === pid);
                    updateItem(it.key, {
                      product_id: pid as number,
                      product_name: p?.name ?? "",
                      unit_price: p?.price ?? it.unit_price,
                    });
                  }}
                  testID={`item-product-${idx}`}
                />
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <TextField
                    label="Nama Private"
                    value={it.product_name}
                    onChangeText={(t) => updateItem(it.key, { product_name: t })}
                    testID={`item-privname-${idx}`}
                  />
                  <NumberField
                    label="Jumlah Sesi"
                    value={it.sessions ?? 1}
                    onChange={(v) => updateItem(it.key, { sessions: v })}
                    testID={`item-sessions-${idx}`}
                  />
                </div>
              )}

              <NumberField
                label="Harga / Unit (Rp)"
                value={it.unit_price}
                onChange={(v) => updateItem(it.key, { unit_price: v })}
                testID={`item-price-${idx}`}
              />

              <div className="grid grid-cols-2 gap-3 items-end">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Qty
                  </label>
                  <Stepper
                    value={it.quantity}
                    onChange={(v) => updateItem(it.key, { quantity: Math.max(1, v) })}
                    testID={`item-qty-${idx}`}
                  />
                </div>
                <SelectField
                  label="Status"
                  value={it.status}
                  options={statusOptions}
                  onChange={(s) => updateItem(it.key, { status: s as SalesStatus })}
                  testID={`item-status-${idx}`}
                />
              </div>

              <div className="flex justify-between items-center mt-2.5 pt-2 border-t border-slate-200 dark:border-[#282A3A] text-xs font-semibold">
                <span className="text-slate-600 dark:text-slate-400">
                  Gross: {formatRupiah(it.unit_price * it.quantity)}
                </span>
                <span className="text-[#00A3A6] dark:text-[#38D9D9] font-bold">
                  Ach: {formatRupiah(Math.round(it.unit_price * it.quantity * STATUS_PCT[it.status]))}
                </span>
              </div>
            </Card>
          ))
        )}

        <div className="p-3 rounded-xl bg-slate-100 dark:bg-[#161722] border border-slate-200 dark:border-[#282A3A] flex justify-between items-center text-xs font-bold">
          <div>
            <span className="text-slate-500 dark:text-slate-400">Total Gross:</span>{" "}
            <span className="text-slate-900 dark:text-white">{formatRupiah(totalGross)}</span>
          </div>
          <div>
            <span className="text-slate-500 dark:text-slate-400">Achievement:</span>{" "}
            <span className="text-[#00A3A6] dark:text-[#38D9D9] font-black">{formatRupiah(totalAch)}</span>
          </div>
        </div>

        <div className="flex gap-2 mt-2">
          <Button title="Batal" variant="ghost" onClick={onClose} className="flex-1" />
          <Button
            title={editId ? "Simpan Perubahan" : "Simpan Closing"}
            onClick={handleSave}
            testID="closing-save"
            className="flex-1"
          />
        </div>
      </div>
    </Modal>
  );
};
