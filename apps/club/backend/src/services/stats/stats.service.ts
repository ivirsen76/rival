// @ts-nocheck
// Initializes the `stats` service on path `/stats`
import { Stats } from './stats.class';
import hooks from './stats.hooks';

export default function (app) {
    const options = {
        paginate: app.get('paginate'),
    };

    // Initialize our service with any options it requires
    const service = app.declareService('stats', new Stats(options, app));

    service.hooks(hooks);
}
