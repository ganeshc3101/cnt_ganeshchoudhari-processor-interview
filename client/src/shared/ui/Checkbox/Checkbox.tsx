import { forwardRef, useId, type InputHTMLAttributes } from 'react';

import styles from './Checkbox.module.css';

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  label: string;
};

export const Checkbox = forwardRef<HTMLInputElement, Props>(function Checkbox(
  { label, id, className, ...rest },
  ref,
) {
  const reactId = useId();
  const inputId = id ?? `checkbox-${reactId}`;

  const rootClasses = [styles.root, className].filter(Boolean).join(' ');

  return (
    <label htmlFor={inputId} className={rootClasses}>
      <span className={styles.control}>
        <input
          ref={ref}
          id={inputId}
          type="checkbox"
          className={styles.input}
          {...rest}
        />
        <span className={styles.box} aria-hidden="true">
          <svg viewBox="0 0 16 16" width="12" height="12" fill="none" focusable="false">
            <path
              d="M3 8.5l3 3L13 4.5"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </span>
      <span className={styles.labelText}>{label}</span>
    </label>
  );
});
