import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from 'react';

import styles from './InputField.module.css';

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string | undefined;
  hint?: string | undefined;
  endAdornment?: ReactNode | undefined;
};

export const InputField = forwardRef<HTMLInputElement, Props>(function InputField(
  { label, error, hint, endAdornment, id, className, ...rest },
  ref,
) {
  const reactId = useId();
  const inputId = id ?? `input-${reactId}`;
  const hintId = hint ? `${inputId}-hint` : null;
  const errorId = error ? `${inputId}-error` : null;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  const inputClasses = [
    styles.input,
    error ? styles.inputError : null,
    endAdornment ? styles.inputWithAdornment : null,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={styles.root}>
      <label htmlFor={inputId} className={styles.label}>
        {label}
      </label>
      <div className={styles.field}>
        <input
          ref={ref}
          id={inputId}
          className={inputClasses}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          {...rest}
        />
        {endAdornment ? <div className={styles.adornment}>{endAdornment}</div> : null}
      </div>
      {hint && !error ? (
        <p id={hintId ?? undefined} className={styles.hint}>
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId ?? undefined} role="alert" className={styles.errorText}>
          {error}
        </p>
      ) : null}
    </div>
  );
});
