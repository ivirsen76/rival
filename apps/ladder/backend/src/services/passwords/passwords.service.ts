// Initializes the `passwords` service on path `/passwords`
import { Passwords } from './passwords.class';
import hooks from './passwords.hooks';

export default function (app) {
    const options = {
        paginate: app.get('paginate'),
    };

    // Initialize our service with any options it requires
    const service = app.declareService('passwords', new Passwords(options, app));

    service.hooks(hooks);
}
