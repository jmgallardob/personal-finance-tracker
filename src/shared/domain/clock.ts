/**
 * Injectable clock.
 *
 * Reading the current day is an external dependency, so consumers receive a
 * {@link Clock} instead of calling the machine clock themselves. Tests use
 * {@link FixedClock} to become deterministic without patching any domain rule.
 */

import type { LocalDate } from "./dates";

/** Time zone every civil date of the application is interpreted in. */
export const APPLICATION_TIME_ZONE = "Europe/Madrid";

/** Source of the current civil day. */
export interface Clock {
  /** Current day in {@link APPLICATION_TIME_ZONE}. */
  today(): LocalDate;
}

const localDateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: APPLICATION_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/**
 * Civil day an instant belongs to in {@link APPLICATION_TIME_ZONE}.
 *
 * The instant is only used to ask the time zone which calendar day it falls on;
 * the result is civil date text, never a UTC timestamp. Around midnight the
 * Madrid day is already ahead of the UTC one, and that offset is what this
 * conversion preserves.
 */
export function toApplicationLocalDate(instant: Date): LocalDate {
  const parts: Record<string, string> = {};

  for (const part of localDateFormatter.formatToParts(instant)) {
    parts[part.type] = part.value;
  }

  // Intl always yields a real calendar day for a valid instant.
  return `${parts.year}-${parts.month}-${parts.day}` as LocalDate;
}

/** Clock backed by the machine time, resolved in Madrid. */
export class SystemClock implements Clock {
  private readonly now: () => Date;

  constructor(now: () => Date = () => new Date()) {
    this.now = now;
  }

  today(): LocalDate {
    return toApplicationLocalDate(this.now());
  }
}

/** Clock that always reports the same day, for deterministic tests. */
export class FixedClock implements Clock {
  private readonly date: LocalDate;

  constructor(date: LocalDate) {
    this.date = date;
  }

  today(): LocalDate {
    return this.date;
  }
}
