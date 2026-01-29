// @ts-nocheck
// Initializes the `payments` service on path `/payments`
import { Payments } from './payments.class';
import createModel from '../../models/payments.model';
import hooks from './payments.hooks';

export default function (app) {
    const options = {
        Model: createModel(app),
        paginate: app.get('paginate'),
    };

    // Initialize our service with any options it requires
    const service = app.declareService('payments', new Payments(options, app));

    service.hooks(hooks);
}
