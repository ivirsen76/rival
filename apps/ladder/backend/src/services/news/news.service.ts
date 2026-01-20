// Initializes the `news` service on path `/news`
import { News } from './news.class';
import createModel from '../../models/news.model';
import hooks from './news.hooks';

export default function (app) {
    const options = {
        Model: createModel(app),
        paginate: app.get('paginate'),
    };

    // Initialize our service with any options it requires
    const service = app.declareService('news', new News(options, app));

    service.hooks(hooks);
}
