import React, { useEffect, useState } from "react";
import { BellRinging, DeviceMobile, Moon, Sun } from "@phosphor-icons/react";
import { Header } from "@/src/components/ui/Header";
import { Card } from "@/src/components/ui/Card";
import { KeyValue, SectionTitle } from "@/src/components/ui/UIComponents";
import { useToast } from "@/src/components/ui/Toast";
import { subscribeDatabase } from "@/src/db/database";
import { useAppTheme, ThemePref } from "@/src/lib/theme";
import { listTeam } from "@/src/db/repo";
import {
  getWaReminderState,
  toggleWaReminder,
  WA_REMINDER_SLOTS,
  WaReminderSlotId,
  WaReminderState,
} from "@/src/lib/waReminder";

export const SettingsScreen: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { theme, setTheme } = useAppTheme();
  const { showToast } = useToast();
  const teamCount = listTeam(false).length;
  const [reminders, setReminders] = useState<WaReminderState>(() => getWaReminderState());
  const [busySlot, setBusySlot] = useState<WaReminderSlotId | null>(null);

  useEffect(() => {
    setReminders(getWaReminderState());
    return subscribeDatabase(() => {
      setReminders(getWaReminderState());
    });
  }, []);

  const handleToggleReminder = async (slotId: WaReminderSlotId) => {
    if (busySlot !== null) return;
    const nextEnabled = !reminders[slotId];
    setBusySlot(slotId);
    try {
      const result = await toggleWaReminder(slotId, nextEnabled);
      setReminders(getWaReminderState());
      if (result.permissionDenied) {
        showToast(
          "Izin notifikasi ditolak. Aktifkan izin notifikasi di pengaturan HP.",
          "warning",
        );
      }
    } finally {
      setBusySlot(null);
    }
  };

  const options: { key: ThemePref; label: string; Icon: any }[] = [
    { key: "system", label: "Sistem", Icon: DeviceMobile },
    { key: "light", label: "Terang", Icon: Sun },
    { key: "dark", label: "Gelap", Icon: Moon },
  ];

  return (
    <div className="flex flex-col min-h-screen pb-[calc(6rem+env(safe-area-inset-bottom,0px))]">
      <Header title="Settings" subtitle="Tema & info aplikasi" onBack={onBack} />

      <main className="max-w-md mx-auto w-full px-4 pt-3 flex flex-col gap-3">
        <SectionTitle>Tampilan</SectionTitle>
        <div className="grid grid-cols-3 gap-2.5">
          {options.map(({ key, label, Icon }) => {
            const active = theme === key;
            return (
              <button
                key={key}
                data-testid={`theme-${key}`}
                onClick={() => setTheme(key)}
                className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all cursor-pointer ${
                  active
                    ? "border-[#00A3A6] bg-[#00A3A6]/15 dark:bg-[#00A3A6]/20 text-[#00A3A6] dark:text-[#38D9D9]"
                    : "border-slate-200 dark:border-[#282A3A] bg-white dark:bg-[#161722] text-slate-600 dark:text-slate-400 hover:border-slate-300"
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                    active
                      ? "bg-[#00A3A6] text-white shadow-xs"
                      : "bg-slate-100 dark:bg-[#1E202B] text-slate-500"
                  }`}
                >
                  <Icon size={20} weight="fill" />
                </div>
                <span className="text-xs font-bold">{label}</span>
              </button>
            );
          })}
        </div>

        <SectionTitle className="mt-4">Pengingat Laporan WhatsApp</SectionTitle>
        <Card className="p-0 overflow-hidden divide-y divide-[#F3F4F6] dark:divide-[#282A3A]">
          {WA_REMINDER_SLOTS.map((slot) => {
            const enabled = reminders[slot.id];
            const busy = busySlot === slot.id;
            return (
              <button
                key={slot.id}
                type="button"
                role="switch"
                aria-checked={enabled}
                data-testid={`wa-reminder-switch-${slot.id}`}
                disabled={busySlot !== null}
                onClick={() => handleToggleReminder(slot.id)}
                className="min-h-[44px] w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-[#1E202B]/60 disabled:opacity-70 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      enabled
                        ? "bg-[#00A3A6]/15 text-[#00A3A6] dark:text-[#38D9D9]"
                        : "bg-slate-100 dark:bg-[#1E202B] text-slate-400"
                    }`}
                  >
                    <BellRinging size={18} weight={enabled ? "fill" : "regular"} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 dark:text-white">
                      Laporan {slot.id}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Setiap hari pukul {slot.timeText} waktu lokal
                    </p>
                  </div>
                </div>

                <span
                  aria-hidden="true"
                  className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                    enabled
                      ? "bg-[#00A3A6]"
                      : "bg-slate-300 dark:bg-slate-600"
                  } ${busy ? "opacity-60" : ""}`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-xs transition-transform ${
                      enabled ? "translate-x-5" : "translate-x-0.5"
                    }`}
                  />
                </span>
              </button>
            );
          })}
        </Card>

        <SectionTitle className="mt-4">Tentang</SectionTitle>
        <Card className="divide-y divide-[#F3F4F6] dark:divide-[#2D3748] py-1">
          <KeyValue label="Aplikasi" value="SA Summary" />
          <KeyValue label="Versi" value="1.0.0" />
          <KeyValue label="Database" value="SQLite lokal (offline)" />
          <KeyValue label="Anggota aktif" value={`${teamCount} orang`} />
        </Card>

        <p className="text-xs text-slate-500 dark:text-slate-400 px-1 leading-relaxed">
          Aplikasi berjalan 100% offline. Seluruh data tersimpan di perangkat dan dapat dibackup lewat menu Import / Export.
        </p>
      </main>
    </div>
  );
};
