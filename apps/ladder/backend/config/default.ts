import 'dotenv/config';

const {
    TL_DB_NAME,
    TL_DB_HOSTNAME,
    TL_DB_USERNAME,
    TL_DB_PASSWORD,
    TL_SERVER_HOST,
    TL_SERVER_PORT,
    TL_REDIS_HOST,
    TL_REDIS_PORT,
} = process.env;

export default {
    apiPrefix: '/api',
    host: TL_SERVER_HOST,
    port: TL_SERVER_PORT,
    public: '../public/',
    paginate: {
        default: 1000,
        max: 1000,
    },
    authentication: {
        entity: 'user',
        service: 'api/users',
        secret: 'SUyPcAxYNqNNnrp2rsKU7V0ItmE=',
        authStrategies: ['jwt', 'local'],
        jwtOptions: {
            header: {
                typ: 'access',
            },
            audience: 'https://yourdomain.com',
            issuer: 'feathers',
            algorithm: 'HS256',
            expiresIn: '28d',
        },
        local: {
            usernameField: 'email',
            passwordField: 'password',
        },
        maximumSessionLength: '365d',
    },
    mysql: `mysql://${TL_DB_USERNAME}:${TL_DB_PASSWORD}@${TL_DB_HOSTNAME}:3306/${TL_DB_NAME}`,
    redis: {
        host: TL_REDIS_HOST,
        port: TL_REDIS_PORT,
    },
};
