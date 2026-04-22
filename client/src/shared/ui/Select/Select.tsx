import clsx from 'clsx';
import { forwardRef, useId, type SelectHTMLAttributes } from 'react';

import { ChevronDownIcon } from '@/shared/ui/icons';

import styles from './Select.module.css';

export type SelectOption<T extends string = string> = {
  value: T;
  label: string;
};

type Props = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  options: ReadonlyArray<SelectOption>;
  error?: string | undefined;
  hint?: string | undefined;
};

export const Select = forwardRef<HTMLSelectElement, Props>(function Select(
  { label, options, error, hint, id, className, ...rest },
  ref,
) {
  const reactId = useId();
  const selectId = id ?? `select-${reactId}`;
  const errorId = error ? `${selectId}-error` : undefined;
  const hintId = hint ? `${selectId}-hint` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={clsx(styles.root, className)}>
      <label htmlFor={selectId} className={styles.label}>
        {label}
      </label>
      <div className={styles.field}>
        <select
          ref={ref}
          id={selectId}
          className={clsx(styles.select, error && styles.selectError)}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          {...rest}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <span className={styles.chevron} aria-hidden="true">
          <ChevronDownIcon />
        </span>
      </div>
      {hint && !error ? (
        <p id={hintId} className={styles.hint}>
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} role="alert" className={styles.errorText}>
          {error}
        </p>
      ) : null}
    </div>
  );
});
