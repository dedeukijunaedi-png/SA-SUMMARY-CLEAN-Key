import React from "react";
import { DeviceMobile, Moon, Sun } from "@phosphor-icons/react";
import { Header } from "@/src/components/ui/Header";
import { Card } from "@/src/components/ui/Card";
import { KeyValue, SectionTitle } from "@/src/components/ui/UIComponents";
import { useAppTheme, ThemePref } from "@/src/lib/theme";
import { listTeam } from "@/src/db/repo";

export const SettingsScreen: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { theme, setTheme } = useAppTheme();
  const teamCount = listTeam(false).length;

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
