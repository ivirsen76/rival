// Initializes the `emails` service on path `/emails`
import { Emails } from './emails.class';
import createModel from '../../models/emails.model';
import hooks from './emails.hooks';

export default function (app) {
    const options = {
        Model: createModel(app),
        paginate: app.get('paginate'),
    };

    // Initialize our service with any options it requires
    const service = app.declareService('emails', new Emails(options, app));

    service.hooks(hooks);
}
