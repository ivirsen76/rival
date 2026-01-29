// @ts-nocheck
// Initializes the `messages` service on path `/messages`
import { Messages } from './messages.class';
import createModel from '../../models/messages.model';
import hooks from './messages.hooks';

export default function (app) {
    const options = {
        Model: createModel(app),
        paginate: app.get('paginate'),
    };

    // Initialize our service with any options it requires
    const service = app.declareService('messages', new Messages(options, app));

    service.hooks(hooks);
}
