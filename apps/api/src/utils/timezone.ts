export const DEFAULT_BUSINESS_TIMEZONE = "Asia/Kolkata";

export interface TimezoneBoundaries {
  timeZone: string;
  localDate: string; // YYYY-MM-DD in business timezone
  localMonth: string; // YYYY-MM in business timezone
  today: {
    start: string; // ISO string in UTC
    end: string; // ISO string in UTC
  };
  month: {
    start: string; // ISO string in UTC
    end: string; // ISO string in UTC
  };
}

/**
 * Returns UTC ISO boundaries for the start and end of "today" and the "current calendar month"
 * in the specified business timezone (defaulting to Asia/Kolkata / IST).
 */
export function getTimezoneBoundaries(
  referenceDate: Date = new Date(),
  timeZone: string = DEFAULT_BUSINESS_TIMEZONE,
): TimezoneBoundaries {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour12: false,
  });

  const parts = formatter.formatToParts(referenceDate);
  let year = 0;
  let month = 0;
  let day = 0;

  for (const part of parts) {
    if (part.type === "year") year = parseInt(part.value, 10);
    if (part.type === "month") month = parseInt(part.value, 10);
    if (part.type === "day") day = parseInt(part.value, 10);
  }

  function toUtcIso(
    y: number,
    m: number,
    d: number,
    h: number,
    min: number,
    s: number,
    ms: number,
  ): string {
    const approx = new Date(Date.UTC(y, m - 1, d, h, min, s, ms));
    const tzDateStr = approx.toLocaleString("en-US", {
      timeZone,
      hour12: false,
    });
    const utcDateStr = approx.toLocaleString("en-US", {
      timeZone: "UTC",
      hour12: false,
    });
    const offsetMs =
      new Date(tzDateStr).getTime() - new Date(utcDateStr).getTime();
    return new Date(approx.getTime() - offsetMs).toISOString();
  }

  const startOfDay = toUtcIso(year, month, day, 0, 0, 0, 0);
  const endOfDay = toUtcIso(year, month, day, 23, 59, 59, 999);

  const startOfMonth = toUtcIso(year, month, 1, 0, 0, 0, 0);
  const lastDay = new Date(year, month, 0).getDate();
  const endOfMonth = toUtcIso(year, month, lastDay, 23, 59, 59, 999);

  return {
    timeZone,
    localDate: `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
    localMonth: `${year}-${String(month).padStart(2, "0")}`,
    today: {
      start: startOfDay,
      end: endOfDay,
    },
    month: {
      start: startOfMonth,
      end: endOfMonth,
    },
  };
}

/**
 * Converts a date/time tuple in the given business timezone to a UTC ISO string.
 */
export function toUtcIso(
  y: number,
  m: number,
  d: number,
  h: number,
  min: number,
  s: number,
  ms: number,
  timeZone: string = DEFAULT_BUSINESS_TIMEZONE,
): string {
  // If Asia/Kolkata (IST), offset is fixed at UTC+05:30 (+19,800,000 ms) with no DST
  if (timeZone === "Asia/Kolkata" || timeZone === DEFAULT_BUSINESS_TIMEZONE) {
    const utcTime =
      Date.UTC(y, m - 1, d, h, min, s, ms) - (5 * 60 + 30) * 60 * 1000;
    return new Date(utcTime).toISOString();
  }

  // Generic timezone calculation using Intl.DateTimeFormat parts
  const approx = new Date(Date.UTC(y, m - 1, d, h, min, s, ms));
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hour12: false,
  });
  const parts = formatter.formatToParts(approx);
  let py = 0;
  let pm = 0;
  let pd = 0;
  let ph = 0;
  let pmin = 0;
  let ps = 0;
  for (const part of parts) {
    if (part.type === "year") py = parseInt(part.value, 10);
    if (part.type === "month") pm = parseInt(part.value, 10);
    if (part.type === "day") pd = parseInt(part.value, 10);
    if (part.type === "hour")
      ph = parseInt(part.value, 10) === 24 ? 0 : parseInt(part.value, 10);
    if (part.type === "minute") pmin = parseInt(part.value, 10);
    if (part.type === "second") ps = parseInt(part.value, 10);
  }
  const tzTime = Date.UTC(py, pm - 1, pd, ph, pmin, ps, ms);
  const offsetMs = tzTime - approx.getTime();
  return new Date(approx.getTime() - offsetMs).toISOString();
}

/**
 * Validates a date string (YYYY-MM-DD) against the calendar and business timezone.
 * Returns null if valid, or an error string if invalid.
 */
export function validateDateString(
  dateStr: string,
  referenceDate: Date = new Date(),
  timeZone: string = DEFAULT_BUSINESS_TIMEZONE,
): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return "Invalid date format. Expected YYYY-MM-DD.";
  }

  const [yearStr, monthStr, dayStr] = dateStr.split("-");
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const day = parseInt(dayStr, 10);

  if (month < 1 || month > 12) {
    return "Invalid month. Month must be between 01 and 12.";
  }

  const maxDays = new Date(year, month, 0).getDate();
  if (day < 1 || day > maxDays) {
    return `Invalid day. Day must be between 01 and ${maxDays} for ${yearStr}-${monthStr}.`;
  }

  const { localDate: todayLocalDate } = getTimezoneBoundaries(referenceDate, timeZone);
  if (dateStr > todayLocalDate) {
    return "Cannot select a future date.";
  }

  return null;
}

/**
 * Validates a month string (YYYY-MM) against the calendar and business timezone.
 * Returns null if valid, or an error string if invalid.
 */
export function validateMonthString(
  monthStr: string,
  referenceDate: Date = new Date(),
  timeZone: string = DEFAULT_BUSINESS_TIMEZONE,
): string | null {
  if (!/^\d{4}-\d{2}$/.test(monthStr)) {
    return "Invalid month format. Expected YYYY-MM.";
  }

  const [yearStr, monthStrPart] = monthStr.split("-");
  const month = parseInt(monthStrPart, 10);

  if (month < 1 || month > 12) {
    return "Invalid month. Month must be between 01 and 12.";
  }

  const { localMonth: todayLocalMonth } = getTimezoneBoundaries(referenceDate, timeZone);
  if (monthStr > todayLocalMonth) {
    return "Cannot select a future month.";
  }

  return null;
}

/**
 * Calculates start and end UTC ISO strings for a specific business date (YYYY-MM-DD).
 * Uses a half-open interval [start, end) where end is the midnight start of the next business date.
 */
export function getDateBoundaries(
  dateStr: string,
  timeZone: string = DEFAULT_BUSINESS_TIMEZONE,
): { start: string; end: string; localDate: string } {
  const [yearStr, monthStr, dayStr] = dateStr.split("-");
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const day = parseInt(dayStr, 10);

  const start = toUtcIso(year, month, day, 0, 0, 0, 0, timeZone);
  const nextDate = new Date(Date.UTC(year, month - 1, day + 1));
  const nextYear = nextDate.getUTCFullYear();
  const nextMonth = nextDate.getUTCMonth() + 1;
  const nextDay = nextDate.getUTCDate();
  const end = toUtcIso(nextYear, nextMonth, nextDay, 0, 0, 0, 0, timeZone);

  return {
    start,
    end,
    localDate: dateStr,
  };
}

/**
 * Calculates start and end UTC ISO strings for a specific business month (YYYY-MM).
 * Uses a half-open interval [start, end) where end is the midnight start of the next calendar month.
 */
export function getMonthBoundaries(
  monthStr: string,
  timeZone: string = DEFAULT_BUSINESS_TIMEZONE,
): { start: string; end: string; localMonth: string } {
  const [yearStr, monthStrPart] = monthStr.split("-");
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStrPart, 10);

  const start = toUtcIso(year, month, 1, 0, 0, 0, 0, timeZone);
  const nextMonthDate = new Date(Date.UTC(year, month, 1));
  const nextYear = nextMonthDate.getUTCFullYear();
  const nextMonth = nextMonthDate.getUTCMonth() + 1;
  const end = toUtcIso(nextYear, nextMonth, 1, 0, 0, 0, 0, timeZone);

  return {
    start,
    end,
    localMonth: monthStr,
  };
}

/**
 * Returns the UTC ISO timestamp for exactly 6 months prior to the reference date.
 * Handles month-end clamp (e.g. Oct 31 -> Apr 30).
 */
export function getSixMonthsAgoIso(referenceDate: Date = new Date()): string {
  const d = new Date(referenceDate);
  const targetMonth = d.getMonth() - 6;
  d.setMonth(targetMonth);
  const expectedMonth = ((targetMonth % 12) + 12) % 12;
  if (d.getMonth() !== expectedMonth) {
    d.setDate(0);
  }
  return d.toISOString();
}
