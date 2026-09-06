/**
 * Tag contract.
 *
 * Tags add context across categories. Their names are unique without
 * distinguishing case, keep their accents, and an archived tag stays readable
 * in history while it can no longer be assigned to new transactions.
 */

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

declare const tagIdBrand: unique symbol;

/** Identifier of a tag. */
export type TagId = string & { readonly [tagIdBrand]: true };

/** Longest accepted tag name, in characters. */
export const MAX_TAG_NAME_LENGTH = 80;

/** Tag as the domain knows it. */
export interface Tag {
  readonly id: TagId;
  /** Written form shown to the owner, with its accents and case preserved. */
  readonly name: string;
  /** Lowercase comparison key used for global uniqueness. */
  readonly normalizedName: string;
  readonly archivedAt: Timestamp | null;
}

/** Raw values a tag is built from. */
export interface TagInput {
  readonly id: string;
  readonly name: string;
  readonly archivedAt: number | null;
}

/** Builds a tag, collecting every rejected field. */
export function createTag(input: TagInput): DomainResult<Tag> {
  const errors: DomainError[] = [];
  const name = normalizeName(input.name);

  if (!isIdentifier(input.id)) {
    errors.push(domainError("id", "invalidIdentifier"));
  }

  if (name === "") {
    errors.push(domainError("name", "required"));
  } else if (characterLength(name) > MAX_TAG_NAME_LENGTH) {
    errors.push(domainError("name", "tooLong"));
  } else if (containsControlCharacters(name, false)) {
    errors.push(domainError("name", "invalidCharacter"));
  }

  if (input.archivedAt !== null && !isTimestamp(input.archivedAt)) {
    errors.push(domainError("archivedAt", "invalidTimestamp"));
  }

  if (errors.length > 0) {
    return invalid(errors);
  }

  return valid({
    id: input.id as TagId,
    name,
    normalizedName: nameKey(name),
    archivedAt: input.archivedAt as Timestamp | null,
  });
}

/** Tells whether a tag can still be assigned to new transactions. */
export function isTagActive(tag: Tag): boolean {
  return tag.archivedAt === null;
}

/** Tells whether two tags collide for uniqueness. */
export function areTagsEquivalent(left: Tag, right: Tag): boolean {
  return left.normalizedName === right.normalizedName;
}
