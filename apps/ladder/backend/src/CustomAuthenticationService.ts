import { AuthenticationService } from '@feathersjs/authentication';

export default class CustomAuthenticationService extends AuthenticationService {
    async getPayload(authResult, params) {
        const { authentication } = authResult;

        // oat – the original issuing timestamp
        // reuse oat if we're authenticating with an existing jwt
        // generate a new timestamp if we're creating a brand new jwt
        let oat;

        // authentication.payload is the payload of succesfully decoded existing jwt token
        if (authentication.strategy === 'jwt' && authentication.payload && authentication.payload.oat) {
            oat = authentication.payload.oat;
        } else {
            oat = Math.round(Date.now() / 1000);
        }

        const originalPayload = await super.getPayload(authResult, params);
        const { user } = authResult;

        return { ...originalPayload, oat, ...(user?.roles ? { roles: user.roles } : {}) };
    }
}
