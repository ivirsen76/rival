// @ts-nocheck
import type { Application } from '@feathersjs/feathers';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import dayjs from '@rival/dayjs';
import getCombinedConfig from './getCombinedConfig';

export default async (app: Application) => {
    const sequelize = app.get('sequelizeClient');
    const { TL_WEATHER_TEAM_ID, TL_WEATHER_KEY_ID, TL_WEATHER_AUTH_KEY_PATH } = process.env;

    if (!TL_WEATHER_TEAM_ID || !TL_WEATHER_KEY_ID || !TL_WEATHER_AUTH_KEY_PATH) {
        return;
    }

    const config = await getCombinedConfig();
    if (!config.latitude || !config.longitude) {
        return;
    }

    // Populate prev date weather if possible
    const [rows] = await sequelize.query('SELECT weather FROM settings WHERE id=1');
    const prevDayWeather = (() => {
        if (!rows[0].weather) {
            return [];
        }
        const prevWeather = JSON.parse(rows[0].weather);
        const prevDate = dayjs.tz().subtract(1, 'day').format('YYYY-MM-DD');

        const result = prevWeather.hours.filter((item) => item.datetime.startsWith(prevDate));
        if (result.length === 24) {
            return result;
        }

        return prevWeather.prevDay || [];
    })();

    const hourlyStart = dayjs.tz().hour(0).minute(0).second(0).utc().format('YYYY-MM-DDTHH:mm:ss[Z]');
    const currentUnixTime = Math.floor(Date.now() / 1000);
    const privateKey = fs.readFileSync(TL_WEATHER_AUTH_KEY_PATH);
    const token = jwt.sign(
        {
            iss: TL_WEATHER_TEAM_ID,
            iat: currentUnixTime,
            exp: currentUnixTime + 24 * 3600,
            sub: 'com.tennis-ladder',
        },
        privateKey,
        {
            header: {
                alg: 'ES256',
                kid: TL_WEATHER_KEY_ID,
                id: `${TL_WEATHER_TEAM_ID}.com.tennis-ladder`,
            },
        }
    );

    const response = await axios.get(
        `https://weatherkit.apple.com/api/v1/weather/en/${config.latitude}/${config.longitude}?dataSets=forecastDaily,forecastHourly&hourlyStart=${hourlyStart}`,
        { headers: { Authorization: `Bearer ${token}` } }
    );

    const getDateDiff = (date1: string, date2: string) => {
        const date1ms = new Date(date1).getTime();
        const date2ms = new Date(date2).getTime();

        return Math.round(((date2ms - date1ms) / (24 * 3600 * 1000)) * 100);
    };

    function convertToF(celsius: number) {
        return (celsius * 9) / 5 + 32;
    }

    const firstDay = dayjs.tz().hour(0).minute(0).second(0);
    const weather = {
        days: response.data.forecastDaily.days.map((day) => ({
            datetime: day.forecastStart.slice(0, 10),
            condition: day.daytimeForecast.conditionCode,
            precip: day.precipitationAmount / 25.4,
            precipChance: day.precipitationChance * 100,
            sunrisePercent: getDateDiff(day.forecastStart, day.sunrise),
            sunsetPercent: getDateDiff(day.sunset, day.forecastEnd),
        })),
        hours: response.data.forecastHourly.hours.slice(0, 240).map((item, index) => {
            const hour = index % 24;
            const dayShift = Math.floor(index / 24);
            const precip = item.precipitationAmount / 25.4;

            return {
                datetime: firstDay.add(dayShift, 'day').hour(hour).format('YYYY-MM-DD HH:mm:ss'),
                condition: item.conditionCode,
                temp: convertToF(item.temperature),
                humidity: item.humidity,
                precip,
                precipChance: item.precipitationChance * 100,
                precipType: item.precipitationType,
                windspeed: item.windSpeed / 1.6,
                dayPart: item.daylight ? 'day' : 'night',
            };
        }),
        prevDay: prevDayWeather,
    };

    await sequelize.query('UPDATE settings SET weather=:weather WHERE id=1', {
        replacements: { weather: JSON.stringify(weather) },
    });
};
