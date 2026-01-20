import { decodeAction, encodeBase64 } from './action';

describe('decodeAction', () => {
    it('Should return action params', () => {
        const str = encodeBase64('name=newPassword&userId=123&t=100&d=10&h=26185d52537ecb773ab0');
        expect(decodeAction(str, 105, 'SECUREKEY')).toEqual({
            name: 'newPassword',
            userId: '123',
        });
    });

    it('Should show error about duration', () => {
        const str = encodeBase64('name=newPassword&userId=123&t=100&d=10&h=26185d52537ecb773ab0');
        expect(() => decodeAction(str, 120, 'SECUREKEY')).toThrow(/^The link is expired$/);
    });

    it('Should show error about the wrong hash', () => {
        const str = encodeBase64('name=newPassword&userId=123&t=100&d=10&h=WRONG');
        expect(() => decodeAction(str, 105, 'SECUREKEY')).toThrow(/^The link is broken$/);
    });

    it('Should show error about wrong encoding', () => {
        const str = 'DSJLKFJ(S()S*()FSKLJKLSKLFJLSJ';
        expect(() => decodeAction(str)).toThrow(/^The link is broken$/);
    });

    it('Should show error about missing fields', () => {
        const str = encodeBase64('name=newPassword&userId=123&t=100&d=10');
        expect(() => decodeAction(str)).toThrow(/^There are missing fields in the link$/);
    });

    it('Should show error about missing secure key', () => {
        const str = encodeBase64('name=newPassword&userId=123&t=100&d=10&h=26185d52537ecb773ab0');
        expect(() => decodeAction(str, 120, '')).toThrow(/^The secure key is missing$/);
    });
});
