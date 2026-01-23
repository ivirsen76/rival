// @ts-nocheck
// Initializes the `photos` service on path `/photos`
import { Photos } from './photos.class';
import createModel from '../../models/photos.model';
import hooks from './photos.hooks';

export default function (app) {
    const options = {
        Model: createModel(app),
        paginate: app.get('paginate'),
    };

    // Initialize our service with any options it requires
    const service = app.declareService('photos', new Photos(options, app));

    service.hooks(hooks);
}
