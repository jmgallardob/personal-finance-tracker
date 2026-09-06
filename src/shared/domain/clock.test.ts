import { describe, expect, it } from "vitest";

import {
  APPLICATION_TIME_ZONE,
  type Clock,
  FixedClock,
  SystemClock,
  toApplicationLocalDate,
} from "./clock";
import { type LocalDate, compareLocalDates, parseLocalDate } from "./dates";

function parsedDate(text: string): LocalDate {
  const result = parseLocalDate(text);

  if (!result.ok) {
    throw new Error(
      `Expected "${text}" to be a valid date, got ${result.error}`,
    );
  }

  return result.value;
}

/**
 * Consumer under test: it only receives a clock, so it never reads the machine
 * time itself and stays deterministic without patching any domain rule.
 */
function isInTheFuture(date: LocalDate, clock: Clock): boolean {
  return compareLocalDates(date, clock.today()) > 0;
}

describe("APPLICATION_TIME_ZONE", () => {
  it("resolves civil dates in Madrid", () => {
    expect(APPLICATION_TIME_ZONE).toBe("Europe/Madrid");
  });
});

describe("toApplicationLocalDate", () => {
  it.each([
    ["2026-09-06T10:00:00Z", "2026-09-06", "midday in summer time"],
    ["2026-01-15T12:00:00Z", "2026-01-15", "midday in winter time"],
    ["2026-01-01T00:30:00Z", "2026-01-01", "after midnight in winter time"],
  ])("converts %s into %s at %s", (instant, expected) => {
    expect(toApplicationLocalDate(new Date(instant))).toBe(expected);
  });

  it.each([
    ["2025-12-31T23:30:00Z", "2026-01-01", "winter offset crossing the year"],
    ["2026-06-30T23:00:00Z", "2026-07-01", "summer offset crossing the month"],
    ["2026-07-15T22:30:00Z", "2026-07-16", "summer offset crossing the day"],
    ["2026-02-28T23:30:00Z", "2026-03-01", "end of a common February"],
    ["2024-02-28T23:30:00Z", "2024-02-29", "end of a leap February"],
  ])(
    "reports the Madrid day %s already ahead of the UTC one as %s at the %s",
    (instant, expected) => {
      expect(toApplicationLocalDate(new Date(instant))).toBe(expected);
    },
  );

  it("keeps the UTC day when Madrid has not rolled over yet", () => {
    expect(toApplicationLocalDate(new Date("2026-07-15T21:59:00Z"))).toBe(
      "2026-07-15",
    );
    expect(toApplicationLocalDate(new Date("2026-12-31T22:59:00Z"))).toBe(
      "2026-12-31",
    );
  });

  it("resolves the days on which the Madrid offset changes", () => {
    expect(toApplicationLocalDate(new Date("2026-03-29T00:30:00Z"))).toBe(
      "2026-03-29",
    );
    expect(toApplicationLocalDate(new Date("2026-10-25T00:30:00Z"))).toBe(
      "2026-10-25",
    );
  });

  it("produces text the calendar rules accept", () => {
    const today = toApplicationLocalDate(new Date("2026-02-28T23:30:00Z"));

    expect(parseLocalDate(today)).toEqual({ ok: true, value: "2026-03-01" });
  });
});

describe("SystemClock", () => {
  it("reports the Madrid day of the injected instant", () => {
    const clock = new SystemClock(() => new Date("2025-12-31T23:30:00Z"));

    expect(clock.today()).toBe("2026-01-01");
  });

  it("follows the machine time between two readings", () => {
    const instants = [
      new Date("2026-07-15T21:59:00Z"),
      new Date("2026-07-15T22:30:00Z"),
    ];
    const clock = new SystemClock(() => instants.shift() as Date);

    expect(clock.today()).toBe("2026-07-15");
    expect(clock.today()).toBe("2026-07-16");
  });

  it("reads the real machine time when no source is injected", () => {
    const today = new SystemClock().today();

    expect(parseLocalDate(today).ok).toBe(true);
    expect(today).toBe(toApplicationLocalDate(new Date()));
  });
});

describe("FixedClock", () => {
  it("always reports the same day", () => {
    const clock = new FixedClock(parsedDate("2026-09-06"));

    expect(clock.today()).toBe("2026-09-06");
    expect(clock.today()).toBe("2026-09-06");
  });

  it("makes a consumer deterministic without patching the domain", () => {
    const clock = new FixedClock(parsedDate("2026-09-06"));

    expect(isInTheFuture(parsedDate("2026-09-07"), clock)).toBe(true);
    expect(isInTheFuture(parsedDate("2026-09-06"), clock)).toBe(false);
    expect(isInTheFuture(parsedDate("2026-09-05"), clock)).toBe(false);
  });

  it("lets a consumer run on the day the Madrid date rolls over", () => {
    const clock = new SystemClock(() => new Date("2026-07-15T22:30:00Z"));

    expect(isInTheFuture(parsedDate("2026-07-16"), clock)).toBe(false);
    expect(isInTheFuture(parsedDate("2026-07-17"), clock)).toBe(true);
  });
});
