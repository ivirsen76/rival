import * as am4core from '@amcharts/amcharts4/core';
import * as am4charts from '@amcharts/amcharts4/charts';
import { useRef, useLayoutEffect } from 'react';
import PropTypes from 'prop-types';
import useUniqueId from './useUniqueId';

const Chart = props => {
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

Chart.propTypes = {
    chartType: PropTypes.string,
    getData: PropTypes.func,
    data: PropTypes.array,
    init: PropTypes.func,
    height: PropTypes.string,
};

Chart.defaultProps = {
    chartType: 'XYChart',
    height: '550px',
};

export default Chart;
