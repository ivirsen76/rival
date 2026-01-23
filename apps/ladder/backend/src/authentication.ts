import type { Application } from '@feathersjs/feathers';
import { LocalStrategy } from '@feathersjs/authentication-local';
import { expressOauth } from '@feathersjs/authentication-oauth';
import authenticationHooks from './authentication.hooks';
import CustomAuthenticationService from './CustomAuthenticationService';
import CustomJWTStrategy from './CustomJWTStrategy';

export default (app: Application) => {
    const authentication = new CustomAuthenticationService(app);

    authentication.register('jwt', new CustomJWTStrategy());
    authentication.register('local', new LocalStrategy());

    app.use('/api/authentication', authentication);
    app.configure(expressOauth());

    app.service('api/authentication').hooks(authenticationHooks);
};
