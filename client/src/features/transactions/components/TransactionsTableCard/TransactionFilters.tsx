import { Button } from '@/shared/ui/Button';
import { DatePicker } from '@/shared/ui/DatePicker';
import { MoneyInput } from '@/shared/ui/MoneyInput';

import styles from './TransactionFilters.module.css';
import { CardTypeMultiSelect } from '../CardTypeMultiSelect';

import type { CardTypeFilter, TransactionFilters } from '../../types/transaction';

type Props = {
  filters: TransactionFilters;
  onChange: (update: Partial<Omit<TransactionFilters, 'page'>>) => void;
  onReset: () => void;
};

export function TransactionFiltersBar({ filters, onChange, onReset }: Props) {
  const handleCardTypesChange = (next: CardTypeFilter[]) => {
    onChange({ cardTypes: next });
  };

  const handleDateChange =
    (key: 'from' | 'to') =>
    (next: string) => {
      onChange({ [key]: next });
    };

  return (
    <div className={styles.root}>
      <div className={styles.topRow}>
        <div className={styles.cardTypeField}>
          <CardTypeMultiSelect
            label="Card type"
            value={filters.cardTypes}
            onChange={handleCardTypesChange}
          />
        </div>
      </div>

      <div className={styles.rangeRow}>
        <DatePicker
          label="From date"
          value={filters.from}
          onChange={handleDateChange('from')}
          placeholder="Start date"
          {...(filters.to ? { max: filters.to } : {})}
        />
        <DatePicker
          label="To date"
          value={filters.to}
          onChange={handleDateChange('to')}
          placeholder="End date"
          {...(filters.from ? { min: filters.from } : {})}
        />
        <MoneyInput
          label="Min amount"
          value={filters.minAmount}
          onChange={(next) => onChange({ minAmount: next })}
        />
        <MoneyInput
          label="Max amount"
          value={filters.maxAmount}
          onChange={(next) => onChange({ maxAmount: next })}
        />
      </div>

      <div className={styles.actions}>
        <Button type="button" variant="ghost" size="sm" onClick={onReset}>
          Clear filters
        </Button>
      </div>
    </div>
  );
}
