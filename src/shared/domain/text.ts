/**
 * Accepted text rules.
 *
 * Names are trimmed, normalized to Unicode NFC and their internal whitespace
 * runs collapse into a single space. Uniqueness compares the lowercase form of
 * that name and keeps the diacritics, so `Café` and `café` are the same name
 * while `cafe` and `café` are different ones. Concept and note keep their
 * accents exactly as written; non-printable control characters are rejected
 * everywhere and only the note accepts line breaks.
 *
 * Normalization never trims or collapses a control character, not even a tab or
 * a line break at an extreme: a forbidden character stays in the text so the
 * validation that follows rejects it instead of silently erasing it. Only the
 * note trims the line breaks it is allowed to contain.
 */

const CONTROL_CHARACTERS = /[\p{Cc}]/u;
const CONTROL_CHARACTERS_EXCEPT_LINE_BREAKS = /[^\P{Cc}\n\r]/u;
const IDENTIFIER_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;

/** Whitespace that is not a control character, the only whitespace collapsed. */
const PRINTABLE_WHITESPACE_RUN = /[^\S\p{Cc}]+/gu;

/** Extremes made of printable whitespace, the only extremes a name trims. */
const PRINTABLE_WHITESPACE_EDGES = /^ +| +$/g;

/** Extremes of free text that does not accept line breaks. */
const FREE_TEXT_EDGES = /^[^\S\p{Cc}]+|[^\S\p{Cc}]+$/gu;

/** Extremes of free text that accepts line breaks, which it may also trim. */
const FREE_TEXT_EDGES_WITH_LINE_BREAKS =
  /^(?:[^\S\p{Cc}]|[\n\r])+|(?:[^\S\p{Cc}]|[\n\r])+$/gu;

/**
 * Normalized written form of a name: trimmed, NFC and with single internal
 * spaces. The case and the diacritics the user typed are preserved, and so is
 * every control character, which the caller then rejects.
 */
export function normalizeName(raw: string): string {
  return raw
    .normalize("NFC")
    .replace(PRINTABLE_WHITESPACE_RUN, " ")
    .replace(PRINTABLE_WHITESPACE_EDGES, "");
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

/**
 * Free text as it is stored: NFC and trimmed, with its accents and its internal
 * spacing untouched. A text that accepts line breaks also trims them at its
 * extremes; every other control character survives the normalization so the
 * caller can reject it.
 */
export function normalizeFreeText(
  raw: string,
  allowLineBreaks: boolean,
): string {
  const text = raw.normalize("NFC");

  if (allowLineBreaks) {
    return text.replace(FREE_TEXT_EDGES_WITH_LINE_BREAKS, "");
  }

  return text.replace(FREE_TEXT_EDGES, "");
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
