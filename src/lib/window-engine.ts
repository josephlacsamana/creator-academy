/**
 * Window State Engine
 *
 * Pure functions that compute window state from current UTC time.
 * No side effects, no API calls — just math on UTC time.
 *
 * The 5 daily windows (all times UTC):
 *   W1: 00:30 - 03:30
 *   W2: 06:30 - 09:30
 *   W3: 09:30 - 12:30
 *   W4: 12:30 - 15:30
 *   W5: 15:30 - 18:30
 *
 * Each window has 3 phases:
 *   Submit (60 min) → Engage (90 min) → Cooldown (30 min) = 180 min total
 *
 * Late submissions are allowed during the first 60 minutes of the engage phase.
 * So canSubmit = true during submit phase AND first 60 min of engage phase.
 */

import type { WindowInfo, WindowPhase } from "@/types/database";

// Window definitions: [startMinute, endMinute] in minutes since midnight UTC
const WINDOWS = [
  { number: 1, startMin: 30, endMin: 210 },   // 00:30 - 03:30
  { number: 2, startMin: 390, endMin: 570 },   // 06:30 - 09:30
  { number: 3, startMin: 570, endMin: 750 },   // 09:30 - 12:30
  { number: 4, startMin: 750, endMin: 930 },   // 12:30 - 15:30
  { number: 5, startMin: 930, endMin: 1110 },  // 15:30 - 18:30
] as const;

// Phase durations in minutes
const SUBMIT_DURATION = 60;
const ENGAGE_DURATION = 90;
const COOLDOWN_DURATION = 30;
// Late submit allowed during first 60 min of engage phase
const LATE_SUBMIT_WINDOW = 60;

/** Format a date as "YYYY-MM-DD" in UTC */
function formatDateUTC(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Get minutes since midnight UTC for a given Date */
function minutesSinceMidnightUTC(date: Date): number {
  return date.getUTCHours() * 60 + date.getUTCMinutes() + date.getUTCSeconds() / 60;
}

/** Create a Date at a specific minute offset from midnight UTC of the given date */
function dateAtMinuteUTC(refDate: Date, minuteOfDay: number): Date {
  const d = new Date(refDate);
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCMinutes(minuteOfDay);
  return d;
}

/** Build the window ID string, e.g. "2026-03-13_W1" */
export function getWindowId(windowNumber: number, date?: Date): string {
  const d = date ?? new Date();
  return `${formatDateUTC(d)}_W${windowNumber}`;
}

/**
 * Determine phase label for display
 */
function phaseLabel(phase: WindowPhase): string {
  switch (phase) {
    case "submit":
      return "Submit + Preview";
    case "engage":
      return "Engage";
    case "cooldown":
      return "Cooldown";
    case "between":
      return "Between Windows";
  }
}

/**
 * Get the current window info, or null if between windows.
 */
export function getCurrentWindow(now?: Date): WindowInfo | null {
  const currentTime = now ?? new Date();
  const minutesNow = minutesSinceMidnightUTC(currentTime);

  for (const win of WINDOWS) {
    if (minutesNow < win.startMin || minutesNow >= win.endMin) {
      continue;
    }

    // We're inside this window — determine the phase
    const elapsed = minutesNow - win.startMin;

    let phase: WindowPhase;
    let phaseEndsAtMin: number;

    if (elapsed < SUBMIT_DURATION) {
      // Submit phase: 0-60 min
      phase = "submit";
      phaseEndsAtMin = win.startMin + SUBMIT_DURATION;
    } else if (elapsed < SUBMIT_DURATION + ENGAGE_DURATION) {
      // Engage phase: 60-150 min
      phase = "engage";
      phaseEndsAtMin = win.startMin + SUBMIT_DURATION + ENGAGE_DURATION;
    } else {
      // Cooldown phase: 150-180 min
      phase = "cooldown";
      phaseEndsAtMin = win.endMin;
    }

    const phaseEndsAt = dateAtMinuteUTC(currentTime, phaseEndsAtMin);
    const windowStartsAt = dateAtMinuteUTC(currentTime, win.startMin);
    const windowEndsAt = dateAtMinuteUTC(currentTime, win.endMin);

    // canSubmit: during submit phase OR first 60 min of engage phase
    const canSubmit =
      phase === "submit" ||
      (phase === "engage" && elapsed < SUBMIT_DURATION + LATE_SUBMIT_WINDOW);

    // canClaim: only during engage phase
    const canClaim = phase === "engage";

    const timeRemainingMs = phaseEndsAt.getTime() - currentTime.getTime();

    // Find next window
    const nextWin = getNextWindow(currentTime);

    return {
      windowNumber: win.number,
      windowId: getWindowId(win.number, currentTime),
      phase,
      phaseLabel: phaseLabel(phase),
      phaseEndsAt,
      windowStartsAt,
      windowEndsAt,
      canSubmit,
      canClaim,
      timeRemainingMs: Math.max(0, timeRemainingMs),
      nextWindowStartsAt: nextWin ? nextWin.startsAt : null,
    };
  }

  // Between windows
  return null;
}

/**
 * Get the next upcoming window (the one that starts after `now`).
 * If we're currently inside a window, returns the window after the current one.
 * Returns null if no more windows today (wraps to W1 tomorrow).
 */
export function getNextWindow(
  now?: Date
): { windowNumber: number; startsAt: Date } | null {
  const currentTime = now ?? new Date();
  const minutesNow = minutesSinceMidnightUTC(currentTime);

  // Find the first window that starts after now
  for (const win of WINDOWS) {
    if (win.startMin > minutesNow) {
      return {
        windowNumber: win.number,
        startsAt: dateAtMinuteUTC(currentTime, win.startMin),
      };
    }
  }

  // If we're past the start of the last window, check if we're inside it
  // If inside the last window, or past it, next window is W1 tomorrow
  const tomorrow = new Date(currentTime);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  return {
    windowNumber: WINDOWS[0].number,
    startsAt: dateAtMinuteUTC(tomorrow, WINDOWS[0].startMin),
  };
}

/**
 * Format milliseconds as a human-readable countdown string.
 * e.g. 3723000 → "1:02:03"
 */
export function formatCountdown(ms: number): string {
  if (ms <= 0) return "0:00";

  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}
