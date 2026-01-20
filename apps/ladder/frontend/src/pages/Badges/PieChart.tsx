import PropTypes from 'prop-types';
import Chart from '@/components/Chart';
import style from './style.module.scss';

const PieChart = (props) => {
    const { data } = props;

    const chartInit = ({ am4core, am4charts, instance }) => {
        // Add and configure Series
        const pieSeries = instance.series.push(new am4charts.PieSeries());
        pieSeries.dataFields.value = 'value';
        pieSeries.dataFields.category = 'label';
        pieSeries.slices.template.strokeWidth = 3;
        pieSeries.slices.template.stroke = am4core.color('#edeff8');
        pieSeries.slices.template.strokeOpacity = 1;
        pieSeries.slices.template.propertyFields.fill = 'color';
        pieSeries.slices.template.states.getKey('hover').properties.scale = 1;
        pieSeries.slices.template.states.getKey('active').properties.shiftRadius = 0;

        // This creates initial animation
        pieSeries.hiddenState.properties.opacity = 1;
        pieSeries.hiddenState.properties.endAngle = -90;
        pieSeries.hiddenState.properties.startAngle = -90;

        instance.hiddenState.properties.radius = am4core.percent(0);
        instance.radius = am4core.percent(90);
        instance.paddingTop = 20;
        instance.paddingBottom = 20;

        pieSeries.labels.template.text = '{category}: {value}';
        pieSeries.labels.template.fontSize = 15;

        pieSeries.tooltip.disabled = true;
    };

    const getData = ({ am4core, am4charts, instance }) => data;

    return (
        <div className={style.chartWrapper}>
            <Chart chartType="PieChart" init={chartInit} getData={getData} height="100%" />
        </div>
    );
};

PieChart.propTypes = {
    data: PropTypes.array,
};

PieChart.defaultProps = {};

export default PieChart;
