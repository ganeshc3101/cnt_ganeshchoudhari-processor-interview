import clsx from 'clsx';
import { useId, useRef, type KeyboardEvent, type ReactNode } from 'react';

import styles from './Tabs.module.css';

export type TabItem<T extends string> = {
  id: T;
  label: ReactNode;
  icon?: ReactNode;
};

type Props<T extends string> = {
  items: ReadonlyArray<TabItem<T>>;
  value: T;
  onChange: (next: T) => void;
  className?: string;
  ariaLabel?: string;
};

export function Tabs<T extends string>({ items, value, onChange, className, ariaLabel }: Props<T>) {
  const listId = useId();
  const buttonsRef = useRef<Array<HTMLButtonElement | null>>([]);

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
    event.preventDefault();
    const delta = event.key === 'ArrowRight' ? 1 : -1;
    const next = (index + delta + items.length) % items.length;
    const nextItem = items[next];
    if (!nextItem) return;
    onChange(nextItem.id);
    buttonsRef.current[next]?.focus();
  };

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={clsx(styles.root, className)}
      id={listId}
    >
      {items.map((item, index) => {
        const isActive = item.id === value;
        return (
          <button
            key={item.id}
            ref={(el) => {
              buttonsRef.current[index] = el;
            }}
            type="button"
            role="tab"
            id={`${listId}-tab-${item.id}`}
            aria-selected={isActive}
            aria-controls={`${listId}-panel-${item.id}`}
            tabIndex={isActive ? 0 : -1}
            className={clsx(styles.tab, isActive && styles.tabActive)}
            onClick={() => onChange(item.id)}
            onKeyDown={(e) => handleKeyDown(e, index)}
          >
            {item.icon !== undefined ? <span className={styles.icon}>{item.icon}</span> : null}
            <span>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}

type PanelProps = {
  tabId: string;
  id: string;
  active: boolean;
  children: ReactNode;
};

export function TabPanel({ tabId, id, active, children }: PanelProps) {
  if (!active) return null;
  return (
    <div role="tabpanel" id={id} aria-labelledby={tabId} className={styles.panel}>
      {children}
    </div>
  );
}
