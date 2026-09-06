/**
 * Category contract.
 *
 * A category classifies transactions of a single type. Its type is fixed when
 * it is created and no mutation of the MVP changes it. A category with history
 * is archived instead of deleted, which keeps its past associations readable.
 */

import {
  type TransactionType,
  isTransactionType,
} from "../../transactions/domain/transaction-type";
import {
  type DomainError,
  type DomainResult,
  domainError,
  invalid,
  valid,
} from "../../../shared/domain/errors";
import {
  characterLength,
  containsControlCharacters,
  isIdentifier,
  nameKey,
  normalizeName,
} from "../../../shared/domain/text";
import { type Timestamp, isTimestamp } from "../../../shared/domain/timestamp";

declare const categoryIdBrand: unique symbol;

/** Identifier of a category. */
export type CategoryId = string & { readonly [categoryIdBrand]: true };

/** Longest accepted category name, in characters. */
export const MAX_CATEGORY_NAME_LENGTH = 80;

/** Category as the domain knows it. */
export interface Category {
  readonly id: CategoryId;
  /** Written form shown to the owner, with its accents and case preserved. */
  readonly name: string;
  /** Lowercase comparison key used for uniqueness within type. */
  readonly normalizedName: string;
  readonly type: TransactionType;
  readonly sortOrder: number;
  readonly archivedAt: Timestamp | null;
}

/** Raw values a category is built from. */
export interface CategoryInput {
  readonly id: string;
  readonly name: string;
  readonly type: string;
  readonly sortOrder: number;
  readonly archivedAt: number | null;
}

/** Builds a category, collecting every rejected field. */
export function createCategory(input: CategoryInput): DomainResult<Category> {
  const errors: DomainError[] = [];
  const name = normalizeName(input.name);

  if (!isIdentifier(input.id)) {
    errors.push(domainError("id", "invalidIdentifier"));
  }

  if (name === "") {
    errors.push(domainError("name", "required"));
  } else if (characterLength(name) > MAX_CATEGORY_NAME_LENGTH) {
    errors.push(domainError("name", "tooLong"));
  } else if (containsControlCharacters(name, false)) {
    errors.push(domainError("name", "invalidCharacter"));
  }

  if (!isTransactionType(input.type)) {
    errors.push(domainError("type", "invalidTransactionType"));
  }

  if (!Number.isSafeInteger(input.sortOrder) || input.sortOrder < 0) {
    errors.push(domainError("sortOrder", "invalidSortOrder"));
  }

  if (input.archivedAt !== null && !isTimestamp(input.archivedAt)) {
    errors.push(domainError("archivedAt", "invalidTimestamp"));
  }

  if (errors.length > 0) {
    return invalid(errors);
  }

  return valid({
    id: input.id as CategoryId,
    name,
    normalizedName: nameKey(name),
    type: input.type as TransactionType,
    sortOrder: input.sortOrder,
    archivedAt: input.archivedAt as Timestamp | null,
  });
}

/** Tells whether a category can still be assigned to new transactions. */
export function isCategoryActive(category: Category): boolean {
  return category.archivedAt === null;
}

/**
 * Tells whether two categories collide for uniqueness: same normalized name
 * within the same type.
 */
export function areCategoriesEquivalent(
  left: Category,
  right: Category,
): boolean {
  return (
    left.type === right.type && left.normalizedName === right.normalizedName
  );
}
