import { zodResolver } from '@hookform/resolvers/zod';
import { useState, type ChangeEvent } from 'react';
import { Controller, useFieldArray, useForm } from 'react-hook-form';

import { userFacingApiMessage } from '@/features/auth/lib/loginErrorMessage';
import { Button } from '@/shared/ui/Button';
import { DatePicker } from '@/shared/ui/DatePicker';
import { PlusIcon, TrashIcon } from '@/shared/ui/icons';
import { InputField } from '@/shared/ui/InputField';
import { MoneyInput } from '@/shared/ui/MoneyInput';

import styles from './ManualEntryTab.module.css';
import { useCreateManyTransactions } from '../../hooks/useCreateManyTransactions';
import { classifyCardType } from '../../lib/cardType';
import { formatCardNumber } from '../../lib/formatCardNumber';
import {
  MAX_MANUAL_ENTRIES,
  ManualEntriesFormSchema,
  type CreateTransactionInput,
  type ManualEntriesFormValues,
  type ManualEntryRow,
} from '../../types/transaction';
import { CardTypeBadge } from '../CardTypeBadge';


const EMPTY_ROW: ManualEntryRow = {
  cardholderName: '',
  cardNumber: '',
  occurredAt: '',
  amountMajor: '',
};

const DEFAULTS: ManualEntriesFormValues = {
  entries: [{ ...EMPTY_ROW }],
};

type LastResult = {
  accepted: number;
  rejected: number;
};

function toTimestamp(ymd: string): string | undefined {
  if (!ymd) return undefined;
  const parsed = new Date(`${ymd}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed.toISOString();
}

function toPayload(row: ManualEntryRow): CreateTransactionInput {
  const digits = row.cardNumber.replace(/\s+/g, '');
  const iso = toTimestamp(row.occurredAt);
  const name = row.cardholderName.trim();
  return {
    cardNumber: digits,
    amountMajor: row.amountMajor.trim(),
    ...(name ? { cardholderName: name } : {}),
    ...(iso ? { occurredAt: iso } : {}),
  };
}

export function ManualEntryTab() {
  const create = useCreateManyTransactions();
  const [lastResult, setLastResult] = useState<LastResult | null>(null);

  const form = useForm<ManualEntriesFormValues>({
    resolver: zodResolver(ManualEntriesFormSchema),
    defaultValues: DEFAULTS,
    mode: 'onBlur',
  });
  const {
    control,
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = form;

  const { fields, append, remove } = useFieldArray({ control, name: 'entries' });

  const watchedEntries = watch('entries');
  const canAddMore = fields.length < MAX_MANUAL_ENTRIES;

  const onSubmit = handleSubmit(async (values) => {
    setLastResult(null);
    try {
      const result = await create.mutateAsync(values.entries.map(toPayload));
      setLastResult({ accepted: result.accepted, rejected: result.rejected });
      reset(DEFAULTS);
    } catch {
      // Error displayed via the alert region.
    }
  });

  const handleCardNumberChange = (index: number) => (event: ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCardNumber(event.target.value);
    setValue(`entries.${index}.cardNumber`, formatted, {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  const addRow = () => {
    if (!canAddMore) return;
    append({ ...EMPTY_ROW });
  };

  const removeRow = (index: number) => {
    if (fields.length <= 1) {
      reset({ entries: [{ ...EMPTY_ROW }] });
      return;
    }
    remove(index);
  };

  return (
    <form className={styles.root} onSubmit={onSubmit} noValidate>
      <div className={styles.toolbar}>
        <div className={styles.toolbarMeta}>
          <span className={styles.counter}>
            {fields.length} / {MAX_MANUAL_ENTRIES} entries
          </span>
          <span className={styles.hint}>
            Add multiple transactions, then submit them together.
          </span>
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          leadingIcon={<PlusIcon />}
          onClick={addRow}
          disabled={!canAddMore || isSubmitting}
        >
          Add another
        </Button>
      </div>

      <div
        className={styles.list}
        data-scrollable={fields.length >= 3 ? 'true' : 'false'}
        aria-live="polite"
      >
        {fields.map((field, index) => {
          const rowErrors = errors.entries?.[index];
          const rowValue = watchedEntries?.[index];
          const detectedType =
            rowValue?.cardNumber ? classifyCardType(rowValue.cardNumber) : null;

          return (
            <fieldset key={field.id} className={styles.row}>
              <legend className={styles.rowLegend}>
                <span className={styles.rowIndex}>#{index + 1}</span>
                <span className={styles.rowTitle}>Transaction</span>
                <button
                  type="button"
                  className={styles.removeButton}
                  onClick={() => removeRow(index)}
                  aria-label={`Remove transaction ${index + 1}`}
                  disabled={isSubmitting}
                >
                  <TrashIcon />
                </button>
              </legend>

              <div className={styles.rowGrid}>
                <InputField
                  label="Cardholder name"
                  autoComplete="cc-name"
                  placeholder="Jane Smith"
                  hint="Optional"
                  error={rowErrors?.cardholderName?.message}
                  {...register(`entries.${index}.cardholderName`)}
                />

                <InputField
                  label="Card number"
                  inputMode="numeric"
                  autoComplete="cc-number"
                  placeholder="1234 5678 9012 3456"
                  {...register(`entries.${index}.cardNumber`)}
                  onChange={handleCardNumberChange(index)}
                  error={rowErrors?.cardNumber?.message}
                  endAdornment={
                    rowValue?.cardNumber && detectedType ? (
                      <CardTypeBadge cardType={detectedType} compact />
                    ) : null
                  }
                />

                <Controller
                  control={control}
                  name={`entries.${index}.occurredAt`}
                  render={({ field: picker }) => (
                    <DatePicker
                      label="Date"
                      value={picker.value}
                      onChange={picker.onChange}
                      placeholder="Defaults to today"
                      hint="Optional"
                      error={rowErrors?.occurredAt?.message}
                    />
                  )}
                />

                <Controller
                  control={control}
                  name={`entries.${index}.amountMajor`}
                  render={({ field: amount }) => (
                    <MoneyInput
                      label="Amount (USD)"
                      value={amount.value}
                      onChange={amount.onChange}
                      onBlur={amount.onBlur}
                      error={rowErrors?.amountMajor?.message}
                    />
                  )}
                />
              </div>
            </fieldset>
          );
        })}
      </div>

      <div className={styles.footer}>
        <div className={styles.footerActions}>
          <Button
            type="submit"
            leadingIcon={<PlusIcon />}
            isLoading={isSubmitting}
            disabled={fields.length === 0}
          >
            Submit {fields.length > 1 ? `${fields.length} transactions` : 'transaction'}
          </Button>
        </div>

        {create.isError ? (
          <p role="alert" className={styles.errorText}>
            {userFacingApiMessage(create.error, 'Could not create transactions.')}
          </p>
        ) : null}

        {lastResult ? (
          <p role="status" className={styles.successText}>
            Successfully added <strong>{lastResult.accepted}</strong> transaction
            {lastResult.accepted === 1 ? '' : 's'}.
          </p>
        ) : null}
      </div>
    </form>
  );
}
