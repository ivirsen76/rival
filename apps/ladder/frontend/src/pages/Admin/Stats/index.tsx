import { useQuery } from 'react-query';
import Loader from '@/components/Loader';
import Card from '@/components/Card';
import Chart from '@/components/Chart';
import axios from '@/utils/axios';

const yearsChartInit =
    () =>
    ({ am4core, am4charts, instance }) => {
        const interfaceColors = new am4core.InterfaceColorSet();

        const seasonAxis = instance.xAxes.push(new am4charts.CategoryAxis());
        seasonAxis.dataFields.category = 'name';

        const valueAxis = instance.yAxes.push(new am4charts.ValueAxis());
        valueAxis.tooltip.disabled = true;
        valueAxis.min = 0;

        function addSeries(valueKey, name, colorIndex) {
            const series = instance.series.push(new am4charts.LineSeries());
            series.dataFields.valueY = valueKey;
            series.dataFields.categoryX = 'name';
            series.tooltipText = `${name}: [bold]{valueY}[/]`;
            series.tooltip.pointerOrientation = 'vertical';
            series.strokeWidth = 2;
            series.tensionX = 0.95;
            series.tensionY = 0.95;
            series.stroke = instance.colors.getIndex(colorIndex);
            series.fill = series.stroke;

            const bullet = series.bullets.push(new am4charts.CircleBullet());
            bullet.circle.stroke = interfaceColors.getFor('background');
            bullet.circle.strokeWidth = 2;
            bullet.circle.radius = 4;

            return series;
        }

        addSeries('players', 'Players', 0);
        addSeries('matches', 'Matches', 8);
        addSeries('predictedPlayers', 'Predicted players', 4);

        instance.cursor = new am4charts.XYCursor();
    };

const playersChartInit =
    () =>
    ({ am4core, am4charts, instance }) => {
        const interfaceColors = new am4core.InterfaceColorSet();

        const seasonAxis = instance.xAxes.push(new am4charts.CategoryAxis());
        seasonAxis.dataFields.category = 'year';

        const valueAxis = instance.yAxes.push(new am4charts.ValueAxis());
        valueAxis.tooltip.disabled = true;
        valueAxis.min = 0;

        function addSeries(valueKey, name, color) {
            const series = instance.series.push(new am4charts.LineSeries());
            series.dataFields.valueY = valueKey;
            series.dataFields.categoryX = 'year';
            series.tooltipText = `${name}: [bold]{valueY}[/]`;
            series.tooltip.pointerOrientation = 'vertical';
            series.strokeWidth = 2;
            series.tensionX = 0.95;
            series.tensionY = 0.95;
            if (typeof color === 'string') {
                series.stroke = am4core.color(color);
            } else {
                series.stroke = instance.colors.getIndex(color);
            }
            series.fill = series.stroke;

            const bullet = series.bullets.push(new am4charts.CircleBullet());
            bullet.circle.stroke = interfaceColors.getFor('background');
            bullet.circle.strokeWidth = 2;
            bullet.circle.radius = 4;

            return series;
        }

        addSeries('springPlayers', 'Spring', 4);
        addSeries('summerPlayers', 'Summer', 16);
        addSeries('fallPlayers', 'Fall', 8);
        addSeries('winterPlayers', 'Winter', 0);
        addSeries('predictedPlayers', 'Predicted players', '#000000');

        instance.cursor = new am4charts.XYCursor();
    };

const matchesChartInit =
    () =>
    ({ am4core, am4charts, instance }) => {
        const interfaceColors = new am4core.InterfaceColorSet();

        const seasonAxis = instance.xAxes.push(new am4charts.CategoryAxis());
        seasonAxis.dataFields.category = 'year';

        const valueAxis = instance.yAxes.push(new am4charts.ValueAxis());
        valueAxis.tooltip.disabled = true;
        valueAxis.min = 0;

        function addSeries(valueKey, name, colorIndex) {
            const series = instance.series.push(new am4charts.LineSeries());
            series.dataFields.valueY = valueKey;
            series.dataFields.categoryX = 'year';
            series.tooltipText = `${name}: [bold]{valueY}[/]`;
            series.tooltip.pointerOrientation = 'vertical';
            series.strokeWidth = 2;
            series.tensionX = 0.95;
            series.tensionY = 0.95;
            series.stroke = instance.colors.getIndex(colorIndex);
            series.fill = series.stroke;

            const bullet = series.bullets.push(new am4charts.CircleBullet());
            bullet.circle.stroke = interfaceColors.getFor('background');
            bullet.circle.strokeWidth = 2;
            bullet.circle.radius = 4;

            return series;
        }

        addSeries('springMatches', 'Spring', 4);
        addSeries('summerMatches', 'Summer', 16);
        addSeries('fallMatches', 'Fall', 8);
        addSeries('winterMatches', 'Winter', 0);

        instance.cursor = new am4charts.XYCursor();
    };

const ageChartInit =
    (colorIndex) =>
    ({ am4charts, instance }) => {
        const ageAxis = instance.xAxes.push(new am4charts.CategoryAxis());
        ageAxis.dataFields.category = 'label';
        ageAxis.renderer.grid.template.disabled = true;
        ageAxis.renderer.minGridDistance = 1;
        ageAxis.renderer.labels.template.fontSize = 12;

        const valueAxis = instance.yAxes.push(new am4charts.ValueAxis());
        valueAxis.tooltip.disabled = true;
        valueAxis.renderer.labels.template.disabled = true;
        valueAxis.renderer.line.disabled = true;
        valueAxis.min = 0;
        valueAxis.max = 50;

        const series = instance.series.push(new am4charts.ColumnSeries());
        series.sequencedInterpolation = true;
        series.dataFields.valueY = 'percent';
        series.dataFields.categoryX = 'label';
        series.columns.template.strokeWidth = 0;

        series.tooltip.pointerOrientation = 'vertical';

        series.columns.template.column.cornerRadiusTopLeft = 5;
        series.columns.template.column.cornerRadiusTopRight = 5;
        series.columns.template.column.fillOpacity = 0.8;

        series.stroke = instance.colors.getIndex(colorIndex);
        series.fill = series.stroke;
        series.showOnInit = false;

        const bullet = series.bullets.push(new am4charts.LabelBullet());
        bullet.label.verticalCenter = 'bottom';
        bullet.label.dy = -2;
        bullet.label.text = '{values.valueY.workingValue}%';
    };

const Stats = (props) => {
    const { data: stat, isLoading } = useQuery('getSeasonStats', async () => {
        const response = await axios.put('/api/seasons/0', { action: 'getSeasonStats' });
        return response.data.data;
    });

    if (isLoading) {
        return <Loader loading />;
    }

    const {
        seasonStats,
        yearStats,
        allAgeDistribution,
        malesAgeDistribution,
        femalesAgeDistribution,
        allMedianAge,
        malesMedianAge,
        femalesMedianAge,
    } = stat;

    if (seasonStats.length === 0) {
        return <Card>Not enough data</Card>;
    }

    return (
        <Card>
            <h3>Age distribution</h3>
            <div className="d-flex gap-4">
                <div className="flex-grow-1">
                    <h4>All</h4>
                    <div className="mt-n2 mb-4">
                        Median age: <b>{allMedianAge} years</b>
                    </div>
                    <Chart init={ageChartInit(4)} getData={() => allAgeDistribution} height="300px" />
                </div>
                <div className="flex-grow-1">
                    <h4>Men</h4>
                    <div className="mt-n2 mb-4">
                        Median age: <b>{malesMedianAge} years</b>
                    </div>
                    <Chart init={ageChartInit(0)} getData={() => malesAgeDistribution} height="300px" />
                </div>
                <div className="flex-grow-1">
                    <h4>Women</h4>
                    <div className="mt-n2 mb-4">
                        Median age: <b>{femalesMedianAge} years</b>
                    </div>
                    <Chart init={ageChartInit(8)} getData={() => femalesAgeDistribution} height="300px" />
                </div>
            </div>

            <h3>Players</h3>
            <Chart init={playersChartInit()} getData={() => seasonStats} height="450px" />

            <h3>Matches</h3>
            <Chart init={matchesChartInit()} getData={() => seasonStats} height="450px" />

            <h3>Years</h3>
            <Chart init={yearsChartInit()} getData={() => yearStats} height="450px" />
        </Card>
    );
};

Stats.propTypes = {};

Stats.defaultProps = {};

export default Stats;
