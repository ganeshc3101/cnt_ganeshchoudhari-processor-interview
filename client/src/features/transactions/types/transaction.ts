import { z } from 'zod';

export const CARD_TYPES = ['AMEX', 'VISA', 'MASTERCARD', 'DISCOVER'] as const;
export const CardTypeSchema = z.enum(CARD_TYPES);
export type CardType = z.infer<typeof CardTypeSchema>;

export const TRANSACTION_STATUSES = ['ACCEPTED', 'REJECTED'] as const;
export const TransactionStatusSchema = z.enum(TRANSACTION_STATUSES);
export type TransactionStatus = z.infer<typeof TransactionStatusSchema>;

export const TRANSACTION_SOURCES = ['UPLOAD', 'MANUAL', 'SEED'] as const;
export const TransactionSourceSchema = z.enum(TRANSACTION_SOURCES);
export type TransactionSource = z.infer<typeof TransactionSourceSchema>;

export const TransactionSchema = z.object({
  id: z.string().min(1),
  cardholderName: z.string().nullable(),
  /** Digits only; length 13–19 (Luhn not enforced client-side). */
  cardNumber: z.string().regex(/^\d{13,19}$/),
  /** Null when the card number cannot be classified (rejected). */
  cardType: CardTypeSchema.nullable(),
  amountMinor: z.number().int(),
  currency: z.string().length(3),
  occurredAt: z.string().datetime(),
  status: TransactionStatusSchema,
  rejectionReason: z.string().nullable(),
  source: TransactionSourceSchema,
});
export type Transaction = z.infer<typeof TransactionSchema>;

export const CreateTransactionInputSchema = z.object({
  cardholderName: z.string().trim().max(80).optional(),
  cardNumber: z
    .string()
    .trim()
    .transform((v) => v.replace(/\s+/g, ''))
    .pipe(z.string().regex(/^\d{13,19}$/, 'Card number must be 13–19 digits.')),
  /** Optional ISO string — service falls back to "now" when omitted/empty. */
  occurredAt: z.string().optional(),
  /** Major units, decimal string e.g. "12.34". */
  amountMajor: z
    .string()
    .trim()
    .min(1, 'Amount is required.')
    .regex(/^\d+(\.\d{1,2})?$/, 'Amount must be a decimal with up to 2 places.'),
});
export type CreateTransactionInput = z.infer<typeof CreateTransactionInputSchema>;

/**
 * Row schema for the multi-entry manual form. Deliberately non-transforming —
 * the form holds raw user strings; conversion happens in the service layer.
 */
export const ManualEntryRowSchema = z.object({
  cardholderName: z.string().trim().max(80, 'Cardholder name is too long.'),
  cardNumber: z
    .string()
    .trim()
    .min(1, 'Card number is required.')
    .refine(
      (value) => /^\d{13,19}$/.test(value.replace(/\s+/g, '')),
      'Card number must be 13–19 digits.',
    ),
  occurredAt: z.string().trim(),
  amountMajor: z
    .string()
    .trim()
    .min(1, 'Amount is required.')
    .regex(/^\d+(\.\d{1,2})?$/, 'Amount must be a decimal with up to 2 places.'),
});
export type ManualEntryRow = z.infer<typeof ManualEntryRowSchema>;

export const MAX_MANUAL_ENTRIES = 10;

export const ManualEntriesFormSchema = z.object({
  entries: z
    .array(ManualEntryRowSchema)
    .min(1, 'Add at least one transaction.')
    .max(MAX_MANUAL_ENTRIES, `You can add up to ${MAX_MANUAL_ENTRIES} transactions at a time.`),
});
export type ManualEntriesFormValues = z.infer<typeof ManualEntriesFormSchema>;

export const CreateManyResultSchema = z.object({
  accepted: z.number().int().nonnegative(),
  rejected: z.number().int().nonnegative(),
  created: z.array(TransactionSchema),
});
export type CreateManyResult = z.infer<typeof CreateManyResultSchema>;

export const CARD_TYPE_FILTER_VALUES = [...CARD_TYPES, 'REJECTED'] as const;
export type CardTypeFilter = (typeof CARD_TYPE_FILTER_VALUES)[number];

const CARD_TYPE_FILTER_SET = new Set<string>(CARD_TYPE_FILTER_VALUES);

export const CardTypeFiltersSchema = z
  .string()
  .default('')
  .transform((raw): CardTypeFilter[] => {
    if (!raw) return [];
    const unique = new Set<CardTypeFilter>();
    for (const part of raw.split(',')) {
      const token = part.trim().toUpperCase();
      if (CARD_TYPE_FILTER_SET.has(token)) unique.add(token as CardTypeFilter);
    }
    return Array.from(unique);
  });

export const TransactionFiltersSchema = z.object({
  q: z.string().trim().default(''),
  cardTypes: CardTypeFiltersSchema,
  from: z.string().default(''),
  to: z.string().default(''),
  minAmount: z.string().default(''),
  maxAmount: z.string().default(''),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(5).max(100).default(10),
});
export type TransactionFilters = z.infer<typeof TransactionFiltersSchema>;

export const TransactionListResponseSchema = z.object({
  items: z.array(TransactionSchema),
  total: z.number().int().nonnegative(),
  page: z.number().int().min(1),
  pageSize: z.number().int().min(1),
});
export type TransactionListResponse = z.infer<typeof TransactionListResponseSchema>;

export const TransactionSummarySchema = z.object({
  totalCount: z.number().int().nonnegative(),
  acceptedCount: z.number().int().nonnegative(),
  rejectedCount: z.number().int().nonnegative(),
  totalVolumeMinor: z.number().int().nonnegative(),
  averageVolumeMinor: z.number().int().nonnegative(),
  currency: z.string().length(3),
  byDay: z.array(
    z.object({
      date: z.string(),
      count: z.number().int().nonnegative(),
      volumeMinor: z.number().int().nonnegative(),
    }),
  ),
  byCardType: z.array(
    z.object({
      cardType: z.enum([...CARD_TYPES, 'REJECTED']),
      count: z.number().int().nonnegative(),
      volumeMinor: z.number().int().nonnegative(),
    }),
  ),
});
export type TransactionSummary = z.infer<typeof TransactionSummarySchema>;

export const UploadResultSchema = z.object({
  accepted: z.number().int().nonnegative(),
  rejected: z.number().int().nonnegative(),
  errors: z.array(z.object({ file: z.string(), message: z.string() })),
});
export type UploadResult = z.infer<typeof UploadResultSchema>;
