import { useCallback } from 'react';
import Chart from '@/components/Chart';
import _findLastIndex from 'lodash/findLastIndex';
import Tooltip from '@rival/packages/components/Tooltip';
import Mark from './Mark';
import useAppearance from '@/utils/useAppearance';

type EloHistoryProps = {
    tournament: object;
    eloHistory: unknown[];
};

const EloHistory = (props: EloHistoryProps) => {
    const { eloHistory, tournament } = props;
    const appearance = useAppearance();

    const isLight = appearance === 'light';

    const chartInit = useCallback(
        ({ am4core, am4charts, instance }) => {
            const matches = eloHistory.length;

            const removeMatchId = (text) => text && text.replace(/\(\d+\)/, '');

            // Get tournament selection
            let selectionStart;
            let selectionEnd;
            if (tournament) {
                selectionStart = eloHistory.findIndex((point) => point.seasonId === tournament.seasonId);
                selectionEnd = _findLastIndex(eloHistory, (point) => point.seasonId === tournament.seasonId);
                if (selectionStart === -1) {
                    selectionStart = 0;
                }
                if (selectionEnd === -1) {
                    selectionEnd = matches - 1;
                }
                if (selectionEnd - selectionStart < 20) {
                    selectionStart = Math.max(selectionEnd - 20, 0);
                }
            }

            const dateAxis = instance.xAxes.push(new am4charts.CategoryAxis());
            dateAxis.dataFields.category = 'date';
            dateAxis.renderer.labels.template.adapter.add('textOutput', removeMatchId);
            dateAxis.adapter.add('getTooltipText', removeMatchId);
            if (tournament) {
                const selectionPadding = ((selectionEnd - selectionStart) / matches) * 0.1;
                dateAxis.start = selectionStart / matches - selectionPadding;
                dateAxis.end = (selectionEnd + 1) / matches + selectionPadding;
            }

            const valueAxis = instance.yAxes.push(new am4charts.ValueAxis());
            valueAxis.tooltip.disabled = true;
            valueAxis.extraMin = 0.1;
            valueAxis.extraMax = 0.1;
            valueAxis.renderer.minGridDistance = 50;
            valueAxis.numberFormatter = new am4core.NumberFormatter();
            valueAxis.numberFormatter.numberFormat = '0.00';
            valueAxis.adjustLabelPrecision = false;

            const series = instance.series.push(new am4charts.LineSeries());
            series.dataFields.valueY = 'value';
            series.dataFields.categoryX = 'date';
            series.strokeWidth = 2;
            series.minBulletDistance = 9;
            series.propertyFields.stroke = am4core.color('#6db7d9');
            series.tensionX = 0.95;
            series.tensionY = 0.95;

            // Highlight current season
            if (tournament) {
                const tournamentStart = eloHistory.findIndex((point) => point.seasonId === tournament.seasonId);
                const tournamentEnd = _findLastIndex(eloHistory, (point) => point.seasonId === tournament.seasonId);
                if (tournamentStart !== -1) {
                    const range = dateAxis.createSeriesRange(series);
                    range.category = eloHistory[tournamentStart].date;
                    range.endCategory = eloHistory[tournamentEnd].date;
                    range.contents.fill = am4core.color(isLight ? '#000' : '#fff');
                    range.contents.fillOpacity = 0.05;
                    range.label.text = tournament.season;
                    range.label.disabled = false;
                    range.label.rotation = 0;
                    range.label.inside = true;
                    range.label.fill = am4core.color(isLight ? '#000' : '#fff');
                }
            }

            // Draw lines for levels
            [2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0, 5.5].forEach((value) => {
                const rangeLine = valueAxis.axisRanges.create();
                rangeLine.value = value;
                rangeLine.grid.stroke = am4core.color(isLight ? '#ccc' : '#666');
                rangeLine.grid.strokeWidth = 3;
                rangeLine.grid.strokeOpacity = 0.5;
            });

            const bullet = series.bullets.push(new am4charts.CircleBullet());
            bullet.circle.strokeWidth = 2;
            bullet.circle.radius = 3;
            bullet.propertyFields.stroke = am4core.color('#6db7d9');
            bullet.propertyFields.fill = 'bulletFillColor';
            bullet.tooltipHTML = '{tooltip}';
            bullet.tooltip = new am4core.Tooltip();
            bullet.tooltip.dy = -5;
            bullet.tooltip.getFillFromObject = false;
            bullet.tooltip.background.fill = am4core.color('#fff');
            bullet.tooltip.autoTextColor = false;
            bullet.tooltip.label.fill = am4core.color('#000');

            // Make a panning cursor
            instance.cursor = new am4charts.XYCursor();
            instance.cursor.lineY.disabled = true;
            instance.cursor.behavior = 'panX';
            instance.cursor.snapToSeries = series;

            const scrollbarX = new am4charts.XYChartScrollbar();
            scrollbarX.series.push(series);
            instance.scrollbarX = scrollbarX;

            instance.zoomOutButton.align = 'left';
        },
        [eloHistory]
    );

    const getData = useCallback(
        ({ am4core, am4charts, instance }) => {
            return eloHistory.map((point, index) => {
                let bulletFillColor = isLight ? '#fff' : '#000';
                if (point.isWin) {
                    bulletFillColor = '#6db7d9';
                }

                return {
                    ...point,
                    value: point.value / 100,
                    bulletFillColor,
                };
            });
        },
        [eloHistory]
    );

    const tooltip = (
        <Tooltip
            content={
                <div className="p-2">
                    <div className="d-flex align-items-center">
                        <Mark />
                        <div className="ms-4 lh-lg">Won match</div>
                    </div>
                    <div className="d-flex align-items-center">
                        <Mark isEmpty />
                        <div className="ms-4 lh-lg">Lost match</div>
                    </div>
                </div>
            }
            placement="bottom-start"
            theme="light"
        >
            <div
                className="text-muted border-1 border-bottom-dashed"
                style={{ position: 'absolute', top: 0, left: 0, zIndex: 1, cursor: 'pointer' }}
            >
                Key
            </div>
        </Tooltip>
    );

    return (
        <div className="position-relative">
            {tooltip}
            <Chart init={chartInit} getData={getData} />
        </div>
    );
};

export default EloHistory;
