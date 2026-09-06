/**
 * Accepted text rules.
 *
 * Names are trimmed, normalized to Unicode NFC and their internal whitespace
 * runs collapse into a single space. Uniqueness compares the lowercase form of
 * that name and keeps the diacritics, so `Café` and `café` are the same name
 * while `cafe` and `café` are different ones. Concept and note keep their
 * accents exactly as written; non-printable control characters are rejected
 * everywhere and only the note accepts line breaks.
 */

const CONTROL_CHARACTERS = /[\p{Cc}]/u;
const CONTROL_CHARACTERS_EXCEPT_LINE_BREAKS = /[^\P{Cc}\n\r]/u;
const IDENTIFIER_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;
const WHITESPACE_RUN = /\s+/gu;

/**
 * Normalized written form of a name: trimmed, NFC and with single internal
 * spaces. The case and the diacritics the user typed are preserved.
 */
export function normalizeName(raw: string): string {
  return raw.normalize("NFC").replace(WHITESPACE_RUN, " ").trim();
}

/**
 * Comparison key of a normalized name. Uniqueness and equivalence use it, so
 * they ignore the case but never the accents.
 */
export function nameKey(name: string): string {
  return normalizeName(name).toLowerCase();
}

/** Tells whether two names are the same for uniqueness purposes. */
export function areNamesEquivalent(left: string, right: string): boolean {
  return nameKey(left) === nameKey(right);
}

/** Free text as it is stored: NFC and trimmed, with its accents untouched. */
export function normalizeFreeText(raw: string): string {
  return raw.normalize("NFC").trim();
}

/**
 * Length in Unicode code points, so an accented letter or an emoji counts as
 * the single character a person sees.
 */
export function characterLength(text: string): number {
  return [...text].length;
}

/** Tells whether the text contains non-printable control characters. */
export function containsControlCharacters(
  text: string,
  allowLineBreaks: boolean,
): boolean {
  if (allowLineBreaks) {
    return CONTROL_CHARACTERS_EXCEPT_LINE_BREAKS.test(text);
  }

  return CONTROL_CHARACTERS.test(text);
}

/** Tells whether a value is a valid URL-safe identifier, such as a UUID. */
export function isIdentifier(value: string): boolean {
  return IDENTIFIER_PATTERN.test(value);
}
