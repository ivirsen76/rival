// Initializes the `players` service on path `/players`
import { Players } from './players.class';
import createModel from '../../models/players.model';
import hooks from './players.hooks';

export default function (app) {
    const options = {
        Model: createModel(app),
        paginate: app.get('paginate'),
    };

    // Initialize our service with any options it requires
    const service = app.declareService('players', new Players(options, app));

    service.hooks(hooks);
}
