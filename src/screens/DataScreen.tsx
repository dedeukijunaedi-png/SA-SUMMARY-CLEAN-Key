import React, { useRef, useState } from "react";
import { Database, DownloadSimple, UploadSimple, Warning } from "@phosphor-icons/react";
import { Header } from "@/src/components/ui/Header";
import { Card } from "@/src/components/ui/Card";
import { Button } from "@/src/components/ui/Inputs";
import { KeyValue, SectionTitle } from "@/src/components/ui/UIComponents";
import { useToast } from "@/src/components/ui/Toast";
import { exportDatabaseToJson } from "@/src/services/exporter";
import {
  applyImport,
  ImportMode,
  ImportPreview,
  Normalized,
  parseBackup,
  previewImport,
} from "@/src/services/importer";
import { listImportLogs } from "@/src/db/repo";
import { displayDateTime } from "@/src/lib/date";

export const DataScreen: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { confirm, showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState(false);
  const [normalized, setNormalized] = useState<Normalized | null>(null);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [mode, setMode] = useState<ImportMode>("merge");
  const [logs, setLogs] = useState(() => listImportLogs());

  const handleExport = async () => {
    setBusy(true);
    try {
      await exportDatabaseToJson();
      setLogs(listImportLogs());
      showToast("Database berhasil diexport / dibagikan", "success");
    } catch (e: any) {
      showToast("Gagal export: " + (e?.message ?? ""), "error");
    } finally {
      setBusy(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setBusy(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = String(event.target?.result ?? "");
        const n = parseBackup(text);
        if (n.format === "unknown") {
          showToast("Format backup tidak dikenali", "error");
          setBusy(false);
          return;
        }
        setNormalized(n);
        setPreview(previewImport(n));
        setMode("merge");
        showToast("File backup berhasil dimuat", "info");
      } catch (err: any) {
        showToast("Gagal membaca file: " + (err?.message ?? ""), "error");
      } finally {
        setBusy(false);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleApply = async () => {
    if (!normalized) return;
    if (mode === "replace") {
      const ok = await confirm({
        title: "Replace seluruh database?",
        message:
          "Semua data saat ini akan diganti dengan isi backup. Data yang ada akan dihapus.",
        confirmText: "Replace",
        destructive: true,
      });
      if (!ok) return;
    }
    setBusy(true);
    const result = applyImport(normalized, mode);
    setBusy(false);
    if (!result.ok) {
      showToast("Import gagal: " + result.error, "error");
      return;
    }
    const total = Object.values(result.added).reduce((a, b) => a + b, 0);
    setLogs(listImportLogs());
    setNormalized(null);
    setPreview(null);
    showToast(`Import selesai: ${total} record ditambahkan`, "success");
  };

  return (
    <div className="flex flex-col min-h-screen pb-24">
      <Header title="Import / Export" subtitle="Backup & restore JSON" onBack={onBack} />

      <main className="max-w-md mx-auto w-full px-4 pt-3 flex flex-col gap-3">
        <Card testID="export-card" className="p-4 flex flex-col gap-2 border-[#00A3A6]/30">
          <div className="flex items-center gap-2 text-[#00A3A6] dark:text-[#38D9D9]">
            <Database size={20} weight="fill" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Export Database</h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Simpan seluruh data (team, produk, closing, target, production, COED, cancellation, settings) ke satu file JSON.
          </p>
          <Button
            title="Export ke JSON"
            onClick={handleExport}
            loading={busy}
            icon={<DownloadSimple size={18} weight="bold" />}
            testID="btn-export"
            className="w-full mt-1"
          />
        </Card>

        <Card testID="import-card" className="p-4 flex flex-col gap-2 border-[#00A3A6]/30">
          <div className="flex items-center gap-2 text-[#00A3A6] dark:text-[#38D9D9]">
            <UploadSimple size={20} weight="fill" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Import Database</h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Pilih backup aplikasi lama (Rockstar) atau hasil export SA Summary. Data akan dipreview sebelum diterapkan.
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={handleFileChange}
          />
          <Button
            title="Pilih File JSON"
            variant="secondary"
            onClick={() => fileInputRef.current?.click()}
            loading={busy}
            testID="btn-pick"
            className="w-full mt-1"
          />
        </Card>

        {preview && normalized && (
          <div className="flex flex-col gap-2 mt-2">
            <SectionTitle>Preview Import</SectionTitle>
            <Card testID="import-preview" className="p-4 divide-y divide-[#F3F4F6] dark:divide-[#2D3748]">
              <div className="pb-2">
                <span className="inline-block px-2.5 py-1 rounded-full text-xs font-bold bg-[#00A3A6]/15 text-[#00A3A6] dark:text-[#38D9D9] border border-[#00A3A6]/30">
                  Format: {preview.format === "rockstar_old" ? "Backup Lama (Rockstar)" : "SA Summary Export"}
                </span>
              </div>
              <KeyValue label="Team" value={`${preview.counts.team}`} />
              <KeyValue label="Products" value={`${preview.counts.products}`} />
              <KeyValue label="Monthly Targets" value={`${preview.counts.monthlyTargets}`} />
              <KeyValue label="Legacy Targets" value={`${preview.counts.legacyTargets}`} />
              <KeyValue
                label="Closings"
                value={`${preview.counts.closings} (${preview.counts.closingItems} item)`}
              />
              <KeyValue label="Daily Production" value={`${preview.counts.production}`} />
              <KeyValue label="COED" value={`${preview.counts.coed}`} />
              <KeyValue label="Cancellation" value={`${preview.counts.cancellations}`} />
              <KeyValue label="Settings" value={`${preview.counts.settings}`} />

              {(preview.duplicates.closings +
                preview.duplicates.coed +
                preview.duplicates.cancellations +
                preview.duplicates.production) > 0 && (
                <div className="py-2.5 flex items-start gap-2 text-xs text-[#D97706] dark:text-[#F59E0B]">
                  <Warning size={18} weight="fill" className="shrink-0 mt-0.5" />
                  <span>
                    Duplikat terdeteksi: {preview.duplicates.closings} closing, {preview.duplicates.production} production, {preview.duplicates.coed} COED, {preview.duplicates.cancellations} cancellation (akan dilewati saat Merge).
                  </span>
                </div>
              )}

              {preview.unmapped.length > 0 && (
                <div className="py-2.5 flex items-start gap-2 text-xs text-[#DC2626] dark:text-[#EF4444]">
                  <Warning size={18} weight="fill" className="shrink-0 mt-0.5" />
                  <span>{preview.unmapped.length} data tidak dapat dipetakan.</span>
                </div>
              )}

              <div className="pt-3">
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
                  Pilih Mode Import:
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    data-testid="mode-merge"
                    onClick={() => setMode("merge")}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      mode === "merge"
                        ? "bg-[#00A3A6] text-white border-[#00A3A6]"
                        : "bg-white dark:bg-[#161722] text-slate-700 dark:text-slate-300 border-slate-300 dark:border-[#282A3A]"
                    }`}
                  >
                    Merge (Aman)
                  </button>
                  <button
                    type="button"
                    data-testid="mode-replace"
                    onClick={() => setMode("replace")}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                      mode === "replace"
                        ? "bg-[#DC2626] text-white border-[#DC2626]"
                        : "bg-white dark:bg-[#1E1E1E] text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700"
                    }`}
                  >
                    Replace (Ganti Total)
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 mt-2">
                  {mode === "merge"
                    ? "Merge: data lama dipertahankan, hanya menambah yang baru."
                    : "Replace: seluruh database diganti dengan isi backup."}
                </p>

                <Button
                  title="Terapkan Import"
                  onClick={handleApply}
                  loading={busy}
                  testID="btn-apply"
                  className="w-full mt-3"
                />
              </div>
            </Card>
          </div>
        )}

        {logs.length > 0 && (
          <div className="flex flex-col gap-2 mt-2">
            <SectionTitle>Riwayat Import / Export</SectionTitle>
            <div className="flex flex-col gap-2">
              {logs.map((l: any) => (
                <Card key={l.id} className="p-3 text-xs flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white uppercase tracking-wider">
                      {l.source} · {l.mode}
                    </p>
                    <p className="text-slate-400 mt-0.5">{l.summary}</p>
                  </div>
                  <span className="text-[11px] text-slate-400 shrink-0">
                    {displayDateTime(l.created_at.slice(0, 10), l.created_at.slice(11, 16))}
                  </span>
                </Card>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
