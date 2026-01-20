import { Reactions } from './reactions.class';
import createModel from '../../models/reactions.model';
import hooks from './reactions.hooks';

export default function (app) {
    const options = {
        Model: createModel(app),
        paginate: app.get('paginate'),
    };

    // Initialize our service with any options it requires
    const service = app.declareService('reactions', new Reactions(options, app));

    service.hooks(hooks);
}
