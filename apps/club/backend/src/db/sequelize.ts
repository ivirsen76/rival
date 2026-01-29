import { Sequelize } from 'sequelize';
import { mysqlOptions } from '../config';
import config from '../config/default';

// @ts-expect-error - mysqlOptions are complicated type
export default new Sequelize(config.mysql, mysqlOptions);
