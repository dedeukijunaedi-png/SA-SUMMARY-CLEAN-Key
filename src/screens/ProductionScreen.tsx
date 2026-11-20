import React, { useEffect, useState } from "react";
import { ClipboardText } from "@phosphor-icons/react";
import { Header } from "@/src/components/ui/Header";
import { Card } from "@/src/components/ui/Card";
import { Button, DateField, NumberField } from "@/src/components/ui/Inputs";
import { EmptyState, SectionTitle } from "@/src/components/ui/UIComponents";
import { useToast } from "@/src/components/ui/Toast";
import { getProductionForDate, listProductionHistory, ProductionRow, upsertProductionBatch } from "@/src/db/repo";
import { todayYMD, ymOf, displayDate } from "@/src/lib/date";
import { formatInt } from "@/src/lib/format";

export const ProductionScreen: React.FC = () => {
  const { showToast } = useToast();
  const [date, setDate] = useState(todayYMD());
  const [rows, setRows] = useState<ProductionRow[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  const { year, month } = ymOf(date);

  useEffect(() => {
    setRows(getProductionForDate(date));
  }, [date, refreshKey]);

  const history = listProductionHistory(year, month);

  const updateMetric = (advisorId: number, field: keyof ProductionRow, val: number) => {
    setRows((prev) =>
      prev.map((r) => (r.advisor_id === advisorId ? { ...r, [field]: val } : r))
    );
  };

  const handleSave = () => {
    upsertProductionBatch(
      date,
      rows.map((r) => ({
        advisor_id: r.advisor_id,
        leads: r.leads,
        appointment: r.appointment,
        show: r.show,
        interview: r.interview,
      }))
    );
    showToast("Daily production tersimpan", "success");
    setRefreshKey((k) => k + 1);
  };

  return (
    <div className="flex flex-col min-h-screen pb-24">
      <Header title="Daily Production" subtitle="Input produksi harian team" />

      <main className="max-w-md mx-auto w-full px-4 pt-3 flex flex-col gap-3">
        <DateField label="Tanggal" value={date} onChange={setDate} testID="production-date" />

        {rows.length === 0 ? (
          <EmptyState
            title="Belum ada anggota aktif"
            message="Tambahkan anggota team di menu Team untuk mulai mencatat produksi."
            icon={<ClipboardText size={40} />}
          />
        ) : (
          <div className="flex flex-col gap-3">
            {rows.map((r) => (
              <Card key={r.advisor_id} testID={`production-row-${r.advisor_id}`} className="p-4">
                <h4 className="text-base font-bold text-slate-900 dark:text-white mb-3">
                  {r.advisor_name}
                </h4>
                <div className="grid grid-cols-2 gap-2.5">
                  <NumberField
                    label="Leads"
                    value={r.leads}
                    onChange={(v) => updateMetric(r.advisor_id, "leads", v)}
                    testID={`prod-leads-${r.advisor_id}`}
                  />
                  <NumberField
                    label="Appointment"
                    value={r.appointment}
                    onChange={(v) => updateMetric(r.advisor_id, "appointment", v)}
                    testID={`prod-appt-${r.advisor_id}`}
                  />
                  <NumberField
                    label="Show"
                    value={r.show}
                    onChange={(v) => updateMetric(r.advisor_id, "show", v)}
                    testID={`prod-show-${r.advisor_id}`}
                  />
                  <NumberField
                    label="Interview"
                    value={r.interview}
                    onChange={(v) => updateMetric(r.advisor_id, "interview", v)}
                    testID={`prod-interview-${r.advisor_id}`}
                  />
                </div>
              </Card>
            ))}

            <Button
              title="Simpan Production"
              onClick={handleSave}
              testID="production-save"
              className="w-full mt-1"
            />
          </div>
        )}

        <SectionTitle className="mt-6">Histori Bulan Ini</SectionTitle>
        {history.length === 0 ? (
          <p className="text-xs text-slate-400 py-3 text-center">Belum ada histori produksi bulan ini.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {history.map((h) => (
              <div
                key={h.id}
                data-testid={`history-${h.id}`}
                className="flex items-center justify-between p-3 rounded-2xl bg-white dark:bg-[#161722] border border-slate-200 dark:border-[#282A3A] shadow-2xs text-xs"
              >
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">{h.advisor_name}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">{displayDate(h.date)}</p>
                </div>
                <div className="text-right text-slate-700 dark:text-slate-300 font-medium">
                  L {formatInt(h.leads)} · A {formatInt(h.appointment)} · S {formatInt(h.show)} · I {formatInt(h.interview)}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};
