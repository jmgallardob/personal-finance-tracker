import { describe, expect, it } from "vitest";

import { TRANSACTION_TYPES, isTransactionType } from "./transaction-type";

describe("transaction types", () => {
  it("offers exactly the two accepted types", () => {
    expect(TRANSACTION_TYPES).toEqual(["expense", "income"]);
  });

  it.each(["expense", "income"])("accepts the type %s", (value) => {
    expect(isTransactionType(value)).toBe(true);
  });

  it.each([
    "gasto",
    "ingreso",
    "Expense",
    "EXPENSE",
    "transfer",
    "",
    " expense",
  ])("rejects the type %p", (value) => {
    expect(isTransactionType(value)).toBe(false);
  });
});
