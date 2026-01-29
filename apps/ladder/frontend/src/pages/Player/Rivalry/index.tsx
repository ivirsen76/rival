import { formatDate } from '@/utils/dayjs';
import classnames from 'classnames';
import Chart from '@rival/packages/components/Chart';

type RivalryProps = {
    rivalry: object;
    user: object;
};

const Rivalry = (props: RivalryProps) => {
    const { rivalry, user } = props;

    const stat = (() => {
        const result = [{ date: '', diff: 0 }];
        for (let i = rivalry.matches.length - 1; i >= 0; i--) {
            const match = rivalry.matches[i];
            const item = { date: `${formatDate(match.date)}(${match.id})` };
            item.diff = result[result.length - 1].diff + (match.isWinner ? 1 : -1);
            result.push(item);
        }
        return result;
    })();

    const chartInit = ({ am4core, am4charts, instance }) => {
        const dateAxis = instance.xAxes.push(new am4charts.CategoryAxis());
        dateAxis.dataFields.category = 'date';
        dateAxis.renderer.labels.template.adapter.add('textOutput', (text) => text && text.replace(/\(\d+\)/, ''));

        const valueAxis = instance.yAxes.push(new am4charts.ValueAxis());
        valueAxis.tooltip.disabled = true;
        valueAxis.maxPrecision = 0;

        const series = instance.series.push(new am4charts.LineSeries());
        series.dataFields.valueY = 'diff';
        series.dataFields.categoryX = 'date';
        series.strokeWidth = 3;
        series.tensionX = 0.95;
        series.tensionY = 0.95;
        series.fillOpacity = 0.1;

        // Create a range to change stroke for values below 0
        const range = valueAxis.createSeriesRange(series);
        range.value = 0;
        range.endValue = -1000;
        range.contents.stroke = instance.colors.getIndex(8);
        range.contents.fill = range.contents.stroke;
        range.contents.strokeOpacity = 0.7;
        range.contents.fillOpacity = 0.1;

        // Draw line for 0
        const range2 = valueAxis.axisRanges.create();
        range2.value = 0;
        range2.grid.stroke = am4core.color('#999');
        range2.grid.strokeWidth = 1;
        range2.grid.strokeOpacity = 1;
    };

    const getData = ({ am4core, am4charts, instance }) => stat;

    return (
        <div>
            <p>
                <b>Matches:</b> {rivalry.won}-{rivalry.lost}
            </p>
            <div className="mb-6">
                <Chart init={chartInit} getData={getData} height="450px" />
            </div>
            <table className="table tl-table">
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Season</th>
                        <th className="d-none d-lg-table-cell">Level</th>
                        <th className="d-none d-lg-table-cell">Winner</th>
                        <th className="d-none d-lg-table-cell rounded-end pe-4">Score</th>
                        <th className="d-table-cell d-lg-none">Winner</th>
                    </tr>
                </thead>
                <tbody>
                    {rivalry.matches.map((match) => {
                        const winner = match.isWinner
                            ? `${user.firstName} ${user.lastName}`
                            : `${rivalry.opponent.firstName} ${rivalry.opponent.lastName}`;

                        return (
                            <tr key={match.id} className={classnames({ 'table-primary': match.isWinner })}>
                                <td>{formatDate(match.date)}</td>
                                <td className="text-nowrap">
                                    {match.season}
                                    <div className="d-table-cell d-lg-none">{match.level}</div>
                                </td>
                                <td className="d-none d-lg-table-cell">{match.level}</td>
                                <td className="d-none d-lg-table-cell">{winner}</td>
                                <td className="text-break">
                                    <div className="d-table-cell d-lg-none">{winner}</div>
                                    <span className="text-nowrap">{match.score}</span>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

export default Rivalry;
