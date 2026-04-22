import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  type ChangeEvent,
  type FocusEventHandler,
} from 'react';

import {
  formatMoneyDisplay,
  mapDisplayCaretToRaw,
  mapRawCaretToDisplay,
  sanitizeMoneyInput,
} from './money';
import styles from './MoneyInput.module.css';

type Props = {
  label: string;
  /** Raw value, e.g. "1234.56" — what the schema validates. */
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  error?: string | undefined;
  hint?: string | undefined;
  /** Symbol shown as the prefix adornment. Defaults to `$`. */
  currencySymbol?: string;
  disabled?: boolean;
  id?: string;
  name?: string;
  onBlur?: FocusEventHandler<HTMLInputElement>;
  className?: string;
  autoComplete?: string;
};

function mergeRefs<T>(
  ...refs: Array<React.Ref<T> | undefined>
): (value: T | null) => void {
  return (value) => {
    refs.forEach((ref) => {
      if (!ref) return;
      if (typeof ref === 'function') ref(value);
      else (ref as React.MutableRefObject<T | null>).current = value;
    });
  };
}

export const MoneyInput = forwardRef<HTMLInputElement, Props>(function MoneyInput(
  {
    label,
    value,
    onChange,
    placeholder = '0.00',
    error,
    hint,
    currencySymbol = '$',
    disabled = false,
    id,
    name,
    onBlur,
    className,
    autoComplete = 'off',
  },
  ref,
) {
  const reactId = useId();
  const inputId = id ?? `money-${reactId}`;
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  const innerRef = useRef<HTMLInputElement | null>(null);
  const nextCaretRef = useRef<number | null>(null);

  const displayValue = formatMoneyDisplay(value);

  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const inputEl = event.currentTarget;
      const previousDisplayCaret = inputEl.selectionStart ?? inputEl.value.length;
      const rawFromInput = inputEl.value.replace(/,/g, '');
      const rawCaretBefore = mapDisplayCaretToRaw(inputEl.value, previousDisplayCaret);
      const sanitized = sanitizeMoneyInput(rawFromInput);

      // Any chars dropped during sanitization reduce caret distance from left.
      const droppedBefore = Math.max(0, rawFromInput.length - sanitized.length);
      const rawCaret = Math.max(0, Math.min(sanitized.length, rawCaretBefore - droppedBefore));
      const nextDisplay = formatMoneyDisplay(sanitized);
      nextCaretRef.current = mapRawCaretToDisplay(sanitized, nextDisplay, rawCaret);

      onChange(sanitized);
    },
    [onChange],
  );

  useLayoutEffect(() => {
    const el = innerRef.current;
    const caret = nextCaretRef.current;
    if (el && caret !== null && document.activeElement === el) {
      el.setSelectionRange(caret, caret);
    }
    nextCaretRef.current = null;
  });

  // Keep focus ring wrapper tidy when value changes externally.
  useEffect(() => {
    nextCaretRef.current = null;
  }, [value]);

  return (
    <div className={[styles.root, className].filter(Boolean).join(' ')}>
      <label htmlFor={inputId} className={styles.label}>
        {label}
      </label>
      <div className={[styles.field, error ? styles.fieldError : ''].filter(Boolean).join(' ')}>
        <span className={styles.prefix} aria-hidden="true">
          {currencySymbol}
        </span>
        <input
          ref={mergeRefs(innerRef, ref)}
          id={inputId}
          name={name}
          type="text"
          inputMode="decimal"
          autoComplete={autoComplete}
          disabled={disabled}
          className={styles.input}
          placeholder={placeholder}
          value={displayValue}
          onChange={handleChange}
          onBlur={onBlur}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
        />
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
