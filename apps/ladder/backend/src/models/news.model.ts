// See http://docs.sequelizejs.com/en/latest/docs/models-definition/
// for more of what you can do here.
import Sequelize from 'sequelize';

export default function (app) {
    const sequelizeClient = app.get('sequelizeClient');
    const news = sequelizeClient.define(
        'news',
        {
            date: Sequelize.DATE,
            content: Sequelize.TEXT,
            isManual: Sequelize.BOOLEAN,
        },
        {
            hooks: {
                beforeCount(options) {
                    options.raw = true;
                },
            },
        }
    );

    return news;
}
