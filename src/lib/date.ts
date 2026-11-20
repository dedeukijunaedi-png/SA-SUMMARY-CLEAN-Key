
export const MONTH_NAMES_ID = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

export function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

export function toYMD(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export function toHM(d: Date): string {
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

export function fromYMD(ymd: string): Date {
  const [y, m, d] = ymd.split("-").map((x) => parseInt(x, 10));
  return new Date(y, (m || 1) - 1, d || 1);
}

export function todayYMD(): string {
  return toYMD(new Date());
}

export function nowISO(): string {
  return new Date().toISOString();
}

export function ymOf(ymd: string): { year: number; month: number } {
  const [y, m] = ymd.split("-").map((x) => parseInt(x, 10));
  return { year: y, month: m };
}

export function monthLabel(year: number, month: number): string {
  return `${MONTH_NAMES_ID[month - 1]} ${year}`;
}

export function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

export function monthStart(year: number, month: number): string {
  return `${year}-${pad2(month)}-01`;
}

export function monthEnd(year: number, month: number): string {
  return `${year}-${pad2(month)}-${pad2(daysInMonth(year, month))}`;
}

export function elapsedDays(year: number, month: number): number {
  const now = new Date();
  const dim = daysInMonth(year, month);
  if (now.getFullYear() === year && now.getMonth() + 1 === month) {
    return Math.min(now.getDate(), dim);
  }
  return dim;
}

export function displayDate(ymd: string): string {
  const [y, m, d] = ymd.split("-");
  return `${d}/${m}/${y}`;
}

export function displayDateTime(ymd: string, hm?: string | null): string {
  const base = displayDate(ymd);
  return hm ? `${base} ${hm}` : base;
}

export function currentYM(): { year: number; month: number } {
  const n = new Date();
  return { year: n.getFullYear(), month: n.getMonth() + 1 };
}
