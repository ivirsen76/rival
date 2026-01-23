// @ts-nocheck
// Initializes the `teams` service on path `/teams`
import { Teams } from './teams.class';
import hooks from './teams.hooks';

export default function (app) {
    const options = {
        paginate: app.get('paginate'),
    };

    // Initialize our service with any options it requires
    const service = app.declareService('teams', new Teams(options, app));

    service.hooks(hooks);
}
