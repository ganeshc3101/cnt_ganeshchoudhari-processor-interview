import clsx from 'clsx';

import styles from './Skeleton.module.css';

import type { CSSProperties } from 'react';


type Props = {
  width?: number | string;
  height?: number | string;
  radius?: 'sm' | 'md' | 'lg' | 'full';
  className?: string;
};

export function Skeleton({ width, height = 16, radius = 'md', className }: Props) {
  const style: CSSProperties = {};
  if (width !== undefined) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height !== undefined) style.height = typeof height === 'number' ? `${height}px` : height;

  return (
    <span
      aria-hidden="true"
      className={clsx(styles.root, styles[`radius_${radius}`], className)}
      style={style}
    />
  );
}
