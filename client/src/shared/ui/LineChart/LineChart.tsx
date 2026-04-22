import { useMemo } from 'react';

import styles from './LineChart.module.css';

export type LinePoint = {
  label: string;
  value: number;
};

type Props = {
  data: ReadonlyArray<LinePoint>;
  height?: number;
  valueFormatter?: (value: number) => string;
  ariaLabel?: string;
};

const DEFAULT_HEIGHT = 220;
const VIEWPORT_WIDTH = 640;
const PADDING = { top: 16, right: 16, bottom: 28, left: 44 };

export function LineChart({
  data,
  height = DEFAULT_HEIGHT,
  valueFormatter = (v) => v.toLocaleString(),
  ariaLabel = 'Line chart',
}: Props) {
  const chart = useMemo(() => {
    if (data.length === 0) return null;

    const plotWidth = VIEWPORT_WIDTH - PADDING.left - PADDING.right;
    const plotHeight = height - PADDING.top - PADDING.bottom;

    const values = data.map((d) => d.value);
    const rawMax = Math.max(...values);
    const rawMin = Math.min(...values, 0);
    const max = rawMax === rawMin ? rawMax + 1 : rawMax;
    const min = rawMin;

    const xAt = (i: number) =>
      data.length === 1 ? plotWidth / 2 : (i / (data.length - 1)) * plotWidth;
    const yAt = (v: number) => plotHeight - ((v - min) / (max - min)) * plotHeight;

    const points = data.map((d, i) => ({
      ...d,
      cx: xAt(i) + PADDING.left,
      cy: yAt(d.value) + PADDING.top,
    }));

    const linePath = points
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.cx} ${p.cy}`)
      .join(' ');

    const areaPath =
      points.length > 0
        ? `${linePath} L ${points[points.length - 1]!.cx} ${plotHeight + PADDING.top} L ${points[0]!.cx} ${plotHeight + PADDING.top} Z`
        : '';

    const tickCount = 4;
    const yTicks = Array.from({ length: tickCount + 1 }, (_, i) => {
      const value = min + ((max - min) * i) / tickCount;
      return {
        value,
        y: yAt(value) + PADDING.top,
      };
    });

    const xLabelStep = Math.max(1, Math.floor(data.length / 6));
    const xLabels = points
      .map((p, i) => ({ label: p.label, x: p.cx, i }))
      .filter(({ i }) => i % xLabelStep === 0 || i === points.length - 1);

    return { points, linePath, areaPath, yTicks, xLabels, plotHeight, plotWidth };
  }, [data, height]);

  if (!chart) return null;

  return (
    <svg
      className={styles.root}
      viewBox={`0 0 ${VIEWPORT_WIDTH} ${height}`}
      preserveAspectRatio="none"
      role="img"
      aria-label={ariaLabel}
    >
      {chart.yTicks.map((tick, i) => (
        <g key={`tick-${i}`}>
          <line
            className={styles.grid}
            x1={PADDING.left}
            x2={VIEWPORT_WIDTH - PADDING.right}
            y1={tick.y}
            y2={tick.y}
          />
          <text
            className={styles.axisLabel}
            x={PADDING.left - 8}
            y={tick.y}
            textAnchor="end"
            dominantBaseline="middle"
          >
            {valueFormatter(tick.value)}
          </text>
        </g>
      ))}

      <path className={styles.area} d={chart.areaPath} />
      <path className={styles.line} d={chart.linePath} />

      {chart.points.map((p, i) => (
        <circle key={`p-${i}`} className={styles.point} cx={p.cx} cy={p.cy} r={3.5}>
          <title>{`${p.label}: ${valueFormatter(p.value)}`}</title>
        </circle>
      ))}

      {chart.xLabels.map((label) => (
        <text
          key={`xl-${label.i}`}
          className={styles.axisLabel}
          x={label.x}
          y={height - 8}
          textAnchor="middle"
        >
          {label.label}
        </text>
      ))}
    </svg>
  );
}
