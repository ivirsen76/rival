// Initializes the `calendars` service on path `/calendars`
import { Calendars } from './calendars.class';
import hooks from './calendars.hooks';

export default function (app) {
    const options = {
        paginate: app.get('paginate'),
    };

    // Initialize our service with any options it requires
    const service = app.declareService('calendars', new Calendars(options, app), (req, res, next) => {
        res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename="calendar.ics"');
        res.end(res.data);
    });

    service.hooks(hooks);
}
