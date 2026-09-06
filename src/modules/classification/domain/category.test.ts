import { describe, expect, it } from "vitest";

import type { Category, CategoryInput } from "./category";
import {
  MAX_CATEGORY_NAME_LENGTH,
  areCategoriesEquivalent,
  createCategory,
  isCategoryActive,
} from "./category";

const VALID_INPUT: CategoryInput = {
  id: "0193f0a1-6f3d-7c62-9a24-8f5b0e1c2d34",
  name: "Supermercado",
  type: "expense",
  sortOrder: 3,
  archivedAt: null,
};

function created(input: Partial<CategoryInput> = {}): Category {
  const result = createCategory({ ...VALID_INPUT, ...input });

  if (!result.ok) {
    throw new Error(
      `Expected a valid category, got ${JSON.stringify(result.errors)}`,
    );
  }

  return result.value;
}

function errorsOf(input: Partial<CategoryInput>) {
  const result = createCategory({ ...VALID_INPUT, ...input });

  return result.ok ? [] : result.errors;
}

describe("createCategory", () => {
  it("builds an active category with its normalized name", () => {
    expect(created()).toEqual({
      id: VALID_INPUT.id,
      name: "Supermercado",
      normalizedName: "supermercado",
      type: "expense",
      sortOrder: 3,
      archivedAt: null,
    });
  });

  it("accepts an income category and keeps the type it was created with", () => {
    expect(created({ name: "Sueldo", type: "income" }).type).toBe("income");
  });

  it("normalizes the written name and keeps its accents and case", () => {
    const category = created({ name: "  Cuidado   Personál  " });

    expect(category.name).toBe("Cuidado Personál");
    expect(category.normalizedName).toBe("cuidado personál");
  });

  it("records the archiving mark as a technical millisecond timestamp", () => {
    const category = created({ archivedAt: 1757145600000 });

    expect(category.archivedAt).toBe(1757145600000);
    expect(isCategoryActive(category)).toBe(false);
    expect(isCategoryActive(created())).toBe(true);
  });

  it.each([
    ["a", 1],
    ["A".repeat(MAX_CATEGORY_NAME_LENGTH), MAX_CATEGORY_NAME_LENGTH],
  ])("accepts the name of %i character(s) at the boundary", (name) => {
    expect(created({ name }).name).toBe(name);
  });

  it("rejects a name one character beyond the accepted maximum", () => {
    expect(
      errorsOf({ name: "A".repeat(MAX_CATEGORY_NAME_LENGTH + 1) }),
    ).toEqual([{ field: "name", code: "tooLong" }]);
  });

  it("measures the maximum in characters, not in UTF-16 units", () => {
    const emojiName = "\u{1F381}".repeat(MAX_CATEGORY_NAME_LENGTH);

    expect(emojiName.length).toBe(MAX_CATEGORY_NAME_LENGTH * 2);
    expect(created({ name: emojiName }).name).toBe(emojiName);
    expect(
      errorsOf({ name: "\u{1F381}".repeat(MAX_CATEGORY_NAME_LENGTH + 1) }),
    ).toEqual([{ field: "name", code: "tooLong" }]);
  });

  it.each(["", "   "])("rejects the empty name %p", (name) => {
    expect(errorsOf({ name })).toEqual([{ field: "name", code: "required" }]);
  });

  it("rejects a name made of control characters as an invalid character, not as an empty name", () => {
    expect(errorsOf({ name: "\t\n " })).toEqual([
      { field: "name", code: "invalidCharacter" },
    ]);
  });

  it.each([
    ["Casa\u0007", "a control character in the middle"],
    ["\u0007Casa", "a control character at the start"],
    ["Casa\u0000", "a control character at the end"],
    ["\tCasa", "a leading tab"],
    ["Casa\t", "a trailing tab"],
    ["Ca\tsa", "an internal tab"],
    ["\nCasa", "a leading line break"],
    ["Casa\n", "a trailing line break"],
    ["Ca\nsa", "an internal line break"],
    ["Casa\r", "a trailing carriage return"],
    ["\r\nCasa\r\n", "line breaks at both extremes"],
  ])("rejects the name %p because of %s", (name) => {
    expect(errorsOf({ name })).toEqual([
      { field: "name", code: "invalidCharacter" },
    ]);
  });

  it("still normalizes the printable whitespace of an accepted name", () => {
    expect(created({ name: "  Comida   a  domicilio  " }).name).toBe(
      "Comida a domicilio",
    );
  });

  it.each(["gasto", "Expense", "", "transfer"])(
    "rejects the invalid type %p",
    (type) => {
      expect(errorsOf({ type })).toEqual([
        { field: "type", code: "invalidTransactionType" },
      ]);
    },
  );

  it.each(["", "with space", "A".repeat(65)])(
    "rejects the invalid identifier %p",
    (id) => {
      expect(errorsOf({ id })).toEqual([
        { field: "id", code: "invalidIdentifier" },
      ]);
    },
  );

  it.each([-1, 1.5, Number.NaN, 2 ** 53])(
    "rejects the sort order %p",
    (sortOrder) => {
      expect(errorsOf({ sortOrder })).toEqual([
        { field: "sortOrder", code: "invalidSortOrder" },
      ]);
    },
  );

  it("accepts the first sort order", () => {
    expect(created({ sortOrder: 0 }).sortOrder).toBe(0);
  });

  it.each([-1, 1.5, Number.NaN])(
    "rejects the archiving mark %p",
    (archivedAt) => {
      expect(errorsOf({ archivedAt })).toEqual([
        { field: "archivedAt", code: "invalidTimestamp" },
      ]);
    },
  );

  it("reports every rejected field at once", () => {
    expect(
      errorsOf({ id: "", name: "  ", type: "gasto", sortOrder: -3 }),
    ).toEqual([
      { field: "id", code: "invalidIdentifier" },
      { field: "name", code: "required" },
      { field: "type", code: "invalidTransactionType" },
      { field: "sortOrder", code: "invalidSortOrder" },
    ]);
  });
});

describe("areCategoriesEquivalent", () => {
  it("collides on the same normalized name within the same type", () => {
    expect(
      areCategoriesEquivalent(
        created({ name: "Café" }),
        created({ name: "  café " }),
      ),
    ).toBe(true);
  });

  it("does not collide when the accent differs", () => {
    expect(
      areCategoriesEquivalent(
        created({ name: "cafe" }),
        created({ name: "café" }),
      ),
    ).toBe(false);
  });

  it("does not collide across types", () => {
    expect(
      areCategoriesEquivalent(
        created({ name: "Regalos", type: "expense" }),
        created({ name: "regalos", type: "income" }),
      ),
    ).toBe(false);
  });

  it("does not collide on different names of the same type", () => {
    expect(
      areCategoriesEquivalent(
        created({ name: "Viajes" }),
        created({ name: "Ocio" }),
      ),
    ).toBe(false);
  });
});
