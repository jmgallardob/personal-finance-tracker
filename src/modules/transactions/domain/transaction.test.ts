import { describe, expect, it } from "vitest";

import type { Category } from "../../classification/domain/category";
import { createCategory } from "../../classification/domain/category";
import {
  MAX_TRANSACTION_MINOR,
  MIN_TRANSACTION_MINOR,
} from "../../../shared/domain/money";

import type { TransactionInput } from "./transaction";
import {
  MAX_CONCEPT_LENGTH,
  MAX_NOTE_LENGTH,
  MAX_TAGS_PER_TRANSACTION,
  createTransaction,
} from "./transaction";

function categoryOf(type: string, name: string): Category {
  const result = createCategory({
    id: "0193f0a1-6f3d-7c62-9a24-8f5b0e1c2d34",
    name,
    type,
    sortOrder: 0,
    archivedAt: null,
  });

  if (!result.ok) {
    throw new Error(
      `Expected a valid category, got ${JSON.stringify(result.errors)}`,
    );
  }

  return result.value;
}

const EXPENSE_CATEGORY = categoryOf("expense", "Supermercado");
const INCOME_CATEGORY = categoryOf("income", "Sueldo");

const VALID_INPUT: TransactionInput = {
  id: "0193f0a1-6f3d-7c62-9a24-8f5b0e1c2d35",
  type: "expense",
  amountMinor: 1250,
  date: "2026-09-06",
  category: EXPENSE_CATEGORY,
  concept: "Compra semanal",
  note: null,
  tagIds: ["tag-casa", "tag-comida"],
  createdAt: 1757145600000,
  updatedAt: 1757145600000,
};

function created(input: Partial<TransactionInput> = {}) {
  const result = createTransaction({ ...VALID_INPUT, ...input });

  if (!result.ok) {
    throw new Error(
      `Expected a valid transaction, got ${JSON.stringify(result.errors)}`,
    );
  }

  return result.value;
}

function errorsOf(input: Partial<TransactionInput>) {
  const result = createTransaction({ ...VALID_INPUT, ...input });

  return result.ok ? [] : result.errors;
}

describe("createTransaction", () => {
  it("builds an expense with its category, tags and technical timestamps", () => {
    expect(created()).toEqual({
      id: VALID_INPUT.id,
      type: "expense",
      amountMinor: 1250,
      date: "2026-09-06",
      categoryId: EXPENSE_CATEGORY.id,
      concept: "Compra semanal",
      note: null,
      tagIds: ["tag-casa", "tag-comida"],
      createdAt: 1757145600000,
      updatedAt: 1757145600000,
    });
  });

  it("builds an income with a positive amount and no manual sign", () => {
    const transaction = created({
      type: "income",
      category: INCOME_CATEGORY,
      amountMinor: 250000,
      concept: "Nómina",
    });

    expect(transaction.type).toBe("income");
    expect(transaction.amountMinor).toBe(250000);
  });

  it("accepts a transaction without concept, note or tags", () => {
    const transaction = created({ concept: null, note: null, tagIds: [] });

    expect(transaction.concept).toBeNull();
    expect(transaction.note).toBeNull();
    expect(transaction.tagIds).toEqual([]);
  });

  it("stores blank optional text as no text at all", () => {
    expect(created({ concept: "   ", note: "  " }).concept).toBeNull();
    expect(created({ concept: "   ", note: "  " }).note).toBeNull();
  });

  it("keeps the accents and the line breaks of the note", () => {
    const transaction = created({
      concept: "  Café con Ana  ",
      note: "Primera línea\nSegunda línea",
    });

    expect(transaction.concept).toBe("Café con Ana");
    expect(transaction.note).toBe("Primera línea\nSegunda línea");
  });

  it("copies the tag list instead of sharing the caller array", () => {
    const tagIds = ["tag-casa"];
    const transaction = created({ tagIds });

    tagIds.push("tag-ocio");

    expect(transaction.tagIds).toEqual(["tag-casa"]);
  });
});

describe("createTransaction amount limits", () => {
  it.each([MIN_TRANSACTION_MINOR, 1, 123456, MAX_TRANSACTION_MINOR])(
    "accepts the amount of %i minor units",
    (amountMinor) => {
      expect(created({ amountMinor }).amountMinor).toBe(amountMinor);
    },
  );

  it.each([
    0,
    -1,
    MAX_TRANSACTION_MINOR + 1,
    0.5,
    Number.NaN,
    Number.POSITIVE_INFINITY,
  ])("rejects the amount %p", (amountMinor) => {
    expect(errorsOf({ amountMinor })).toEqual([
      { field: "amountMinor", code: "invalidAmount" },
    ]);
  });
});

describe("createTransaction category compatibility", () => {
  it("accepts a category of the same type", () => {
    expect(
      created({ type: "income", category: INCOME_CATEGORY }).categoryId,
    ).toBe(INCOME_CATEGORY.id);
  });

  it.each([
    ["expense", INCOME_CATEGORY],
    ["income", EXPENSE_CATEGORY],
  ])(
    "rejects the %s classified with an incompatible category",
    (type, category) => {
      expect(errorsOf({ type, category })).toEqual([
        { field: "categoryId", code: "incompatibleCategoryType" },
      ]);
    },
  );

  it("reports the invalid type instead of the compatibility when the type is unknown", () => {
    expect(errorsOf({ type: "gasto" })).toEqual([
      { field: "type", code: "invalidTransactionType" },
    ]);
  });
});

describe("createTransaction date", () => {
  it.each(["2026-09-06", "2024-02-29", "2026-12-31"])(
    "accepts the real calendar date %s",
    (date) => {
      expect(created({ date }).date).toBe(date);
    },
  );

  it.each(["2026-02-30", "2023-02-29", "2026-13-01", "06/09/2026", ""])(
    "rejects the date %p",
    (date) => {
      expect(errorsOf({ date })).toEqual([
        { field: "date", code: "invalidDate" },
      ]);
    },
  );
});

describe("createTransaction text boundaries", () => {
  it("accepts a concept and a note exactly at their maximum length", () => {
    const concept = "c".repeat(MAX_CONCEPT_LENGTH);
    const note = "n".repeat(MAX_NOTE_LENGTH);

    expect(created({ concept, note }).concept).toBe(concept);
    expect(created({ concept, note }).note).toBe(note);
  });

  it("rejects a concept one character beyond its maximum", () => {
    expect(errorsOf({ concept: "c".repeat(MAX_CONCEPT_LENGTH + 1) })).toEqual([
      { field: "concept", code: "tooLong" },
    ]);
  });

  it("rejects a note one character beyond its maximum", () => {
    expect(errorsOf({ note: "n".repeat(MAX_NOTE_LENGTH + 1) })).toEqual([
      { field: "note", code: "tooLong" },
    ]);
  });

  it("measures the concept in characters, not in UTF-16 units", () => {
    const concept = "\u{1F381}".repeat(MAX_CONCEPT_LENGTH);

    expect(concept.length).toBe(MAX_CONCEPT_LENGTH * 2);
    expect(created({ concept }).concept).toBe(concept);
  });

  it.each([
    ["cafe\u0301", "an accented letter written decomposed"],
    ["\u{1F1EA}\u{1F1F8}", "a flag"],
    [
      "\u{1F468}\u200D\u{1F469}\u200D\u{1F467}\u200D\u{1F466}",
      "a family sequence",
    ],
  ])(
    "counts the visible characters of a concept made of %p, each one %s",
    (character) => {
      const visibleCharacters = [
        ...new Intl.Segmenter("es", { granularity: "grapheme" }).segment(
          character,
        ),
      ].length;
      const repetitions = MAX_CONCEPT_LENGTH / visibleCharacters;

      expect(
        created({ concept: character.repeat(repetitions) }).concept,
      ).not.toBeNull();
      expect(errorsOf({ concept: character.repeat(repetitions + 1) })).toEqual([
        { field: "concept", code: "tooLong" },
      ]);
    },
  );

  it("counts the visible characters of a note at its boundary", () => {
    const flag = "\u{1F1EA}\u{1F1F8}";

    expect(created({ note: flag.repeat(MAX_NOTE_LENGTH) }).note).not.toBeNull();
    expect(errorsOf({ note: flag.repeat(MAX_NOTE_LENGTH + 1) })).toEqual([
      { field: "note", code: "tooLong" },
    ]);
  });

  it("rejects line breaks in the concept and accepts them in the note", () => {
    expect(errorsOf({ concept: "Primera\nSegunda" })).toEqual([
      { field: "concept", code: "invalidCharacter" },
    ]);
    expect(created({ note: "Primera\nSegunda" }).note).toBe("Primera\nSegunda");
  });

  it.each([
    ["Compra\u0000", "a control character at the end"],
    ["\u0007Compra", "a control character at the start"],
    ["Com\u001Fpra", "a control character in the middle"],
    ["\tCompra", "a leading tab"],
    ["Compra\t", "a trailing tab"],
    ["Com\tpra", "an internal tab"],
    ["\nCompra", "a leading line break"],
    ["Compra\n", "a trailing line break"],
    ["\r\nCompra\r\n", "line breaks at both extremes"],
  ])("rejects the concept %p because of %s", (concept) => {
    expect(errorsOf({ concept })).toEqual([
      { field: "concept", code: "invalidCharacter" },
    ]);
  });

  it.each([
    ["Nota\u0007", "a control character at the end"],
    ["\u0000Nota", "a control character at the start"],
    ["No\u001Fta", "a control character in the middle"],
    ["\tNota", "a leading tab"],
    ["Nota\t", "a trailing tab"],
    ["No\tta", "an internal tab"],
  ])("rejects the note %p because of %s", (note) => {
    expect(errorsOf({ note })).toEqual([
      { field: "note", code: "invalidCharacter" },
    ]);
  });

  it.each([
    ["\nNota", "Nota"],
    ["Nota\n", "Nota"],
    ["\r\n  Primera\nSegunda  \r\n", "Primera\nSegunda"],
  ])(
    "accepts the note %p and trims its permitted line breaks",
    (note, expected) => {
      expect(created({ note }).note).toBe(expected);
    },
  );

  it("stores a note made only of line breaks as no note at all", () => {
    expect(created({ note: "\n\r\n" }).note).toBeNull();
  });

  it("still trims the printable extremes of an accepted concept", () => {
    expect(created({ concept: "   Compra semanal   " }).concept).toBe(
      "Compra semanal",
    );
  });
});

describe("createTransaction tags", () => {
  it("accepts the maximum number of tags", () => {
    const tagIds = Array.from(
      { length: MAX_TAGS_PER_TRANSACTION },
      (_, index) => `tag-${index}`,
    );

    expect(created({ tagIds }).tagIds).toHaveLength(MAX_TAGS_PER_TRANSACTION);
  });

  it("rejects one tag beyond the maximum", () => {
    const tagIds = Array.from(
      { length: MAX_TAGS_PER_TRANSACTION + 1 },
      (_, index) => `tag-${index}`,
    );

    expect(errorsOf({ tagIds })).toEqual([
      { field: "tagIds", code: "tooManyTags" },
    ]);
  });

  it("rejects a repeated tag instead of silently keeping one copy", () => {
    expect(errorsOf({ tagIds: ["tag-casa", "tag-casa"] })).toEqual([
      { field: "tagIds", code: "duplicateTag" },
    ]);
  });

  it("rejects a repeated tag in a longer selection", () => {
    expect(
      errorsOf({ tagIds: ["tag-casa", "tag-ocio", "tag-casa", "tag-viaje"] }),
    ).toEqual([{ field: "tagIds", code: "duplicateTag" }]);
  });

  it("rejects an invalid tag identifier", () => {
    expect(errorsOf({ tagIds: ["tag casa"] })).toEqual([
      { field: "tagIds", code: "invalidIdentifier" },
    ]);
  });
});

describe("createTransaction technical timestamps", () => {
  it("accepts the epoch as a technical mark", () => {
    expect(created({ createdAt: 0, updatedAt: 0 }).createdAt).toBe(0);
  });

  it.each([-1, 0.5, Number.NaN])(
    "rejects %p as a creation mark",
    (createdAt) => {
      expect(errorsOf({ createdAt })).toEqual([
        { field: "createdAt", code: "invalidTimestamp" },
      ]);
    },
  );

  it("rejects an inexact update mark", () => {
    expect(errorsOf({ updatedAt: 2 ** 53 })).toEqual([
      { field: "updatedAt", code: "invalidTimestamp" },
    ]);
  });
});

describe("createTransaction error reporting", () => {
  it("reports every rejected field at once", () => {
    expect(
      errorsOf({
        id: "",
        type: "gasto",
        amountMinor: 0,
        date: "2026-02-30",
        concept: "c".repeat(MAX_CONCEPT_LENGTH + 1),
        note: "n".repeat(MAX_NOTE_LENGTH + 1),
        tagIds: ["tag-casa", "tag-casa"],
        createdAt: -1,
        updatedAt: -1,
      }),
    ).toEqual([
      { field: "id", code: "invalidIdentifier" },
      { field: "type", code: "invalidTransactionType" },
      { field: "amountMinor", code: "invalidAmount" },
      { field: "date", code: "invalidDate" },
      { field: "concept", code: "tooLong" },
      { field: "note", code: "tooLong" },
      { field: "tagIds", code: "duplicateTag" },
      { field: "createdAt", code: "invalidTimestamp" },
      { field: "updatedAt", code: "invalidTimestamp" },
    ]);
  });
});
