// @ts-nocheck
// Initializes the `clubs` service on path `/clubs`
import { Clubs } from './clubs.class';
import createModel from '../../models/clubs.model';
import hooks from './clubs.hooks';

export default function (app) {
    const options = {
        Model: createModel(app),
        paginate: app.get('paginate'),
    };

    // Initialize our service with any options it requires
    const service = app.declareService('clubs', new Clubs(options, app));

    service.hooks(hooks);
}
