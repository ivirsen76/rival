// See http://docs.sequelizejs.com/en/latest/docs/models-definition/
// for more of what you can do here.
import Sequelize from 'sequelize';

export default function (app) {
    const sequelizeClient = app.get('sequelizeClient');
    const orders = sequelizeClient.define(
        'orders',
        {
            userId: Sequelize.INTEGER,
            amount: Sequelize.INTEGER,
            payload: Sequelize.TEXT,
            sessionId: Sequelize.STRING,
            processedAt: Sequelize.DATE,
        },
        {
            hooks: {
                beforeCount(options) {
                    options.raw = true;
                },
            },
        }
    );

    orders.associate = function (models) {
        orders.belongsTo(models.users);
    };

    return orders;
}
