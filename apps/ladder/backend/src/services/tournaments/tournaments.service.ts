// @ts-nocheck
// Initializes the `tournaments` service on path `/tournaments`
import { Tournaments } from './tournaments.class';
import createModel from '../../models/tournaments.model';
import hooks from './tournaments.hooks';

export default function (app) {
    const options = {
        Model: createModel(app),
        paginate: app.get('paginate'),
    };

    // Initialize our service with any options it requires
    const service = app.declareService('tournaments', new Tournaments(options, app));

    service.hooks(hooks);
}
