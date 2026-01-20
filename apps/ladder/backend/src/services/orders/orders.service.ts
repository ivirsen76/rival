// Initializes the `orders` service on path `/orders`
import { Orders } from './orders.class';
import createModel from '../../models/orders.model';
import hooks from './orders.hooks';

export default function (app) {
    const options = {
        Model: createModel(app),
        paginate: app.get('paginate'),
    };

    // Initialize our service with any options it requires
    const service = app.declareService('orders', new Orders(options, app));

    service.hooks(hooks);
}
