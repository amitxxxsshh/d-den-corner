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
