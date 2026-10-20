const TASHKENT_TZ = "Asia/Tashkent";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

/** Today's date as YYYY-MM-DD, computed in the Asia/Tashkent timezone. */
export function todayInTashkent(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TASHKENT_TZ }).format(new Date());
}

/** Current month as YYYY-MM, computed in the Asia/Tashkent timezone. */
export function currentMonthInTashkent(): string {
  return todayInTashkent().slice(0, 7);
}

/** True for a real calendar date in YYYY-MM-DD form (rejects e.g. 2024-02-30). */
export function isValidDateString(value: string): boolean {
  if (!DATE_RE.test(value)) return false;
  const [y, m, d] = value.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}

/** True for a strictly-formatted YYYY-MM month with a valid 01-12 month part. */
export function isValidMonthString(value: string): boolean {
  return MONTH_RE.test(value);
}

/** [startDate, endDate] (both YYYY-MM-DD, inclusive) covering the given YYYY-MM month. */
export function monthRange(month: string): { start: string; end: string } {
  const [y, m] = month.split("-").map(Number);
  const start = `${month}-01`;
  const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const end = `${month}-${String(lastDay).padStart(2, "0")}`;
  return { start, end };
}
