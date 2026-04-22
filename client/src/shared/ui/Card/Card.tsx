import clsx from 'clsx';

import styles from './Card.module.css';

import type { HTMLAttributes, ReactNode } from 'react';


type Props = HTMLAttributes<HTMLElement> & {
  as?: 'section' | 'article' | 'div';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  title?: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
};

export function Card({
  as = 'section',
  padding = 'md',
  title,
  subtitle,
  actions,
  className,
  children,
  ...rest
}: Props) {
  const Tag = as;
  const hasHeader = title !== undefined || actions !== undefined;

  return (
    <Tag className={clsx(styles.root, styles[`padding_${padding}`], className)} {...rest}>
      {hasHeader ? (
        <header className={styles.header}>
          <div className={styles.heading}>
            {title !== undefined ? <h3 className={styles.title}>{title}</h3> : null}
            {subtitle !== undefined ? <p className={styles.subtitle}>{subtitle}</p> : null}
          </div>
          {actions !== undefined ? <div className={styles.actions}>{actions}</div> : null}
        </header>
      ) : null}
      <div className={styles.body}>{children}</div>
    </Tag>
  );
}
