import {
  cancellationCount,
  coedTotals,
  productionForDay,
  project,
  salesAgg,
  salesUnitForDay,
  targetInfo,
} from "./calc";
import { getSetting, getWaReport } from "@/src/db/repo";
import { displayDate, fromYMD } from "@/src/lib/date";
import { formatWaNumber } from "@/src/lib/format";

export type WaReportSlot = "1PM" | "5PM" | "9PM" | "10PM";

export function normalizeReportSlot(raw?: string | null): WaReportSlot {
  if (!raw) return "5PM";
  const upper = raw.toUpperCase().replace(/\s+/g, "");
  if (upper.includes("10PM") || upper.includes("10:00") || upper.includes("22:00")) return "10PM";
  if (upper.includes("9PM") || upper.includes("9:00") || upper.includes("21:00")) return "9PM";
  if (upper.includes("1PM") || upper.includes("13:00")) return "1PM";
  return "5PM";
}

export function buildWhatsappReport(date: string, slotOverride?: string): string {
  const d = fromYMD(date);
  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  const day = d.getDate();

  const manual = getWaReport(date);
  const slot = normalizeReportSlot(slotOverride ?? manual?.report_time);
  const isClosing = slot === "9PM" || slot === "10PM";

  const academyCode = getSetting("academy_code")?.trim() || "LE";

  const dayProd = productionForDay(date);
  const dayCoed = coedTotals(year, month, date);
  const monthCoed = coedTotals(year, month);

  const monthSales = salesAgg(year, month, undefined, date);
  const duesUnit = monthSales.duesUnit;
  const duesGross = monthSales.duesGross;
  const duesUnitProjo = project(duesUnit, year, month, day);
  const duesGrossProjo = project(duesGross, year, month, day);

  const t = targetInfo(year, month);
  const projoPct = t.dues > 0 ? `${((duesGrossProjo / t.dues) * 100).toFixed(2)}%` : "-";

  const n = (v: number | null | undefined) => formatWaNumber(v, true);

  const daySalesUnit = salesUnitForDay(date);
  const salesUnitDisplay = n(daySalesUnit);

  const cancelToday = cancellationCount(year, month, undefined, date);
  const totalCancelMonth = cancellationCount(year, month);

  const lines: string[] = [
    `*${academyCode} ${displayDate(date)} (${slot})*`,
    "",
    "*Cancelation*",
    `Cancel today: ${n(cancelToday)}`,
    `Total cancel in month: ${n(totalCancelMonth)}`,
    "",
    "*Production*",
    `Appt Today: ${n(dayProd.appointment)}`,
    `Verified: ${n(manual?.verified ?? 0)}`,
    `Show: ${n(dayProd.show)}`,
    `Free Trial: ${n(manual?.free_trial ?? 0)}`,
    `Interview: ${n(dayProd.interview)}`,
    `Appt tomorrow: ${n(manual?.appt_tomorrow ?? 0)}`,
    `Appt the day after: ${n(manual?.appt_day_after ?? 0)}`,
    `Leads: ${n(dayProd.leads)}`,
    "",
    `*Sales Dues (unit): ${salesUnitDisplay}*`,
    "",
    "*Collection Report*",
    `Collection Appt: ${n(manual?.collection_appt ?? 0)}`,
    `Collection Verified: ${n(manual?.collection_verified ?? 0)}`,
    `Collection Show: ${n(manual?.collection_show ?? 0)}`,
    "",
    "*COED*",
    `HO autopay today: ${n(dayCoed.HO_AUTOPAY)}`,
    `Advance payment today: ${n(dayCoed.ADVANCE_PAYMENT)}`,
    `Advance freeze payment today: ${n(dayCoed.ADVANCE_FREEZE)}`,
    `Collection today: ${n(dayCoed.COLLECTION)}`,
  ];

  if (isClosing) {
    lines.push(
      "",
      "*Dues in Bank (Month)*",
      `Dues Unit: ${n(duesUnit)}`,
      `Dues Unit Projo: ${n(duesUnitProjo)}`,
      `Dues$: ${n(duesGross)}`,
      `Dues$ Projo: ${n(duesGrossProjo)} (${projoPct})`,
      "",
      "*COED in Bank (Month)*",
      `HO autopay paid: ${n(monthCoed.HO_AUTOPAY)}`,
      `Adv payment paid: ${n(monthCoed.ADVANCE_PAYMENT)}`,
      `Adv freeze paid: ${n(monthCoed.ADVANCE_FREEZE)}`,
      `Collection paid: ${n(monthCoed.COLLECTION)}`,
      `COED total: ${n(monthCoed.total)}`
    );
  }

  return lines.join("\n");
}
