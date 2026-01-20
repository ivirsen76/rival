import { Reports } from './reports.class';
import createModel from '../../models/reports.model';
import hooks from './reports.hooks';

export default function (app) {
    const options = {
        Model: createModel(app),
        paginate: app.get('paginate'),
    };

    // Initialize our service with any options it requires
    const service = app.declareService('reports', new Reports(options, app));

    service.hooks(hooks);
}
