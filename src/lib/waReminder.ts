import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";
import { getSetting, setSetting } from "@/src/db/repo";

export type WaReminderSlotId = "1PM" | "5PM" | "9PM" | "10PM";

export interface WaReminderSlot {
  id: WaReminderSlotId;
  label: string;
  timeText: string;
  hour: number;
  minute: number;
  notificationId: number;
  settingKey: string;
}

export const WA_REMINDER_SLOTS: readonly WaReminderSlot[] = [
  {
    id: "1PM",
    label: "1PM (13:00)",
    timeText: "13:00",
    hour: 13,
    minute: 0,
    notificationId: 1001,
    settingKey: "wa_reminder_1PM",
  },
  {
    id: "5PM",
    label: "5PM (17:00)",
    timeText: "17:00",
    hour: 17,
    minute: 0,
    notificationId: 1002,
    settingKey: "wa_reminder_5PM",
  },
  {
    id: "9PM",
    label: "9PM (21:00)",
    timeText: "21:00",
    hour: 21,
    minute: 0,
    notificationId: 1003,
    settingKey: "wa_reminder_9PM",
  },
  {
    id: "10PM",
    label: "10PM (22:00)",
    timeText: "22:00",
    hour: 22,
    minute: 0,
    notificationId: 1004,
    settingKey: "wa_reminder_10PM",
  },
];

export type WaReminderState = Record<WaReminderSlotId, boolean>;

export function getWaReminderState(): WaReminderState {
  const result: WaReminderState = {
    "1PM": false,
    "5PM": false,
    "9PM": false,
    "10PM": false,
  };
  for (const slot of WA_REMINDER_SLOTS) {
    try {
      result[slot.id] = getSetting(slot.settingKey) === "1";
    } catch {
      result[slot.id] = false;
    }
  }
  return result;
}

export function getWaReminderSignature(): string {
  const state = getWaReminderState();
  return WA_REMINDER_SLOTS.map((s) => (state[s.id] ? "1" : "0")).join("");
}

let lastSyncedSignature: string | null = null;
let syncQueue: Promise<void> = Promise.resolve();

async function runSyncTask(force: boolean): Promise<void> {
  const sig = getWaReminderSignature();
  if (!force && sig === lastSyncedSignature) {
    return;
  }
  lastSyncedSignature = sig;

  if (!Capacitor.isNativePlatform()) return;

  try {
    await LocalNotifications.cancel({
      notifications: WA_REMINDER_SLOTS.map((s) => ({ id: s.notificationId })),
    });
  } catch (err) {
    console.warn("LocalNotifications.cancel failed:", err);
  }

  const state = getWaReminderState();
  const activeSlots = WA_REMINDER_SLOTS.filter((s) => state[s.id]);
  if (activeSlots.length === 0) return;

  try {
    const perm = await LocalNotifications.checkPermissions();
    if (perm.display !== "granted") {
      return;
    }

    await LocalNotifications.schedule({
      notifications: activeSlots.map((slot) => ({
        id: slot.notificationId,
        title: "Laporan WhatsApp",
        body: `Waktunya kirim laporan (${slot.id})`,
        isExactNotification: false,
        schedule: {
          on: { hour: slot.hour, minute: slot.minute },
          repeats: true,
          allowWhileIdle: true,
        },
      })),
    });
  } catch (err) {
    console.warn("LocalNotifications.schedule failed:", err);
  }
}

export function syncWaReminders(force = true): Promise<void> {
  syncQueue = syncQueue
    .then(() => runSyncTask(force))
    .catch((err) => {
      console.warn("syncWaReminders failed:", err);
    });
  return syncQueue;
}

export function syncWaRemindersIfSignatureChanged(): void {
  try {
    const currentSig = getWaReminderSignature();
    if (currentSig === lastSyncedSignature) {
      return;
    }
    void syncWaReminders(false);
  } catch (err) {
    console.warn("syncWaRemindersIfSignatureChanged failed:", err);
  }
}

export interface ToggleWaReminderResult {
  enabled: boolean;
  permissionDenied: boolean;
}

export async function toggleWaReminder(
  slotId: WaReminderSlotId,
  nextEnabled: boolean,
): Promise<ToggleWaReminderResult> {
  const slot = WA_REMINDER_SLOTS.find((s) => s.id === slotId);
  if (!slot) {
    return { enabled: false, permissionDenied: false };
  }

  if (nextEnabled && Capacitor.isNativePlatform()) {
    try {
      let perm = await LocalNotifications.checkPermissions();
      if (perm.display !== "granted") {
        perm = await LocalNotifications.requestPermissions();
      }
      if (perm.display !== "granted") {
        setSetting(slot.settingKey, "0");
        await syncWaReminders();
        return { enabled: false, permissionDenied: true };
      }
    } catch (err) {
      console.warn("LocalNotifications permission error:", err);
    }
  }

  setSetting(slot.settingKey, nextEnabled ? "1" : "0");
  await syncWaReminders(false);
  return { enabled: nextEnabled, permissionDenied: false };
}
