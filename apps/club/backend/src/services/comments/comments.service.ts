// @ts-nocheck
import { Comments } from './comments.class';
import createModel from '../../models/comments.model';
import hooks from './comments.hooks';

export default function (app) {
    const options = {
        Model: createModel(app),
        paginate: app.get('paginate'),
    };

    // Initialize our service with any options it requires
    const service = app.declareService('comments', new Comments(options, app));

    service.hooks(hooks);
}
