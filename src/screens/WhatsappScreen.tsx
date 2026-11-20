import React from "react";
import { Header } from "@/src/components/ui/Header";
import { WhatsappReportView } from "@/src/components/reports/WhatsappReportView";

export const WhatsappScreen: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  return (
    <div className="flex flex-col min-h-screen pb-24">
      <Header
        title="WhatsApp Report"
        subtitle="Laporan 1PM • 5PM • 9/10PM siap copy"
        onBack={onBack}
      />

      <main className="max-w-md mx-auto w-full px-4 pt-3 flex flex-col gap-3">
        <WhatsappReportView />
      </main>
    </div>
  );
};
