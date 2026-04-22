import clsx from 'clsx';
import { useEffect, useId, useMemo, useRef, useState } from 'react';

import { CardBrandIcon } from '@/shared/ui/CardBrandIcon';
import { ChevronDownIcon, XIcon } from '@/shared/ui/icons';

import styles from './CardTypeMultiSelect.module.css';
import {
  CARD_TYPE_FILTER_VALUES,
  type CardTypeFilter,
} from '../../types/transaction';

type Props = {
  label: string;
  value: ReadonlyArray<CardTypeFilter>;
  onChange: (next: CardTypeFilter[]) => void;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
  className?: string;
};

const OPTION_LABELS: Record<CardTypeFilter, string> = {
  AMEX: 'American Express',
  VISA: 'Visa',
  MASTERCARD: 'Mastercard',
  DISCOVER: 'Discover',
  REJECTED: 'Rejected only',
};

export function CardTypeMultiSelect({
  label,
  value,
  onChange,
  placeholder = 'All card types',
  disabled = false,
  id,
  className,
}: Props) {
  const reactId = useId();
  const fieldId = id ?? `card-multi-${reactId}`;
  const listboxId = `${fieldId}-listbox`;

  const rootRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  const [open, setOpen] = useState(false);

  const selectedSet = useMemo(() => new Set(value), [value]);
  const selected = useMemo(
    () => CARD_TYPE_FILTER_VALUES.filter((item) => selectedSet.has(item)),
    [selectedSet],
  );

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(event.target as Node)) setOpen(false);
    };
    const handleKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  const toggle = (option: CardTypeFilter) => {
    const next = selectedSet.has(option)
      ? selected.filter((item) => item !== option)
      : [...selected, option];
    onChange(next);
  };

  const clearAll = () => {
    onChange([]);
  };

  const selectAll = () => {
    onChange([...CARD_TYPE_FILTER_VALUES]);
  };

  const allSelected = selected.length === CARD_TYPE_FILTER_VALUES.length;

  const renderTriggerContent = () => {
    if (selected.length === 0) {
      return <span className={styles.placeholder}>{placeholder}</span>;
    }
    if (selected.length === CARD_TYPE_FILTER_VALUES.length) {
      return <span className={styles.summaryAll}>All card types</span>;
    }
    const visible = selected.slice(0, 3);
    const overflow = selected.length - visible.length;
    return (
      <span className={styles.chips}>
        {visible.map((item) => (
          <span key={item} className={styles.chip}>
            <CardBrandIcon brand={item} size="sm" />
          </span>
        ))}
        {overflow > 0 ? <span className={styles.chipOverflow}>+{overflow}</span> : null}
      </span>
    );
  };

  return (
    <div className={clsx(styles.root, className)} ref={rootRef}>
      <label htmlFor={fieldId} className={styles.label}>
        {label}
      </label>

      <button
        id={fieldId}
        ref={triggerRef}
        type="button"
        className={styles.trigger}
        onClick={() => !disabled && setOpen((prev) => !prev)}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
      >
        <span className={styles.triggerValue}>{renderTriggerContent()}</span>
        {selected.length > 0 ? (
          <span
            className={styles.clearButton}
            role="button"
            aria-label="Clear card type filter"
            tabIndex={-1}
            onClick={(event) => {
              event.stopPropagation();
              clearAll();
            }}
          >
            <XIcon width={14} height={14} />
          </span>
        ) : null}
        <span className={styles.chevron} aria-hidden="true">
          <ChevronDownIcon />
        </span>
      </button>

      {open ? (
        <div className={styles.popover} role="presentation">
          <div className={styles.popoverHeader}>
            <span className={styles.popoverHint}>Select one or more</span>
            <button
              type="button"
              className={styles.bulkAction}
              onClick={allSelected ? clearAll : selectAll}
            >
              {allSelected ? 'Clear all' : 'Select all'}
            </button>
          </div>
          <ul
            id={listboxId}
            role="listbox"
            aria-multiselectable="true"
            aria-label={label}
            className={styles.list}
          >
            {CARD_TYPE_FILTER_VALUES.map((option) => {
              const checked = selectedSet.has(option);
              return (
                <li key={option} className={styles.item}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={checked}
                    className={clsx(styles.option, checked && styles.optionChecked)}
                    onClick={() => toggle(option)}
                  >
                    <span
                      className={clsx(styles.checkbox, checked && styles.checkboxChecked)}
                      aria-hidden="true"
                    >
                      {checked ? <CheckMark /> : null}
                    </span>
                    <CardBrandIcon brand={option} size="sm" />
                    <span className={styles.optionLabel}>{OPTION_LABELS[option]}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function CheckMark() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M5 12l4 4L19 7"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
