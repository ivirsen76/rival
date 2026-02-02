// @ts-nocheck
// Initializes the `associations` service on path `/associations`
import { Associations } from './associations.class';
import createModel from '../../models/associations.model';
import hooks from './associations.hooks';

export default function (app) {
    const options = {
        Model: createModel(app),
        paginate: app.get('paginate'),
    };

    // Initialize our service with any options it requires
    const service = app.declareService('associations', new Associations(options, app));

    service.hooks(hooks);
}
