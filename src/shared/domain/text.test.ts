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
    ["con\tamigos", "con amigos"],
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
  it("trims the extremes and keeps accents and internal spacing", () => {
    expect(normalizeFreeText("  Cena con  Ana  ")).toBe("Cena con  Ana");
    expect(normalizeFreeText(DECOMPOSED_CAFE)).toBe("café");
    expect(normalizeFreeText("   ")).toBe("");
  });

  it("keeps the line breaks a note may contain", () => {
    expect(normalizeFreeText("primera\nsegunda")).toBe("primera\nsegunda");
  });
});

describe("characterLength", () => {
  it("counts the characters a person sees, not the UTF-16 units", () => {
    expect(characterLength("café")).toBe(4);
    expect(characterLength("\u{1F381}")).toBe(1);
    expect("\u{1F381}".length).toBe(2);
    expect(characterLength("")).toBe(0);
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
