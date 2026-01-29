// @ts-nocheck
import ms from 'ms';
import { JWTStrategy } from '@feathersjs/authentication';
import { NotAuthenticated } from '@feathersjs/errors';
import dayjs from '@rival/dayjs';

export default class CustomJWTStrategy extends JWTStrategy {
    async authenticate(authentication, params) {
        const config = this.authentication.configuration;
        const { maximumSessionLength, jwtOptions } = config;

        // run all of the original authentication logic, e.g. checking
        // if the token is there, is valid, is not expired, etc.
        const res = await super.authenticate(authentication, params);

        if (res.user.banDate && dayjs.tz().isBefore(dayjs.tz(res.user.banDate))) {
            throw new NotAuthenticated('The user is banned');
        }

        const { payload } = res.authentication;
        // do not refresh tokens for loggedInAs users as it loses payload information
        if (payload.loginAs) {
            return res;
        }

        // use the oat date to check if we should regenerate the token
        const now = Date.now();
        const iat = payload.iat * 1000;
        const oat = payload.oat * 1000;

        // regenerate only once per day to avoid "waste"
        // check if this token has been issued today, which
        // would mean we do not need to bother regenerating it
        if (now - iat > 24 * 3600 * 1000) {
            // now check if by regenerating the token, we will
            // not exceed our maximum desired session length
            if (oat + ms(maximumSessionLength) > now + ms(jwtOptions.expiresIn)) {
                // and now the key trick - by deleting the accessToken here
                // we will get Feathers AuthenticationStrategy.create()
                // to generate us a new token, but with the original oat
                // field as specified in out custom getPayload!
                delete res.accessToken;
            }
        }

        return res;
    }
}
