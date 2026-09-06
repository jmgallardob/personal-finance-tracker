/**
 * Technical timestamps.
 *
 * A timestamp records when a row was written, in Unix milliseconds. It is a
 * technical mark and never replaces the civil date of a transaction, which
 * stays a `LocalDate`.
 */

import { type DomainResult, domainError, invalid, valid } from "./errors";

declare const timestampBrand: unique symbol;

/** Instant in Unix milliseconds. */
export type Timestamp = number & { readonly [timestampBrand]: true };

/** Tells whether a number is an exact non-negative Unix millisecond mark. */
export function isTimestamp(value: number): value is Timestamp {
  return Number.isSafeInteger(value) && value >= 0;
}

/** Converts a number into a {@link Timestamp}, rejecting inexact marks. */
export function toTimestamp(
  field: string,
  value: number,
): DomainResult<Timestamp> {
  if (!isTimestamp(value)) {
    return invalid([domainError(field, "invalidTimestamp")]);
  }

  return valid(value);
}
