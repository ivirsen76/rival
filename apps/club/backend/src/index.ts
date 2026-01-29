import 'dotenv/config';
import logger from '@rival-tennis-ladder/logger';
import app from './app';

const port = app.get('port');
const server = app.listen(port);

process.on('unhandledRejection', (reason, p) => {
    logger.error(`Unhandled Promise Rejection: ${reason}`);
});

server.on('listening', () => {
    logger.info(`Application started on http://${app.get('host')}:${port}`);
});
