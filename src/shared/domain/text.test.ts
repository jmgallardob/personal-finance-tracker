import { describe, expect, it } from "vitest";

import {
  areNamesEquivalent,
  characterLength,
  containsControlCharacters,
  isIdentifier,
  nameKey,
  normalizeFreeText,
  normalizeName,
} from "./text";

/** "cafe" written with a combining acute accent instead of the letter "e". */
const DECOMPOSED_CAFE = "cafe\u0301";

/** Non-printable characters that must never reach a stored field. */
const CONTROL_SAMPLES = ["a\u0000b", "a\u0007b", "a\u001Fb", "a\u007Fb"];

describe("normalizeName", () => {
  it.each([
    ["  Vacaciones  ", "Vacaciones"],
    ["con   amigos", "con amigos"],
    ["  Comida a  domicilio ", "Comida a domicilio"],
    ["Café", "Café"],
    ["   ", ""],
    ["", ""],
  ])("normalizes %p into %p", (raw, expected) => {
    expect(normalizeName(raw)).toBe(expected);
  });

  it("normalizes to Unicode NFC without losing the accent", () => {
    expect(DECOMPOSED_CAFE).not.toBe("café");
    expect(normalizeName(DECOMPOSED_CAFE)).toBe("café");
    expect(characterLength(normalizeName(DECOMPOSED_CAFE))).toBe(4);
  });

  it.each(["\tCasa", "Ca\tsa", "Casa\t", "\nCasa", "Casa\r", "Casa\u0000"])(
    "keeps the control characters of %p instead of collapsing or trimming them",
    (raw) => {
      expect(normalizeName(raw)).toBe(raw.normalize("NFC"));
      expect(containsControlCharacters(normalizeName(raw), false)).toBe(true);
    },
  );

  it("collapses only the printable whitespace around a control character", () => {
    expect(normalizeName("  Casa   de\tcampo  ")).toBe("Casa de\tcampo");
  });

  it("keeps the case the owner typed", () => {
    expect(normalizeName("Navidad")).toBe("Navidad");
    expect(normalizeName("MADRID")).toBe("MADRID");
  });
});

describe("nameKey and areNamesEquivalent", () => {
  it("treats names that only differ in case as the same name", () => {
    expect(nameKey("Café")).toBe("café");
    expect(areNamesEquivalent("Café", "café")).toBe(true);
    expect(areNamesEquivalent("  CAFÉ ", "café")).toBe(true);
  });

  it("treats an accented name as different from its unaccented form", () => {
    expect(areNamesEquivalent("cafe", "café")).toBe(false);
    expect(nameKey("cafe")).not.toBe(nameKey("café"));
  });

  it("compares the normalized form, not the raw text", () => {
    expect(areNamesEquivalent("con   amigos", "Con amigos")).toBe(true);
    expect(areNamesEquivalent(DECOMPOSED_CAFE, "Café")).toBe(true);
    expect(areNamesEquivalent("viajes", "viaje")).toBe(false);
  });
});

describe("normalizeFreeText", () => {
  it.each([true, false])(
    "trims the printable extremes and keeps accents and internal spacing (line breaks allowed: %s)",
    (allowLineBreaks) => {
      expect(normalizeFreeText("  Cena con  Ana  ", allowLineBreaks)).toBe(
        "Cena con  Ana",
      );
      expect(normalizeFreeText(DECOMPOSED_CAFE, allowLineBreaks)).toBe("café");
      expect(normalizeFreeText("   ", allowLineBreaks)).toBe("");
    },
  );

  it("keeps the line breaks a note may contain", () => {
    expect(normalizeFreeText("primera\nsegunda", true)).toBe(
      "primera\nsegunda",
    );
  });

  it("trims the line breaks a note may contain only at its extremes", () => {
    expect(normalizeFreeText("\n\n  Nota  \r\n", true)).toBe("Nota");
    expect(normalizeFreeText("\n\n", true)).toBe("");
  });

  it("keeps the line breaks of a text that does not accept them, so they are rejected", () => {
    expect(normalizeFreeText("\nConcepto\n", false)).toBe("\nConcepto\n");
    expect(normalizeFreeText("\n", false)).toBe("\n");
  });

  it.each(CONTROL_SAMPLES)(
    "keeps the forbidden control characters of %p wherever they appear",
    (text) => {
      expect(normalizeFreeText(text, true)).toBe(text);
      expect(normalizeFreeText(text, false)).toBe(text);
    },
  );

  it("keeps a forbidden control character at a trimmed extreme", () => {
    expect(normalizeFreeText("\tNota", true)).toBe("\tNota");
    expect(normalizeFreeText("Nota\u0000", true)).toBe("Nota\u0000");
    expect(normalizeFreeText("  \u0007  ", true)).toBe("\u0007");
  });
});

describe("characterLength", () => {
  it("counts the characters a person sees, not the UTF-16 units", () => {
    expect(characterLength("café")).toBe(4);
    expect(characterLength("\u{1F381}")).toBe(1);
    expect("\u{1F381}".length).toBe(2);
    expect(characterLength("")).toBe(0);
  });

  it("counts an accented letter as one character, composed or decomposed", () => {
    expect(characterLength(DECOMPOSED_CAFE)).toBe(4);
    expect(characterLength("café")).toBe(4);
    expect([...DECOMPOSED_CAFE].length).toBe(5);
  });

  it("counts a combining mark with no composed form as one character", () => {
    const decomposedOnly = "x\u0301";

    expect(characterLength(decomposedOnly)).toBe(1);
    expect([...decomposedOnly.normalize("NFC")].length).toBe(2);
  });

  it.each([
    ["\u{1F44D}\u{1F3FD}", 2, "a skin-tone emoji"],
    ["\u{1F1EA}\u{1F1F8}", 2, "a flag"],
    [
      "\u{1F468}\u200D\u{1F469}\u200D\u{1F467}\u200D\u{1F466}",
      7,
      "a family sequence",
    ],
  ])(
    "counts %p as one character even though %i code points build %s",
    (text, codePoints) => {
      expect(characterLength(text)).toBe(1);
      expect([...text].length).toBe(codePoints);
    },
  );

  it("counts a sequence of visible characters one by one", () => {
    expect(characterLength("Cañón \u{1F1EA}\u{1F1F8}")).toBe(7);
  });
});

describe("containsControlCharacters", () => {
  it.each([...CONTROL_SAMPLES, "a\nb", "a\rb"])(
    "rejects %p when line breaks are not allowed",
    (text) => {
      expect(containsControlCharacters(text, false)).toBe(true);
    },
  );

  it.each(CONTROL_SAMPLES)(
    "rejects %p even when line breaks are allowed",
    (text) => {
      expect(containsControlCharacters(text, true)).toBe(true);
    },
  );

  it("accepts line breaks only where they are allowed", () => {
    expect(containsControlCharacters("primera\nsegunda", true)).toBe(false);
    expect(containsControlCharacters("primera\r\nsegunda", true)).toBe(false);
    expect(containsControlCharacters("primera\nsegunda", false)).toBe(true);
  });

  it.each(["Café con leche", "\u{1F381} regalo", "acentós y ñ", ""])(
    "accepts the printable text %p",
    (text) => {
      expect(containsControlCharacters(text, false)).toBe(false);
      expect(containsControlCharacters(text, true)).toBe(false);
    },
  );
});

describe("isIdentifier", () => {
  it.each([
    "0193f0a1-6f3d-7c62-9a24-8f5b0e1c2d34",
    "V1StGXR8_Z5jdHi6B-myT",
    "a",
    "A".repeat(64),
  ])("accepts the identifier %p", (value) => {
    expect(isIdentifier(value)).toBe(true);
  });

  it.each(["", " ", "with space", "with/slash", "acentúa", "A".repeat(65)])(
    "rejects the identifier %p",
    (value) => {
      expect(isIdentifier(value)).toBe(false);
    },
  );
});
