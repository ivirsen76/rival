// @ts-nocheck
// Initializes the `feedbacks` service on path `/feedbacks`
import { Feedbacks } from './feedbacks.class';
import createModel from '../../models/feedbacks.model';
import hooks from './feedbacks.hooks';

export default function (app) {
    const options = {
        Model: createModel(app),
        paginate: app.get('paginate'),
    };

    // Initialize our service with any options it requires
    const service = app.declareService('feedbacks', new Feedbacks(options, app));

    service.hooks(hooks);
}
