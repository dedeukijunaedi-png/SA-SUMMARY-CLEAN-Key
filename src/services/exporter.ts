import { getDb } from "@/src/db/database";
import { addImportLog } from "@/src/db/repo";
import { SCHEMA_VERSION } from "@/src/db/schema";
import { nowISO, todayYMD } from "@/src/lib/date";

const TABLES = [
  "team_members",
  "products",
  "monthly_targets",
  "legacy_personal_targets",
  "closing_transactions",
  "closing_items",
  "daily_production",
  "coed_entries",
  "cancellation_entries",
  "whatsapp_reports",
  "app_settings",
  "import_logs",
];

export function buildSnapshot() {
  const db = getDb();
  const data: Record<string, any[]> = {};
  for (const t of TABLES) {
    data[t] = db.getAllSync<any>(`SELECT * FROM ${t}`);
  }
  return {
    app: "SA Summary",
    schema_version: SCHEMA_VERSION,
    exported_at: nowISO(),
    data,
  };
}

import { shareOrSaveFile } from "@/src/services/fileShare";

export async function downloadFile(filename: string, content: string, mimeType = "application/json") {
  await shareOrSaveFile({
    filename,
    title: filename,
    mimeType,
    text: content,
  });
}

export async function exportDatabaseToJson(): Promise<string> {
  const snapshot = buildSnapshot();
  const json = JSON.stringify(snapshot, null, 2);
  const stamp = todayYMD();
  const filename = `sa_summary_backup_${stamp}.json`;
  await shareOrSaveFile({
    filename,
    title: "SA Summary Database Backup",
    mimeType: "application/json",
    text: json,
  });
  const totalCount = Object.values(snapshot.data).reduce((a: number, b: any) => a + (b?.length ?? 0), 0);
  addImportLog("export", "export", `Exported ${totalCount} records`);
  return json;
}
