import clsx from 'clsx';

import styles from './Badge.module.css';

import type { ReactNode } from 'react';


type Tone = 'neutral' | 'brand' | 'success' | 'warning' | 'danger' | 'info';

type Props = {
  tone?: Tone;
  children: ReactNode;
  className?: string;
};

export function Badge({ tone = 'neutral', children, className }: Props) {
  return <span className={clsx(styles.root, styles[`tone_${tone}`], className)}>{children}</span>;
}
