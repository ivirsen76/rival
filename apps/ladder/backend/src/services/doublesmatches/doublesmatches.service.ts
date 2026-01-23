// @ts-nocheck
// Initializes the `doublesMatches` service on path `/doublesmatches`
import { DoublesMatches } from './doublesmatches.class';
import createModel from '../../models/doublesmatches.model';
import hooks from './doublesmatches.hooks';

export default function (app) {
    const options = {
        Model: createModel(app),
        paginate: app.get('paginate'),
    };

    // Initialize our service with any options it requires
    const service = app.declareService('doublesmatches', new DoublesMatches(options, app));

    service.hooks(hooks);
}
