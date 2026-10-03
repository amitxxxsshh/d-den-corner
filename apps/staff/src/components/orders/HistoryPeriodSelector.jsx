"use client";

import { useEffect, useMemo, useRef, useState } from "react";

function getBusinessTodayDateString(timeZone = "Asia/Kolkata") {
  try {
    return new Intl.DateTimeFormat("en-CA", { timeZone }).format(new Date());
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

function addDays(dateStr, n) {
  if (!dateStr || typeof dateStr !== "string" || !dateStr.includes("-")) return "";
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d + n));
  if (isNaN(date.getTime())) return dateStr;
  return [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, "0"),
    String(date.getUTCDate()).padStart(2, "0"),
  ].join("-");
}

function addMonths(monthStr, n) {
  if (!monthStr || typeof monthStr !== "string" || !monthStr.includes("-")) return "";
  const [y, m] = monthStr.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1 + n, 1));
  if (isNaN(date.getTime())) return monthStr;
  return [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, "0"),
  ].join("-");
}

function formatDateDisplay(dateStr) {
  if (!dateStr || typeof dateStr !== "string" || !dateStr.includes("-")) return "";
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  if (isNaN(date.getTime())) return dateStr;
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function formatMonthDisplay(monthStr) {
  if (!monthStr || typeof monthStr !== "string" || !monthStr.includes("-")) return "";
  const [y, m] = monthStr.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, 1, 12, 0, 0));
  if (isNaN(date.getTime())) return monthStr;
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const WEEKDAY_NAMES = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export default function HistoryPeriodSelector({
  mode = "day",
  onModeChange,
  selectedDate,
  onDateChange,
  selectedMonth,
  onMonthChange,
  disabled = false,
  timeZone = "Asia/Kolkata",
}) {
  const [calendarOpen, setCalendarOpen] = useState(false);
  const calendarRef = useRef(null);

  const todayLocalDate = useMemo(() => getBusinessTodayDateString(timeZone), [timeZone]);
  const todayLocalMonth = useMemo(() => todayLocalDate.slice(0, 7), [todayLocalDate]);

  // Calendar viewing month/year for the Day picker popup (derived or navigated)
  const [navigatedMonth, setNavigatedMonth] = useState(null);
  const viewingMonth =
    navigatedMonth ||
    (selectedDate ? selectedDate.slice(0, 7) : todayLocalMonth) ||
    "2026-10";

  // Close calendar popup on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (calendarRef.current && !calendarRef.current.contains(event.target)) {
        setCalendarOpen(false);
      }
    }

    if (calendarOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [calendarOpen]);

  // Month navigation in Day picker calendar popup
  const [viewYear, viewMonthNumber] = viewingMonth.split("-").map(Number);

  const isNextMonthInFuture = useMemo(() => {
    const nextMonth = addMonths(viewingMonth, 1);
    return nextMonth > todayLocalMonth;
  }, [viewingMonth, todayLocalMonth]);

  function handleCalendarPrevMonth() {
    setNavigatedMonth(addMonths(viewingMonth, -1));
  }

  function handleCalendarNextMonth() {
    if (isNextMonthInFuture) return;
    setNavigatedMonth(addMonths(viewingMonth, 1));
  }

  // Generate calendar days for viewing month
  const calendarCells = useMemo(() => {
    const [y, m] = viewingMonth.split("-").map(Number);
    const firstDayDow = new Date(Date.UTC(y, m - 1, 1)).getUTCDay();
    const totalDays = new Date(Date.UTC(y, m, 0)).getUTCDate();

    const cells = [];
    // Padding
    for (let i = 0; i < firstDayDow; i++) {
      cells.push({ key: `pad-${i}`, padding: true });
    }
    // Days
    for (let d = 1; d <= totalDays; d++) {
      const dateStr = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const isFuture = dateStr > todayLocalDate;
      const isSelected = dateStr === selectedDate;
      const isToday = dateStr === todayLocalDate;
      cells.push({
        key: dateStr,
        dayNumber: d,
        dateStr,
        isFuture,
        isSelected,
        isToday,
      });
    }
    return cells;
  }, [viewingMonth, todayLocalDate, selectedDate]);

  // Available years for dropdowns (current year down to 2024)
  const currentYearNum = parseInt(todayLocalDate.slice(0, 4), 10);
  const yearsList = useMemo(() => {
    const list = [];
    for (let y = currentYearNum; y >= currentYearNum - 2; y--) {
      list.push(y);
    }
    return list;
  }, [currentYearNum]);

  // Day mode quick handlers
  function handlePrevDay() {
    const prev = addDays(selectedDate, -1);
    onDateChange(prev);
  }

  function handleNextDay() {
    if (selectedDate >= todayLocalDate) return;
    const next = addDays(selectedDate, 1);
    onDateChange(next);
  }

  function handleQuickToday() {
    onDateChange(todayLocalDate);
    setNavigatedMonth(null);
  }

  // Month mode quick handlers
  const isMonthNextInFuture = useMemo(() => {
    const nextMonth = addMonths(selectedMonth, 1);
    return nextMonth > todayLocalMonth;
  }, [selectedMonth, todayLocalMonth]);

  function handlePrevMonth() {
    const prev = addMonths(selectedMonth, -1);
    onMonthChange(prev);
  }

  function handleNextMonth() {
    if (isMonthNextInFuture) return;
    const next = addMonths(selectedMonth, 1);
    onMonthChange(next);
  }

  function handleQuickCurrentMonth() {
    onMonthChange(todayLocalMonth);
  }

  const [selectedMonthYear, selectedMonthPart] = (selectedMonth || todayLocalMonth)
    .split("-")
    .map(Number);

  return (
    <div className="rounded-3xl border border-stone/50 bg-white p-4 sm:p-5 card-warm-shadow space-y-4">
      {/* Top Bar: Mode Switcher & Period Label */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        {/* Day / Month Mode Toggle */}
        <div className="inline-flex rounded-2xl border border-stone/40 bg-cream-warm/20 p-1 shadow-2xs self-start">
          <button
            type="button"
            onClick={() => onModeChange("day")}
            disabled={disabled}
            className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl transition ${
              mode === "day"
                ? "bg-charcoal-deep text-cream-soft font-bold shadow-xs"
                : "text-charcoal-deep/70 hover:bg-cream-warm/50"
            }`}
          >
            <svg
              className="h-3.5 w-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <span>Day</span>
          </button>

          <button
            type="button"
            onClick={() => onModeChange("month")}
            disabled={disabled}
            className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl transition ${
              mode === "month"
                ? "bg-charcoal-deep text-cream-soft font-bold shadow-xs"
                : "text-charcoal-deep/70 hover:bg-cream-warm/50"
            }`}
          >
            <svg
              className="h-3.5 w-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
              <circle cx="8" cy="14" r="1" fill="currentColor" />
              <circle cx="12" cy="14" r="1" fill="currentColor" />
              <circle cx="16" cy="14" r="1" fill="currentColor" />
            </svg>
            <span>Month</span>
          </button>
        </div>

        {/* Selected Period Badge */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-charcoal-deep/60">Viewing:</span>
          <span className="inline-flex items-center gap-1.5 rounded-xl border border-amber-warm/40 bg-amber-warm/15 px-3 py-1.5 text-xs font-bold font-serif text-charcoal-deep">
            <span>📅</span>
            <span>
              {mode === "day"
                ? formatDateDisplay(selectedDate)
                : formatMonthDisplay(selectedMonth)}
            </span>
          </span>
        </div>
      </div>

      {/* ============================================================ */}
      {/* MODE A: DAY CONTROLS                                         */}
      {/* ============================================================ */}
      {mode === "day" ? (
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-stone/30">
          {/* Quick Date Stepper (< Today >) */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handlePrevDay}
              disabled={disabled}
              title="Previous Day"
              className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-stone/40 bg-white text-xs font-bold text-charcoal-deep hover:bg-cream-warm/40 transition disabled:opacity-40"
            >
              ‹
            </button>

            <button
              type="button"
              onClick={handleQuickToday}
              disabled={disabled}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition border ${
                selectedDate === todayLocalDate
                  ? "bg-charcoal-deep text-cream-soft border-charcoal-deep font-bold"
                  : "bg-white border-stone/40 text-charcoal-deep hover:bg-cream-warm/40"
              }`}
            >
              Today
            </button>

            <button
              type="button"
              onClick={handleNextDay}
              disabled={disabled || selectedDate >= todayLocalDate}
              title="Next Day"
              className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-stone/40 bg-white text-xs font-bold text-charcoal-deep hover:bg-cream-warm/40 transition disabled:opacity-40"
            >
              ›
            </button>
          </div>

          {/* Calendar Picker Trigger & Native Input */}
          <div className="relative flex items-center gap-2" ref={calendarRef}>
            <button
              type="button"
              onClick={() => setCalendarOpen((prev) => !prev)}
              disabled={disabled}
              className="inline-flex items-center gap-1.5 rounded-xl border border-stone/40 bg-white px-3 py-1.5 text-xs font-semibold text-charcoal-deep hover:bg-cream-warm/40 transition shadow-2xs"
            >
              <svg
                className="h-3.5 w-3.5 text-amber-gold"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <span>{calendarOpen ? "Close Calendar" : "Pick from Calendar"}</span>
            </button>

            {/* Native HTML Date input fallback for mobile / accessibility */}
            <input
              type="date"
              max={todayLocalDate}
              value={selectedDate || todayLocalDate}
              onChange={(e) => {
                if (e.target.value && e.target.value <= todayLocalDate) {
                  onDateChange(e.target.value);
                }
              }}
              disabled={disabled}
              className="rounded-xl border border-stone/40 bg-white px-2.5 py-1 text-xs text-charcoal-deep shadow-2xs cursor-pointer focus:outline-none focus:ring-1 focus:ring-amber-warm"
              title="Select date via native picker"
            />

            {/* Interactive Calendar Dropdown Modal / Popover */}
            {calendarOpen ? (
              <div className="absolute right-0 top-full mt-2 z-30 w-72 rounded-3xl border border-stone/50 bg-white p-4 shadow-xl card-warm-shadow">
                {/* Calendar Month Navigation Header */}
                <div className="flex items-center justify-between pb-3 border-b border-stone/30">
                  <button
                    type="button"
                    onClick={handleCalendarPrevMonth}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-stone/30 bg-cream-warm/20 text-xs font-bold text-charcoal-deep hover:bg-cream-warm/60"
                  >
                    ‹
                  </button>

                  <div className="flex items-center gap-1.5 text-xs font-bold text-charcoal-deep">
                    {/* Month select */}
                    <select
                      value={viewMonthNumber}
                      onChange={(e) => {
                        const newM = String(e.target.value).padStart(2, "0");
                        const newViewing = `${viewYear}-${newM}`;
                        if (newViewing <= todayLocalMonth) {
                          setNavigatedMonth(newViewing);
                        }
                      }}
                      className="rounded-lg border border-stone/30 bg-cream-warm/15 px-2 py-0.5 text-xs font-semibold text-charcoal-deep"
                    >
                      {MONTH_NAMES.map((name, idx) => {
                        const mNum = idx + 1;
                        const candidate = `${viewYear}-${String(mNum).padStart(2, "0")}`;
                        const isFuture = candidate > todayLocalMonth;
                        return (
                          <option key={name} value={mNum} disabled={isFuture}>
                            {name}
                          </option>
                        );
                      })}
                    </select>

                    {/* Year select */}
                    <select
                      value={viewYear}
                      onChange={(e) => {
                        const newY = e.target.value;
                        const candidate = `${newY}-${String(viewMonthNumber).padStart(2, "0")}`;
                        setNavigatedMonth(candidate > todayLocalMonth ? todayLocalMonth : candidate);
                      }}
                      className="rounded-lg border border-stone/30 bg-cream-warm/15 px-2 py-0.5 text-xs font-semibold text-charcoal-deep"
                    >
                      {yearsList.map((y) => (
                        <option key={y} value={y}>
                          {y}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={handleCalendarNextMonth}
                    disabled={isNextMonthInFuture}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-stone/30 bg-cream-warm/20 text-xs font-bold text-charcoal-deep hover:bg-cream-warm/60 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    ›
                  </button>
                </div>

                {/* Weekday Labels */}
                <div className="grid grid-cols-7 gap-1 pt-3 text-center text-[10px] font-bold uppercase tracking-wider text-charcoal-deep/50">
                  {WEEKDAY_NAMES.map((w) => (
                    <div key={w} className="py-1">
                      {w}
                    </div>
                  ))}
                </div>

                {/* Day Cells Grid */}
                <div className="grid grid-cols-7 gap-1 pt-1 text-center">
                  {calendarCells.map((cell) => {
                    if (cell.padding) {
                      return <div key={cell.key} className="h-8 w-8" />;
                    }

                    return (
                      <button
                        key={cell.key}
                        type="button"
                        onClick={() => {
                          if (!cell.isFuture) {
                            setNavigatedMonth(null);
                            onDateChange(cell.dateStr);
                            setCalendarOpen(false);
                          }
                        }}
                        disabled={cell.isFuture}
                        className={`h-8 w-8 rounded-xl text-xs flex items-center justify-center font-medium transition ${
                          cell.isFuture
                            ? "opacity-25 cursor-not-allowed text-charcoal-deep/30"
                            : cell.isSelected
                              ? "bg-charcoal-deep text-cream-soft font-bold shadow-xs ring-2 ring-amber-warm"
                              : cell.isToday
                                ? "border border-amber-warm font-bold text-amber-gold hover:bg-cream-warm/40"
                                : "text-charcoal-deep hover:bg-cream-warm/50"
                        }`}
                      >
                        {cell.dayNumber}
                      </button>
                    );
                  })}
                </div>

                {/* Calendar Footer */}
                <div className="mt-3 pt-2.5 border-t border-stone/30 flex items-center justify-between text-[11px]">
                  <button
                    type="button"
                    onClick={() => {
                      handleQuickToday();
                      setCalendarOpen(false);
                    }}
                    className="font-bold text-amber-gold hover:underline"
                  >
                    Today ({todayLocalDate})
                  </button>

                  <button
                    type="button"
                    onClick={() => setCalendarOpen(false)}
                    className="text-charcoal-deep/60 hover:text-charcoal-deep font-semibold"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : (
        /* ============================================================ */
        /* MODE B: MONTH CONTROLS                                       */
        /* ============================================================ */
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-stone/30">
          {/* Quick Month Stepper (< Current Month >) */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handlePrevMonth}
              disabled={disabled}
              title="Previous Month"
              className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-stone/40 bg-white text-xs font-bold text-charcoal-deep hover:bg-cream-warm/40 transition disabled:opacity-40"
            >
              ‹
            </button>

            <button
              type="button"
              onClick={handleQuickCurrentMonth}
              disabled={disabled}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition border ${
                selectedMonth === todayLocalMonth
                  ? "bg-charcoal-deep text-cream-soft border-charcoal-deep font-bold"
                  : "bg-white border-stone/40 text-charcoal-deep hover:bg-cream-warm/40"
              }`}
            >
              Current Month
            </button>

            <button
              type="button"
              onClick={handleNextMonth}
              disabled={disabled || isMonthNextInFuture}
              title="Next Month"
              className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-stone/40 bg-white text-xs font-bold text-charcoal-deep hover:bg-cream-warm/40 transition disabled:opacity-40"
            >
              ›
            </button>
          </div>

          {/* Month / Year Selectors */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-charcoal-deep/60">Select Month:</span>

            {/* Month Dropdown */}
            <select
              value={selectedMonthPart}
              onChange={(e) => {
                const newM = String(e.target.value).padStart(2, "0");
                const candidate = `${selectedMonthYear}-${newM}`;
                if (candidate <= todayLocalMonth) {
                  onMonthChange(candidate);
                }
              }}
              disabled={disabled}
              className="rounded-xl border border-stone/40 bg-white px-3 py-1.5 text-xs font-semibold text-charcoal-deep shadow-2xs focus:outline-none focus:ring-1 focus:ring-amber-warm"
            >
              {MONTH_NAMES.map((name, idx) => {
                const mNum = idx + 1;
                const candidate = `${selectedMonthYear}-${String(mNum).padStart(2, "0")}`;
                const isFuture = candidate > todayLocalMonth;
                return (
                  <option key={name} value={mNum} disabled={isFuture}>
                    {name}
                  </option>
                );
              })}
            </select>

            {/* Year Dropdown */}
            <select
              value={selectedMonthYear}
              onChange={(e) => {
                const newY = e.target.value;
                const candidate = `${newY}-${String(selectedMonthPart).padStart(2, "0")}`;
                onMonthChange(candidate > todayLocalMonth ? todayLocalMonth : candidate);
              }}
              disabled={disabled}
              className="rounded-xl border border-stone/40 bg-white px-3 py-1.5 text-xs font-semibold text-charcoal-deep shadow-2xs focus:outline-none focus:ring-1 focus:ring-amber-warm"
            >
              {yearsList.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  );
}
