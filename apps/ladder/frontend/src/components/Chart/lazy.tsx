import * as am4core from '@amcharts/amcharts4/core';
import * as am4charts from '@amcharts/amcharts4/charts';
import { useRef, useLayoutEffect } from 'react';
import useUniqueId from './useUniqueId';

type ChartProps = {
    chartType?: string;
    getData?: (...args: unknown[]) => unknown;
    data?: unknown[];
    init?: (...args: unknown[]) => unknown;
    height?: string;
};

const Chart = (props: ChartProps) => {
    const { chartType, data, getData, height } = props;
    const chart = useRef(null);
    const chartId = useUniqueId();
    const { init } = props;

    useLayoutEffect(() => {
        chart.current = am4core.create(chartId, am4charts[chartType]);
        chart.current.data = getData ? getData({ am4core, am4charts, instance: chart.current }) : data;
        init({ am4core, am4charts, instance: chart.current });

        return () => {
            chart.current && chart.current.dispose();
        };
    }, []);

    return <div id={chartId} style={{ width: '100%', height }} />;
};

Chart.defaultProps = {
    chartType: 'XYChart',
    height: '550px',
};

export default Chart;
