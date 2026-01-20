// Initializes the `actions` service on path `/actions`
import { Actions } from './actions.class';
import hooks from './actions.hooks';

export default function (app) {
    const options = {
        paginate: app.get('paginate'),
    };

    // Initialize our service with any options it requires
    const service = app.declareService('actions', new Actions(options, app));

    service.hooks(hooks);
}
