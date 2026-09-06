/**
 * Transaction contract.
 *
 * A transaction is a pure domain object: exact minor units, a civil date, one
 * compatible category, optional text and a set of tags without repetitions. It
 * carries no persistence or form concern, and its technical timestamps are Unix
 * milliseconds that never replace its civil date.
 */

import type {
  Category,
  CategoryId,
} from "../../classification/domain/category";
import type { TagId } from "../../classification/domain/tag";
import { type TransactionType, isTransactionType } from "./transaction-type";
import { type LocalDate, parseLocalDate } from "../../../shared/domain/dates";
import {
  type DomainError,
  type DomainResult,
  domainError,
  invalid,
  valid,
} from "../../../shared/domain/errors";
import {
  MAX_TRANSACTION_MINOR,
  MIN_TRANSACTION_MINOR,
  type MoneyMinor,
} from "../../../shared/domain/money";
import {
  characterLength,
  containsControlCharacters,
  isIdentifier,
  normalizeFreeText,
} from "../../../shared/domain/text";
import { type Timestamp, isTimestamp } from "../../../shared/domain/timestamp";

declare const transactionIdBrand: unique symbol;

/** Identifier of a transaction. */
export type TransactionId = string & { readonly [transactionIdBrand]: true };

/** Longest accepted concept, in characters. */
export const MAX_CONCEPT_LENGTH = 200;

/** Longest accepted note, in characters. */
export const MAX_NOTE_LENGTH = 2000;

/** Largest number of tags a single transaction accepts. */
export const MAX_TAGS_PER_TRANSACTION = 20;

/** Transaction as the domain knows it. */
export interface Transaction {
  readonly id: TransactionId;
  readonly type: TransactionType;
  readonly amountMinor: MoneyMinor;
  readonly date: LocalDate;
  readonly categoryId: CategoryId;
  readonly concept: string | null;
  readonly note: string | null;
  /** Set of tags, without repetitions. */
  readonly tagIds: readonly TagId[];
  readonly createdAt: Timestamp;
  readonly updatedAt: Timestamp;
}

/** Raw values a transaction is built from. */
export interface TransactionInput {
  readonly id: string;
  readonly type: string;
  readonly amountMinor: number;
  readonly date: string;
  readonly category: Category;
  readonly concept: string | null;
  readonly note: string | null;
  readonly tagIds: readonly string[];
  readonly createdAt: number;
  readonly updatedAt: number;
}

interface OptionalTextRules {
  readonly field: string;
  readonly maxLength: number;
  readonly allowLineBreaks: boolean;
}

/**
 * Validates optional free text. Empty text becomes `null`, accents survive
 * untouched and only the note accepts line breaks.
 */
function normalizeOptionalText(
  raw: string | null,
  rules: OptionalTextRules,
  errors: DomainError[],
): string | null {
  if (raw === null) {
    return null;
  }

  const text = normalizeFreeText(raw, rules.allowLineBreaks);

  if (text === "") {
    return null;
  }

  if (characterLength(text) > rules.maxLength) {
    errors.push(domainError(rules.field, "tooLong"));
    return null;
  }

  if (containsControlCharacters(text, rules.allowLineBreaks)) {
    errors.push(domainError(rules.field, "invalidCharacter"));
    return null;
  }

  return text;
}

function validateTagIds(
  tagIds: readonly string[],
  errors: DomainError[],
): void {
  if (tagIds.length > MAX_TAGS_PER_TRANSACTION) {
    errors.push(domainError("tagIds", "tooManyTags"));
  }

  if (tagIds.some((tagId) => !isIdentifier(tagId))) {
    errors.push(domainError("tagIds", "invalidIdentifier"));
  }

  if (new Set(tagIds).size !== tagIds.length) {
    errors.push(domainError("tagIds", "duplicateTag"));
  }
}

/** Builds a transaction, collecting every rejected field. */
export function createTransaction(
  input: TransactionInput,
): DomainResult<Transaction> {
  const errors: DomainError[] = [];

  if (!isIdentifier(input.id)) {
    errors.push(domainError("id", "invalidIdentifier"));
  }

  if (!isTransactionType(input.type)) {
    errors.push(domainError("type", "invalidTransactionType"));
  } else if (input.type !== input.category.type) {
    errors.push(domainError("categoryId", "incompatibleCategoryType"));
  }

  if (
    !Number.isSafeInteger(input.amountMinor) ||
    input.amountMinor < MIN_TRANSACTION_MINOR ||
    input.amountMinor > MAX_TRANSACTION_MINOR
  ) {
    errors.push(domainError("amountMinor", "invalidAmount"));
  }

  const date = parseLocalDate(input.date);

  if (!date.ok) {
    errors.push(domainError("date", "invalidDate"));
  }

  const concept = normalizeOptionalText(
    input.concept,
    {
      field: "concept",
      maxLength: MAX_CONCEPT_LENGTH,
      allowLineBreaks: false,
    },
    errors,
  );
  const note = normalizeOptionalText(
    input.note,
    { field: "note", maxLength: MAX_NOTE_LENGTH, allowLineBreaks: true },
    errors,
  );

  validateTagIds(input.tagIds, errors);

  if (!isTimestamp(input.createdAt)) {
    errors.push(domainError("createdAt", "invalidTimestamp"));
  }

  if (!isTimestamp(input.updatedAt)) {
    errors.push(domainError("updatedAt", "invalidTimestamp"));
  }

  if (errors.length > 0) {
    return invalid(errors);
  }

  return valid({
    id: input.id as TransactionId,
    type: input.type as TransactionType,
    amountMinor: input.amountMinor as MoneyMinor,
    date: input.date as LocalDate,
    categoryId: input.category.id,
    concept,
    note,
    tagIds: [...input.tagIds] as TagId[],
    createdAt: input.createdAt as Timestamp,
    updatedAt: input.updatedAt as Timestamp,
  });
}
