// Initializes the `settings` service on path `/settings`
import { Settings } from './settings.class';
import createModel from '../../models/settings.model';
import hooks from './settings.hooks';

export default function (app) {
    const options = {
        Model: createModel(app),
        paginate: app.get('paginate'),
    };

    // Initialize our service with any options it requires
    const service = app.declareService('settings', new Settings(options, app));

    service.hooks(hooks);
}
