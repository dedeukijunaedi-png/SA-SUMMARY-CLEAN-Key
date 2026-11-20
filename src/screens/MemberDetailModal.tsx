import React from "react";
import { Modal } from "@/src/components/ui/Modal";
import { Card } from "@/src/components/ui/Card";
import { KeyValue, ProgressBar, SectionTitle, StatusPill } from "@/src/components/ui/UIComponents";
import { getMember, listClosings } from "@/src/db/repo";
import { memberSummaries } from "@/src/services/calc";
import { displayDateTime, monthLabel } from "@/src/lib/date";
import { formatRupiah } from "@/src/lib/format";

interface MemberDetailModalProps {
  memberId: number;
  year: number;
  month: number;
  onClose: () => void;
}

export const MemberDetailModal: React.FC<MemberDetailModalProps> = ({
  memberId,
  year,
  month,
  onClose,
}) => {
  const member = getMember(memberId);
  const summary = memberSummaries(year, month).find((m) => m.id === memberId);
  const closings = listClosings(year, month, memberId);

  if (!member || !summary) return null;

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={member.name}
      subtitle={`${member.position} · ${monthLabel(year, month)}`}
      maxWidth="lg"
    >
      <div className="flex flex-col gap-3">
        {summary.hasTarget && (
          <div className="flex flex-col gap-2.5">
            <Card className="p-3.5 bg-teal-50/50 dark:bg-[#132225]/60 border-teal-500/30">
              <div className="flex items-center justify-between pb-1.5 border-b border-teal-200/50 dark:border-teal-900/40">
                <span className="text-xs font-bold text-[#00A3A6] dark:text-[#38D9D9] flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#00A3A6]" />
                  Target Dues SA
                </span>
                <span className="text-xs font-black text-[#00A3A6] dark:text-[#38D9D9]">
                  Akt: {summary.duesAchPct == null ? "-" : `${summary.duesAchPct.toFixed(1)}%`}
                  <span className="text-slate-400 font-semibold ml-1.5">
                    · Gr: {summary.duesPct == null ? "-" : `${summary.duesPct.toFixed(1)}%`}
                  </span>
                </span>
              </div>
              <div className="flex justify-between items-baseline mt-2">
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#00A3A6] dark:text-[#38D9D9] block">
                    Aktual (Status)
                  </span>
                  <span className="text-xl font-black text-slate-900 dark:text-white">
                    {formatRupiah(summary.sales.duesAch)}
                  </span>
                  <span className="text-xs text-slate-500 block">
                    Gross: {formatRupiah(summary.sales.duesGross)}
                  </span>
                </div>
                <span className="text-xs text-slate-500">
                  Target {formatRupiah(summary.personalDuesTarget)}
                </span>
              </div>
              <div className="my-2 flex flex-col gap-1">
                <ProgressBar value={summary.duesAchPct} barClassName="bg-[#00A3A6]" />
                <ProgressBar value={summary.duesPct} barClassName="bg-slate-400 dark:bg-slate-500" />
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                <div className="p-2 rounded-lg bg-white/80 dark:bg-[#1E202B] border border-teal-100 dark:border-teal-950">
                  <span className="text-[10px] text-slate-400 block font-semibold">Target 80% Dues</span>
                  <p className="font-bold text-slate-800 dark:text-slate-200">{formatRupiah(summary.personalDues80)}</p>
                  <span className="text-[11px] font-extrabold text-[#00A3A6] dark:text-[#38D9D9] mt-0.5 block">
                    {summary.remainingDuesAchTo80 === 0
                      ? "✓ 80% Aktual Tercapai"
                      : `Akt: ${summary.unitsDuesAchTo80} unit (${formatRupiah(summary.remainingDuesAchTo80)})`}
                  </span>
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    {summary.remainingDuesTo80 === 0
                      ? "✓ 80% Gross Tercapai"
                      : `Gross: ${summary.unitsDuesTo80} unit (${formatRupiah(summary.remainingDuesTo80)})`}
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-white/80 dark:bg-[#1E202B] border border-teal-100 dark:border-teal-950">
                  <span className="text-[10px] text-slate-400 block font-semibold">Target 100% Dues</span>
                  <p className="font-bold text-slate-800 dark:text-slate-200">{formatRupiah(summary.personalDuesTarget)}</p>
                  <span className="text-[11px] font-extrabold text-[#00A3A6] dark:text-[#38D9D9] mt-0.5 block">
                    {summary.remainingDuesAchTo100 === 0
                      ? "✓ 100% Aktual Tercapai"
                      : `Akt: ${summary.unitsDuesAchTo100} unit (${formatRupiah(summary.remainingDuesAchTo100)})`}
                  </span>
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    {summary.remainingDuesTo100 === 0
                      ? "✓ 100% Gross Tercapai"
                      : `Gross: ${summary.unitsDuesTo100} unit (${formatRupiah(summary.remainingDuesTo100)})`}
                  </span>
                </div>
              </div>
            </Card>

            <Card className="p-3.5 bg-purple-50/50 dark:bg-[#1F172C]/60 border-purple-500/30">
              <div className="flex items-center justify-between pb-1.5 border-b border-purple-200/50 dark:border-purple-900/40">
                <span className="text-xs font-bold text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-purple-500" />
                  Target Private SA
                </span>
                <span className="text-xs font-black text-purple-600 dark:text-purple-400">
                  Akt: {summary.privAchPct == null ? "-" : `${summary.privAchPct.toFixed(1)}%`}
                  <span className="text-slate-400 font-semibold ml-1.5">
                    · Gr: {summary.privPct == null ? "-" : `${summary.privPct.toFixed(1)}%`}
                  </span>
                </span>
              </div>
              <div className="flex justify-between items-baseline mt-2">
                <div>
                  <span className="text-[10px] uppercase font-bold text-purple-600 dark:text-purple-400 block">
                    Aktual (Status)
                  </span>
                  <span className="text-xl font-black text-slate-900 dark:text-white">
                    {formatRupiah(summary.sales.privAch)}
                  </span>
                  <span className="text-xs text-slate-500 block">
                    Gross: {formatRupiah(summary.sales.privGross)}
                  </span>
                </div>
                <span className="text-xs text-slate-500">
                  Target {formatRupiah(summary.personalPrivTarget)}
                </span>
              </div>
              <div className="my-2 flex flex-col gap-1">
                <ProgressBar value={summary.privAchPct} barClassName="bg-purple-500" />
                <ProgressBar value={summary.privPct} barClassName="bg-slate-400 dark:bg-slate-500" />
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                <div className="p-2 rounded-lg bg-white/80 dark:bg-[#1E202B] border border-purple-100 dark:border-purple-950">
                  <span className="text-[10px] text-slate-400 block font-semibold">Target 80% Private</span>
                  <p className="font-bold text-slate-800 dark:text-slate-200">{formatRupiah(summary.personalPriv80)}</p>
                  <span className="text-[10.5px] font-bold text-purple-600 dark:text-purple-400 mt-0.5 block">
                    {summary.remainingPrivAchTo80 === 0 ? "✓ Akt Tercapai" : `Akt: ${formatRupiah(summary.remainingPrivAchTo80)}`}
                  </span>
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    {summary.remainingPrivTo80 === 0 ? "✓ Gr Tercapai" : `Gross: ${formatRupiah(summary.remainingPrivTo80)}`}
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-white/80 dark:bg-[#1E202B] border border-purple-100 dark:border-purple-950">
                  <span className="text-[10px] text-slate-400 block font-semibold">Target 100% Private</span>
                  <p className="font-bold text-slate-800 dark:text-slate-200">{formatRupiah(summary.personalPrivTarget)}</p>
                  <span className="text-[10.5px] font-bold text-purple-600 dark:text-purple-400 mt-0.5 block">
                    {summary.remainingPrivAchTo100 === 0 ? "✓ Akt Tercapai" : `Akt: ${formatRupiah(summary.remainingPrivAchTo100)}`}
                  </span>
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    {summary.remainingPrivTo100 === 0 ? "✓ Gr Tercapai" : `Gross: ${formatRupiah(summary.remainingPrivTo100)}`}
                  </span>
                </div>
              </div>
            </Card>

            <Card testID="member-achievement" className="bg-[#00A3A6]/10 dark:bg-[#00A3A6]/15 border-[#00A3A6]/30">
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Achievement (Dues + Priv)</span>
                <span className="text-xs font-black text-amber-600 dark:text-amber-400">
                  Akt: {summary.achPct == null ? "-" : `${summary.achPct.toFixed(1)}%`}
                  <span className="text-slate-500 font-semibold ml-1">
                    · Gr: {summary.grossPct == null ? "-" : `${summary.grossPct.toFixed(1)}%`}
                  </span>
                </span>
              </div>
              <div className="flex justify-between items-baseline mt-1">
                <p className="text-2xl font-black text-slate-900 dark:text-white">
                  {formatRupiah(summary.sales.totalAch)}
                </p>
                <span className="text-xs font-semibold text-slate-500">
                  Gross: {formatRupiah(summary.sales.totalGross)}
                </span>
              </div>
              <div className="my-2.5">
                <ProgressBar value={summary.achPct} />
              </div>
              <div className="flex justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
                <span>Target Total: {formatRupiah(summary.personalTarget)}</span>
                <span>
                  {summary.remainingTotalTo100 === 0 ? "✓ Target Tercapai" : `Sisa ${formatRupiah(summary.remainingTotalTo100)}`}
                </span>
              </div>
            </Card>
          </div>
        )}

        <SectionTitle>Sales Performance & Projection</SectionTitle>
        <Card className="divide-y divide-slate-100 dark:divide-[#282A3A] py-1">
          <KeyValue label="Dues Unit" value={`${summary.sales.duesUnit}`} />
          <KeyValue label="Dues Gross" value={formatRupiah(summary.sales.duesGross)} />
          <KeyValue label="Dues Aktual (Status)" value={formatRupiah(summary.sales.duesAch)} valueColor="#00A3A6" />
          <KeyValue label="Private Gross" value={formatRupiah(summary.sales.privGross)} />
          <KeyValue label="Private Aktual (Status)" value={formatRupiah(summary.sales.privAch)} valueColor="#8B5CF6" />
          <KeyValue label="Total Gross" value={formatRupiah(summary.sales.totalGross)} />
          <KeyValue
            label="Total Aktual (Achievement)"
            value={formatRupiah(summary.sales.totalAch)}
            valueColor="#D97706"
          />
          <KeyValue label="Projection Dues (Gross)" value={formatRupiah(summary.projDuesGross)} />
          <KeyValue label="Projection Dues (Aktual)" value={formatRupiah(summary.projDuesAch)} valueColor="#00A3A6" />
          <KeyValue label="Projection Private (Gross)" value={formatRupiah(summary.projPrivGross)} />
          <KeyValue label="Projection Private (Aktual)" value={formatRupiah(summary.projPrivAch)} valueColor="#8B5CF6" />
          <KeyValue label="Projection Total (Gross)" value={formatRupiah(summary.projGross)} />
          <KeyValue label="Projection Total (Aktual)" value={formatRupiah(summary.projAch)} valueColor="#10B981" />
          {summary.hasTarget && (
            <KeyValue label="Sisa Target Total (Aktual)" value={formatRupiah(Math.max(0, summary.remaining))} />
          )}
        </Card>

        <SectionTitle>Conversion Rates & Funnel</SectionTitle>
        <Card className="divide-y divide-slate-100 dark:divide-[#282A3A] py-1 border-[#00A3A6]/30">
          <KeyValue
            label="Leads → Appointment"
            value={summary.apptConv != null ? `${summary.apptConv.toFixed(1)}%` : "—"}
            valueColor="#00B5B5"
          />
          <KeyValue
            label="Appointment → Show (Kehadiran)"
            value={summary.showRate != null ? `${summary.showRate.toFixed(1)}%` : "—"}
            valueColor="#FF6B35"
          />
          <KeyValue
            label="Show → Interview (Konsultasi)"
            value={summary.interviewRate != null ? `${summary.interviewRate.toFixed(1)}%` : "—"}
            valueColor="#10B981"
          />
          <KeyValue
            label="Interview → Closing Unit"
            value={summary.closeRate != null ? `${summary.closeRate.toFixed(1)}%` : "—"}
            valueColor="#00A3A6"
          />
          <KeyValue
            label="Overall: Total Leads → Closing Unit"
            value={summary.leadsConv != null ? `${summary.leadsConv.toFixed(1)}%` : "—"}
            valueColor="#00A3A6"
          />
        </Card>

        <SectionTitle>Daily Production</SectionTitle>
        <Card className="divide-y divide-[#F3F4F6] dark:divide-[#2D3748] py-1">
          <KeyValue label="Leads" value={`${summary.prod.leads}`} />
          <KeyValue label="Appointment" value={`${summary.prod.appointment}`} />
          <KeyValue label="Show" value={`${summary.prod.show}`} />
          <KeyValue label="Interview" value={`${summary.prod.interview}`} />
        </Card>

        <SectionTitle>Closing Transactions ({closings.length})</SectionTitle>
        {closings.length === 0 ? (
          <p className="text-xs text-slate-400 py-3 text-center">Belum ada closing tercatat bulan ini.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {closings.map((c) => (
              <Card key={c.id} className="p-3">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {displayDateTime(c.date, c.time)}
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {formatRupiah(c.items.reduce((s, i) => s + i.gross_revenue, 0))}
                  </span>
                </div>
                <div className="flex flex-col gap-1 border-t border-[#F3F4F6] dark:border-[#2D3748] pt-1.5">
                  {c.items.map((i) => (
                    <div key={i.id} className="flex items-center justify-between text-xs">
                      <span className="text-slate-600 dark:text-slate-300 truncate max-w-[200px]">
                        {i.kind === "PRIVATE" ? "🎯 " : ""}
                        {i.product_name} × {i.quantity}
                      </span>
                      <StatusPill status={i.status} />
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
};
