import { useState } from 'react';
import Card from '@/components/Card';
import axios from '@/utils/axios';
import { useQuery } from 'react-query';
import Loader from '@/components/Loader';
import Error from '@/components/Error';
import Chart from '@/components/Chart';
import formatNumber from '@rival/ladder.backend/src/utils/formatNumber';
import Tooltip from '@/components/Tooltip';
import QuestionIcon from '@rival/packages/metronic/icons/duotone/Navigation/Question.svg?react';

const GlobalStats = (props) => {
    const [selectedCity, setSelectedCity] = useState('all');
    const { data, isLoading, isSuccess } = useQuery(
        `global`,
        async () => {
            const response = await axios.put('/api/utils/0', { action: 'getGlobalStats' });
            return response.data.data;
        },
        { keepPreviousData: true, staleTime: 0 }
    );

    if (isLoading) {
        return <Loader loading />;
    }

    if (!isSuccess) {
        return <Error title="" message="Some error while getting global stats" />;
    }

    const cityOptions = [{ value: 'all', label: 'All cities' }, ...data.cities];

    const chartInit = ({ am4core, am4charts, instance }) => {
        const interfaceColors = new am4core.InterfaceColorSet();

        const dateAxis = instance.xAxes.push(new am4charts.CategoryAxis());
        dateAxis.dataFields.category = 'date';

        const valueAxis = instance.yAxes.push(new am4charts.ValueAxis());
        valueAxis.tooltip.disabled = true;
        valueAxis.min = 0;

        function addSeries(valueKey, name, colorIndex) {
            const series = instance.series.push(new am4charts.LineSeries());
            series.dataFields.valueY = valueKey;
            series.dataFields.categoryX = 'date';
            series.tooltipText = `${name}: [bold]{valueY}[/]`;
            series.tooltip.pointerOrientation = 'vertical';
            series.strokeWidth = 2;
            series.tensionX = 0.95;
            series.tensionY = 0.95;
            series.fillOpacity = 0.1;
            series.stroke = instance.colors.getIndex(colorIndex);
            series.fill = series.stroke;

            const bullet = series.bullets.push(new am4charts.CircleBullet());
            bullet.circle.stroke = interfaceColors.getFor('background');
            bullet.circle.strokeWidth = 2;
            bullet.circle.radius = 4;
        }

        addSeries('activePlayers', 'Active players', 0);
        addSeries('payments', 'Current payments', 8);

        instance.cursor = new am4charts.XYCursor();
    };

    const incomeChartInit = ({ am4core, am4charts, instance }) => {
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
            series.tooltipText = `${name}: [bold]\${valueY}[/]`;
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

        let color = 3;
        for (const city of data.incomeCities) {
            addSeries(city.slug, city.name, color);
            color += 3;
        }

        addSeries('all', 'All', 0);

        instance.cursor = new am4charts.XYCursor();
    };

    const getData = () => data.history;
    const getIncomeData = () => data.income;

    const years = data.years[selectedCity];

    return (
        <Card>
            <h2>Players and Payments</h2>
            <Chart init={chartInit} getData={getData} height="450px" />

            <h2>Income</h2>
            <Chart init={incomeChartInit} getData={getIncomeData} height="450px" />

            <h2>Overall</h2>
            <div>
                Total matches: <b>{formatNumber(data.totalMatches)}</b>
            </div>
            <div>
                Total players: <b>{formatNumber(data.totalUsers)}</b>
            </div>

            <table className="table tl-table mt-4">
                <thead>
                    <tr>
                        <th style={{ verticalAlign: 'middle' }}>
                            <select
                                className="form-select form-select-sm"
                                onChange={(e) => setSelectedCity(e.target.value)}
                            >
                                {cityOptions.map((city) => (
                                    <option key={city.value} value={city.value}>
                                        {city.label}
                                    </option>
                                ))}
                            </select>
                        </th>
                        {years.map((year, index) => (
                            <th key={year.to} className="text-center">
                                {years.length - index} year{years.length - index > 1 ? 's' : ''}
                                <br />
                                ago
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td className="fw-bold">
                            Ladders
                            <Tooltip content="Including ladders with no players and matches">
                                <span className="svg-icon svg-icon-muted svg-icon-6 ms-2">
                                    <QuestionIcon />
                                </span>
                            </Tooltip>
                        </td>
                        {years.map((year) => (
                            <td key={year.to} className="text-center">
                                {year.ladders}
                            </td>
                        ))}
                    </tr>
                    <tr>
                        <td className="fw-bold">
                            Matches
                            <Tooltip content="Including singles and doubles">
                                <span className="svg-icon svg-icon-muted svg-icon-6 ms-2">
                                    <QuestionIcon />
                                </span>
                            </Tooltip>
                        </td>
                        {years.map((year) => (
                            <td key={year.to} className="text-center">
                                {formatNumber(year.matches)}
                            </td>
                        ))}
                    </tr>
                    <tr>
                        <td className="fw-bold">
                            Active players
                            <Tooltip content="Played at least one time during the year">
                                <span className="svg-icon svg-icon-muted svg-icon-6 ms-2">
                                    <QuestionIcon />
                                </span>
                            </Tooltip>
                        </td>
                        {years.map((year) => (
                            <td key={year.to} className="text-center">
                                {formatNumber(year.activePlayers)}
                            </td>
                        ))}
                    </tr>
                    <tr>
                        <td className="fw-bold">
                            Payments
                            <Tooltip content="Including payments based on credit">
                                <span className="svg-icon svg-icon-muted svg-icon-6 ms-2">
                                    <QuestionIcon />
                                </span>
                            </Tooltip>
                        </td>
                        {years.map((year) => (
                            <td key={year.to} className="text-center">
                                {formatNumber(year.paymentsCount)}
                            </td>
                        ))}
                    </tr>
                    <tr>
                        <td className="fw-bold">
                            Retention
                            <Tooltip
                                content={
                                    <div className="text-center">
                                        Take all players who paid prev year, and calculate percent who also paid this
                                        year
                                    </div>
                                }
                            >
                                <span className="svg-icon svg-icon-muted svg-icon-6 ms-2">
                                    <QuestionIcon />
                                </span>
                            </Tooltip>
                        </td>
                        {years.map((year) => (
                            <td key={year.to} className="text-center">
                                {year.playersPaidLastYear > 0
                                    ? `${Math.floor((year.playersPaidThisYearAgain / year.playersPaidLastYear) * 100)}%`
                                    : '-'}
                            </td>
                        ))}
                    </tr>
                </tbody>
            </table>
        </Card>
    );
};

export default GlobalStats;
