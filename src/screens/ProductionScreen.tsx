import React, { useEffect, useState } from "react";
import { ClipboardText, Users, CalendarBlank } from "@phosphor-icons/react";
import { Header } from "@/src/components/ui/Header";
import { Card } from "@/src/components/ui/Card";
import { Button, DateField, MonthNavigator, NumberField, SelectField } from "@/src/components/ui/Inputs";
import { EmptyState, SectionTitle } from "@/src/components/ui/UIComponents";
import { useToast } from "@/src/components/ui/Toast";
import {
  activeTeam,
  getProductionForDate,
  listProductionHistory,
  ProductionRow,
  upsertProductionBatch,
} from "@/src/db/repo";
import { currentYM, todayYMD, ymOf, displayDate } from "@/src/lib/date";
import { formatInt } from "@/src/lib/format";

type ProductionTab = "input" | "sa";

export const ProductionScreen: React.FC = () => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<ProductionTab>("input");
  const [date, setDate] = useState(todayYMD());
  const [rows, setRows] = useState<ProductionRow[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  const [{ year: saYear, month: saMonth }, setSaYM] = useState(currentYM());
  const [selectedSaId, setSelectedSaId] = useState<number | null>(null);

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

  const activeMembers = activeTeam();
  const saMonthHistory = activeTab === "sa" ? listProductionHistory(saYear, saMonth) : [];

  const totalsByAdvisor = new Map<
    number,
    { leads: number; appointment: number; show: number; interview: number }
  >();
  const teamMonthTotal = { leads: 0, appointment: 0, show: 0, interview: 0 };

  for (const h of saMonthHistory) {
    const cur = totalsByAdvisor.get(h.advisor_id) ?? {
      leads: 0,
      appointment: 0,
      show: 0,
      interview: 0,
    };
    const l = Number(h.leads ?? 0);
    const a = Number(h.appointment ?? 0);
    const s = Number(h.show ?? 0);
    const i = Number(h.interview ?? 0);
    cur.leads += l;
    cur.appointment += a;
    cur.show += s;
    cur.interview += i;
    totalsByAdvisor.set(h.advisor_id, cur);

    teamMonthTotal.leads += l;
    teamMonthTotal.appointment += a;
    teamMonthTotal.show += s;
    teamMonthTotal.interview += i;
  }

  const filteredSaHistory =
    selectedSaId !== null
      ? saMonthHistory.filter((h) => h.advisor_id === selectedSaId)
      : saMonthHistory;

  const groupedByDate: {
    date: string;
    subtotal: { leads: number; appointment: number; show: number; interview: number };
    entries: typeof filteredSaHistory;
  }[] = [];
  const dateGroupMap = new Map<string, (typeof groupedByDate)[number]>();

  for (const item of filteredSaHistory) {
    let group = dateGroupMap.get(item.date);
    if (!group) {
      group = {
        date: item.date,
        subtotal: { leads: 0, appointment: 0, show: 0, interview: 0 },
        entries: [],
      };
      dateGroupMap.set(item.date, group);
      groupedByDate.push(group);
    }
    group.subtotal.leads += Number(item.leads ?? 0);
    group.subtotal.appointment += Number(item.appointment ?? 0);
    group.subtotal.show += Number(item.show ?? 0);
    group.subtotal.interview += Number(item.interview ?? 0);
    group.entries.push(item);
  }

  const saFilterOptions = [
    { label: "Semua SA", value: 0 },
    ...activeMembers.map((m) => ({ label: m.name, value: m.id })),
  ];

  return (
    <div className="flex flex-col min-h-screen pb-24">
      <Header title="Daily Production" subtitle="Input produksi harian team" />

      <main className="max-w-md mx-auto w-full px-4 pt-3 flex flex-col gap-3">
        <div className="grid grid-cols-2 p-1 bg-slate-200/80 dark:bg-[#161722] rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold">
          <button
            type="button"
            data-testid="production-tab-input"
            onClick={() => setActiveTab("input")}
            className={`py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === "input"
                ? "bg-white dark:bg-[#202230] text-[#00A3A6] dark:text-[#38D9D9] shadow-sm font-black"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <ClipboardText size={16} weight="fill" />
            <span>Input Harian</span>
          </button>
          <button
            type="button"
            data-testid="production-tab-sa"
            onClick={() => setActiveTab("sa")}
            className={`py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === "sa"
                ? "bg-white dark:bg-[#202230] text-[#00A3A6] dark:text-[#38D9D9] shadow-sm font-black"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Users size={16} weight="fill" />
            <span>SA Production</span>
          </button>
        </div>

        {activeTab === "input" && (
          <>
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
          </>
        )}

        {activeTab === "sa" && (
          <>
            <MonthNavigator
              year={saYear}
              month={saMonth}
              onChange={(y, m) => setSaYM({ year: y, month: m })}
            />

            <SectionTitle
              action={
                <span className="text-[11px] font-bold text-[#00A3A6] dark:text-[#38D9D9]">
                  {formatInt(activeMembers.length)} SA Aktif
                </span>
              }
            >
              Daftar SA Aktif (Akumulasi Bulan)
            </SectionTitle>

            {activeMembers.length === 0 ? (
              <EmptyState
                title="Belum ada anggota aktif"
                message="Tambahkan anggota team di menu Team untuk melihat SA Production."
                icon={<Users size={40} />}
              />
            ) : (
              <Card testID="sa-production-active-list" className="p-3.5">
                <div className="divide-y divide-slate-100 dark:divide-[#282A3A]">
                  {activeMembers.map((m) => {
                    const sum = totalsByAdvisor.get(m.id) ?? {
                      leads: 0,
                      appointment: 0,
                      show: 0,
                      interview: 0,
                    };
                    const isSelected = selectedSaId === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        data-testid={`sa-active-row-${m.id}`}
                        onClick={() => setSelectedSaId(isSelected ? null : m.id)}
                        className={`w-full text-left py-2.5 first:pt-0 last:pb-0 flex flex-col gap-1.5 rounded-lg transition-colors cursor-pointer ${
                          isSelected ? "bg-teal-50/70 dark:bg-[#132225]/70 px-2 -mx-2" : ""
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-sm font-bold text-slate-900 dark:text-white truncate">
                              {m.name}
                            </span>
                            <span className="shrink-0 px-1.5 py-0.5 rounded text-[9.5px] font-bold bg-slate-100 text-slate-600 dark:bg-[#1E202B] dark:text-slate-300 border border-slate-200 dark:border-[#2D3748]">
                              {m.position}
                            </span>
                          </div>
                          {isSelected && (
                            <span className="shrink-0 text-[10px] font-bold text-[#00A3A6] dark:text-[#38D9D9]">
                              Dipilih
                            </span>
                          )}
                        </div>
                        <div className="grid grid-cols-4 gap-1.5 text-center text-[10.5px]">
                          <div className="py-1 px-1.5 rounded-md bg-slate-50 dark:bg-[#1E202B] border border-slate-200/70 dark:border-[#282A3A]">
                            <span className="text-slate-400 block text-[9.5px]">Leads</span>
                            <span className="font-extrabold text-slate-900 dark:text-white">
                              {formatInt(sum.leads)}
                            </span>
                          </div>
                          <div className="py-1 px-1.5 rounded-md bg-slate-50 dark:bg-[#1E202B] border border-slate-200/70 dark:border-[#282A3A]">
                            <span className="text-slate-400 block text-[9.5px]">Appt</span>
                            <span className="font-extrabold text-[#00B5B5]">
                              {formatInt(sum.appointment)}
                            </span>
                          </div>
                          <div className="py-1 px-1.5 rounded-md bg-slate-50 dark:bg-[#1E202B] border border-slate-200/70 dark:border-[#282A3A]">
                            <span className="text-slate-400 block text-[9.5px]">Show</span>
                            <span className="font-extrabold text-[#FF6B35]">
                              {formatInt(sum.show)}
                            </span>
                          </div>
                          <div className="py-1 px-1.5 rounded-md bg-slate-50 dark:bg-[#1E202B] border border-slate-200/70 dark:border-[#282A3A]">
                            <span className="text-slate-400 block text-[9.5px]">Interview</span>
                            <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                              {formatInt(sum.interview)}
                            </span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-2.5 pt-2.5 border-t border-slate-200 dark:border-[#282A3A] flex items-center justify-between gap-2 text-xs">
                  <span className="font-bold text-slate-600 dark:text-slate-300">Total Tim Bulan Ini</span>
                  <span className="font-extrabold text-[#00A3A6] dark:text-[#38D9D9]">
                    L {formatInt(teamMonthTotal.leads)} · A {formatInt(teamMonthTotal.appointment)} · S{" "}
                    {formatInt(teamMonthTotal.show)} · I {formatInt(teamMonthTotal.interview)}
                  </span>
                </div>
              </Card>
            )}

            <SelectField
              label="Filter SA Histori"
              value={selectedSaId ?? 0}
              options={saFilterOptions}
              onChange={(v) => setSelectedSaId(v === 0 ? null : (v as number))}
              testID="sa-production-filter"
            />

            <SectionTitle>Histori Daily Production per Tanggal</SectionTitle>
            {groupedByDate.length === 0 ? (
              <Card testID="sa-production-empty" className="p-4 text-center">
                <p className="text-xs text-slate-400 dark:text-slate-500">Belum ada data produksi</p>
              </Card>
            ) : (
              <div className="flex flex-col gap-2.5">
                {groupedByDate.map((g) => (
                  <Card key={g.date} testID={`sa-history-date-${g.date}`} className="p-3.5">
                    <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-slate-100 dark:border-[#282A3A]">
                      <div className="flex items-center gap-1.5 text-xs font-black text-slate-900 dark:text-white">
                        <CalendarBlank size={15} weight="bold" className="text-[#00A3A6] dark:text-[#38D9D9]" />
                        <span>{displayDate(g.date)}</span>
                      </div>
                      <span className="text-[11px] font-bold text-[#00A3A6] dark:text-[#38D9D9]">
                        L {formatInt(g.subtotal.leads)} · A {formatInt(g.subtotal.appointment)} · S{" "}
                        {formatInt(g.subtotal.show)} · I {formatInt(g.subtotal.interview)}
                      </span>
                    </div>

                    <div className="divide-y divide-slate-100 dark:divide-[#282A3A]">
                      {g.entries.map((entry) => (
                        <div
                          key={entry.id}
                          data-testid={`sa-history-row-${entry.id}`}
                          className="py-1.5 first:pt-0 last:pb-0 flex items-center justify-between gap-2 text-xs"
                        >
                          <span className="font-bold text-slate-800 dark:text-slate-200 truncate">
                            {entry.advisor_name}
                          </span>
                          <span className="shrink-0 text-[11px] font-medium text-slate-600 dark:text-slate-300">
                            L {formatInt(entry.leads)} · A {formatInt(entry.appointment)} · S{" "}
                            {formatInt(entry.show)} · I {formatInt(entry.interview)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};
