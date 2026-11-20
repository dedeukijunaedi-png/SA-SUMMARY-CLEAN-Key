import React, { useEffect, useMemo, useState } from "react";
import {
  ChatText,
  CheckCircle,
  Clock,
  Copy,
  Eye,
  PaperPlaneTilt,
  PencilSimple,
  SlidersHorizontal,
  Sparkle,
} from "@phosphor-icons/react";
import { Card } from "@/src/components/ui/Card";
import { Button, DateField, NumberField, TextField } from "@/src/components/ui/Inputs";
import { SectionTitle } from "@/src/components/ui/UIComponents";
import { useToast } from "@/src/components/ui/Toast";
import { getSetting, getWaReport, setSetting, upsertWaReport } from "@/src/db/repo";
import { buildWhatsappReport, normalizeReportSlot, WaReportSlot } from "@/src/services/whatsapp";
import { displayDate, todayYMD } from "@/src/lib/date";

interface Props {
  initialDate?: string;
}

export const WhatsappReportView: React.FC<Props> = ({ initialDate }) => {
  const { showToast } = useToast();
  const [date, setDate] = useState(initialDate || todayYMD());
  const [selectedSlot, setSelectedSlot] = useState<WaReportSlot>("5PM");
  const [academyCode, setAcademyCode] = useState("LE");

  const [freeTrial, setFreeTrial] = useState(0);
  const [verified, setVerified] = useState(0);
  const [apptTomorrow, setApptTomorrow] = useState(0);
  const [apptDayAfter, setApptDayAfter] = useState(0);
  const [collAppt, setCollAppt] = useState(0);
  const [collVerified, setCollVerified] = useState(0);
  const [collShow, setCollShow] = useState(0);

  const [showManualForm, setShowManualForm] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const savedCode = getSetting("academy_code");
    if (savedCode) setAcademyCode(savedCode);
  }, []);

  useEffect(() => {
    const w = getWaReport(date);
    if (w?.report_time) {
      setSelectedSlot(normalizeReportSlot(w.report_time));
    }
    setFreeTrial(w?.free_trial ?? 0);
    setVerified(w?.verified ?? 0);
    setApptTomorrow(w?.appt_tomorrow ?? 0);
    setApptDayAfter(w?.appt_day_after ?? 0);
    setCollAppt(w?.collection_appt ?? 0);
    setCollVerified(w?.collection_verified ?? 0);
    setCollShow(w?.collection_show ?? 0);
  }, [date]);

  const persistChanges = (overrideSlot?: WaReportSlot) => {
    const slotToSave = overrideSlot || selectedSlot;
    upsertWaReport(date, {
      report_time: slotToSave,
      free_trial: freeTrial,
      verified,
      appt_tomorrow: apptTomorrow,
      appt_day_after: apptDayAfter,
      collection_appt: collAppt,
      collection_verified: collVerified,
      collection_show: collShow,
    });
  };

  const handleSlotChange = (slot: WaReportSlot) => {
    setSelectedSlot(slot);
    upsertWaReport(date, {
      report_time: slot,
      free_trial: freeTrial,
      verified,
      appt_tomorrow: apptTomorrow,
      appt_day_after: apptDayAfter,
      collection_appt: collAppt,
      collection_verified: collVerified,
      collection_show: collShow,
    });
  };

  const handleAcademyCodeChange = (code: string) => {
    setAcademyCode(code);
    setSetting("academy_code", code.trim());
  };

  const previewText = useMemo(() => {
    return buildWhatsappReport(date, selectedSlot);
  }, [
    date,
    selectedSlot,
    academyCode,
    freeTrial,
    verified,
    apptTomorrow,
    apptDayAfter,
    collAppt,
    collVerified,
    collShow,
  ]);

  const handleCopy = async () => {
    persistChanges();
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(previewText);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = previewText;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
      showToast(`Report ${selectedSlot} (${displayDate(date)}) siap di-paste ke WhatsApp!`, "success");
    } catch {
      showToast("Gagal menyalin otomatis. Silakan salin manual dari kotak preview.", "error");
    }
  };

  const isClosingSlot = selectedSlot === "9PM" || selectedSlot === "10PM";

  return (
    <div className="flex flex-col gap-3">
      <div>
        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
          Pilih Jam Laporan:
        </label>
        <div className="grid grid-cols-4 gap-1.5 p-1 bg-slate-100 dark:bg-[#161722] rounded-xl border border-slate-200 dark:border-slate-800">
          {(["1PM", "5PM", "9PM", "10PM"] as WaReportSlot[]).map((slot) => {
            const active = selectedSlot === slot;
            return (
              <button
                key={slot}
                type="button"
                onClick={() => handleSlotChange(slot)}
                className={`py-2 px-1 text-xs font-black rounded-lg transition-all flex flex-col items-center justify-center cursor-pointer ${
                  active
                    ? "bg-[#00A3A6] text-white shadow-md shadow-[#00A3A6]/30 scale-[1.02]"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <span>{slot}</span>
                <span className="text-[9px] font-medium opacity-80">
                  {slot === "1PM" ? "Siang" : slot === "5PM" ? "Sore" : "Closing"}
                </span>
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-1.5 mt-1.5 px-1">
          <span className="inline-block w-2 h-2 rounded-full bg-[#00A3A6]" />
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            {isClosingSlot
              ? "Format Closing Malam (9/10 PM): Termasuk Production, Cancellation, COED, Dues in Bank (Month) & COED in Bank (Month)."
              : `Format Progres Siang/Sore (${selectedSlot}): Cancelation, Production, Sales Dues unit, Collection Report, & COED hari ini.`}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <DateField label="Tanggal Laporan" value={date} onChange={setDate} testID="wa-date" />
        <TextField
          label="Kode Cabang / Head"
          value={academyCode}
          onChangeText={handleAcademyCodeChange}
          placeholder="LE / MOI"
          testID="wa-academy"
        />
      </div>

      <Card className="p-3.5 border-slate-200 dark:border-slate-800">
        <div
          className="flex items-center justify-between cursor-pointer"
          onClick={() => setShowManualForm(!showManualForm)}
        >
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={16} className="text-[#00A3A6]" weight="bold" />
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Input Manual Progres & Collection
            </span>
          </div>
          <span className="text-[11px] font-bold text-[#00A3A6]">
            {showManualForm ? "Tutup" : "Ubah Angka"}
          </span>
        </div>

        {showManualForm && (
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2.5">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Production Progress
            </span>
            <div className="grid grid-cols-2 gap-2">
              <NumberField
                label="Free Trial"
                value={freeTrial}
                onChange={(v) => {
                  setFreeTrial(v);
                  upsertWaReport(date, { free_trial: v });
                }}
                testID="wa-freetrial"
              />
              <NumberField
                label="Verified"
                value={verified}
                onChange={(v) => {
                  setVerified(v);
                  upsertWaReport(date, { verified: v });
                }}
                testID="wa-verified"
              />
              <NumberField
                label="Appt Tomorrow"
                value={apptTomorrow}
                onChange={(v) => {
                  setApptTomorrow(v);
                  upsertWaReport(date, { appt_tomorrow: v });
                }}
                testID="wa-appt-tomorrow"
              />
              <NumberField
                label="Appt Day After"
                value={apptDayAfter}
                onChange={(v) => {
                  setApptDayAfter(v);
                  upsertWaReport(date, { appt_day_after: v });
                }}
                testID="wa-appt-dayafter"
              />
            </div>

            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 mt-1">
              Collection Report
            </span>
            <div className="grid grid-cols-3 gap-2">
              <NumberField
                label="Coll Appt"
                value={collAppt}
                onChange={(v) => {
                  setCollAppt(v);
                  upsertWaReport(date, { collection_appt: v });
                }}
                testID="wa-coll-appt"
              />
              <NumberField
                label="Coll Verified"
                value={collVerified}
                onChange={(v) => {
                  setCollVerified(v);
                  upsertWaReport(date, { collection_verified: v });
                }}
                testID="wa-coll-verified"
              />
              <NumberField
                label="Coll Show"
                value={collShow}
                onChange={(v) => {
                  setCollShow(v);
                  upsertWaReport(date, { collection_show: v });
                }}
                testID="wa-coll-show"
              />
            </div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-tight italic">
              * Angka langsung tersimpan otomatis dan memperbarui teks preview di bawah.
            </p>
          </div>
        )}
      </Card>

      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={handleCopy}
          data-testid="wa-copy-btn"
          className="w-full py-3 px-4 rounded-xl font-black text-sm text-white flex items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.98] cursor-pointer bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30"
        >
          {copied ? (
            <>
              <CheckCircle size={20} weight="fill" className="text-white animate-bounce" />
              <span>BERHASIL DISALIN KE CLIPBOARD!</span>
            </>
          ) : (
            <>
              <Copy size={20} weight="fill" />
              <span>SALIN REPORT WHATSAPP ({selectedSlot})</span>
            </>
          )}
        </button>

        <a
          href={`https://api.whatsapp.com/send?text=${encodeURIComponent(previewText)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full py-2.5 px-3 rounded-xl font-bold text-xs text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-center gap-2 hover:bg-emerald-100 transition-colors"
        >
          <PaperPlaneTilt size={16} weight="bold" />
          <span>Buka di WhatsApp Web / App Langsung</span>
        </a>
      </div>

      <div className="flex flex-col gap-1.5 mt-1">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
            <ChatText size={16} className="text-emerald-600 dark:text-emerald-400" weight="fill" />
            <span>Format Pesan WhatsApp (Siap Kirim)</span>
          </div>
          <span className="text-[10px] font-semibold text-slate-400">
            Format Bold: *teks*
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#EFEAE2] dark:bg-[#111B21] border border-[#DAD3C7] dark:border-[#222E35] text-slate-900 dark:text-[#E9EDEF] shadow-inner">
          <pre
            data-testid="wa-preview"
            className="font-mono text-xs whitespace-pre-wrap leading-relaxed select-all selection:bg-emerald-400/30"
          >
            {previewText}
          </pre>
        </div>
      </div>
    </div>
  );
};
