import { getDb } from "@/src/db/database";
import { activeTeam, getSetting, getTarget, listProducts, listTeam, setSetting } from "@/src/db/repo";
import { daysInMonth, elapsedDays } from "@/src/lib/date";
import { pct } from "@/src/lib/format";
import { CoedCategory, Product } from "@/src/types";

const db = () => getDb();

export interface SalesAgg {
  duesGross: number;
  duesAch: number;
  duesUnit: number;
  privGross: number;
  privAch: number;
  totalGross: number;
  totalAch: number;
}

export interface ProductionAgg {
  leads: number;
  appointment: number;
  show: number;
  interview: number;
}

function mm(month: number) {
  return String(month).padStart(2, "0");
}

export function salesAgg(year: number, month: number, advisorId?: number, upToDate?: string): SalesAgg {
  const conds = ["c.deleted_at IS NULL", "strftime('%Y',c.date)=?", "strftime('%m',c.date)=?"];
  const args: any[] = [String(year), mm(month)];
  if (advisorId) {
    conds.push("c.advisor_id=?");
    args.push(advisorId);
  }
  if (upToDate) {
    conds.push("c.date<=?");
    args.push(upToDate);
  }
  const r = db().getFirstSync<any>(
    `SELECT
      COALESCE(SUM(CASE WHEN i.kind='DUES' THEN i.gross_revenue ELSE 0 END),0) duesGross,
      COALESCE(SUM(CASE WHEN i.kind='DUES' THEN i.achievement_revenue ELSE 0 END),0) duesAch,
      COALESCE(SUM(CASE WHEN i.kind='DUES' THEN i.quantity ELSE 0 END),0) duesUnit,
      COALESCE(SUM(CASE WHEN i.kind='PRIVATE' THEN i.gross_revenue ELSE 0 END),0) privGross,
      COALESCE(SUM(CASE WHEN i.kind='PRIVATE' THEN i.achievement_revenue ELSE 0 END),0) privAch
     FROM closing_items i JOIN closing_transactions c ON c.id=i.closing_id
     WHERE ${conds.join(" AND ")}`,
    args,
  );
  const duesGross = Number(r?.duesGross ?? 0);
  const duesAch = Number(r?.duesAch ?? 0);
  const duesUnit = Number(r?.duesUnit ?? 0);
  const privGross = Number(r?.privGross ?? 0);
  const privAch = Number(r?.privAch ?? 0);
  return {
    duesGross,
    duesAch,
    duesUnit,
    privGross,
    privAch,
    totalGross: duesGross + privGross,
    totalAch: duesAch + privAch,
  };
}

export function productionAgg(year: number, month: number, advisorId?: number, upToDate?: string): ProductionAgg {
  const conds = ["deleted_at IS NULL", "strftime('%Y',date)=?", "strftime('%m',date)=?"];
  const args: any[] = [String(year), mm(month)];
  if (advisorId) {
    conds.push("advisor_id=?");
    args.push(advisorId);
  }
  if (upToDate) {
    conds.push("date<=?");
    args.push(upToDate);
  }
  const r = db().getFirstSync<any>(
    `SELECT COALESCE(SUM(leads),0) leads, COALESCE(SUM(appointment),0) appointment,
     COALESCE(SUM(show),0) show, COALESCE(SUM(interview),0) interview
     FROM daily_production WHERE ${conds.join(" AND ")}`,
    args,
  );
  return {
    leads: Number(r?.leads ?? 0),
    appointment: Number(r?.appointment ?? 0),
    show: Number(r?.show ?? 0),
    interview: Number(r?.interview ?? 0),
  };
}

export function productionForDay(date: string): ProductionAgg {
  const r = db().getFirstSync<any>(
    `SELECT COALESCE(SUM(leads),0) leads, COALESCE(SUM(appointment),0) appointment,
     COALESCE(SUM(show),0) show, COALESCE(SUM(interview),0) interview
     FROM daily_production WHERE deleted_at IS NULL AND date=?`,
    [date],
  );
  return {
    leads: Number(r?.leads ?? 0),
    appointment: Number(r?.appointment ?? 0),
    show: Number(r?.show ?? 0),
    interview: Number(r?.interview ?? 0),
  };
}

export function salesUnitForDay(date: string): number {
  const r = db().getFirstSync<{ u: number }>(
    `SELECT COALESCE(SUM(i.quantity),0) u FROM closing_items i JOIN closing_transactions c ON c.id=i.closing_id
     WHERE c.deleted_at IS NULL AND i.kind='DUES' AND c.date=?`,
    [date],
  );
  return Number(r?.u ?? 0);
}

export function cancellationCount(year: number, month: number, advisorId?: number, exactDate?: string): number {
  const conds = ["deleted_at IS NULL"];
  const args: any[] = [];
  if (exactDate) {
    conds.push("date=?");
    args.push(exactDate);
  } else {
    conds.push("strftime('%Y',date)=?", "strftime('%m',date)=?");
    args.push(String(year), mm(month));
  }
  if (advisorId) {
    conds.push("advisor_id=?");
    args.push(advisorId);
  }
  const r = db().getFirstSync<{ q: number }>(
    `SELECT COALESCE(SUM(qty),0) q FROM cancellation_entries WHERE ${conds.join(" AND ")}`,
    args,
  );
  return Number(r?.q ?? 0);
}

export type CoedTotals = Record<CoedCategory, number> & { total: number };

export function coedTotals(year: number, month: number, exactDate?: string): CoedTotals {
  const conds = ["deleted_at IS NULL"];
  const args: any[] = [];
  if (exactDate) {
    conds.push("date=?");
    args.push(exactDate);
  } else {
    conds.push("strftime('%Y',date)=?", "strftime('%m',date)=?");
    args.push(String(year), mm(month));
  }
  const rows = db().getAllSync<{ category: CoedCategory; s: number }>(
    `SELECT category, COALESCE(SUM(amount),0) s FROM coed_entries WHERE ${conds.join(" AND ")} GROUP BY category`,
    args,
  );
  const out: CoedTotals = { HO_AUTOPAY: 0, ADVANCE_PAYMENT: 0, ADVANCE_FREEZE: 0, COLLECTION: 0, total: 0 };
  for (const r of rows) {
    out[r.category] = Number(r.s);
    out.total += Number(r.s);
  }
  return out;
}

export interface Funnel {
  leads: number;
  appointment: number;
  show: number;
  interview: number;
  duesUnit: number;
  apptConv: number | null; // appt/leads %
  showRate: number | null; // show/appt %
  interviewRate: number | null; // interview/show %
  closeRate: number | null; // duesUnit/interview %
  leadsConv: number | null; // duesUnit/leads %
}

export function funnel(year: number, month: number, advisorId?: number): Funnel {
  const p = productionAgg(year, month, advisorId);
  const s = salesAgg(year, month, advisorId);
  return {
    leads: p.leads,
    appointment: p.appointment,
    show: p.show,
    interview: p.interview,
    duesUnit: s.duesUnit,
    apptConv: pct(p.appointment, p.leads),
    showRate: pct(p.show, p.appointment),
    interviewRate: pct(p.interview, p.show),
    closeRate: pct(s.duesUnit, p.interview),
    leadsConv: pct(s.duesUnit, p.leads),
  };
}

export function project(valueToDate: number, year: number, month: number, asOfDay?: number): number {
  const dim = daysInMonth(year, month);
  const day = asOfDay ?? elapsedDays(year, month);
  if (day <= 0) return 0;
  return Math.round((valueToDate / day) * dim);
}

// Tanpa year/month: anggota aktif ber-target (saat ini).
// Dengan year/month: ditambah anggota nonaktif ber-target yang punya closing atau produksi
// pada bulan itu, supaya target per orang bulan lampau tidak bergeser setelah ada yang dinonaktifkan.
export function membersWithTargetCount(year?: number, month?: number): number {
  const base = activeTeam().filter((m) => m.has_target === 1).length;
  if (!year || !month) return base;
  const y = String(year);
  const m2 = mm(month);
  let extra = 0;
  for (const m of listTeam(true)) {
    if (m.has_target !== 1 || m.active === 1) continue;
    const c = db().getFirstSync<{ n: number }>(
      `SELECT (SELECT COUNT(*) FROM closing_transactions WHERE deleted_at IS NULL AND advisor_id=? AND strftime('%Y',date)=? AND strftime('%m',date)=?)
            + (SELECT COUNT(*) FROM daily_production WHERE deleted_at IS NULL AND advisor_id=? AND strftime('%Y',date)=? AND strftime('%m',date)=?
               AND (leads>0 OR appointment>0 OR show>0 OR interview>0)) AS n`,
      [m.id, y, m2, m.id, y, m2],
    );
    if ((c?.n ?? 0) > 0) extra++;
  }
  return base + extra;
}

export function getSelectedTargetProducts(year?: number, month?: number): Product[] {
  const allProducts = listProducts(false);
  let settingVal: string | null = null;
  if (year && month) {
    settingVal = getSetting(`target_unit_products_${year}_${month}`);
  }
  if (!settingVal) {
    settingVal = getSetting("target_unit_products");
  }

  if (settingVal) {
    try {
      const ids: number[] = JSON.parse(settingVal);
      if (Array.isArray(ids) && ids.length > 0) {
        const matched = ids
          .map((id) => allProducts.find((p) => p.id === id))
          .filter((p): p is Product => Boolean(p));
        if (matched.length > 0) {
          return matched.slice(0, 2);
        }
      }
    } catch {
    }
  }

  const dues = allProducts.filter((p) => p.type === "DUES");
  if (dues.length >= 2) return dues.slice(0, 2);
  if (dues.length === 1) return dues;
  return allProducts.slice(0, 2);
}

export function saveSelectedTargetProducts(productIds: number[], year?: number, month?: number): void {
  const cleanIds = productIds.slice(0, 2);
  const json = JSON.stringify(cleanIds);
  if (year && month) {
    setSetting(`target_unit_products_${year}_${month}`, json);
  }
  setSetting("target_unit_products", json);
}

export interface TargetUnitDetails {
  selectedProducts: Product[];
  avgPrice: number;
  totalTargetUnit: number;
  personalTargetUnit: number;
  unitOptions: { product: Product; units: number }[];
}

export function calculateTargetUnitDetails(
  duesTarget: number,
  selectedProducts: Product[],
  year?: number,
  month?: number,
): TargetUnitDetails {
  const count = membersWithTargetCount(year, month);
  if (!selectedProducts || selectedProducts.length === 0 || duesTarget <= 0) {
    return {
      selectedProducts: selectedProducts || [],
      avgPrice: 0,
      totalTargetUnit: 0,
      personalTargetUnit: 0,
      unitOptions: [],
    };
  }

  const unitOptions = selectedProducts.map((p) => ({
    product: p,
    units: p.price > 0 ? Math.ceil(duesTarget / p.price) : 0,
  }));

  const avgPrice = Math.round(
    selectedProducts.reduce((sum, p) => sum + p.price, 0) / selectedProducts.length
  );

  const totalTargetUnit = avgPrice > 0 ? Math.ceil(duesTarget / avgPrice) : 0;
  const personalTargetUnit = count > 0 ? Math.ceil(totalTargetUnit / count) : 0;

  return {
    selectedProducts,
    avgPrice,
    totalTargetUnit,
    personalTargetUnit,
    unitOptions,
  };
}

export interface TargetInfo {
  academy: number;
  dues: number;
  private: number;
  personal: number; // total / count = personalDues + personalPriv
  personalDues: number; // dues / count
  personalPriv: number; // private / count
  targetCount: number;
  selectedProducts: Product[];
  targetUnit: number;
  avgPrice: number;
  personalTargetUnit: number;
  unitOptions: { product: Product; units: number }[];
}

export function targetInfo(year: number, month: number): TargetInfo {
  const t = getTarget(year, month);
  const count = membersWithTargetCount(year, month);
  const dues = t?.dues_target ?? 0;
  const priv = t?.private_target ?? 0;
  const academy = dues > 0 || priv > 0 ? dues + priv : (t?.academy_target ?? 0);

  const selectedProducts = getSelectedTargetProducts(year, month);
  const unitCalc = calculateTargetUnitDetails(dues, selectedProducts, year, month);

  const personalDues = count > 0 ? Math.round(dues / count) : 0;
  const personalPriv = count > 0 ? Math.round(priv / count) : 0;
  const personal = personalDues + personalPriv;

  return {
    academy,
    dues,
    private: priv,
    targetCount: count,
    personalDues,
    personalPriv,
    personal,
    selectedProducts,
    targetUnit: unitCalc.totalTargetUnit,
    avgPrice: unitCalc.avgPrice,
    personalTargetUnit: unitCalc.personalTargetUnit,
    unitOptions: unitCalc.unitOptions,
  };
}

export interface FunnelSuggestion {
  stage: string;
  status: "good" | "warning" | "danger";
  title: string;
  desc: string;
  actualRate: number | null;
  benchmark: string;
}

export interface FunnelRequirements {
  targetUnit: number;
  achievedUnit: number;
  remainingUnit: number;
  rates: {
    leadToAppt: number; // %
    apptToShow: number; // %
    showToInterview: number; // %
    interviewToClose: number; // %
    leadToClose: number; // %
  };
  neededRemaining: {
    leads: number;
    appointment: number;
    show: number;
    interview: number;
    unit: number;
  };
  neededTotal: {
    leads: number;
    appointment: number;
    show: number;
    interview: number;
    unit: number;
  };
  daysRemaining: number;
  dailyPacing: {
    leads: number;
    appointment: number;
    show: number;
    interview: number;
    unit: number;
  };
  perAdvisorRemaining: {
    leads: number;
    appointment: number;
    show: number;
    interview: number;
    unit: number;
  };
  bottleneck: {
    stage: string;
    label: string;
    currentRate: number;
    benchmarkRate: number;
  };
  suggestions: FunnelSuggestion[];
}

export function calculateFunnelRequirements(
  year: number,
  month: number,
  customTargetUnit?: number,
): FunnelRequirements {
  const p = productionAgg(year, month);
  const s = salesAgg(year, month);
  const t = targetInfo(year, month);
  const targetUnit = customTargetUnit !== undefined ? customTargetUnit : t.targetUnit;
  const achievedUnit = s.duesUnit;
  const remainingUnit = Math.max(0, targetUnit - achievedUnit);

  const actualApptConv = p.leads > 0 ? (p.appointment / p.leads) * 100 : null;
  const actualShowRate = p.appointment > 0 ? (p.show / p.appointment) * 100 : null;
  const actualInterviewRate = p.show > 0 ? (p.interview / p.show) * 100 : null;
  const actualCloseRate = p.interview > 0 ? (s.duesUnit / p.interview) * 100 : null;
  const actualLeadClose = p.leads > 0 ? (s.duesUnit / p.leads) * 100 : null;

  const safeLeadToAppt = actualApptConv && actualApptConv > 0 ? actualApptConv / 100 : 0.22;
  const safeApptToShow = actualShowRate && actualShowRate > 0 ? actualShowRate / 100 : 0.62;
  const safeShowToInterview = actualInterviewRate && actualInterviewRate > 0 ? actualInterviewRate / 100 : 0.85;
  const safeInterviewToClose = actualCloseRate && actualCloseRate > 0 ? actualCloseRate / 100 : 0.38;

  const interviewRemaining = safeInterviewToClose > 0 ? Math.ceil(remainingUnit / safeInterviewToClose) : 0;
  const showRemaining = safeShowToInterview > 0 ? Math.ceil(interviewRemaining / safeShowToInterview) : 0;
  const apptRemaining = safeApptToShow > 0 ? Math.ceil(showRemaining / safeApptToShow) : 0;
  const leadsRemaining = safeLeadToAppt > 0 ? Math.ceil(apptRemaining / safeLeadToAppt) : 0;

  const interviewTotal = safeInterviewToClose > 0 ? Math.ceil(targetUnit / safeInterviewToClose) : 0;
  const showTotal = safeShowToInterview > 0 ? Math.ceil(interviewTotal / safeShowToInterview) : 0;
  const apptTotal = safeApptToShow > 0 ? Math.ceil(showTotal / safeApptToShow) : 0;
  const leadsTotal = safeLeadToAppt > 0 ? Math.ceil(apptTotal / safeLeadToAppt) : 0;

  const totalDays = daysInMonth(year, month);
  const elapsed = elapsedDays(year, month);
  const daysRemaining = Math.max(1, totalDays - elapsed);

  const advisorCount = Math.max(1, membersWithTargetCount(year, month));

  const suggestions: FunnelSuggestion[] = [];

  const bLeadAppt = 22;
  if (actualApptConv === null || actualApptConv < 15) {
    suggestions.push({
      stage: "Leads → Appointment",
      status: "danger",
      title: "Speed to Lead Lemah (<15%)",
      desc: "Hubungi leads baru dalam 10-15 menit pertama. Gunakan template WhatsApp welcoming Rockstar Academy yang mengajak memilih 2 opsi waktu Free Trial / Placement Test.",
      actualRate: actualApptConv,
      benchmark: "≥ 22%",
    });
  } else if (actualApptConv < 22) {
    suggestions.push({
      stage: "Leads → Appointment",
      status: "warning",
      title: "Optimalkan Skrip Kontak Leads (15-22%)",
      desc: "Tanyakan minat kelas anak (Ballet, Gymnastics, Dance, Cheerleading, Martial Arts) sebelum menawarkan jadwal agar calon member merasa dipersonalisasi.",
      actualRate: actualApptConv,
      benchmark: "≥ 22%",
    });
  } else {
    suggestions.push({
      stage: "Leads → Appointment",
      status: "good",
      title: "Booking Rate Solid (≥22%)",
      desc: "Ritme konversi leads ke appointment sudah prima. Pertahankan konsistensi follow-up harian.",
      actualRate: actualApptConv,
      benchmark: "≥ 22%",
    });
  }

  const bApptShow = 65;
  if (actualShowRate === null || actualShowRate < 50) {
    suggestions.push({
      stage: "Appointment → Show",
      status: "danger",
      title: "Angka No-Show Tinggi (<50%)",
      desc: "Kirim pesan konfirmasi H-1 dan reminder 3 jam sebelum jadwal trial via WA. Kirimkan Google Maps Rockstar Academy, info parkir, dan dresscode kaos lentur agar orang tua siap hadir.",
      actualRate: actualShowRate,
      benchmark: "≥ 65%",
    });
  } else if (actualShowRate < 65) {
    suggestions.push({
      stage: "Appointment → Show",
      status: "warning",
      title: "Tingkatkan Re-confirmation Kehadiran",
      desc: "Lakukan panggilan singkat atau voice note di pagi hari jadwal appointment untuk mengonfirmasi kehadiran anak dan orang tua.",
      actualRate: actualShowRate,
      benchmark: "≥ 65%",
    });
  } else {
    suggestions.push({
      stage: "Appointment → Show",
      status: "good",
      title: "Show Rate Sangat Baik (≥65%)",
      desc: "Mayoritas calon member yang membuat appointment berhasil hadir di akademi.",
      actualRate: actualShowRate,
      benchmark: "≥ 65%",
    });
  }

  const bShowInterview = 85;
  if (actualInterviewRate === null || actualInterviewRate < 75) {
    suggestions.push({
      stage: "Show → Interview",
      status: "danger",
      title: "Drop Setelah Trial / Masuk Akademi (<75%)",
      desc: "Pastikan SA menyambut orang tua di lobi dan langsung mendampingi konsultasi kurikulum tepat seusai anak mencoba kelas trial. Jangan biarkan orang tua langsung pulang.",
      actualRate: actualInterviewRate,
      benchmark: "≥ 85%",
    });
  } else {
    suggestions.push({
      stage: "Show → Interview",
      status: "good",
      title: "Alur Konsultasi Lancar (≥85%)",
      desc: "Hampir seluruh tamu yang hadir langsung mengikuti sesi konsultasi kurikulum dengan Student Advisor.",
      actualRate: actualInterviewRate,
      benchmark: "≥ 85%",
    });
  }

  const bInterviewClose = 40;
  if (actualCloseRate === null || actualCloseRate < 30) {
    suggestions.push({
      stage: "Interview → Closing Unit",
      status: "danger",
      title: "Handling Objection & Closing Meja Interview (<30%)",
      desc: "Atasi keberatan biaya dengan breakdown nilai investasi per sesi dan fasilitas cicilan 0% kartu kredit. Hadapi alasan 'pikir-pikir dulu / tanya pasangan' dengan same-day enrollment benefit (gift eksklusif / diskon reg fee) yang hangus jika tunda. Berikan fleksibilitas reschedule/freeze agar orang tua tidak ragu komitmen.",
      actualRate: actualCloseRate,
      benchmark: "≥ 40%",
    });
    suggestions.push({
      stage: "Interview → Closing Unit",
      status: "warning",
      title: "Tingkatkan Kualitas Qualifying Prospek",
      desc: "Perbaiki qualifying sejak Leads & Booking: gali motivasi utama orang tua (percaya diri, postur, disiplin anak) sebelum trial. Pastikan kedua pengambil keputusan (ayah & ibu) hadir mendampingi trial agar konsultasi kurikulum langsung menghasilkan keputusan tanpa menunggu persetujuan di rumah.",
      actualRate: actualCloseRate,
      benchmark: "≥ 40%",
    });
  } else if (actualCloseRate < 40) {
    suggestions.push({
      stage: "Interview → Closing Unit",
      status: "warning",
      title: "Perkuat Objections Handling & Urgensi (30-40%)",
      desc: "Antisipasi keraguan orang tua terkait jadwal sekolah atau anak belum terbiasa dengan menawarkan free schedule change / freeze policy. Buat simulasi perbandingan nilai kurikulum internasional vs biaya harian kursus lain.",
      actualRate: actualCloseRate,
      benchmark: "≥ 40%",
    });
    suggestions.push({
      stage: "Interview → Closing Unit",
      status: "warning",
      title: "Pertajam Kualitas Qualifying di Meja Konsultasi",
      desc: "Lakukan qualifying cepat 3 menit sebelum trial dimulai untuk mencocokkan ekspektasi orang tua dengan keunggulan akademi Rockstar, sehingga saat konsultasi fokus pada solusi masalah anak.",
      actualRate: actualCloseRate,
      benchmark: "≥ 40%",
    });
  } else {
    suggestions.push({
      stage: "Interview → Closing Unit",
      status: "good",
      title: "Daya Tutup Closing Tinggi (≥40%)",
      desc: "Keahlian closing SA sangat bagus. Pertahankan teknik qualifying dan handling objection yang efektif, serta fokus memperbesar aliran volume appointment dan show.",
      actualRate: actualCloseRate,
      benchmark: "≥ 40%",
    });
  }

  let maxDeficit = -1;
  let bottleneck = {
    stage: "Interview → Closing Unit",
    label: "Closing Rate",
    currentRate: actualCloseRate ?? 0,
    benchmarkRate: bInterviewClose,
  };

  const stagesToCheck = [
    { stage: "Leads → Appointment", label: "Konversi Leads", current: actualApptConv ?? 0, bm: bLeadAppt },
    { stage: "Appointment → Show", label: "Show Rate", current: actualShowRate ?? 0, bm: bApptShow },
    { stage: "Show → Interview", label: "Show ke Interview", current: actualInterviewRate ?? 0, bm: bShowInterview },
    { stage: "Interview → Closing Unit", label: "Closing Rate", current: actualCloseRate ?? 0, bm: bInterviewClose },
  ];

  for (const s of stagesToCheck) {
    const deficit = s.bm - s.current;
    if (deficit > maxDeficit) {
      maxDeficit = deficit;
      bottleneck = {
        stage: s.stage,
        label: s.label,
        currentRate: Number(s.current.toFixed(1)),
        benchmarkRate: s.bm,
      };
    }
  }

  return {
    targetUnit,
    achievedUnit,
    remainingUnit,
    rates: {
      leadToAppt: actualApptConv ? Number(actualApptConv.toFixed(1)) : 22,
      apptToShow: actualShowRate ? Number(actualShowRate.toFixed(1)) : 62,
      showToInterview: actualInterviewRate ? Number(actualInterviewRate.toFixed(1)) : 85,
      interviewToClose: actualCloseRate ? Number(actualCloseRate.toFixed(1)) : 38,
      leadToClose: actualLeadClose ? Number(actualLeadClose.toFixed(1)) : 5.1,
    },
    neededRemaining: {
      leads: leadsRemaining,
      appointment: apptRemaining,
      show: showRemaining,
      interview: interviewRemaining,
      unit: remainingUnit,
    },
    neededTotal: {
      leads: leadsTotal,
      appointment: apptTotal,
      show: showTotal,
      interview: interviewTotal,
      unit: targetUnit,
    },
    daysRemaining,
    dailyPacing: {
      leads: Number((leadsRemaining / daysRemaining).toFixed(1)),
      appointment: Number((apptRemaining / daysRemaining).toFixed(1)),
      show: Number((showRemaining / daysRemaining).toFixed(1)),
      interview: Number((interviewRemaining / daysRemaining).toFixed(1)),
      unit: Number((remainingUnit / daysRemaining).toFixed(1)),
    },
    perAdvisorRemaining: {
      leads: Math.ceil(leadsRemaining / advisorCount),
      appointment: Math.ceil(apptRemaining / advisorCount),
      show: Math.ceil(showRemaining / advisorCount),
      interview: Math.ceil(interviewRemaining / advisorCount),
      unit: Math.ceil(remainingUnit / advisorCount),
    },
    bottleneck,
    suggestions,
  };
}

export interface DashboardData {
  year: number;
  month: number;
  sales: SalesAgg;
  prod: ProductionAgg;
  target: TargetInfo;
  funnel: Funnel;
  targetUnit: number;
  funnelRequirements: FunnelRequirements;
  projDuesGross: number;
  projDuesAch: number;
  projDuesUnit: number;
  projPrivGross: number;
  projPrivAch: number;
  projTotalGross: number;
  projAcademy: number; // projection of total achievement (Aktual)
  target80: number;
  target100: number;
  remainingTo80: number;
  remainingTo100: number;
  remainingAchTo80: number;
  remainingAchTo100: number;
  unitsTo80: number;
  unitsTo100: number;
  unitOptionsTo80: { product: Product; units: number }[];
  unitOptionsTo100: { product: Product; units: number }[];
  unitsAchTo80: number;
  unitsAchTo100: number;
  unitOptionsAchTo80: { product: Product; units: number }[];
  unitOptionsAchTo100: { product: Product; units: number }[];
  academyPct: number | null;
  academyGrossPct: number | null;
  duesPct: number | null; // Gross %
  duesAchPct: number | null; // Aktual (Status) %
  privPct: number | null; // Gross %
  privAchPct: number | null; // Aktual (Status) %
  remainingAcademy: number;
  remainingAcademyGross: number;
  remainingPriv: number;
  remainingPrivAch: number;
}

export function dashboard(year: number, month: number): DashboardData {
  const sales = salesAgg(year, month);
  const prod = productionAgg(year, month);
  const target = targetInfo(year, month);
  const f = funnel(year, month);
  const target80 = Math.round(target.dues * 0.8);
  const target100 = target.dues;
  const fReq = calculateFunnelRequirements(year, month, target.targetUnit);

  const remTo80 = Math.max(0, target80 - sales.duesGross);
  const remTo100 = Math.max(0, target100 - sales.duesGross);
  const remAchTo80 = Math.max(0, target80 - sales.duesAch);
  const remAchTo100 = Math.max(0, target100 - sales.duesAch);
  const avgP = target.avgPrice;

  const unitsTo80 = avgP > 0 ? Math.ceil(remTo80 / avgP) : 0;
  const unitsTo100 = avgP > 0 ? Math.ceil(remTo100 / avgP) : 0;
  const unitsAchTo80 = avgP > 0 ? Math.ceil(remAchTo80 / avgP) : 0;
  const unitsAchTo100 = avgP > 0 ? Math.ceil(remAchTo100 / avgP) : 0;

  const unitOptionsTo80 = target.selectedProducts.map((p) => ({
    product: p,
    units: p.price > 0 ? Math.ceil(remTo80 / p.price) : 0,
  }));

  const unitOptionsTo100 = target.selectedProducts.map((p) => ({
    product: p,
    units: p.price > 0 ? Math.ceil(remTo100 / p.price) : 0,
  }));

  const unitOptionsAchTo80 = target.selectedProducts.map((p) => ({
    product: p,
    units: p.price > 0 ? Math.ceil(remAchTo80 / p.price) : 0,
  }));

  const unitOptionsAchTo100 = target.selectedProducts.map((p) => ({
    product: p,
    units: p.price > 0 ? Math.ceil(remAchTo100 / p.price) : 0,
  }));

  return {
    year,
    month,
    sales,
    prod,
    target,
    funnel: f,
    targetUnit: target.targetUnit,
    funnelRequirements: fReq,
    projDuesGross: project(sales.duesGross, year, month),
    projDuesAch: project(sales.duesAch, year, month),
    projDuesUnit: project(sales.duesUnit, year, month),
    projPrivGross: project(sales.privGross, year, month),
    projPrivAch: project(sales.privAch, year, month),
    projTotalGross: project(sales.totalGross, year, month),
    projAcademy: project(sales.totalAch, year, month),
    target80,
    target100,
    remainingTo80: target80 - sales.duesGross,
    remainingTo100: target100 - sales.duesGross,
    remainingAchTo80: target80 - sales.duesAch,
    remainingAchTo100: target100 - sales.duesAch,
    unitsTo80,
    unitsTo100,
    unitOptionsTo80,
    unitOptionsTo100,
    unitsAchTo80,
    unitsAchTo100,
    unitOptionsAchTo80,
    unitOptionsAchTo100,
    academyPct: pct(sales.totalAch, target.academy),
    academyGrossPct: pct(sales.totalGross, target.academy),
    duesPct: pct(sales.duesGross, target.dues),
    duesAchPct: pct(sales.duesAch, target.dues),
    privPct: pct(sales.privGross, target.private),
    privAchPct: pct(sales.privAch, target.private),
    remainingAcademy: target.academy - sales.totalAch,
    remainingAcademyGross: target.academy - sales.totalGross,
    remainingPriv: target.private - sales.privGross,
    remainingPrivAch: target.private - sales.privAch,
  };
}

export interface MemberSummary {
  id: number;
  name: string;
  position: string;
  hasTarget: boolean;
  active: boolean;
  sales: SalesAgg;
  prod: ProductionAgg;

  personalDuesTarget: number;
  personalDues80: number;
  duesPct: number | null; // Gross %
  duesAchPct: number | null; // Aktual (Status) %
  remainingDuesTo80: number;
  remainingDuesTo100: number;
  unitsDuesTo80: number;
  unitsDuesTo100: number;
  unitOptionsDuesTo80: { product: Product; units: number }[];
  unitOptionsDuesTo100: { product: Product; units: number }[];
  remainingDuesAchTo80: number;
  remainingDuesAchTo100: number;
  unitsDuesAchTo80: number;
  unitsDuesAchTo100: number;
  unitOptionsDuesAchTo80: { product: Product; units: number }[];
  unitOptionsDuesAchTo100: { product: Product; units: number }[];

  personalPrivTarget: number;
  personalPriv80: number;
  privPct: number | null; // Gross %
  privAchPct: number | null; // Aktual (Status) %
  remainingPrivTo80: number;
  remainingPrivTo100: number;
  remainingPrivAchTo80: number;
  remainingPrivAchTo100: number;

  personalTarget: number;
  personalTarget80: number;
  personalTargetUnit: number;
  achPct: number | null;
  grossPct: number | null;
  remainingTotalTo80: number;
  remainingTotalTo100: number;

  projGross: number;
  projAch: number;
  projDuesGross: number;
  projDuesAch: number;
  projPrivGross: number;
  projPrivAch: number;
  remaining: number;

  apptConv: number | null; // appt/leads %
  showRate: number | null; // show/appt %
  interviewRate: number | null; // interview/show %
  closeRate: number | null; // duesUnit/interview %
  leadsConv: number | null; // duesUnit/leads %
}

export function memberSummaries(year: number, month: number): MemberSummary[] {
  const team = listTeam(true);
  const info = targetInfo(year, month);
  const avgP = info.avgPrice;

  return team.map((m) => {
    const sales = salesAgg(year, month, m.id);
    const prod = productionAgg(year, month, m.id);
    const hasTarget = m.has_target === 1;

    const personalDuesTarget = hasTarget ? info.personalDues : 0;
    const personalDues80 = Math.round(personalDuesTarget * 0.8);
    const duesPct = hasTarget && personalDuesTarget > 0 ? pct(sales.duesGross, personalDuesTarget) : null;
    const duesAchPct = hasTarget && personalDuesTarget > 0 ? pct(sales.duesAch, personalDuesTarget) : null;

    const remainingDuesTo80 = Math.max(0, personalDues80 - sales.duesGross);
    const remainingDuesTo100 = Math.max(0, personalDuesTarget - sales.duesGross);
    const unitsDuesTo80 = avgP > 0 ? Math.ceil(remainingDuesTo80 / avgP) : 0;
    const unitsDuesTo100 = avgP > 0 ? Math.ceil(remainingDuesTo100 / avgP) : 0;
    const unitOptionsDuesTo80 = info.selectedProducts.map((p) => ({
      product: p,
      units: p.price > 0 ? Math.ceil(remainingDuesTo80 / p.price) : 0,
    }));
    const unitOptionsDuesTo100 = info.selectedProducts.map((p) => ({
      product: p,
      units: p.price > 0 ? Math.ceil(remainingDuesTo100 / p.price) : 0,
    }));

    const remainingDuesAchTo80 = Math.max(0, personalDues80 - sales.duesAch);
    const remainingDuesAchTo100 = Math.max(0, personalDuesTarget - sales.duesAch);
    const unitsDuesAchTo80 = avgP > 0 ? Math.ceil(remainingDuesAchTo80 / avgP) : 0;
    const unitsDuesAchTo100 = avgP > 0 ? Math.ceil(remainingDuesAchTo100 / avgP) : 0;
    const unitOptionsDuesAchTo80 = info.selectedProducts.map((p) => ({
      product: p,
      units: p.price > 0 ? Math.ceil(remainingDuesAchTo80 / p.price) : 0,
    }));
    const unitOptionsDuesAchTo100 = info.selectedProducts.map((p) => ({
      product: p,
      units: p.price > 0 ? Math.ceil(remainingDuesAchTo100 / p.price) : 0,
    }));

    const personalPrivTarget = hasTarget ? info.personalPriv : 0;
    const personalPriv80 = Math.round(personalPrivTarget * 0.8);
    const privPct = hasTarget && personalPrivTarget > 0 ? pct(sales.privGross, personalPrivTarget) : null;
    const privAchPct = hasTarget && personalPrivTarget > 0 ? pct(sales.privAch, personalPrivTarget) : null;
    const remainingPrivTo80 = Math.max(0, personalPriv80 - sales.privGross);
    const remainingPrivTo100 = Math.max(0, personalPrivTarget - sales.privGross);
    const remainingPrivAchTo80 = Math.max(0, personalPriv80 - sales.privAch);
    const remainingPrivAchTo100 = Math.max(0, personalPrivTarget - sales.privAch);

    const personalTarget = hasTarget ? info.personal : 0;
    const personalTarget80 = Math.round(personalTarget * 0.8);
    const personalTargetUnit = hasTarget ? info.personalTargetUnit : 0;
    const achPct = hasTarget && personalTarget > 0 ? pct(sales.totalAch, personalTarget) : null;
    const grossPct = hasTarget && personalTarget > 0 ? pct(sales.totalGross, personalTarget) : null;
    const remainingTotalTo80 = Math.max(0, personalTarget80 - sales.totalAch);
    const remainingTotalTo100 = Math.max(0, personalTarget - sales.totalAch);

    return {
      id: m.id,
      name: m.name,
      position: m.position,
      hasTarget,
      active: m.active === 1,
      sales,
      prod,
      personalDuesTarget,
      personalDues80,
      duesPct,
      duesAchPct,
      remainingDuesTo80,
      remainingDuesTo100,
      unitsDuesTo80,
      unitsDuesTo100,
      unitOptionsDuesTo80,
      unitOptionsDuesTo100,
      remainingDuesAchTo80,
      remainingDuesAchTo100,
      unitsDuesAchTo80,
      unitsDuesAchTo100,
      unitOptionsDuesAchTo80,
      unitOptionsDuesAchTo100,
      personalPrivTarget,
      personalPriv80,
      privPct,
      privAchPct,
      remainingPrivTo80,
      remainingPrivTo100,
      remainingPrivAchTo80,
      remainingPrivAchTo100,
      personalTarget,
      personalTarget80,
      personalTargetUnit,
      achPct,
      grossPct,
      remainingTotalTo80,
      remainingTotalTo100,
      projGross: project(sales.totalGross, year, month),
      projAch: project(sales.totalAch, year, month),
      projDuesGross: project(sales.duesGross, year, month),
      projDuesAch: project(sales.duesAch, year, month),
      projPrivGross: project(sales.privGross, year, month),
      projPrivAch: project(sales.privAch, year, month),
      remaining: remainingTotalTo100,
      apptConv: pct(prod.appointment, prod.leads),
      showRate: pct(prod.show, prod.appointment),
      interviewRate: pct(prod.interview, prod.show),
      closeRate: pct(sales.duesUnit, prod.interview),
      leadsConv: pct(sales.duesUnit, prod.leads),
    };
  });
}

export function unitsNeeded(remainingGross: number, unitPrice: number): number | null {
  if (!unitPrice || unitPrice <= 0) return null;
  if (remainingGross <= 0) return 0;
  return Math.ceil(remainingGross / unitPrice);
}

export interface MonthlyClosingTrend {
  monthKey: string;
  label: string;
  year: number;
  month: number;
  duesGross: number;
  duesAch: number;
  privGross: number;
  privAch: number;
  totalGross: number;
  totalAch: number;
  duesUnit: number;
  targetAcademy: number;
  targetDues: number;
}

export interface MonthlyProductionTrend {
  monthKey: string;
  label: string;
  year: number;
  month: number;
  leads: number;
  appointment: number;
  show: number;
  interview: number;
  duesUnit: number;
  apptConv: number;
  showRate: number;
  closeRate: number;
}

const SHORT_MONTHS_ID = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
  "Jul", "Agu", "Sep", "Okt", "Nov", "Des"
];

export function getMonthlyAnalyticsData(selectedYear: number, selectedMonth: number, count: number = 6) {
  const months: { year: number; month: number }[] = [];
  let curY = selectedYear;
  let curM = selectedMonth;

  for (let i = 0; i < count; i++) {
    months.unshift({ year: curY, month: curM });
    curM--;
    if (curM < 1) {
      curM = 12;
      curY--;
    }
  }

  const closingTrends: MonthlyClosingTrend[] = [];
  const productionTrends: MonthlyProductionTrend[] = [];

  for (const item of months) {
    const s = salesAgg(item.year, item.month);
    const p = productionAgg(item.year, item.month);
    const t = targetInfo(item.year, item.month);
    const monthKey = `${item.year}-${String(item.month).padStart(2, "0")}`;
    const label = `${SHORT_MONTHS_ID[item.month - 1]} '${String(item.year).slice(2)}`;

    closingTrends.push({
      monthKey,
      label,
      year: item.year,
      month: item.month,
      duesGross: s.duesGross,
      duesAch: s.duesAch,
      privGross: s.privGross,
      privAch: s.privAch,
      totalGross: s.totalGross,
      totalAch: s.totalAch,
      duesUnit: s.duesUnit,
      targetAcademy: t.academy,
      targetDues: t.dues,
    });

    const apptConv = p.leads > 0 ? Number(((p.appointment / p.leads) * 100).toFixed(1)) : 0;
    const showRate = p.appointment > 0 ? Number(((p.show / p.appointment) * 100).toFixed(1)) : 0;
    const closeRate = p.interview > 0 ? Number(((s.duesUnit / p.interview) * 100).toFixed(1)) : 0;

    productionTrends.push({
      monthKey,
      label,
      year: item.year,
      month: item.month,
      leads: p.leads,
      appointment: p.appointment,
      show: p.show,
      interview: p.interview,
      duesUnit: s.duesUnit,
      apptConv,
      showRate,
      closeRate,
    });
  }

  const latestClosing = closingTrends[closingTrends.length - 1];
  const prevClosing = closingTrends[closingTrends.length - 2];
  const momRevenueGrowth = prevClosing && prevClosing.totalAch > 0
    ? Number((((latestClosing.totalAch - prevClosing.totalAch) / prevClosing.totalAch) * 100).toFixed(1))
    : 0;

  const latestProd = productionTrends[productionTrends.length - 1];
  const prevProd = productionTrends[productionTrends.length - 2];
  const momLeadsGrowth = prevProd && prevProd.leads > 0
    ? Number((((latestProd.leads - prevProd.leads) / prevProd.leads) * 100).toFixed(1))
    : 0;

  return {
    closingTrends,
    productionTrends,
    momRevenueGrowth,
    momLeadsGrowth,
  };
}

export interface DailyProductionCumulativePoint {
  day: number;
  date: string;
  label: string;
  dailyLeads: number;
  cumLeads: number;
  dailyAppt: number;
  cumAppt: number;
  dailyShow: number;
  cumShow: number;
  dailyInterview: number;
  cumInterview: number;
  dailyClosings: number;
  cumClosings: number;
  dailyRevenue: number;
  cumRevenue: number;
}

export function getDailyProductionCumulative(year: number, month: number): DailyProductionCumulativePoint[] {
  const totalDays = daysInMonth(year, month);
  const rows = db().getAllSync<any>(
    `SELECT strftime('%d', date) as day_str,
            COALESCE(SUM(leads), 0) as leads,
            COALESCE(SUM(appointment), 0) as appt,
            COALESCE(SUM(show), 0) as show,
            COALESCE(SUM(interview), 0) as interview
     FROM daily_production
     WHERE deleted_at IS NULL AND strftime('%Y', date) = ? AND strftime('%m', date) = ?
     GROUP BY strftime('%d', date)`,
    [String(year), mm(month)]
  );

  const prodByDay: Record<number, { leads: number; appt: number; show: number; interview: number }> = {};
  for (const r of rows) {
    prodByDay[parseInt(r.day_str, 10)] = {
      leads: Number(r.leads || 0),
      appt: Number(r.appt || 0),
      show: Number(r.show || 0),
      interview: Number(r.interview || 0),
    };
  }

  const closingRows = db().getAllSync<any>(
    `SELECT strftime('%d', c.date) as day_str,
            COALESCE(SUM(i.quantity), 0) as closings,
            COALESCE(SUM(i.gross_revenue), 0) as gross
     FROM closing_transactions c
     JOIN closing_items i ON i.closing_id = c.id
     WHERE c.deleted_at IS NULL AND strftime('%Y', c.date) = ? AND strftime('%m', c.date) = ?
     GROUP BY strftime('%d', c.date)`,
    [String(year), mm(month)]
  );

  const closingByDay: Record<number, { closings: number; gross: number }> = {};
  for (const r of closingRows) {
    closingByDay[parseInt(r.day_str, 10)] = {
      closings: Number(r.closings || 0),
      gross: Number(r.gross || 0),
    };
  }

  let cumLeads = 0;
  let cumAppt = 0;
  let cumShow = 0;
  let cumInterview = 0;
  let cumClosings = 0;
  let cumRevenue = 0;

  const points: DailyProductionCumulativePoint[] = [];
  const maxDay = Math.min(totalDays, elapsedDays(year, month));

  for (let d = 1; d <= maxDay; d++) {
    const p = prodByDay[d] || { leads: 0, appt: 0, show: 0, interview: 0 };
    const c = closingByDay[d] || { closings: 0, gross: 0 };

    cumLeads += p.leads;
    cumAppt += p.appt;
    cumShow += p.show;
    cumInterview += p.interview;
    cumClosings += c.closings;
    cumRevenue += c.gross;

    points.push({
      day: d,
      date: `${year}-${mm(month)}-${String(d).padStart(2, "0")}`,
      label: `Tgl ${d}`,
      dailyLeads: p.leads,
      cumLeads,
      dailyAppt: p.appt,
      cumAppt,
      dailyShow: p.show,
      cumShow,
      dailyInterview: p.interview,
      cumInterview,
      dailyClosings: c.closings,
      cumClosings,
      dailyRevenue: c.gross,
      cumRevenue,
    });
  }

  return points;
}

