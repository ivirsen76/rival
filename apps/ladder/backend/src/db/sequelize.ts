import { Sequelize } from 'sequelize';
import { mysqlOptions } from '../config';
import config from '../config/default';

export default new Sequelize(config.mysql, mysqlOptions);
