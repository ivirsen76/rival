// Initializes the `matches` service on path `/matches`
import { Matches } from './matches.class';
import createModel from '../../models/matches.model';
import hooks from './matches.hooks';

export default function (app) {
    const options = {
        Model: createModel(app),
        paginate: app.get('paginate'),
    };

    // Initialize our service with any options it requires
    const service = app.declareService('matches', new Matches(options, app));

    service.hooks(hooks);
}
