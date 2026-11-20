import * as XLSX from "xlsx";
import { Capacitor } from "@capacitor/core";
import { getDb } from "@/src/db/database";
import { listTeam, getSetting } from "@/src/db/repo";
import { calculateFunnelRequirements, FunnelRequirements, project, salesAgg, targetInfo } from "./calc";
import { daysInMonth, displayDate, fromYMD, monthLabel } from "@/src/lib/date";
import { formatRupiah, formatInt, formatPercent, pct } from "@/src/lib/format";
import { shareOrSaveFile } from "@/src/services/fileShare";

const db = () => getDb();

export interface MemberReport {
  name: string;
  position: string;
  hasTarget: boolean;
  leads: number;
  appointment: number;
  show: number;
  interview: number;
  duesUnit: number;
  duesGross: number;
  duesAch: number;
  personalDuesTarget: number;
  duesGrossPct: number | null;
  duesAchPct: number | null;
  privGross: number;
  privAch: number;
  personalPrivTarget: number;
  privGrossPct: number | null;
  privAchPct: number | null;
  totalGross: number;
  totalAch: number;
  personalTarget: number;
  apptConv: number | null; // appt/leads %
  showRate: number | null; // show/appt %
  interviewRate: number | null; // interview/show %
  closeRate: number | null; // duesUnit/interview %
  leadsConv: number | null; // duesUnit/leads %
}

export interface ProductClosingSummary {
  kind: "DUES" | "PRIVATE";
  productName: string;
  quantity: number;
  actualQty: number;
  delayQty: number;
  decomQty: number;
  grossRevenue: number;
  achievementRevenue: number;
}

export interface ReportData {
  title: string;
  periodLabel: string;
  start: string;
  end: string;
  members: MemberReport[];
  totals: Omit<
    MemberReport,
    | "name"
    | "position"
    | "hasTarget"
    | "personalTarget"
    | "personalDuesTarget"
    | "duesGrossPct"
    | "duesAchPct"
    | "personalPrivTarget"
    | "privGrossPct"
    | "privAchPct"
  >;
  targetUnit: number;
  selectedProductsLabel: string;
  funnelRequirements: FunnelRequirements;
  gap: {
    duesTarget: number;
    duesGross: number;
    duesAch: number;
    target80: number;
    target100: number;
    remainingTo80: number;
    remainingTo100: number;
    remainingAchTo80: number;
    remainingAchTo100: number;
    unitsTo80: number;
    unitsTo100: number;
    unitsAchTo80: number;
    unitsAchTo100: number;
    unitBreakdownTo80: { product: any; units: number }[];
    unitBreakdownTo100: { product: any; units: number }[];
    unitBreakdownAchTo80: { product: any; units: number }[];
    unitBreakdownAchTo100: { product: any; units: number }[];
    projGross: number;
    projDuesAch: number;
    effectiveDays: number;
    dim: number;
    privTarget: number;
    privGross: number;
    privAch: number;
    remainingPriv: number;
    remainingPrivAch: number;
    projPrivGross: number;
    projPrivAch: number;
    academyTarget: number;
    totalGross: number;
    totalAch: number;
    projTotalGross: number;
    projTotalAch: number;
  };
  productBreakdown?: ProductClosingSummary[];
}

export function buildReportData(
  year: number,
  month: number,
  start: string,
  end: string,
  title = "MTD Report",
): ReportData {
  const team = listTeam(true);
  const info = targetInfo(year, month);
  const members: MemberReport[] = team.map((m) => {
    const p = db().getFirstSync<any>(
      `SELECT COALESCE(SUM(leads),0) leads, COALESCE(SUM(appointment),0) appointment, COALESCE(SUM(show),0) show, COALESCE(SUM(interview),0) interview
       FROM daily_production WHERE deleted_at IS NULL AND advisor_id=? AND date BETWEEN ? AND ?`,
      [m.id, start, end],
    );
    const s = db().getFirstSync<any>(
      `SELECT
        COALESCE(SUM(CASE WHEN i.kind='DUES' THEN i.quantity ELSE 0 END),0) duesUnit,
        COALESCE(SUM(CASE WHEN i.kind='DUES' THEN i.gross_revenue ELSE 0 END),0) duesGross,
        COALESCE(SUM(CASE WHEN i.kind='DUES' THEN i.achievement_revenue ELSE 0 END),0) duesAch,
        COALESCE(SUM(CASE WHEN i.kind='PRIVATE' THEN i.gross_revenue ELSE 0 END),0) privGross,
        COALESCE(SUM(CASE WHEN i.kind='PRIVATE' THEN i.achievement_revenue ELSE 0 END),0) privAch
       FROM closing_items i JOIN closing_transactions c ON c.id=i.closing_id
       WHERE c.deleted_at IS NULL AND c.advisor_id=? AND c.date BETWEEN ? AND ?`,
      [m.id, start, end],
    );

    const leads = Number(p?.leads ?? 0);
    const appointment = Number(p?.appointment ?? 0);
    const show = Number(p?.show ?? 0);
    const interview = Number(p?.interview ?? 0);
    const duesUnit = Number(s?.duesUnit ?? 0);
    const duesGross = Number(s?.duesGross ?? 0);
    const duesAch = Number(s?.duesAch ?? 0);
    const privGross = Number(s?.privGross ?? 0);
    const privAch = Number(s?.privAch ?? 0);
    const totalGross = duesGross + privGross;
    const totalAch = duesAch + privAch;

    return {
      name: m.name,
      position: m.position,
      hasTarget: m.has_target === 1,
      leads,
      appointment,
      show,
      interview,
      duesUnit,
      duesGross,
      duesAch,
      personalDuesTarget: m.has_target === 1 ? info.personalDues : 0,
      duesGrossPct: m.has_target === 1 && info.personalDues > 0 ? (duesGross / info.personalDues) * 100 : null,
      duesAchPct: m.has_target === 1 && info.personalDues > 0 ? (duesAch / info.personalDues) * 100 : null,
      privGross,
      privAch,
      personalPrivTarget: m.has_target === 1 ? info.personalPriv : 0,
      privGrossPct: m.has_target === 1 && info.personalPriv > 0 ? (privGross / info.personalPriv) * 100 : null,
      privAchPct: m.has_target === 1 && info.personalPriv > 0 ? (privAch / info.personalPriv) * 100 : null,
      totalGross,
      totalAch,
      personalTarget: m.has_target === 1 ? info.personal : 0,
      apptConv: leads > 0 ? (appointment / leads) * 100 : null,
      showRate: appointment > 0 ? (show / appointment) * 100 : null,
      interviewRate: show > 0 ? (interview / show) * 100 : null,
      closeRate: interview > 0 ? (duesUnit / interview) * 100 : null,
      leadsConv: leads > 0 ? (duesUnit / leads) * 100 : null,
    };
  });

  const rawTotals = members.reduce(
    (a, m) => ({
      leads: a.leads + m.leads,
      appointment: a.appointment + m.appointment,
      show: a.show + m.show,
      interview: a.interview + m.interview,
      duesUnit: a.duesUnit + m.duesUnit,
      duesGross: a.duesGross + m.duesGross,
      duesAch: a.duesAch + m.duesAch,
      privGross: a.privGross + m.privGross,
      privAch: a.privAch + m.privAch,
      totalGross: a.totalGross + m.totalGross,
      totalAch: a.totalAch + m.totalAch,
    }),
    {
      leads: 0,
      appointment: 0,
      show: 0,
      interview: 0,
      duesUnit: 0,
      duesGross: 0,
      duesAch: 0,
      privGross: 0,
      privAch: 0,
      totalGross: 0,
      totalAch: 0,
    },
  );

  const totals = {
    ...rawTotals,
    apptConv: rawTotals.leads > 0 ? (rawTotals.appointment / rawTotals.leads) * 100 : null,
    showRate: rawTotals.appointment > 0 ? (rawTotals.show / rawTotals.appointment) * 100 : null,
    interviewRate: rawTotals.show > 0 ? (rawTotals.interview / rawTotals.show) * 100 : null,
    closeRate: rawTotals.interview > 0 ? (rawTotals.duesUnit / rawTotals.interview) * 100 : null,
    leadsConv: rawTotals.leads > 0 ? (rawTotals.duesUnit / rawTotals.leads) * 100 : null,
  };

  const now = new Date();
  const isCurrentMonth = now.getFullYear() === year && now.getMonth() + 1 === month;
  const dim = daysInMonth(year, month);
  const endDay = fromYMD(end).getDate();

  let effectiveDays: number;
  if (isCurrentMonth) {
    const todayDay = now.getDate();
    effectiveDays = Math.min(endDay, todayDay);
  } else {
    effectiveDays = Math.min(endDay, dim);
  }
  effectiveDays = Math.max(1, effectiveDays);

  const monthSales = salesAgg(year, month, undefined, end);
  const monthDues = monthSales.duesGross;
  const monthDuesAch = monthSales.duesAch;
  const monthPriv = monthSales.privGross;
  const monthPrivAch = monthSales.privAch;
  const target80 = Math.round(info.dues * 0.8);
  const remTo80 = Math.max(0, target80 - monthDues);
  const remTo100 = Math.max(0, info.dues - monthDues);
  const remAchTo80 = Math.max(0, target80 - monthDuesAch);
  const remAchTo100 = Math.max(0, info.dues - monthDuesAch);
  const remPriv = Math.max(0, info.private - monthPriv);
  const remPrivAch = Math.max(0, info.private - monthPrivAch);

  const avgPrice = info.avgPrice;
  const unitsTo80 = avgPrice > 0 ? Math.ceil(remTo80 / avgPrice) : 0;
  const unitsTo100 = avgPrice > 0 ? Math.ceil(remTo100 / avgPrice) : 0;
  const unitsAchTo80 = avgPrice > 0 ? Math.ceil(remAchTo80 / avgPrice) : 0;
  const unitsAchTo100 = avgPrice > 0 ? Math.ceil(remAchTo100 / avgPrice) : 0;

  const unitBreakdownTo80 = info.selectedProducts.map((p) => ({
    product: p,
    units: p.price > 0 ? Math.ceil(remTo80 / p.price) : 0,
  }));

  const unitBreakdownTo100 = info.selectedProducts.map((p) => ({
    product: p,
    units: p.price > 0 ? Math.ceil(remTo100 / p.price) : 0,
  }));

  const unitBreakdownAchTo80 = info.selectedProducts.map((p) => ({
    product: p,
    units: p.price > 0 ? Math.ceil(remAchTo80 / p.price) : 0,
  }));

  const unitBreakdownAchTo100 = info.selectedProducts.map((p) => ({
    product: p,
    units: p.price > 0 ? Math.ceil(remAchTo100 / p.price) : 0,
  }));

  const projDuesGross = Math.round((monthDues / effectiveDays) * dim);
  const projDuesAch = Math.round((monthDuesAch / effectiveDays) * dim);
  const projPrivGross = Math.round((monthPriv / effectiveDays) * dim);
  const projPrivAch = Math.round((monthPrivAch / effectiveDays) * dim);
  const projTotalGross = projDuesGross + projPrivGross;
  const projTotalAch = projDuesAch + projPrivAch;

  const fReq = calculateFunnelRequirements(year, month, info.targetUnit);

  const selectedProductsLabel =
    info.selectedProducts.length > 0
      ? info.selectedProducts.map((p) => `${p.name} (${formatRupiah(p.price)})`).join(" & ")
      : "Rata-rata Produk Dues";

  const prodClosingRows = db().getAllSync<any>(
    `SELECT
      i.kind AS kind,
      i.product_name AS product_name,
      COALESCE(SUM(i.quantity), 0) AS quantity,
      COALESCE(SUM(CASE WHEN i.status='Actual' THEN i.quantity ELSE 0 END), 0) AS actualQty,
      COALESCE(SUM(CASE WHEN i.status='Delay' THEN i.quantity ELSE 0 END), 0) AS delayQty,
      COALESCE(SUM(CASE WHEN i.status='Decom' THEN i.quantity ELSE 0 END), 0) AS decomQty,
      COALESCE(SUM(i.gross_revenue), 0) AS grossRevenue,
      COALESCE(SUM(i.achievement_revenue), 0) AS achievementRevenue
     FROM closing_items i
     JOIN closing_transactions c ON c.id = i.closing_id
     WHERE c.deleted_at IS NULL AND c.date BETWEEN ? AND ?
     GROUP BY i.kind, i.product_name
     ORDER BY CASE WHEN i.kind='DUES' THEN 0 ELSE 1 END ASC, quantity DESC, i.product_name ASC`,
    [start, end],
  );

  const productBreakdown: ProductClosingSummary[] = prodClosingRows.map((r) => ({
    kind: r.kind === "PRIVATE" ? "PRIVATE" : "DUES",
    productName: String(r.product_name ?? ""),
    quantity: Number(r.quantity ?? 0),
    actualQty: Number(r.actualQty ?? 0),
    delayQty: Number(r.delayQty ?? 0),
    decomQty: Number(r.decomQty ?? 0),
    grossRevenue: Number(r.grossRevenue ?? 0),
    achievementRevenue: Number(r.achievementRevenue ?? 0),
  }));

  return {
    title,
    periodLabel: `${displayDate(start)} - ${displayDate(end)} (${monthLabel(year, month)})`,
    start,
    end,
    members,
    totals,
    targetUnit: info.targetUnit,
    selectedProductsLabel,
    funnelRequirements: fReq,
    productBreakdown,
    gap: {
      duesTarget: info.dues,
      duesGross: monthDues,
      duesAch: monthDuesAch,
      target80,
      target100: info.dues,
      remainingTo80: remTo80,
      remainingTo100: remTo100,
      remainingAchTo80: remAchTo80,
      remainingAchTo100: remAchTo100,
      unitsTo80,
      unitsTo100,
      unitsAchTo80,
      unitsAchTo100,
      unitBreakdownTo80,
      unitBreakdownTo100,
      unitBreakdownAchTo80,
      unitBreakdownAchTo100,
      projGross: projDuesGross,
      projDuesAch,
      effectiveDays,
      dim,
      privTarget: info.private,
      privGross: monthPriv,
      privAch: monthPrivAch,
      remainingPriv: remPriv,
      remainingPrivAch: remPrivAch,
      projPrivGross,
      projPrivAch,
      academyTarget: info.academy,
      totalGross: monthDues + monthPriv,
      totalAch: monthDuesAch + monthPrivAch,
      projTotalGross,
      projTotalAch,
    },
  };
}

export function reportHtml(data: ReportData): string {
  const baseLogo = getSetting("logo_uri") || "/rockstar-logo-trimmed.png";
  const logo =
    typeof window !== "undefined" && baseLogo.startsWith("/")
      ? window.location.origin + baseLogo
      : baseLogo;
  const rp = (v: number) => formatRupiah(v);
  const pStr = (v: number | null) => (v != null ? `${v.toFixed(1)}%` : "—");

  const prodRows = data.members
    .map(
      (m) => `
    <tr>
      <td class="l">
        <strong>${m.name}</strong>
        <div style="color: #6b7280; font-size: 10px;">${m.position}</div>
      </td>
      <td>${m.leads}</td>
      <td>${m.appointment}</td>
      <td class="rate" style="color: #00B5B5;">${pStr(m.apptConv)}</td>
      <td>${m.show}</td>
      <td class="rate" style="color: #FF6B35;">${pStr(m.showRate)}</td>
      <td>${m.interview}</td>
      <td class="rate" style="color: #10B981;">${pStr(m.interviewRate)}</td>
      <td style="font-weight: 700;">${m.duesUnit}</td>
      <td class="rate" style="color: #00A3A6; font-weight: 700;">${pStr(m.closeRate)}</td>
      <td class="rate highlight">${pStr(m.leadsConv)}</td>
    </tr>`,
    )
    .join("");

  const salesRows = data.members
    .map(
      (m) => `
    <tr>
      <td class="l">
        <strong>${m.name}</strong>
        <div style="color: #6b7280; font-size: 9.5px;">${m.position}</div>
      </td>
      <td>${m.duesUnit}</td>
      <td>${rp(m.duesGross)}</td>
      <td style="font-weight: 700; color: #00A3A6;">${rp(m.duesAch)}</td>
      <td>${m.hasTarget ? rp(m.personalDuesTarget) : "-"}</td>
      <td style="font-weight: 700; color: #00A3A6;">
        ${m.hasTarget ? `${m.duesAchPct != null ? m.duesAchPct.toFixed(1) : "0.0"}% / ${m.duesGrossPct != null ? m.duesGrossPct.toFixed(1) : "0.0"}%` : "-"}
      </td>
      <td>${rp(m.privGross)}</td>
      <td style="font-weight: 700; color: #8B5CF6;">${rp(m.privAch)}</td>
      <td>${m.hasTarget ? rp(m.personalPrivTarget) : "-"}</td>
      <td style="font-weight: 700; color: #8B5CF6;">
        ${m.hasTarget ? `${m.privAchPct != null ? m.privAchPct.toFixed(1) : "0.0"}% / ${m.privGrossPct != null ? m.privGrossPct.toFixed(1) : "0.0"}%` : "-"}
      </td>
      <td>${rp(m.totalGross)}</td>
      <td style="font-weight: 700; color: #00A3A6;">${rp(m.totalAch)}</td>
      <td>${m.hasTarget ? rp(m.personalTarget) : "-"}</td>
      <td style="font-weight: 700;">${m.hasTarget ? formatPercent(m.totalAch, m.personalTarget) : "-"}</td>
    </tr>`,
    )
    .join("");

  const req = data.funnelRequirements;

  const unitStr80 =
    data.gap.unitBreakdownTo80.length > 0
      ? data.gap.unitBreakdownTo80.map((b) => `${b.units} unit (${b.product.name})`).join(" atau ")
      : `${data.gap.unitsTo80} unit`;

  const unitStr100 =
    data.gap.unitBreakdownTo100.length > 0
      ? data.gap.unitBreakdownTo100.map((b) => `${b.units} unit (${b.product.name})`).join(" atau ")
      : `${data.gap.unitsTo100} unit`;

  const unitStrAch80 =
    data.gap.unitBreakdownAchTo80.length > 0
      ? data.gap.unitBreakdownAchTo80.map((b) => `${b.units} unit (${b.product.name})`).join(" atau ")
      : `${data.gap.unitsAchTo80} unit`;

  const unitStrAch100 =
    data.gap.unitBreakdownAchTo100.length > 0
      ? data.gap.unitBreakdownAchTo100.map((b) => `${b.units} unit (${b.product.name})`).join(" atau ")
      : `${data.gap.unitsAchTo100} unit`;

  const escHtml = (s: string) =>
    String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  const productList = data.productBreakdown ?? [];
  const duesProdList = productList.filter((p) => p.kind === "DUES");
  const privProdList = productList.filter((p) => p.kind === "PRIVATE");
  const sumProd = (arr: ProductClosingSummary[]) =>
    arr.reduce(
      (a, p) => ({
        quantity: a.quantity + p.quantity,
        actualQty: a.actualQty + p.actualQty,
        delayQty: a.delayQty + p.delayQty,
        decomQty: a.decomQty + p.decomQty,
        grossRevenue: a.grossRevenue + p.grossRevenue,
        achievementRevenue: a.achievementRevenue + p.achievementRevenue,
      }),
      { quantity: 0, actualQty: 0, delayQty: 0, decomQty: 0, grossRevenue: 0, achievementRevenue: 0 },
    );
  const duesProdSum = sumProd(duesProdList);
  const privProdSum = sumProd(privProdList);
  const allProdSum = sumProd(productList);

  const productClosingRowsHtml = productList
    .map(
      (p) => `
    <tr>
      <td class="l"><strong>${escHtml(p.productName)}</strong></td>
      <td class="l">
        <span style="display:inline-block;padding:1px 6px;border-radius:4px;font-size:9.5px;font-weight:700;${
          p.kind === "PRIVATE"
            ? "background:#F5F3FF;color:#6D28D9;border:1px solid #DDD6FE;"
            : "background:#F0FDFA;color:#0F766E;border:1px solid #99F6E4;"
        }">${p.kind === "PRIVATE" ? "Private" : "Dues"}</span>
      </td>
      <td style="font-weight:800;">${formatInt(p.quantity)}</td>
      <td style="color:#059669;font-weight:700;">${formatInt(p.actualQty)}</td>
      <td style="color:#D97706;font-weight:700;">${formatInt(p.delayQty)}</td>
      <td style="color:#DC2626;font-weight:700;">${formatInt(p.decomQty)}</td>
      <td>${rp(p.grossRevenue)}</td>
      <td style="font-weight:700;color:#00A3A6;">${rp(p.achievementRevenue)}</td>
    </tr>`,
    )
    .join("");

  const productClosingSectionHtml =
    productList.length === 0
      ? `<div class="callout" style="background:#FAFAFA;border-color:#E5E7EB;color:#6B7280;">Belum ada closing</div>`
      : `
  <table>
    <thead>
      <tr>
        <th class="l">Nama Produk</th>
        <th class="l">Kategori</th>
        <th>Jumlah</th>
        <th>Actual</th>
        <th>Delay</th>
        <th>Decom</th>
        <th>Gross</th>
        <th>Aktual</th>
      </tr>
    </thead>
    <tbody>${productClosingRowsHtml}</tbody>
    <tfoot>
      ${
        duesProdList.length > 0
          ? `<tr>
        <td class="l" colspan="2">TOTAL DUES</td>
        <td>${formatInt(duesProdSum.quantity)}</td>
        <td style="color:#059669;">${formatInt(duesProdSum.actualQty)}</td>
        <td style="color:#D97706;">${formatInt(duesProdSum.delayQty)}</td>
        <td style="color:#DC2626;">${formatInt(duesProdSum.decomQty)}</td>
        <td>${rp(duesProdSum.grossRevenue)}</td>
        <td style="color:#00A3A6;">${rp(duesProdSum.achievementRevenue)}</td>
      </tr>`
          : ""
      }
      ${
        privProdList.length > 0
          ? `<tr>
        <td class="l" colspan="2">TOTAL PRIVATE</td>
        <td>${formatInt(privProdSum.quantity)}</td>
        <td style="color:#059669;">${formatInt(privProdSum.actualQty)}</td>
        <td style="color:#D97706;">${formatInt(privProdSum.delayQty)}</td>
        <td style="color:#DC2626;">${formatInt(privProdSum.decomQty)}</td>
        <td>${rp(privProdSum.grossRevenue)}</td>
        <td style="color:#8B5CF6;">${rp(privProdSum.achievementRevenue)}</td>
      </tr>`
          : ""
      }
      ${
        duesProdList.length > 0 && privProdList.length > 0
          ? `<tr>
        <td class="l" colspan="2">TOTAL KESELURUHAN</td>
        <td>${formatInt(allProdSum.quantity)}</td>
        <td style="color:#059669;">${formatInt(allProdSum.actualQty)}</td>
        <td style="color:#D97706;">${formatInt(allProdSum.delayQty)}</td>
        <td style="color:#DC2626;">${formatInt(allProdSum.decomQty)}</td>
        <td>${rp(allProdSum.grossRevenue)}</td>
        <td style="color:#00A3A6;">${rp(allProdSum.achievementRevenue)}</td>
      </tr>`
          : ""
      }
    </tfoot>
  </table>`;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Rockstar Academy - ${data.title}</title>
  <style>
    * { font-family: -apple-system, BlinkMacSystemFont, "Plus Jakarta Sans", "Segoe UI", Roboto, sans-serif; box-sizing: border-box; }
    body { padding: 24px; color: #111827; background: #fff; max-width: 980px; margin: 0 auto; font-size: 11px; }
    .header-bar { display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #00A3A6; padding-bottom: 10px; margin-bottom: 16px; }
    .brand-title { font-size: 20px; margin: 0; color: #00A3A6; font-weight: 800; letter-spacing: -0.5px; }
    .brand-sub { color: #6b7280; font-size: 12px; margin-top: 2px; }
    .logo-img { height: 38px; width: auto; object-fit: contain; }
    
    .kpi-summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 16px; }
    .kpi-card { background: #FAFAFA; border: 1px solid #E5E7EB; border-radius: 8px; padding: 10px 12px; }
    .kpi-card.dues { border-top: 3px solid #00A3A6; }
    .kpi-card.priv { border-top: 3px solid #8B5CF6; }
    .kpi-card.total { border-top: 3px solid #10B981; }
    .kpi-label { font-size: 10px; font-weight: 700; text-transform: uppercase; color: #6B7280; }
    .kpi-val { font-size: 16px; font-weight: 800; color: #111827; margin: 2px 0; }
    .kpi-sub { font-size: 10px; color: #4B5563; }

    h2 { font-size: 13px; margin: 18px 0 8px; border-left: 3.5px solid #00A3A6; padding-left: 8px; color: #111827; text-transform: uppercase; letter-spacing: 0.5px; page-break-after: avoid; break-after: avoid; }
    table { width: 100%; border-collapse: collapse; font-size: 10.5px; margin-bottom: 14px; }
    th, td { border: 1px solid #E5E7EB; padding: 6px 7px; text-align: right; }
    th { background: #F0FDFA; color: #0F766E; font-weight: 700; font-size: 10.5px; }
    td.l, th.l { text-align: left; }
    td.rate { font-weight: 700; }
    td.highlight { background: #F0FDFA; color: #00A3A6; font-weight: 800; }
    tfoot td { font-weight: 800; background: #F9FAFB; border-top: 2px solid #00A3A6; }
    
    .callout { background: #F0FDFA; border: 1px solid #99F6E4; border-radius: 8px; padding: 10px 12px; margin-bottom: 14px; font-size: 11px; }
    .callout-title { font-weight: 700; color: #0F766E; margin-bottom: 4px; display: flex; align-items: center; justify-content: space-between; }

    .gap-dual-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 6px; }
    .gap-box { border: 1px solid #E5E7EB; border-radius: 8px; padding: 10px 12px; background: #FAFAFA; }
    .gap-box-title { font-size: 11px; font-weight: 800; text-transform: uppercase; margin-bottom: 6px; padding-bottom: 4px; border-bottom: 1px solid #E5E7EB; }
    .gap-box-title.dues { color: #00A3A6; }
    .gap-box-title.priv { color: #8B5CF6; }
    .gap-table { width: 100%; border-collapse: collapse; }
    .gap-table td { border: none; padding: 3px 0; text-align: left; font-size: 11px; }
    .gap-table .v { font-weight: 700; text-align: right; color: #111827; }

    @media print {
      body { padding: 0; }
      @page { margin: 0.8cm; size: A4 landscape; }
      .header-bar { border-bottom: 2px solid #00A3A6; }
      table { page-break-inside: auto; }
      thead { display: table-header-group; }
      tr { page-break-inside: avoid; break-inside: avoid; page-break-after: auto; }
    }
  </style>
</head>
<body>
  <div class="header-bar">
    <div>
      <h1 class="brand-title">ROCKSTAR ACADEMY</h1>
      <div class="brand-sub">${data.title} · Periode: ${data.periodLabel}</div>
    </div>
    <img src="${logo}" alt="Rockstar Academy" class="logo-img" />
  </div>

  <!-- KPI Overview Strip: Dues, Private, Total Akademi -->
  <div class="kpi-summary-grid">
    <div class="kpi-card dues">
      <div class="kpi-label">Dues Membership</div>
      <div class="kpi-val">${rp(data.gap.duesAch)} <span style="font-size: 10px; font-weight: 600; color: #00A3A6;">(Aktual)</span></div>
      <div class="kpi-sub">
        Gross: <strong>${rp(data.gap.duesGross)}</strong> · Target: <strong>${rp(data.gap.duesTarget)}</strong><br/>
        Capaian Akt: <strong>${data.gap.duesTarget > 0 ? ((data.gap.duesAch / data.gap.duesTarget) * 100).toFixed(1) : 0}%</strong> · 
        Gross: <strong>${data.gap.duesTarget > 0 ? ((data.gap.duesGross / data.gap.duesTarget) * 100).toFixed(1) : 0}%</strong> · 
        Unit: <strong>${data.totals.duesUnit}</strong>/${data.targetUnit}
      </div>
    </div>
    <div class="kpi-card priv">
      <div class="kpi-label">Private Class</div>
      <div class="kpi-val">${rp(data.gap.privAch)} <span style="font-size: 10px; font-weight: 600; color: #8B5CF6;">(Aktual)</span></div>
      <div class="kpi-sub">
        Gross: <strong>${rp(data.gap.privGross)}</strong> · Target: <strong>${rp(data.gap.privTarget)}</strong><br/>
        Capaian Akt: <strong>${data.gap.privTarget > 0 ? ((data.gap.privAch / data.gap.privTarget) * 100).toFixed(1) : 0}%</strong> · 
        Sisa Akt: <strong>${rp(data.gap.remainingPrivAch)}</strong>
      </div>
    </div>
    <div class="kpi-card total">
      <div class="kpi-label">Total Revenue Akademi</div>
      <div class="kpi-val">${rp(data.gap.totalAch)} <span style="font-size: 10px; font-weight: 600; color: #10B981;">(Aktual)</span></div>
      <div class="kpi-sub">
        Total Gross: <strong>${rp(data.gap.totalGross)}</strong><br/>
        Target Akademi: <strong>${rp(data.gap.academyTarget)}</strong> · 
        Capaian Akt: <strong>${data.gap.academyTarget > 0 ? ((data.gap.totalAch / data.gap.academyTarget) * 100).toFixed(1) : 0}%</strong>
      </div>
    </div>
  </div>

  <!-- Kebutuhan Pipeline Berdasarkan Trend -->
  <div class="callout">
    <div class="callout-title">
      <span>🎯 KEBUTUHAN PIPELINE BERDASARKAN TREND BULAN INI</span>
      <span>Target Unit: ${formatInt(data.targetUnit)} Unit (${data.selectedProductsLabel})</span>
    </div>
    <p style="margin: 3px 0 6px; color: #374151;">
      Sisa unit dibutuhkan: <strong>${formatInt(req.remainingUnit)} unit</strong> di sisa <strong>${req.daysRemaining} hari</strong>.
      Berdasarkan tren konversi bulan ini, tim membutuhkan:
    </p>
    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; font-size: 10.5px;">
      <div style="background: #fff; padding: 5px 8px; border-radius: 6px; border: 1px solid #CCFBF1;">
        <span style="color: #6B7280; font-size: 9.5px; display: block;">Butuh Leads</span>
        <strong style="font-size: 12px; color: #111827;">${formatInt(req.neededRemaining.leads)}</strong>
        <span style="color: #00A3A6; font-size: 9px; display: block;">~${req.dailyPacing.leads}/hari</span>
      </div>
      <div style="background: #fff; padding: 5px 8px; border-radius: 6px; border: 1px solid #CCFBF1;">
        <span style="color: #6B7280; font-size: 9.5px; display: block;">Butuh Appointment</span>
        <strong style="font-size: 12px; color: #111827;">${formatInt(req.neededRemaining.appointment)}</strong>
        <span style="color: #00B5B5; font-size: 9px; display: block;">~${req.dailyPacing.appointment}/hari</span>
      </div>
      <div style="background: #fff; padding: 5px 8px; border-radius: 6px; border: 1px solid #CCFBF1;">
        <span style="color: #6B7280; font-size: 9.5px; display: block;">Butuh Show</span>
        <strong style="font-size: 12px; color: #111827;">${formatInt(req.neededRemaining.show)}</strong>
        <span style="color: #FF6B35; font-size: 9px; display: block;">~${req.dailyPacing.show}/hari</span>
      </div>
      <div style="background: #fff; padding: 5px 8px; border-radius: 6px; border: 1px solid #CCFBF1;">
        <span style="color: #6B7280; font-size: 9.5px; display: block;">Butuh Interview</span>
        <strong style="font-size: 12px; color: #111827;">${formatInt(req.neededRemaining.interview)}</strong>
        <span style="color: #10B981; font-size: 9px; display: block;">~${req.dailyPacing.interview}/hari</span>
      </div>
    </div>
  </div>

  <!-- Table 1: Daily Production & Conversion Rates -->
  <h2>1. Daily Production & Conversion Rates (Team & Masing-Masing SA)</h2>
  <table>
    <thead>
      <tr>
        <th class="l">Student Advisor</th>
        <th>Leads</th>
        <th>Appt</th>
        <th>Lead→Appt%</th>
        <th>Show</th>
        <th>Appt→Show%</th>
        <th>Int</th>
        <th>Show→Int%</th>
        <th>Unit</th>
        <th>Int→Close%</th>
        <th>Total Conv%</th>
      </tr>
    </thead>
    <tbody>${prodRows}</tbody>
    <tfoot>
      <tr>
        <td class="l">TOTAL TIM</td>
        <td>${data.totals.leads}</td>
        <td>${data.totals.appointment}</td>
        <td style="color: #00B5B5;">${pStr(data.totals.apptConv)}</td>
        <td>${data.totals.show}</td>
        <td style="color: #FF6B35;">${pStr(data.totals.showRate)}</td>
        <td>${data.totals.interview}</td>
        <td style="color: #10B981;">${pStr(data.totals.interviewRate)}</td>
        <td>${data.totals.duesUnit}</td>
        <td style="color: #00A3A6;">${pStr(data.totals.closeRate)}</td>
        <td style="color: #00A3A6; font-size: 11px;">${pStr(data.totals.leadsConv)}</td>
      </tr>
    </tfoot>
  </table>

  <!-- Table 2: Sales Performance -->
  <h2>2. Sales Performance & Achievement (Team & Masing-Masing SA)</h2>
  <table style="font-size: 9.5px;">
    <thead>
      <tr>
        <th class="l">Student Advisor</th>
        <th>Unit</th>
        <th>Dues Gross</th>
        <th>Dues Aktual</th>
        <th>Target Dues</th>
        <th>Dues % (Akt/Gr)</th>
        <th>Priv Gross</th>
        <th>Priv Aktual</th>
        <th>Target Priv</th>
        <th>Priv % (Akt/Gr)</th>
        <th>Total Gross</th>
        <th>Total Aktual</th>
        <th>Target Total</th>
        <th>Ach%</th>
      </tr>
    </thead>
    <tbody>${salesRows}</tbody>
    <tfoot>
      <tr>
        <td class="l">TOTAL TIM</td>
        <td>${data.totals.duesUnit}</td>
        <td>${rp(data.totals.duesGross)}</td>
        <td style="color: #00A3A6;">${rp(data.totals.duesAch)}</td>
        <td>${data.gap.duesTarget > 0 ? rp(data.gap.duesTarget) : "-"}</td>
        <td style="color: #00A3A6;">${data.gap.duesTarget > 0 ? `${((data.totals.duesAch / data.gap.duesTarget) * 100).toFixed(1)}% / ${((data.totals.duesGross / data.gap.duesTarget) * 100).toFixed(1)}%` : "-"}</td>
        <td>${rp(data.totals.privGross)}</td>
        <td style="color: #8B5CF6;">${rp(data.totals.privAch)}</td>
        <td>${data.gap.privTarget > 0 ? rp(data.gap.privTarget) : "-"}</td>
        <td style="color: #8B5CF6;">${data.gap.privTarget > 0 ? `${((data.totals.privAch / data.gap.privTarget) * 100).toFixed(1)}% / ${((data.totals.privGross / data.gap.privTarget) * 100).toFixed(1)}%` : "-"}</td>
        <td>${rp(data.totals.totalGross)}</td>
        <td style="color: #00A3A6;">${rp(data.totals.totalAch)}</td>
        <td>${data.gap.academyTarget > 0 ? rp(data.gap.academyTarget) : "-"}</td>
        <td style="color: #00A3A6;">${data.gap.academyTarget > 0 ? formatPercent(data.totals.totalAch, data.gap.academyTarget) : "-"}</td>
      </tr>
    </tfoot>
  </table>

  <!-- Section 3: Target Gap, Unit Requirements & Proyeksi Akhir Bulan -->
  <h2>3. Target Gap, Unit Menuju 80%/100% & Proyeksi Akhir Bulan (Gross & Aktual)</h2>
  <div class="gap-dual-grid">
    <!-- Dues & Target Unit Box -->
    <div class="gap-box">
      <div class="gap-box-title dues">Dues Membership & Target Unit</div>
      <table class="gap-table">
        <tr><td>Target Dues (100% / 80%)</td><td class="v">${rp(data.gap.duesTarget)} / ${rp(data.gap.target80)}</td></tr>
        <tr><td>Dues Aktual (Status) saat ini</td><td class="v" style="color: #00A3A6;">${rp(data.gap.duesAch)}</td></tr>
        <tr><td>Dues Gross saat ini</td><td class="v">${rp(data.gap.duesGross)}</td></tr>
        <tr>
          <td><strong>Menuju 80% (Aktual)</strong></td>
          <td class="v" style="color: #00A3A6;">
            ${rp(data.gap.remainingAchTo80)} · <strong>${unitStrAch80}</strong>
          </td>
        </tr>
        <tr>
          <td>Menuju 80% (Gross)</td>
          <td class="v">
            ${rp(data.gap.remainingTo80)} · ${unitStr80}
          </td>
        </tr>
        <tr>
          <td><strong>Menuju 100% (Aktual)</strong></td>
          <td class="v" style="color: #00A3A6;">
            ${rp(data.gap.remainingAchTo100)} · <strong>${unitStrAch100}</strong>
          </td>
        </tr>
        <tr>
          <td>Menuju 100% (Gross)</td>
          <td class="v">
            ${rp(data.gap.remainingTo100)} · ${unitStr100}
          </td>
        </tr>
        <tr style="border-top: 1px solid #E5E7EB;">
          <td><strong>Proyeksi Dues Gross</strong> <span style="font-size: 9px; color: #6B7280; font-weight: normal;">(${data.gap.effectiveDays}/${data.gap.dim} hr)</span></td>
          <td class="v">${rp(data.gap.projGross)}</td>
        </tr>
        <tr>
          <td><strong>Proyeksi Dues Aktual (Status)</strong></td>
          <td class="v" style="color: #00A3A6; font-size: 12px;">${rp(data.gap.projDuesAch)}</td>
        </tr>
      </table>
    </div>

    <!-- Private & Total Box -->
    <div class="gap-box">
      <div class="gap-box-title priv">Private Class & Total Proyeksi (Gross & Aktual)</div>
      <table class="gap-table">
        <tr><td>Target Private</td><td class="v">${rp(data.gap.privTarget)}</td></tr>
        <tr><td>Private Aktual (Status) saat ini</td><td class="v" style="color: #8B5CF6;">${rp(data.gap.privAch)}</td></tr>
        <tr><td>Private Gross saat ini</td><td class="v">${rp(data.gap.privGross)}</td></tr>
        <tr>
          <td><strong>Sisa Target Private (Aktual / Gross)</strong></td>
          <td class="v" style="color: #8B5CF6;">${rp(data.gap.remainingPrivAch)} / ${rp(data.gap.remainingPriv)}</td>
        </tr>
        <tr>
          <td>Proyeksi Private Gross</td>
          <td class="v">${rp(data.gap.projPrivGross)}</td>
        </tr>
        <tr>
          <td><strong>Proyeksi Private Aktual (Status)</strong></td>
          <td class="v" style="color: #8B5CF6;">${rp(data.gap.projPrivAch)}</td>
        </tr>
        <tr style="border-top: 1px solid #E5E7EB;">
          <td><strong>Proyeksi Total Akademi (Gross)</strong></td>
          <td class="v" style="font-size: 11.5px; color: #111827;">${rp(data.gap.projTotalGross)}</td>
        </tr>
        <tr>
          <td><strong>Proyeksi Total Akademi (Aktual)</strong></td>
          <td class="v" style="font-size: 12px; color: #10B981;">${rp(data.gap.projTotalAch)}</td>
        </tr>
      </table>
    </div>
  </div>

  <!-- Section 4: Daftar Closing Produk & Jumlahnya -->
  <h2>4. Daftar Closing Produk &amp; Jumlahnya</h2>
  ${productClosingSectionHtml}
</body>
</html>`;
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const res = String(reader.result || "");
      resolve(res.includes(",") ? res.split(",")[1] : res);
    };
    reader.onerror = () => reject(reader.error || new Error("Gagal membaca PDF"));
    reader.readAsDataURL(blob);
  });
}

function bytesToBase64(bytes: Uint8Array): string {
  let bin = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(bin);
}

export async function downloadReportPdf(data: ReportData, filename?: string): Promise<number> {
  const name = filename || `Rockstar-Academy-MTD-Report-${data.start}-sd-${data.end}.pdf`;
  const html = reportHtml(data);

  const wrapper = document.createElement("div");
  wrapper.style.cssText = "position:fixed;left:0;top:0;width:0;height:0;overflow:hidden;opacity:0;pointer-events:none;";
  const container = document.createElement("div");
  container.id = "pdf-export-container";
  container.innerHTML = html;
  container.style.width = "1050px";
  container.style.background = "#ffffff";
  wrapper.appendChild(container);
  document.body.appendChild(wrapper);

  try {
    const html2pdfModule = await import("html2pdf.js");
    const html2pdf = (html2pdfModule as any).default || html2pdfModule;

    const opt = {
      margin: [8, 8, 8, 8],
      filename: name,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        logging: false,
        letterRendering: true,
        scrollX: 0,
        scrollY: 0,
        windowWidth: 1050,
      },
      jsPDF: {
        unit: "mm",
        format: "a4",
        orientation: "landscape",
      },
      pagebreak: { mode: ["avoid-all", "css", "legacy"] },
    };

    const isNative = Capacitor.isNativePlatform();
    if (isNative) {
      const pdfBlob: Blob = await html2pdf().set(opt).from(container).outputPdf("blob");
      const base64 = await blobToBase64(pdfBlob);
      return await shareOrSaveFile({
        filename: name,
        title: name,
        mimeType: "application/pdf",
        base64,
      });
    } else {
      await html2pdf().set(opt).from(container).save();
      return 0;
    }
  } catch (err: any) {
    console.error("html2pdf generation error:", err);
    try {
      await downloadReportHtml(data, name.replace(/\.pdf$/, ".html"));
    } catch (e2) {
      console.error("HTML fallback error:", e2);
    }
    throw new Error(
      "Gagal membuat file PDF langsung (" +
        (err?.message || "pembatasan browser") +
        "). File HTML laporan telah otomatis disimpan / dibagikan!",
    );
  } finally {
    if (wrapper.parentNode) {
      document.body.removeChild(wrapper);
    }
  }
}

export async function downloadReportHtml(data: ReportData, filename?: string) {
  const name = filename || `Rockstar-Academy-MTD-Report-${data.start}-sd-${data.end}.html`;
  const html = reportHtml(data);
  await shareOrSaveFile({
    filename: name,
    title: name,
    mimeType: "text/html;charset=utf-8",
    text: html,
  });
}

export function printReport(data: ReportData) {
  const html = reportHtml(data);

  try {
    const w = window.open("", "_blank");
    if (w) {
      w.document.open();
      w.document.write(html);
      w.document.close();
      w.focus();
      setTimeout(() => {
        try {
          w.print();
        } catch (e) {
          console.warn("Popup print failed", e);
        }
      }, 500);
      return;
    }
  } catch {
  }

  const oldFrame = document.getElementById("rockstar-print-frame");
  if (oldFrame) oldFrame.remove();

  const iframe = document.createElement("iframe");
  iframe.id = "rockstar-print-frame";
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "1050px";
  iframe.style.height = "750px";
  iframe.style.opacity = "0.01";
  iframe.style.pointerEvents = "none";
  iframe.style.zIndex = "-1";
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (doc) {
    doc.open();
    doc.write(html);
    doc.close();
    setTimeout(() => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch (e) {
        console.warn("Iframe print error", e);
        downloadReportHtml(data);
      }
    }, 600);
  }
}

export async function exportMonthlyExcel(year: number, month: number): Promise<number> {
  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const end = `${year}-${String(month).padStart(2, "0")}-${lastDay}`;
  const data = buildReportData(year, month, start, end, "Monthly Closing Summary");

  const wb = XLSX.utils.book_new();

  const salesAoa = [
    [
      "Member",
      "Position",
      "Dues Unit",
      "Dues Gross",
      "Dues Aktual (Status)",
      "Target Dues",
      "Dues Gross %",
      "Dues Aktual %",
      "Private Gross",
      "Private Aktual (Status)",
      "Target Private",
      "Private Gross %",
      "Private Aktual %",
      "Total Gross",
      "Total Aktual (Achievement)",
      "Target Total",
      "Total Ach %",
    ],
    ...data.members.map((m) => [
      m.name,
      m.position,
      m.duesUnit,
      m.duesGross,
      m.duesAch,
      m.hasTarget ? m.personalDuesTarget : "-",
      m.hasTarget && m.duesGrossPct != null ? `${m.duesGrossPct.toFixed(1)}%` : "-",
      m.hasTarget && m.duesAchPct != null ? `${m.duesAchPct.toFixed(1)}%` : "-",
      m.privGross,
      m.privAch,
      m.hasTarget ? m.personalPrivTarget : "-",
      m.hasTarget && m.privGrossPct != null ? `${m.privGrossPct.toFixed(1)}%` : "-",
      m.hasTarget && m.privAchPct != null ? `${m.privAchPct.toFixed(1)}%` : "-",
      m.totalGross,
      m.totalAch,
      m.hasTarget ? m.personalTarget : "-",
      m.hasTarget ? `${pct(m.totalAch, m.personalTarget)?.toFixed(1) ?? "-"}%` : "-",
    ]),
    [
      "TOTAL",
      "",
      data.totals.duesUnit,
      data.totals.duesGross,
      data.totals.duesAch,
      data.gap.duesTarget > 0 ? data.gap.duesTarget : "-",
      data.gap.duesTarget > 0 ? `${((data.totals.duesGross / data.gap.duesTarget) * 100).toFixed(1)}%` : "-",
      data.gap.duesTarget > 0 ? `${((data.totals.duesAch / data.gap.duesTarget) * 100).toFixed(1)}%` : "-",
      data.totals.privGross,
      data.totals.privAch,
      data.gap.privTarget > 0 ? data.gap.privTarget : "-",
      data.gap.privTarget > 0 ? `${((data.totals.privGross / data.gap.privTarget) * 100).toFixed(1)}%` : "-",
      data.gap.privTarget > 0 ? `${((data.totals.privAch / data.gap.privTarget) * 100).toFixed(1)}%` : "-",
      data.totals.totalGross,
      data.totals.totalAch,
      data.gap.academyTarget > 0 ? data.gap.academyTarget : "-",
      data.gap.academyTarget > 0 ? `${((data.totals.totalAch / data.gap.academyTarget) * 100).toFixed(1)}%` : "-",
    ],
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(salesAoa), "Sales");

  const prodAoa = [
    [
      "Member",
      "Leads",
      "Appointment",
      "Lead->Appt %",
      "Show",
      "Appt->Show %",
      "Interview",
      "Show->Int %",
      "Dues Unit",
      "Int->Close %",
      "Overall Conv %",
    ],
    ...data.members.map((m) => [
      m.name,
      m.leads,
      m.appointment,
      m.apptConv != null ? `${m.apptConv.toFixed(1)}%` : "-",
      m.show,
      m.showRate != null ? `${m.showRate.toFixed(1)}%` : "-",
      m.interview,
      m.interviewRate != null ? `${m.interviewRate.toFixed(1)}%` : "-",
      m.duesUnit,
      m.closeRate != null ? `${m.closeRate.toFixed(1)}%` : "-",
      m.leadsConv != null ? `${m.leadsConv.toFixed(1)}%` : "-",
    ]),
    [
      "TOTAL",
      data.totals.leads,
      data.totals.appointment,
      data.totals.apptConv != null ? `${data.totals.apptConv.toFixed(1)}%` : "-",
      data.totals.show,
      data.totals.showRate != null ? `${data.totals.showRate.toFixed(1)}%` : "-",
      data.totals.interview,
      data.totals.interviewRate != null ? `${data.totals.interviewRate.toFixed(1)}%` : "-",
      data.totals.duesUnit,
      data.totals.closeRate != null ? `${data.totals.closeRate.toFixed(1)}%` : "-",
      data.totals.leadsConv != null ? `${data.totals.leadsConv.toFixed(1)}%` : "-",
    ],
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(prodAoa), "Production & Conversion");

  const gapAoa = [
    ["Metric", "Value"],
    ["Period", data.periodLabel],
    ["Target Unit", data.targetUnit],
    ["Target Unit Acuan Produk", data.selectedProductsLabel],
    ["Target Dues (100%)", data.gap.duesTarget],
    ["Target Dues (80%)", data.gap.target80],
    ["Dues Aktual (Status) Current", data.gap.duesAch],
    ["Dues Gross Current", data.gap.duesGross],
    ["Remaining to 80% (Aktual Rp)", Math.max(0, data.gap.remainingAchTo80)],
    ["Remaining to 80% (Aktual Unit)", data.gap.unitsAchTo80],
    ["Remaining to 80% (Gross Rp)", Math.max(0, data.gap.remainingTo80)],
    ["Remaining to 80% (Gross Unit)", data.gap.unitsTo80],
    ["Remaining to 100% (Aktual Rp)", Math.max(0, data.gap.remainingAchTo100)],
    ["Remaining to 100% (Aktual Unit)", data.gap.unitsAchTo100],
    ["Remaining to 100% (Gross Rp)", Math.max(0, data.gap.remainingTo100)],
    ["Remaining to 100% (Gross Unit)", data.gap.unitsTo100],
    ["Projection Dues Gross", data.gap.projGross],
    ["Projection Dues Aktual (Status)", data.gap.projDuesAch],
    ["Target Private", data.gap.privTarget],
    ["Private Aktual (Status) Current", data.gap.privAch],
    ["Private Gross Current", data.gap.privGross],
    ["Remaining Private (Aktual)", Math.max(0, data.gap.remainingPrivAch)],
    ["Remaining Private (Gross)", Math.max(0, data.gap.remainingPriv)],
    ["Projection Private Gross", data.gap.projPrivGross],
    ["Projection Private Aktual (Status)", data.gap.projPrivAch],
    ["Projection Total Akademi (Gross)", data.gap.projTotalGross],
    ["Projection Total Akademi (Aktual)", data.gap.projTotalAch],
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(gapAoa), "Target Gap");

  const productList = data.productBreakdown ?? [];
  const duesItems = productList.filter((p) => p.kind === "DUES");
  const privItems = productList.filter((p) => p.kind === "PRIVATE");
  const sumItems = (arr: ProductClosingSummary[]) =>
    arr.reduce(
      (a, p) => ({
        quantity: a.quantity + p.quantity,
        actualQty: a.actualQty + p.actualQty,
        delayQty: a.delayQty + p.delayQty,
        decomQty: a.decomQty + p.decomQty,
        grossRevenue: a.grossRevenue + p.grossRevenue,
        achievementRevenue: a.achievementRevenue + p.achievementRevenue,
      }),
      { quantity: 0, actualQty: 0, delayQty: 0, decomQty: 0, grossRevenue: 0, achievementRevenue: 0 },
    );
  const duesSum = sumItems(duesItems);
  const privSum = sumItems(privItems);
  const allSum = sumItems(productList);

  const closingProductAoa: (string | number)[][] =
    productList.length === 0
      ? [["Info"], ["Belum ada closing"]]
      : [
          [
            "Kategori",
            "Nama Produk",
            "Total Jumlah",
            "Actual",
            "Delay",
            "Decom",
            "Gross Revenue",
            "Achievement (Aktual)",
          ],
          ...productList.map((p) => [
            p.kind === "PRIVATE" ? "Private" : "Dues",
            p.productName,
            Math.round(p.quantity),
            Math.round(p.actualQty),
            Math.round(p.delayQty),
            Math.round(p.decomQty),
            Math.round(p.grossRevenue),
            Math.round(p.achievementRevenue),
          ]),
          [
            "TOTAL DUES",
            "",
            Math.round(duesSum.quantity),
            Math.round(duesSum.actualQty),
            Math.round(duesSum.delayQty),
            Math.round(duesSum.decomQty),
            Math.round(duesSum.grossRevenue),
            Math.round(duesSum.achievementRevenue),
          ],
          [
            "TOTAL PRIVATE",
            "",
            Math.round(privSum.quantity),
            Math.round(privSum.actualQty),
            Math.round(privSum.delayQty),
            Math.round(privSum.decomQty),
            Math.round(privSum.grossRevenue),
            Math.round(privSum.achievementRevenue),
          ],
          [
            "TOTAL KESELURUHAN",
            "",
            Math.round(allSum.quantity),
            Math.round(allSum.actualQty),
            Math.round(allSum.delayQty),
            Math.round(allSum.decomQty),
            Math.round(allSum.grossRevenue),
            Math.round(allSum.achievementRevenue),
          ],
        ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(closingProductAoa), "Closing Produk");

  const filename = `sa_summary_${year}-${String(month).padStart(2, "0")}.xlsx`;
  const out = XLSX.write(wb, { bookType: "xlsx", type: "array" }) as ArrayBuffer;
  const base64 = bytesToBase64(new Uint8Array(out));
  return await shareOrSaveFile({
    filename,
    title: `Laporan Bulanan ${monthLabel(year, month)}`,
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    base64,
  });
}
