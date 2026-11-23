import React, { useState } from "react";
import {
  CaretRight,
  ChatText,
  Cube,
  Database,
  FileText,
  Gear,
  Target,
  UsersThree,
  Wallet,
  XCircle,
} from "@phosphor-icons/react";
import { Header } from "@/src/components/ui/Header";
import { Card } from "@/src/components/ui/Card";
import { TargetsScreen } from "./TargetsScreen";
import { ProductsScreen } from "./ProductsScreen";
import { TeamScreen } from "./TeamScreen";
import { CoedScreen } from "./CoedScreen";
import { CancellationScreen } from "./CancellationScreen";
import { ReportsScreen } from "./ReportsScreen";
import { WhatsappScreen } from "./WhatsappScreen";
import { DataScreen } from "./DataScreen";
import { SettingsScreen } from "./SettingsScreen";

type SubView =
  | "targets"
  | "products"
  | "team"
  | "coed"
  | "cancellation"
  | "reports"
  | "whatsapp"
  | "data"
  | "settings"
  | null;

interface MenuItem {
  label: string;
  sub: string;
  view: SubView;
  Icon: any;
  testID: string;
}

export const MoreScreen: React.FC = () => {
  const [subView, setSubView] = useState<SubView>(null);

  if (subView === "targets") return <TargetsScreen onBack={() => setSubView(null)} />;
  if (subView === "products") return <ProductsScreen onBack={() => setSubView(null)} />;
  if (subView === "team") return <TeamScreen onBack={() => setSubView(null)} />;
  if (subView === "coed") return <CoedScreen onBack={() => setSubView(null)} />;
  if (subView === "cancellation") return <CancellationScreen onBack={() => setSubView(null)} />;
  if (subView === "reports") return <ReportsScreen onBack={() => setSubView(null)} />;
  if (subView === "whatsapp") return <WhatsappScreen onBack={() => setSubView(null)} />;
  if (subView === "data") return <DataScreen onBack={() => setSubView(null)} />;
  if (subView === "settings") return <SettingsScreen onBack={() => setSubView(null)} />;

  const groups: { title: string; items: MenuItem[] }[] = [
    {
      title: "Management",
      items: [
        {
          label: "Targets",
          sub: "Target akademi, dues & private per bulan",
          view: "targets",
          Icon: Target,
          testID: "nav-targets",
        },
        {
          label: "Products",
          sub: "Kelola produk dues & private",
          view: "products",
          Icon: Cube,
          testID: "nav-products",
        },
        {
          label: "Team",
          sub: "Anggota team & status aktif",
          view: "team",
          Icon: UsersThree,
          testID: "nav-team",
        },
      ],
    },
    {
      title: "Finance",
      items: [
        {
          label: "COED",
          sub: "HO Autopay, Advance, Collection",
          view: "coed",
          Icon: Wallet,
          testID: "nav-coed",
        },
        {
          label: "Cancellation",
          sub: "Catatan pembatalan per anggota",
          view: "cancellation",
          Icon: XCircle,
          testID: "nav-cancellation",
        },
      ],
    },
    {
      title: "Reports",
      items: [
        {
          label: "Reports",
          sub: "MTD report, export PDF & Excel",
          view: "reports",
          Icon: FileText,
          testID: "nav-reports",
        },
        {
          label: "WhatsApp Report",
          sub: "Laporan harian siap copy",
          view: "whatsapp",
          Icon: ChatText,
          testID: "nav-whatsapp",
        },
      ],
    },
    {
      title: "Data & Pengaturan",
      items: [
        {
          label: "Import / Export",
          sub: "Backup & restore database JSON",
          view: "data",
          Icon: Database,
          testID: "nav-data",
        },
        {
          label: "Settings",
          sub: "Tema, info aplikasi",
          view: "settings",
          Icon: Gear,
          testID: "nav-settings",
        },
      ],
    },
  ];

  return (
    <div className="flex flex-col min-h-screen pb-[calc(6rem+env(safe-area-inset-bottom,0px))]">
      <Header title="Lainnya" subtitle="Manajemen & laporan" />

      <main className="max-w-md mx-auto w-full px-4 pt-3 flex flex-col gap-4">
        {groups.map((g) => (
          <div key={g.title} className="flex flex-col gap-1.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#6B7280] dark:text-[#9CA3AF] px-1">
              {g.title}
            </h3>
            <Card className="p-0 overflow-hidden divide-y divide-slate-100 dark:divide-[#282A3A]">
              {g.items.map((it) => {
                const IconComponent = it.Icon;
                return (
                  <button
                    key={it.testID}
                    type="button"
                    data-testid={it.testID}
                    onClick={() => setSubView(it.view)}
                    className="min-h-[44px] w-full flex items-center gap-3.5 p-3.5 hover:bg-slate-50 dark:hover:bg-[#1E202B]/60 transition-colors text-left cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-xl bg-[#00A3A6]/15 dark:bg-[#00A3A6]/20 text-[#00A3A6] dark:text-[#38D9D9] flex items-center justify-center shrink-0">
                      <IconComponent size={22} weight="fill" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                        {it.label}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {it.sub}
                      </p>
                    </div>
                    <CaretRight size={18} className="text-slate-400 shrink-0" />
                  </button>
                );
              })}
            </Card>
          </div>
        ))}
      </main>
    </div>
  );
};
