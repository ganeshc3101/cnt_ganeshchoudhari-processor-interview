import clsx from 'clsx';

import styles from './Table.module.css';

import type { Key, ReactNode } from 'react';


export type TableColumn<T> = {
  id: string;
  header: ReactNode;
  align?: 'start' | 'end' | 'center';
  width?: string;
  render: (row: T) => ReactNode;
};

type Props<T> = {
  columns: ReadonlyArray<TableColumn<T>>;
  rows: ReadonlyArray<T>;
  getRowId: (row: T) => Key;
  caption?: string;
  className?: string;
};

export function Table<T>({ columns, rows, getRowId, caption, className }: Props<T>) {
  return (
    <div className={clsx(styles.scroll, className)}>
      <table className={styles.table}>
        {caption ? <caption className={styles.caption}>{caption}</caption> : null}
        <thead className={styles.thead}>
          <tr>
            {columns.map((col) => (
              <th
                key={col.id}
                scope="col"
                className={clsx(styles.th, col.align && styles[`align_${col.align}`])}
                style={col.width ? { width: col.width } : undefined}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={getRowId(row)} className={styles.tr}>
              {columns.map((col) => (
                <td
                  key={col.id}
                  className={clsx(styles.td, col.align && styles[`align_${col.align}`])}
                >
                  {col.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
