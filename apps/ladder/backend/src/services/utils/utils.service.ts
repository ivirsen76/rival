// Initializes the `utils` service on path `/utils`
import { Utils } from './utils.class';
import hooks from './utils.hooks';

export default function (app) {
    const options = {
        paginate: app.get('paginate'),
    };

    // Initialize our service with any options it requires
    const service = app.declareService('utils', new Utils(options, app));

    service.hooks(hooks);
}
