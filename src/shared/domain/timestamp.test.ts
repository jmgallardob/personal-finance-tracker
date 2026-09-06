import { describe, expect, it } from "vitest";

import { isTimestamp, toTimestamp } from "./timestamp";

describe("timestamps", () => {
  it.each([0, 1, 1757145600000, Number.MAX_SAFE_INTEGER])(
    "accepts the exact millisecond mark %i",
    (value) => {
      expect(isTimestamp(value)).toBe(true);
      expect(toTimestamp("createdAt", value)).toEqual({ ok: true, value });
    },
  );

  it.each([-1, 0.5, Number.NaN, Number.POSITIVE_INFINITY, 2 ** 53])(
    "rejects %p as a technical timestamp",
    (value) => {
      expect(isTimestamp(value)).toBe(false);
      expect(toTimestamp("updatedAt", value)).toEqual({
        ok: false,
        errors: [{ field: "updatedAt", code: "invalidTimestamp" }],
      });
    },
  );

  it("names the field that was rejected", () => {
    const result = toTimestamp("archivedAt", -1);

    expect(result.ok ? "" : result.errors[0].field).toBe("archivedAt");
  });
});
