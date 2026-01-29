import _get from 'lodash/get';
import PerformanceChart from './PerformanceChart';
import Tooltip from '@rival/packages/components/Tooltip';
import { Link } from 'react-router-dom';
import classnames from 'classnames';
import formatElo from '@rival/ladder.backend/src/utils/formatElo';
import style from './style.module.scss';

const stages = {
    regular: { color: '#ecf2ff', render: 'R' },
    roundOf16: { color: '#afeeee', render: 'R16' },
    quarterfinal: { color: '#ffebcd', render: 'QF' },
    semifinal: { color: '#ffff00', render: 'SF' },
    final: { color: '#d8bfd8', render: 'F' },
    champion: { color: '#00ff00', render: 'C' },
};

type CalendarProps = {
    data: object;
    levelSlug: string;
    levelType: string;
};

const Calendar = (props: CalendarProps) => {
    const { levelSlug, levelType } = props;

    const years = [];
    for (let year = props.data.minYear; year <= props.data.maxYear; year++) {
        years.push(year);
    }

    const isSingle = levelType === 'single';

    const seasons = [
        { value: 'spring', label: 'Spring' },
        { value: 'summer', label: 'Summer' },
        { value: 'fall', label: 'Fall' },
        { value: 'winter', label: 'Winter' },
    ];

    const getStage = (year, season) => {
        const result = _get(props.data, `years.${year}.seasons.${season}.result`);
        return result || null;
    };

    let missedYears = 0;
    const chartData = years.reduce((res, year, index, arr) => {
        const yearData = _get(props.data, `years.${year}`);
        const isLast = arr.length === index + 1;

        if (!yearData) {
            missedYears++;
        }

        if (missedYears > 0 && (isLast || yearData)) {
            const lastYear = yearData ? year - 1 : year;

            res.push({
                year: missedYears === 1 ? lastYear.toString() : '...',
                totalMatches: null,
                matchWinPercent: null,
                totalTb: null,
                tbWinPercent: null,
                avgTLR: null,
            });
        }

        if (yearData) {
            missedYears = 0;
            const totalMatches = yearData.won + yearData.lost;
            const totalTb = yearData.tbWon + yearData.tbLost;

            res.push({
                year: year.toString(),
                totalMatches: totalMatches > 0 ? totalMatches : null,
                matchWinPercent: totalMatches > 0 ? Math.floor((yearData.won / totalMatches) * 100) : null,
                totalTb: totalTb > 0 ? totalTb : null,
                tbWinPercent: totalTb > 0 ? Math.floor((yearData.tbWon / totalTb) * 100) : null,
                avgTLR: yearData.avgTLR > 0 ? yearData.avgTLR : null,
            });
        }

        return res;
    }, []);

    const tooltip = (
        <Tooltip
            content={
                <div className={style.key}>
                    <div className={classnames(style.stage, style.regular)}>R</div>
                    <div>Regular season</div>
                    <div className={classnames(style.stage, style.roundOf16)}>R16</div>
                    <div>Round of 16</div>
                    <div className={classnames(style.stage, style.quarterfinal)}>QF</div>
                    <div>Quarterfinal</div>
                    <div className={classnames(style.stage, style.semifinal)}>SF</div>
                    <div>Semifinal</div>
                    <div className={classnames(style.stage, style.final)}>F</div>
                    <div>Final</div>
                    <div className={classnames(style.stage, style.champion)}>C</div>
                    <div>Champion</div>
                </div>
            }
            placement="bottom-start"
            theme="light"
        >
            <div
                className="text-muted border-1 border-bottom-dashed fw-normal d-inline-block"
                style={{ cursor: 'pointer' }}
            >
                Key
            </div>
        </Tooltip>
    );

    const renderTheOnlyValue = (name, render) => {
        const value = chartData[0][name];

        if (!Number.isInteger(value)) {
            return '-';
        }

        return render ? render(value) : value;
    };

    return (
        <div className={style.wrapper}>
            <table className={style.table} style={{ width: 'auto' }}>
                <thead>
                    <tr>
                        <th className="ps-0">{tooltip}</th>
                        {chartData.map((item, index) => (
                            <th key={item.year + index}>{item.year}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {seasons.map((season) => (
                        <tr key={season.value}>
                            <td>{season.label}</td>
                            {chartData.map((item, index) => {
                                const stage = getStage(item.year, season.value);
                                if (!stage) {
                                    return (
                                        <td key={item.year + index} className={style.placeholder}>
                                            <div>-</div>
                                        </td>
                                    );
                                }

                                return (
                                    <td key={item.year + index}>
                                        <Link to={`/season/${item.year}/${season.value}/${levelSlug}`}>
                                            <div className={style.stage + ' ' + style[stage]}>
                                                {stages[stage].render}
                                            </div>
                                        </Link>
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
                <tfoot>
                    {chartData.length === 1 ? (
                        <>
                            <tr>
                                <td>Matches Played</td>
                                <td>{renderTheOnlyValue('totalMatches')}</td>
                            </tr>
                            <tr>
                                <td>Match Win %</td>
                                <td>{renderTheOnlyValue('matchWinPercent', (value) => `${value}%`)}</td>
                            </tr>
                            <tr>
                                <td>Tiebreaks Played</td>
                                <td>{renderTheOnlyValue('totalTb')}</td>
                            </tr>
                            <tr>
                                <td>Tiebreak Win %</td>
                                <td>{renderTheOnlyValue('tbWinPercent', (value) => `${value}%`)}</td>
                            </tr>
                        </>
                    ) : (
                        <>
                            <tr>
                                <td>
                                    <div>
                                        Matches
                                        <br />
                                        Played
                                    </div>
                                    <div className="mt-6">
                                        Match
                                        <br />
                                        Win %
                                    </div>
                                </td>
                                <td colSpan={chartData.length}>
                                    <div className={style.chart}>
                                        <div className="position-relative" style={{ zIndex: 1 }}>
                                            <PerformanceChart data={chartData} dataKey="totalMatches" color="#ca472f" />
                                        </div>
                                        <div className="mt-n4">
                                            <PerformanceChart
                                                data={chartData}
                                                dataKey="matchWinPercent"
                                                renderLabel={(value) => `${value}%`}
                                                color="#ca472f"
                                            />
                                        </div>
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <div>
                                        Tiebreaks
                                        <br />
                                        Played
                                    </div>
                                    <div className="mt-6">
                                        Tiebreak
                                        <br />
                                        Win %
                                    </div>
                                </td>
                                <td colSpan={chartData.length}>
                                    <div className={style.chart}>
                                        <div className="position-relative" style={{ zIndex: 1 }}>
                                            <PerformanceChart data={chartData} dataKey="totalTb" color="#0b84a5" />
                                        </div>
                                        <div className="mt-n4">
                                            <PerformanceChart
                                                data={chartData}
                                                dataKey="tbWinPercent"
                                                renderLabel={(value) => `${value}%`}
                                                color="#0b84a5"
                                            />
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        </>
                    )}
                    {isSingle ? (
                        chartData.length === 1 ? (
                            <tr>
                                <td>Average TLR</td>
                                <td>{renderTheOnlyValue('avgTLR', formatElo)}</td>
                            </tr>
                        ) : (
                            <tr>
                                <td>
                                    Average
                                    <br />
                                    TLR
                                </td>
                                <td colSpan={chartData.length}>
                                    <div className={style.chart}>
                                        <PerformanceChart
                                            data={chartData}
                                            dataKey="avgTLR"
                                            color="#ec934e"
                                            renderLabel={formatElo}
                                        />
                                    </div>
                                </td>
                            </tr>
                        )
                    ) : null}
                </tfoot>
            </table>
        </div>
    );
};

export default Calendar;
