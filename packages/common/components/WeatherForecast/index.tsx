import useSettings from '../../utils/useSettings';
import Chart from '../Chart';
import RenderDelay from '../RenderDelay';
import Icon from './Icon';
import Hover from './Hover';
import dayjs from '../../dayjs';
import AppleIcon from './apple.svg?react';
import hslToRgb from '../../utils/hslToRgb';
import useAppearance from '../../utils/useAppearance';
import style from './style.module.scss';

type WeatherForecastProps = {
    isDelay: boolean;
};

const WeatherForecast = (props: WeatherForecastProps) => {
    const { isDelay } = props;
    const { settings } = useSettings();
    const { weather } = settings.settings;
    const appearance = useAppearance();

    const currentTime = dayjs.tz().subtract(30, 'minute').format('YYYY-MM-DD HH:mm:ss');
    const nowHour = weather.hours.find((item) => item.datetime >= currentTime);

    const totalDays = weather.days.length;

    const data = weather.hours.slice(0, totalDays * 24).map((hour, index) => ({
        ...hour,
        freezingPoint: 32,
        lineColor: hour.precipType === 'snow' ? '#d5202a' : '#009ef7',
        tempFillOpacity: hour.datetime < currentTime ? 0.02 : 0.1,
        precFillOpacity: hour.datetime < currentTime ? 0.04 : 0.2,
        strokeOpacity: hour.datetime < currentTime ? 0.2 : 1,
        ...(appearance === 'dark'
            ? {
                  tempFillOpacity: hour.datetime < currentTime ? 0.04 : 0.2,
                  strokeOpacity: hour.datetime < currentTime ? 0.2 : 0.8,
              }
            : {}),
    }));

    const minTemp = Math.min(...data.map((item) => item.temp));
    const showFreezingLevel = minTemp < 40;

    const chartInit = ({ am4core, am4charts, instance }) => {
        const dateAxis = instance.xAxes.push(new am4charts.CategoryAxis());
        dateAxis.dataFields.category = 'datetime';
        dateAxis.renderer.labels.template.disabled = true;
        dateAxis.renderer.grid.template.disabled = true;

        const valueAxis2 = instance.yAxes.push(new am4charts.ValueAxis());
        valueAxis2.min = 0;
        valueAxis2.max = 100;
        valueAxis2.renderer.labels.template.disabled = true;
        valueAxis2.renderer.grid.template.disabled = true;

        // Precipitation Chance
        const series2 = instance.series.push(new am4charts.LineSeries());
        series2.yAxis = valueAxis2;
        series2.dataFields.valueY = 'precipChance';
        series2.dataFields.categoryX = 'datetime';
        series2.strokeWidth = 2;
        series2.tensionX = 0.95;
        series2.tensionY = 0.95;
        series2.stroke = am4core.color('#009ef7');
        series2.propertyFields.fill = 'lineColor';
        series2.propertyFields.strokeOpacity = 'strokeOpacity';
        series2.propertyFields.fillOpacity = 'precFillOpacity';

        //         const valueAxis4 = instance.yAxes.push(new am4charts.ValueAxis());
        //         valueAxis4.max = 1;
        //         valueAxis4.min = 0;
        //         valueAxis4.renderer.labels.template.disabled = true;
        //         valueAxis4.renderer.grid.template.disabled = true;
        //
        //         const series4 = instance.series.push(new am4charts.LineSeries());
        //         series4.yAxis = valueAxis4;
        //         series4.dataFields.valueY = 'humidity';
        //         series4.dataFields.categoryX = 'datetime';
        //         series4.strokeWidth = 2;
        //         series4.stroke = am4core.color('#666');

        const globalStyle = getComputedStyle(document.body);
        const headerColor = hslToRgb(globalStyle.getPropertyValue('--bs-heading-color'));

        const valueAxis1 = instance.yAxes.push(new am4charts.ValueAxis());
        valueAxis1.align = 'right';
        valueAxis1.extraMin = 0.3; // slide temp graph up just to not cover rain data
        valueAxis1.extraMax = 0.1;
        valueAxis1.renderer.minGridDistance = 25;
        valueAxis1.renderer.inside = true;
        valueAxis1.renderer.maxLabelPosition = 0.99;
        valueAxis1.renderer.minLabelPosition = 0.01;
        valueAxis1.renderer.labels.template.fill = am4core.color(headerColor);
        valueAxis1.numberFormatter.numberFormat = '#°';
        valueAxis1.renderer.grid.template.stroke = am4core.color(headerColor);

        // Draw line for 32 degree
        if (showFreezingLevel) {
            const series3 = instance.series.push(new am4charts.LineSeries());
            series3.yAxis = valueAxis1;
            series3.dataFields.valueY = 'freezingPoint';
            series3.dataFields.categoryX = 'datetime';
            series3.strokeWidth = 2;
            series3.strokeDasharray = '8,4';
            series3.stroke = am4core.color('#73c5f4');
            series3.propertyFields.strokeOpacity = 'strokeOpacity';
        }

        // Temperature
        const series1 = instance.series.push(new am4charts.LineSeries());
        series1.yAxis = valueAxis1;
        series1.dataFields.valueY = 'temp';
        series1.dataFields.categoryX = 'datetime';
        series1.strokeWidth = 2;
        series1.tensionX = 0.95;
        series1.tensionY = 0.95;
        series1.stroke = am4core.color('#d5202a');
        series1.fill = am4core.color('#d5202a');
        series1.propertyFields.fillOpacity = 'tempFillOpacity';
        series1.propertyFields.strokeOpacity = 'strokeOpacity';

        const fillModifier = new am4core.LinearGradientModifier();
        fillModifier.opacities = [1, 0];
        fillModifier.offsets = [0, 1];
        fillModifier.gradient.rotation = 90;
        series1.segments.template.fillModifier = fillModifier;

        const range = dateAxis.axisRanges.create();
        range.category = nowHour.datetime;
        range.grid.stroke = am4core.color('#666');
        range.grid.strokeWidth = 2;
        range.grid.strokeOpacity = 1;
        range.label.disabled = true;

        instance.paddingTop = 0;
        instance.paddingBottom = 25;
        instance.paddingLeft = 0;
        instance.paddingRight = 0;
    };

    const getData = () => data;

    const courtDryness = (() => {
        const result = [];
        const WARNING_PERCENT = 15;
        const WET_PERCENT = 55;

        let cond = 'dry';
        let len = 0;
        const chances = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]; // 10 hours affect dry conditions

        const hasPrevDay = weather.prevDay.length > 0;
        const fullData = [...weather.prevDay, ...data];
        for (let i = 0; i < fullData.length; i++) {
            const hour = fullData[i];
            const prevCond = cond;

            chances.shift();
            const percentShift = (1 - hour.humidity) * 0.5 * 100;
            for (let j = 0; j < chances.length; j++) {
                chances[j] = Math.max(chances[j] - percentShift, 0);
            }
            chances.push(hour.precipChance || 0);

            const dryChance =
                chances.reduce((acc, num) => {
                    acc *= 1 - num / 100;
                    return acc;
                }, 1) * 100;
            const rainChance = 100 - dryChance;

            if (rainChance < WARNING_PERCENT) {
                cond = 'dry';
            } else if (rainChance < WET_PERCENT) {
                cond = 'warning';
            } else {
                cond = 'wet';
            }

            if (cond !== prevCond && len > 0) {
                if (!hasPrevDay || i >= 24) {
                    if (hasPrevDay && i - len < 24) {
                        result.push([prevCond, i - 24]);
                    } else {
                        result.push([prevCond, len]);
                    }
                }
                len = 0;
            }
            len++;
        }

        result.push([cond, Math.min(len, 240)]);

        return result;
    })();

    const chart = <Chart init={chartInit} getData={getData} height="225px" />;

    return (
        <div className={style.card}>
            <div className={style.wrapper}>
                <div className={style.header}>
                    <div className={style.days}>
                        {weather.days.map((day, index) => (
                            <div key={day.datetime} className={style.day}>
                                <div>{dayjs(day.datetime).format('ddd, MMM D')}</div>
                                <div className={style.icon}>
                                    <Icon type={day.condition} />
                                </div>
                                <div className={style.temp}>
                                    <div className={style.morning}>
                                        {Math.round(weather.hours[index * 24 + 10].temp)}&deg;
                                    </div>
                                    <div className={style.daytime}>
                                        {Math.round(weather.hours[index * 24 + 14].temp)}&deg;
                                    </div>
                                    <div className={style.night}>
                                        {Math.round(weather.hours[index * 24 + 18].temp)}&deg;
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div style={{ overflow: 'hidden', height: '5px', position: 'relative' }}>
                        <div className={style.courts}>
                            <div className={style.start + ' ' + style[courtDryness[0][0]]} />
                            {courtDryness.map((item, index) => (
                                <div key={index} className={style[item[0]]} style={{ flexGrow: item[1] }} />
                            ))}
                            <div className={style.end + ' ' + style[courtDryness[courtDryness.length - 1][0]]} />
                        </div>
                    </div>
                </div>
                <Hover weather={weather} courtDryness={courtDryness} />
                <div className={style.chart}>{isDelay ? <RenderDelay>{chart}</RenderDelay> : chart}</div>
                <div className={style.footer}>
                    <div className={style.legend}>
                        <div className={style.deg}>
                            <div className={style.morning}>{Math.round(weather.hours[10].temp)}&deg;</div>
                            <div className={style.daytime}>{Math.round(weather.hours[14].temp)}&deg;</div>
                            <div className={style.night}>{Math.round(weather.hours[18].temp)}&deg;</div>
                        </div>
                        <div className="me-6">(10 AM - 6 PM)</div>

                        <div className={style.dry}>
                            <div />
                            <div />
                            <div />
                        </div>
                        <div className="me-6">Court Dryness</div>

                        <div className={style.temp} />
                        <div className="me-6">Temperature (&deg;F)</div>

                        <div className={style.prep} />
                        <div>Chance of Precipitation (%)</div>
                    </div>
                    <div className={style.apple}>
                        Powered by{' '}
                        <a href="https://developer.apple.com/weatherkit" target="_blank" rel="noreferrer">
                            <span className="svg-icon svg-icon-primary">
                                <AppleIcon />
                            </span>
                            Weather
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WeatherForecast;
