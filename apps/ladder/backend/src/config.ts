export const projectedTlrMultipliers = {
    5: 1.2,
    6: 1.16,
    7: 1.12,
    8: 1.08,
    9: 1.04,
};

export const mysqlOptions = {
    dialect: 'mysql',
    logging: false,
    define: {
        freezeTableName: true,
    },
    dialectOptions: {
        dateStrings: true,
        typeCast: true,
    },
};

export const isProduction = process.env.TL_ENV === 'production';

export default {
    projectedTlrMultipliers,
    mysqlOptions,
    isProduction,
};
