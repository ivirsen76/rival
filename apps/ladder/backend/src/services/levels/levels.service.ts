// Initializes the `levels` service on path `/levels`
import { Levels } from './levels.class';
import createModel from '../../models/levels.model';
import hooks from './levels.hooks';

export default function (app) {
    const options = {
        Model: createModel(app),
        paginate: app.get('paginate'),
    };

    // Initialize our service with any options it requires
    const service = app.declareService('levels', new Levels(options, app));

    service.hooks(hooks);
}
