import { useMemo } from 'react';

import styles from './DonutChart.module.css';

export type DonutSlice = {
  id: string;
  label: string;
  value: number;
  color: string;
};

type Props = {
  slices: ReadonlyArray<DonutSlice>;
  size?: number;
  thickness?: number;
  centerLabel?: string;
  centerValue?: string;
  valueFormatter?: (value: number) => string;
  ariaLabel?: string;
};

export function DonutChart({
  slices,
  size = 180,
  thickness = 22,
  centerLabel,
  centerValue,
  valueFormatter = (v) => v.toLocaleString(),
  ariaLabel = 'Donut chart',
}: Props) {
  const { rendered, total } = useMemo(() => {
    const sum = slices.reduce((acc, s) => acc + Math.max(0, s.value), 0);
    const radius = (size - thickness) / 2;
    const circumference = 2 * Math.PI * radius;

    let offset = 0;
    const shapes = slices.map((slice) => {
      const safe = Math.max(0, slice.value);
      const length = sum === 0 ? 0 : (safe / sum) * circumference;
      const shape = {
        id: slice.id,
        label: slice.label,
        value: slice.value,
        color: slice.color,
        length,
        gap: circumference - length,
        dashOffset: -offset,
      };
      offset += length;
      return shape;
    });

    return { rendered: { radius, circumference, shapes }, total: sum };
  }, [slices, size, thickness]);

  return (
    <div className={styles.root} style={{ ['--donut-size' as string]: `${size}px` }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className={styles.svg}
        role="img"
        aria-label={ariaLabel}
      >
        <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={rendered.radius}
            className={styles.track}
            strokeWidth={thickness}
          />
          {rendered.shapes.map((shape) => (
            <circle
              key={shape.id}
              cx={size / 2}
              cy={size / 2}
              r={rendered.radius}
              fill="none"
              stroke={shape.color}
              strokeWidth={thickness}
              strokeDasharray={`${shape.length} ${shape.gap}`}
              strokeDashoffset={shape.dashOffset}
              strokeLinecap="butt"
            >
              <title>{`${shape.label}: ${valueFormatter(shape.value)}`}</title>
            </circle>
          ))}
        </g>
      </svg>
      {centerLabel !== undefined || centerValue !== undefined ? (
        <div className={styles.center}>
          {centerValue !== undefined ? (
            <span className={styles.centerValue}>{centerValue}</span>
          ) : null}
          {centerLabel !== undefined ? (
            <span className={styles.centerLabel}>{centerLabel}</span>
          ) : null}
          <span className={styles.centerTotal}>
            {total > 0 ? `${valueFormatter(total)} total` : null}
          </span>
        </div>
      ) : null}
    </div>
  );
}
