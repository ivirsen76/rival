// @ts-nocheck
// Initializes the `proposals` service on path `/proposals`
import { Proposals } from './proposals.class';
import hooks from './proposals.hooks';

export default function (app) {
    const options = {
        paginate: app.get('paginate'),
    };

    // Initialize our service with any options it requires
    const service = app.declareService('proposals', new Proposals(options, app));

    service.hooks(hooks);
}
