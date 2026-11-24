import { getSetting, setSetting } from "@/src/db/repo";
import { displayDate, todayYMD, toYMD } from "@/src/lib/date";
import { exportDatabaseToJson } from "@/src/services/exporter";
import { wasLastShareCancelled } from "@/src/services/fileShare";

export const LAST_BACKUP_SETTING_KEY = "last_backup_at";
export const BACKUP_DISMISSED_STORAGE_KEY = "sa_backup_banner_dismissed";
export const BACKUP_REMINDER_THRESHOLD_DAYS = 7;

const MS_PER_DAY = 86_400_000;
const YMD_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export function parseValidLocalYMD(value: string | null | undefined): string | null {
  if (!value || typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!YMD_REGEX.test(trimmed)) return null;

  const [yStr, mStr, dStr] = trimmed.split("-");
  const y = Number(yStr);
  const m = Number(mStr);
  const d = Number(dStr);
  if (!Number.isInteger(y) || !Number.isInteger(m) || !Number.isInteger(d)) return null;
  if (m < 1 || m > 12 || d < 1 || d > 31) return null;

  const localDate = new Date(y, m - 1, d);
  if (Number.isNaN(localDate.getTime())) return null;
  if (toYMD(localDate) !== trimmed) return null;

  return trimmed;
}

export function daysSinceLocalYMD(lastYmd: string, today: string = todayYMD()): number {
  const validLast = parseValidLocalYMD(lastYmd);
  const validToday = parseValidLocalYMD(today);
  if (!validLast || !validToday) return 0;

  const [ly, lm, ld] = validLast.split("-").map((x) => Number(x));
  const [ty, tm, td] = validToday.split("-").map((x) => Number(x));

  const lastEpochDay = Date.UTC(ly, lm - 1, ld);
  const todayEpochDay = Date.UTC(ty, tm - 1, td);
  const diffDays = Math.round((todayEpochDay - lastEpochDay) / MS_PER_DAY);

  if (!Number.isFinite(diffDays) || diffDays <= 0) return 0;
  return diffDays;
}

export function getLastBackupDate(): string | null {
  try {
    return parseValidLocalYMD(getSetting(LAST_BACKUP_SETTING_KEY));
  } catch {
    return null;
  }
}

export function formatLastBackupDisplay(lastBackupAt: string | null): string {
  const valid = parseValidLocalYMD(lastBackupAt);
  return valid ? displayDate(valid) : "Belum pernah";
}

export function isBackupBannerDismissedToday(today: string = todayYMD()): boolean {
  try {
    if (typeof window === "undefined") return false;
    const stored = window.localStorage.getItem(BACKUP_DISMISSED_STORAGE_KEY);
    return parseValidLocalYMD(stored) === today;
  } catch {
    return false;
  }
}

export function dismissBackupBannerToday(): void {
  try {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(BACKUP_DISMISSED_STORAGE_KEY, todayYMD());
  } catch {
  }
}

export interface BackupReminderState {
  lastBackupAt: string | null;
  daysSinceBackup: number | null;
  needsBackup: boolean;
  dismissedToday: boolean;
  shouldShow: boolean;
}

export function getBackupReminderState(): BackupReminderState {
  const today = todayYMD();
  const lastBackupAt = getLastBackupDate();
  const daysSinceBackup = lastBackupAt ? daysSinceLocalYMD(lastBackupAt, today) : null;
  const needsBackup =
    lastBackupAt === null ||
    (daysSinceBackup !== null && daysSinceBackup > BACKUP_REMINDER_THRESHOLD_DAYS);
  const dismissedToday = isBackupBannerDismissedToday(today);

  return {
    lastBackupAt,
    daysSinceBackup,
    needsBackup,
    dismissedToday,
    shouldShow: needsBackup && !dismissedToday,
  };
}

export async function runBackupAndRecord(): Promise<{ json: string; backupDate: string }> {
  const json = await exportDatabaseToJson();
  if (wasLastShareCancelled()) {
    throw new Error("Dibatalkan, file backup belum disimpan");
  }
  const backupDate = todayYMD();
  setSetting(LAST_BACKUP_SETTING_KEY, backupDate);
  return { json, backupDate };
}
