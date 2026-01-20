// Initializes the `seasons` service on path `/seasons`
import { Seasons } from './seasons.class';
import createModel from '../../models/seasons.model';
import hooks from './seasons.hooks';

export default function (app) {
    const options = {
        Model: createModel(app),
        paginate: {
            default: 1000,
            max: 1000,
        },
    };

    // Initialize our service with any options it requires
    const service = app.declareService('seasons', new Seasons(options, app));

    service.hooks(hooks);
}
