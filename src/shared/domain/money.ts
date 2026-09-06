/**
 * Monetary domain rules.
 *
 * Amounts are exact integers of EUR minor units (cents). Text entered with the
 * Spanish convention is converted digit by digit: this module never uses
 * `parseFloat`, never rounds silently, and never accumulates cents as
 * floating-point values.
 */

declare const moneyMinorBrand: unique symbol;

/** Exact amount expressed in EUR minor units (cents). */
export type MoneyMinor = number & { readonly [moneyMinorBrand]: true };

/** Smallest amount accepted for a single transaction: 0,01 €. */
export const MIN_TRANSACTION_MINOR = 1;

/** Largest amount accepted for a single transaction: 999.999.999,99 €. */
export const MAX_TRANSACTION_MINOR = 99999999999;

/** Number of digits of {@link MAX_TRANSACTION_MINOR}. */
const MAX_TRANSACTION_MINOR_DIGITS = 11;

/** Reason why a monetary value was rejected. */
export type MoneyErrorCode =
  | "invalidFormat"
  | "belowMinimum"
  | "aboveMaximum"
  | "notSafeInteger"
  | "overflow";

/** Outcome of a monetary operation that can fail with a controlled error. */
export type MoneyResult<TValue> =
  | { readonly ok: true; readonly value: TValue }
  | { readonly ok: false; readonly error: MoneyErrorCode };

/**
 * Spanish amount text: either plain digits or complete thousand groups, with an
 * optional decimal comma followed by one or two digits.
 */
const SPANISH_AMOUNT_PATTERN = /^(\d{1,3}(?:\.\d{3})+|\d+)(?:,(\d{1,2}))?$/;

function ok<TValue>(value: TValue): MoneyResult<TValue> {
  return { ok: true, value };
}

function failed<TValue>(error: MoneyErrorCode): MoneyResult<TValue> {
  return { ok: false, error };
}

/** Tells whether a number can represent an exact amount of minor units. */
export function isMoneyMinor(value: number): value is MoneyMinor {
  return Number.isSafeInteger(value);
}

/** Converts a number into {@link MoneyMinor}, rejecting inexact values. */
export function toMoneyMinor(value: number): MoneyResult<MoneyMinor> {
  if (!isMoneyMinor(value)) {
    return failed("notSafeInteger");
  }

  return ok(value);
}

/**
 * Converts Spanish amount text into minor units.
 *
 * Accepts surrounding whitespace, the decimal comma and complete thousand
 * groups. Rejects ambiguous separators, signs, currency symbols, internal
 * spaces, more than two decimals, zero and amounts outside the accepted
 * transaction limits.
 */
export function parseTransactionAmountText(
  text: string,
): MoneyResult<MoneyMinor> {
  const matched = SPANISH_AMOUNT_PATTERN.exec(text.trim());

  if (matched === null) {
    return failed("invalidFormat");
  }

  const [, integerPart, decimalPart = ""] = matched;
  const minorDigits = `${integerPart.replaceAll(".", "")}${decimalPart.padEnd(2, "0")}`;
  const significantDigits = minorDigits.replace(/^0+/, "");

  if (significantDigits.length > MAX_TRANSACTION_MINOR_DIGITS) {
    return failed("aboveMaximum");
  }

  const minor = Number(significantDigits === "" ? "0" : significantDigits);

  if (minor < MIN_TRANSACTION_MINOR) {
    return failed("belowMinimum");
  }

  return ok(minor as MoneyMinor);
}

/** Adds two amounts, reporting overflow instead of an imprecise total. */
export function addMoneyMinor(
  augend: MoneyMinor,
  addend: MoneyMinor,
): MoneyResult<MoneyMinor> {
  const total = augend + addend;

  if (!isMoneyMinor(total)) {
    return failed("overflow");
  }

  return ok(total);
}

/** Subtracts two amounts, reporting overflow instead of an imprecise result. */
export function subtractMoneyMinor(
  minuend: MoneyMinor,
  subtrahend: MoneyMinor,
): MoneyResult<MoneyMinor> {
  const difference = minuend - subtrahend;

  if (!isMoneyMinor(difference)) {
    return failed("overflow");
  }

  return ok(difference);
}

/**
 * Converts minor units into the major-unit number used only for presentation.
 *
 * The quotient of an exact safe integer by 100 stays far from any half-cent
 * boundary, so formatting it with two fraction digits reproduces the exact
 * amount. No calculation uses this value.
 */
function toMajorUnits(minor: MoneyMinor): number {
  return minor / 100;
}

const eurFormatter = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const amountTextFormatter = new Intl.NumberFormat("es-ES", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Formats an amount as Spanish EUR currency copy, for example `1.234,56 €`. */
export function formatMoneyMinorAsEur(minor: MoneyMinor): string {
  return eurFormatter.format(toMajorUnits(minor));
}

/**
 * Formats an amount as Spanish amount text without the currency symbol, in the
 * same shape accepted by {@link parseTransactionAmountText}.
 */
export function formatMoneyMinorAsAmountText(minor: MoneyMinor): string {
  return amountTextFormatter.format(toMajorUnits(minor));
}
