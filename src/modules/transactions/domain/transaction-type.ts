/**
 * Type of a transaction.
 *
 * The type decides whether an amount counts as income or as expense; the amount
 * itself is always positive and never carries a manual sign. The type of a
 * category is fixed when it is created and no mutation of the MVP changes it.
 */

/** Accepted transaction types. */
export const TRANSACTION_TYPES = ["expense", "income"] as const;

/** Type of a transaction and of the category that classifies it. */
export type TransactionType = (typeof TRANSACTION_TYPES)[number];

/** Tells whether a value is one of the two accepted types. */
export function isTransactionType(value: string): value is TransactionType {
  return TRANSACTION_TYPES.includes(value as TransactionType);
}
