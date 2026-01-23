// @ts-nocheck
// Initializes the `users` service on path `/users`
import { Users } from './users.class';
import createModel from '../../models/users.model';
import hooks from './users.hooks';

export default function (app) {
    const options = {
        Model: createModel(app),
        paginate: app.get('paginate'),
    };

    // Initialize our service with any options it requires
    const service = app.declareService('users', new Users(options, app));

    service.hooks(hooks);
}
