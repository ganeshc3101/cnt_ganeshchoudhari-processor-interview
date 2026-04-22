import clsx from 'clsx';
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react';

import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon, XIcon } from '@/shared/ui/icons';

import {
  WEEKDAY_LABELS,
  YEARS_PER_PAGE,
  addDays,
  addMonths,
  buildMonthMatrix,
  clampToRange,
  formatDisplay,
  isAfter,
  isBefore,
  isMonthOutOfRange,
  isSameDay,
  isYearOutOfRange,
  monthLabel,
  monthLabelShort,
  parseYmd,
  toYmd,
  yearPageRange,
} from './calendar';
import styles from './DatePicker.module.css';

type Props = {
  label: string;
  /** `YYYY-MM-DD` or empty string. */
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  /** `YYYY-MM-DD` inclusive lower bound. */
  min?: string;
  /** `YYYY-MM-DD` inclusive upper bound. */
  max?: string;
  error?: string | undefined;
  hint?: string | undefined;
  disabled?: boolean;
  /** Sets the initially-visible month when no value is present. */
  defaultVisibleMonth?: Date;
  id?: string;
  className?: string;
};

type View = 'days' | 'months' | 'years';

export function DatePicker({
  label,
  value,
  onChange,
  placeholder = 'Select a date',
  min,
  max,
  error,
  hint,
  disabled = false,
  defaultVisibleMonth,
  id,
  className,
}: Props) {
  const reactId = useId();
  const fieldId = id ?? `datepicker-${reactId}`;
  const errorId = error ? `${fieldId}-error` : undefined;
  const hintId = hint ? `${fieldId}-hint` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  const rootRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const gridRef = useRef<HTMLDivElement | null>(null);

  const selectedDate = useMemo(() => parseYmd(value), [value]);
  const minDate = useMemo(() => (min ? parseYmd(min) : null), [min]);
  const maxDate = useMemo(() => (max ? parseYmd(max) : null), [max]);

  const [open, setOpen] = useState(false);
  const [view, setView] = useState<View>('days');
  const [visibleMonth, setVisibleMonth] = useState<Date>(() => {
    const base = selectedDate ?? defaultVisibleMonth ?? new Date();
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });
  const [focusedDay, setFocusedDay] = useState<Date>(() => selectedDate ?? new Date());
  const [yearPageStart, setYearPageStart] = useState<number>(
    () => yearPageRange(visibleMonth.getFullYear()).start,
  );

  useEffect(() => {
    if (!open) return;
    const base = selectedDate ?? new Date();
    setView('days');
    setVisibleMonth(new Date(base.getFullYear(), base.getMonth(), 1));
    setFocusedDay(clampToRange(base, minDate, maxDate));
    setYearPageStart(yearPageRange(base.getFullYear()).start);
  }, [open, selectedDate, minDate, maxDate]);

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

  const matrix = useMemo(() => buildMonthMatrix(visibleMonth), [visibleMonth]);
  const today = useMemo(() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t;
  }, []);

  const isDisabled = useCallback(
    (date: Date) => {
      if (minDate && isBefore(date, minDate)) return true;
      if (maxDate && isAfter(date, maxDate)) return true;
      return false;
    },
    [minDate, maxDate],
  );

  const commit = (date: Date) => {
    if (isDisabled(date)) return;
    onChange(toYmd(date));
    setOpen(false);
    triggerRef.current?.focus();
  };

  const clear = () => {
    onChange('');
    setOpen(false);
    triggerRef.current?.focus();
  };

  const moveFocus = (days: number) => {
    setFocusedDay((prev) => {
      const next = addDays(prev, days);
      const clamped = clampToRange(next, minDate, maxDate);
      if (clamped.getMonth() !== visibleMonth.getMonth()) {
        setVisibleMonth(new Date(clamped.getFullYear(), clamped.getMonth(), 1));
      }
      return clamped;
    });
  };

  const moveMonth = (months: number) => {
    setVisibleMonth((prev) => addMonths(prev, months));
    setFocusedDay((prev) => clampToRange(addMonths(prev, months), minDate, maxDate));
  };

  const moveYearPage = (pages: number) => {
    setYearPageStart((prev) => prev + pages * YEARS_PER_PAGE);
  };

  const selectYear = (year: number) => {
    setVisibleMonth((prev) => new Date(year, prev.getMonth(), 1));
    setView('months');
  };

  const selectMonth = (monthIndex: number) => {
    setVisibleMonth((prev) => new Date(prev.getFullYear(), monthIndex, 1));
    setView('days');
  };

  const handleGridKey = (event: KeyboardEvent<HTMLDivElement>) => {
    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault();
        moveFocus(-1);
        return;
      case 'ArrowRight':
        event.preventDefault();
        moveFocus(1);
        return;
      case 'ArrowUp':
        event.preventDefault();
        moveFocus(-7);
        return;
      case 'ArrowDown':
        event.preventDefault();
        moveFocus(7);
        return;
      case 'PageUp':
        event.preventDefault();
        moveMonth(event.shiftKey ? -12 : -1);
        return;
      case 'PageDown':
        event.preventDefault();
        moveMonth(event.shiftKey ? 12 : 1);
        return;
      case 'Home':
        event.preventDefault();
        setFocusedDay((prev) => addDays(prev, -prev.getDay()));
        return;
      case 'End':
        event.preventDefault();
        setFocusedDay((prev) => addDays(prev, 6 - prev.getDay()));
        return;
      case 'Enter':
      case ' ':
        event.preventDefault();
        commit(focusedDay);
        return;
      default:
        return;
    }
  };

  useEffect(() => {
    if (!open || view !== 'days') return;
    if (!gridRef.current) return;
    const focusedEl = gridRef.current.querySelector<HTMLButtonElement>(
      'button[data-focused="true"]',
    );
    focusedEl?.focus();
  }, [open, view, focusedDay]);

  const displayValue = selectedDate ? formatDisplay(selectedDate) : '';

  const visibleYear = visibleMonth.getFullYear();
  const visibleMonthIndex = visibleMonth.getMonth();
  const monthHeader = `${monthLabel(visibleMonthIndex)} ${visibleYear}`;

  const yearPage = useMemo(() => {
    const end = yearPageStart + YEARS_PER_PAGE - 1;
    return { start: yearPageStart, end };
  }, [yearPageStart]);

  const renderHeader = () => {
    if (view === 'years') {
      return (
        <div className={styles.popoverHeader}>
          <button
            type="button"
            className={styles.navButton}
            onClick={() => moveYearPage(-1)}
            aria-label="Previous years"
          >
            <ChevronLeftIcon />
          </button>
          <button
            type="button"
            className={styles.headerTitleButton}
            onClick={() => setView('days')}
            aria-label="Back to days"
          >
            {yearPage.start} – {yearPage.end}
          </button>
          <button
            type="button"
            className={styles.navButton}
            onClick={() => moveYearPage(1)}
            aria-label="Next years"
          >
            <ChevronRightIcon />
          </button>
        </div>
      );
    }

    if (view === 'months') {
      return (
        <div className={styles.popoverHeader}>
          <button
            type="button"
            className={styles.navButton}
            onClick={() => setVisibleMonth((prev) => new Date(prev.getFullYear() - 1, prev.getMonth(), 1))}
            aria-label="Previous year"
          >
            <ChevronLeftIcon />
          </button>
          <button
            type="button"
            className={styles.headerTitleButton}
            onClick={() => {
              setYearPageStart(yearPageRange(visibleYear).start);
              setView('years');
            }}
          >
            {visibleYear}
          </button>
          <button
            type="button"
            className={styles.navButton}
            onClick={() => setVisibleMonth((prev) => new Date(prev.getFullYear() + 1, prev.getMonth(), 1))}
            aria-label="Next year"
          >
            <ChevronRightIcon />
          </button>
        </div>
      );
    }

    return (
      <div className={styles.popoverHeader}>
        <button
          type="button"
          className={styles.navButton}
          onClick={() => moveMonth(-1)}
          aria-label="Previous month"
        >
          <ChevronLeftIcon />
        </button>
        <div className={styles.headerTitleGroup} aria-live="polite">
          <button
            type="button"
            className={styles.headerSegment}
            onClick={() => setView('months')}
            aria-label={`Change month, currently ${monthLabel(visibleMonthIndex)}`}
          >
            {monthLabel(visibleMonthIndex)}
          </button>
          <button
            type="button"
            className={styles.headerSegment}
            onClick={() => {
              setYearPageStart(yearPageRange(visibleYear).start);
              setView('years');
            }}
            aria-label={`Change year, currently ${visibleYear}`}
          >
            {visibleYear}
          </button>
        </div>
        <button
          type="button"
          className={styles.navButton}
          onClick={() => moveMonth(1)}
          aria-label="Next month"
        >
          <ChevronRightIcon />
        </button>
      </div>
    );
  };

  const renderBody = () => {
    if (view === 'years') {
      const years = Array.from({ length: YEARS_PER_PAGE }, (_, i) => yearPage.start + i);
      return (
        <div className={styles.pickerGrid} role="listbox" aria-label="Select a year">
          {years.map((year) => {
            const outOfRange = isYearOutOfRange(year, minDate, maxDate);
            const isCurrent = year === visibleYear;
            const isSelected = selectedDate?.getFullYear() === year;
            return (
              <button
                key={year}
                type="button"
                role="option"
                aria-selected={isSelected}
                disabled={outOfRange}
                onClick={() => selectYear(year)}
                className={clsx(
                  styles.pickerCell,
                  isCurrent && styles.pickerCellCurrent,
                  isSelected && styles.pickerCellSelected,
                )}
              >
                {year}
              </button>
            );
          })}
        </div>
      );
    }

    if (view === 'months') {
      return (
        <div className={styles.pickerGrid} role="listbox" aria-label="Select a month">
          {Array.from({ length: 12 }, (_, monthIndex) => {
            const outOfRange = isMonthOutOfRange(visibleYear, monthIndex, minDate, maxDate);
            const isCurrent = monthIndex === visibleMonthIndex;
            const isSelected =
              selectedDate?.getFullYear() === visibleYear &&
              selectedDate?.getMonth() === monthIndex;
            return (
              <button
                key={monthIndex}
                type="button"
                role="option"
                aria-selected={isSelected}
                disabled={outOfRange}
                onClick={() => selectMonth(monthIndex)}
                className={clsx(
                  styles.pickerCell,
                  isCurrent && styles.pickerCellCurrent,
                  isSelected && styles.pickerCellSelected,
                )}
              >
                {monthLabelShort(monthIndex)}
              </button>
            );
          })}
        </div>
      );
    }

    return (
      <>
        <div className={styles.weekdays} aria-hidden="true">
          {WEEKDAY_LABELS.map((weekday) => (
            <span key={weekday} className={styles.weekday}>
              {weekday.charAt(0)}
            </span>
          ))}
        </div>

        <div
          ref={gridRef}
          role="grid"
          aria-label={monthHeader}
          className={styles.grid}
          onKeyDown={handleGridKey}
        >
          {matrix.map((row, rowIndex) => (
            <div role="row" key={rowIndex} className={styles.row}>
              {row.map((cell) => {
                const isSelected = selectedDate ? isSameDay(cell.date, selectedDate) : false;
                const isToday = isSameDay(cell.date, today);
                const isFocused = isSameDay(cell.date, focusedDay);
                const disabledCell = isDisabled(cell.date);
                return (
                  <div role="gridcell" key={cell.iso} className={styles.cell}>
                    <button
                      type="button"
                      disabled={disabledCell}
                      data-focused={isFocused ? 'true' : 'false'}
                      tabIndex={isFocused ? 0 : -1}
                      aria-pressed={isSelected}
                      aria-label={formatDisplay(cell.date)}
                      className={clsx(
                        styles.day,
                        !cell.inCurrentMonth && styles.dayOutside,
                        isToday && styles.dayToday,
                        isSelected && styles.daySelected,
                      )}
                      onClick={() => commit(cell.date)}
                    >
                      {cell.date.getDate()}
                    </button>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </>
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
        className={clsx(styles.trigger, error && styles.triggerError)}
        onClick={() => !disabled && setOpen((prev) => !prev)}
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
      >
        <span className={styles.triggerIcon} aria-hidden="true">
          <CalendarIcon />
        </span>
        <span className={clsx(styles.triggerValue, !selectedDate && styles.triggerPlaceholder)}>
          {displayValue || placeholder}
        </span>
        {selectedDate ? (
          <span
            className={styles.triggerClear}
            role="button"
            aria-label="Clear date"
            tabIndex={-1}
            onClick={(event) => {
              event.stopPropagation();
              clear();
            }}
          >
            <XIcon width={14} height={14} />
          </span>
        ) : null}
      </button>

      {open ? (
        <div role="dialog" aria-label={`${label} calendar`} className={styles.popover}>
          {renderHeader()}
          {renderBody()}

          <div className={styles.popoverFooter}>
            <button
              type="button"
              className={styles.footerAction}
              onClick={() => commit(clampToRange(today, minDate, maxDate))}
              disabled={isDisabled(today)}
            >
              Today
            </button>
            <button type="button" className={styles.footerAction} onClick={clear}>
              Clear
            </button>
          </div>
        </div>
      ) : null}

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
}
