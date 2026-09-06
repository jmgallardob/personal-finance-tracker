import { describe, expect, it } from "vitest";

import { type DomainResult, domainError, invalid, valid } from "./errors";

describe("domain results", () => {
  it("carries the accepted value", () => {
    const result: DomainResult<number> = valid(42);

    expect(result).toEqual({ ok: true, value: 42 });
  });

  it("carries every field error of a rejection", () => {
    const result: DomainResult<number> = invalid([
      domainError("name", "required"),
      domainError("type", "invalidTransactionType"),
    ]);

    expect(result).toEqual({
      ok: false,
      errors: [
        { field: "name", code: "required" },
        { field: "type", code: "invalidTransactionType" },
      ],
    });
  });

  it("lets a caller narrow the outcome", () => {
    const accepted = valid("value");
    const rejected = invalid<string>([domainError("id", "invalidIdentifier")]);

    expect(accepted.ok ? accepted.value : null).toBe("value");
    expect(
      rejected.ok ? [] : rejected.errors.map((error) => error.field),
    ).toEqual(["id"]);
  });
});
