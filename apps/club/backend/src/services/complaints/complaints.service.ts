// @ts-nocheck
// Initializes the `complaints` service on path `/complaints`
import { Complaints } from './complaints.class';
import createModel from '../../models/complaints.model';
import hooks from './complaints.hooks';

export default function (app) {
    const options = {
        Model: createModel(app),
        paginate: app.get('paginate'),
    };

    // Initialize our service with any options it requires
    const service = app.declareService('complaints', new Complaints(options, app));

    service.hooks(hooks);
}
