// @ts-nocheck
import type { Application } from '@feathersjs/feathers';
import axios from 'axios';
import logger from '@rival-tennis-ladder/logger';
import getCombinedConfig from './getCombinedConfig';

export default async (app: Application) => {
    const sequelize = app.get('sequelizeClient');

    const { TL_STORE_TOKEN, TL_STORE_URL } = process.env;

    const config = await getCombinedConfig();

    const response = await axios.get(`${TL_STORE_URL}/api/cities?populate=*`, {
        headers: { Authorization: `Bearer ${TL_STORE_TOKEN}` },
    });

    const myCity = response.data.data.find(
        (item) => item.attributes.name === config.city && item.attributes.state.data.attributes.short === config.state
    );

    if (!myCity) {
        return;
    }

    const getDistance = (city1, city2) =>
        (city1.attributes.left - city2.attributes.left) ** 2 + (city1.attributes.top - city2.attributes.top) ** 2;

    const citiesNearby = response.data.data
        .filter((item) => item.id !== myCity.id && item.attributes.published)
        .map((item) => ({
            name: item.attributes.name,
            slug: item.attributes.slug,
            state: item.attributes.state.data.attributes.short,
            distance: getDistance(myCity, item),
        }))
        .sort((a, b) => a.distance - b.distance);

    const global = JSON.stringify({
        citiesNearby,
    });

    await sequelize.query('UPDATE settings SET global=:global WHERE id=1', {
        replacements: { global },
    });

    logger.info('Global information is updated');
};
