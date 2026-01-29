import { useState, useMemo } from 'react';
import { useQuery } from 'react-query';
import Loader from '@rival/packages/components/Loader';
import Card from '@rival/packages/components/Card';
import Chart from '@rival/packages/components/Chart';
import axios from '@/utils/axios';
import _xor from 'lodash/xor';
import classnames from 'classnames';
import dayjs from '@/utils/dayjs';

const percentChartInit =
    () =>
    ({ am4core, am4charts, instance }) => {
        const interfaceColors = new am4core.InterfaceColorSet();

        const dateAxis = instance.xAxes.push(new am4charts.CategoryAxis());
        dateAxis.dataFields.category = 'date';

        const valueAxis = instance.yAxes.push(new am4charts.ValueAxis());
        valueAxis.tooltip.disabled = true;
        valueAxis.min = 0;
        valueAxis.max = 100;
        valueAxis.renderer.labels.template.adapter.add('text', (text, target) => target.dataItem.value + '%');

        function addSeries(valueKey, name, color) {
            const series = instance.series.push(new am4charts.LineSeries());
            series.dataFields.valueY = valueKey;
            series.dataFields.categoryX = 'date';
            series.tooltipText = `${name}: [bold]{valueY}%[/]`;
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

        addSeries('openedPercent', 'Opened', 6);
        addSeries('clickedPercent', 'Clicked', 10);

        instance.cursor = new am4charts.XYCursor();
    };

const absoluteChartInit =
    () =>
    ({ am4core, am4charts, instance }) => {
        const interfaceColors = new am4core.InterfaceColorSet();

        const dateAxis = instance.xAxes.push(new am4charts.CategoryAxis());
        dateAxis.dataFields.category = 'date';

        const valueAxis = instance.yAxes.push(new am4charts.ValueAxis());
        valueAxis.tooltip.disabled = true;
        valueAxis.min = 0;

        function addSeries(valueKey, name, color) {
            const series = instance.series.push(new am4charts.LineSeries());
            series.dataFields.valueY = valueKey;
            series.dataFields.categoryX = 'date';
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

        addSeries('sent', 'Sent', 2);
        addSeries('opened', 'Opened', 6);
        addSeries('clicked', 'Clicked', 10);

        instance.cursor = new am4charts.XYCursor();
    };

const Tracking = (props) => {
    const [codes, setCodes] = useState([]);

    const { data: stat, isLoading } = useQuery(
        'getTrackingStats',
        async () => {
            const response = await axios.put('/api/utils/0', { action: 'getTrackingStats' });
            setCodes([...new Set(response.data.data.map((item) => item.code))].sort((a, b) => a.localeCompare(b)));

            return response.data.data;
        },
        { staleTime: 0 }
    );

    const allCodes = useMemo(() => {
        if (!stat) {
            return [];
        }

        return [...new Set(stat.map((item) => item.code))].sort((a, b) => a.localeCompare(b));
    }, [stat]);

    const data = useMemo(() => {
        if (!stat) {
            return [];
        }

        return stat
            .filter((item) => codes.includes(item.code))
            .sort((a, b) => a.date.localeCompare(b.date))
            .reduce((arr, item) => {
                let last = arr[arr.length - 1];
                if (!last || last.date !== item.date) {
                    last = {
                        date: item.date,
                        sent: 0,
                        opened: 0,
                        clicked: 0,
                        openedPercent: 0,
                        clickedPercent: 0,
                    };
                    arr.push(last);
                }

                last.sent += item.sent;
                last.opened += item.opened;
                last.clicked += item.clicked;
                last.openedPercent = last.sent === 0 ? 0 : Math.floor((100 * last.opened) / last.sent);
                last.clickedPercent = last.opened === 0 ? 0 : Math.floor((100 * last.clicked) / last.opened);

                return arr;
            }, []);
    }, [stat, codes]);

    const total = useMemo(() => {
        if (!stat) {
            return null;
        }

        const currentDate = dayjs.tz().format('YYYY-MM-DD');
        const filteredStat = stat.filter((item) => codes.includes(item.code) && item.date !== currentDate);

        if (filteredStat.length === 0) {
            return null;
        }

        return filteredStat.reduce((obj, item) => {
            obj.total ||= {
                sent: 0,
                opened: 0,
                clicked: 0,
                openedPercent: 0,
                clickedPercent: 0,
            };

            obj[item.code] ||= {
                sent: 0,
                opened: 0,
                clicked: 0,
                openedPercent: 0,
                clickedPercent: 0,
            };

            obj.total.sent += item.sent;
            obj.total.opened += item.opened;
            obj.total.clicked += item.clicked;
            obj.total.openedPercent = obj.total.sent === 0 ? 0 : Math.floor((100 * obj.total.opened) / obj.total.sent);
            obj.total.clickedPercent =
                obj.total.opened === 0 ? 0 : Math.floor((100 * obj.total.clicked) / obj.total.opened);

            obj[item.code].sent += item.sent;
            obj[item.code].opened += item.opened;
            obj[item.code].clicked += item.clicked;
            obj[item.code].openedPercent =
                obj[item.code].sent === 0 ? 0 : Math.floor((100 * obj[item.code].opened) / obj[item.code].sent);
            obj[item.code].clickedPercent =
                obj[item.code].opened === 0 ? 0 : Math.floor((100 * obj[item.code].clicked) / obj[item.code].opened);

            return obj;
        }, {});
    }, [stat, codes]);

    const toggleCode = (code) => {
        setCodes(_xor(codes, [code]));
    };

    if (isLoading) {
        return <Loader loading />;
    }

    const renderSummary = (obj) => (
        <div>
            <div>
                Sent: <b>{obj.sent}</b>
            </div>
            <div>
                Opened: <b>{obj.opened}</b>
            </div>
            <div>
                Opened percent: <b>{obj.openedPercent}%</b>
            </div>
            <div>
                Clicked: <b>{obj.clicked}</b>
            </div>
            <div>
                Clicked percent: <b>{obj.clickedPercent}%</b>
            </div>
        </div>
    );

    return (
        <Card>
            <h3>Filter</h3>
            <div className="d-flex gap-2">
                {allCodes.map((code) => (
                    <button
                        key={code}
                        type="button"
                        className={classnames('btn btn-sm', codes.includes(code) ? 'btn-primary' : 'btn-light')}
                        onClick={() => toggleCode(code)}
                    >
                        {code}
                    </button>
                ))}
            </div>

            {codes.length > 0 && (
                <>
                    <h3 className="mb-2">Summary</h3>
                    <div className="mb-4">(Excluding today, as opened/clicked stats are not gathered yet.)</div>
                    <div className="d-flex gap-8">
                        {codes.length > 1 && total && (
                            <div>
                                <h4 className="mb-2">Total:</h4>
                                {renderSummary(total.total)}
                            </div>
                        )}
                        {allCodes
                            .filter((code) => codes.includes(code) && total && total[code])
                            .map((code) => (
                                <div key={code}>
                                    <h4 className="mb-2">{code}:</h4>
                                    {renderSummary(total[code])}
                                </div>
                            ))}
                    </div>

                    <h3>Percent</h3>
                    <Chart
                        key={'percent:' + codes.join(':')}
                        init={percentChartInit()}
                        getData={() => data}
                        height="450px"
                    />

                    <h3>Total</h3>
                    <Chart
                        key={'absolute:' + codes.join(':')}
                        init={absoluteChartInit()}
                        getData={() => data}
                        height="450px"
                    />
                </>
            )}
        </Card>
    );
};

export default Tracking;
