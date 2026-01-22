import { useMemo } from 'react';
import _round from 'lodash/round';
import useUniqueId from '@/utils/useUniqueId';
import pathFromPoints from './pathFromPoints';
import style from './style.module.scss';

type PerformanceChartProps = {
    data?: unknown[];
    dataKey?: string;
    minDiff?: number;
    color?: string;
    renderLabel?: (...args: unknown[]) => unknown;
};

const PerformanceChart = (props: PerformanceChartProps) => {
    const { dataKey, minDiff, color, renderLabel } = props;
    const step = 50;
    const strokeWidth = 2;
    const width = (props.data.length - 1) * step;
    const padding = 15;
    const topPadding = padding + 10;
    const gradientId = useUniqueId();

    const values = props.data.map((item) => item[dataKey]);

    const data = useMemo(() => {
        const presentValues = values.filter(Number.isInteger);

        const min = Math.min(...presentValues);
        const max = Math.max(...presentValues);
        const diff = max - min;
        const scale = Math.min(1, minDiff / diff);
        const addition = Math.max(0, (minDiff - diff) / 2);

        return values
            .map((value, index) => {
                if (!Number.isInteger(value)) {
                    return null;
                }

                const x = _round(index * step, 2);
                const y = _round((max - value) * scale + addition, 2);

                return [x, y, values[index]];
            })
            .filter(Boolean);
    }, [props.data, dataKey, minDiff]);

    const { path, fillPath } = useMemo(() => {
        if (data.length === 0) {
            return { path: null, fullPath: null };
        }

        const result = pathFromPoints(data);

        const leftX = data[0][0];
        const rightX = data[data.length - 1][0];
        const bottomY = minDiff + padding;

        return {
            path: result,
            fillPath: result + ` L ${rightX} ${bottomY} L ${leftX} ${bottomY} Z`,
        };
    }, [data]);

    if (values.length === 1) {
        const value = values[0];

        if (!Number.isInteger(value)) {
            return '-';
        }

        return renderLabel ? renderLabel(value) : value;
    }

    return (
        <svg
            viewBox={`${-step / 2} ${-topPadding} ${width + step} ${minDiff + padding + topPadding}`}
            version="1.1"
            xmlns="http://www.w3.org/2000/svg"
        >
            <defs>
                <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor={color} />
                    <stop offset="100%" stopColor={color} stopOpacity={0} />
                </linearGradient>
            </defs>
            {values.slice(0, -1).map((nums, index) => (
                <line
                    key={index}
                    className={style.chartDivider}
                    strokeWidth="5px"
                    x1={step / 2 + index * step}
                    y1={-topPadding}
                    x2={step / 2 + index * step}
                    y2={minDiff + padding}
                />
            ))}

            {path && (
                <path
                    d={path}
                    stroke={color}
                    strokeWidth={`${strokeWidth}px`}
                    strokeOpacity={0.5}
                    strokeLinecap="round"
                    fill="none"
                />
            )}
            {data.map((nums, index) => (
                <circle key={index} cx={nums[0]} cy={nums[1]} r={strokeWidth + 3} className={style.chartBg} />
            ))}
            {data.map((nums, index) => (
                <circle key={index} cx={nums[0]} cy={nums[1]} r={strokeWidth + 1} fill={color} />
            ))}
            {data.map((nums, index) => (
                <text
                    key={index}
                    x={nums[0]}
                    y={nums[1] - 9}
                    textAnchor="middle"
                    className={style.chartLabel}
                    style={{ fontSize: '0.9rem' }}
                >
                    {renderLabel ? renderLabel(nums[2]) : nums[2]}
                </text>
            ))}
            {fillPath && data.length > 1 && (
                <path d={fillPath} className={style.chartGradient} fill={`url(#${gradientId})`} />
            )}
        </svg>
    );
};

PerformanceChart.defaultProps = {
    minDiff: 50,
    color: '#6db7d9',
};

export default PerformanceChart;
