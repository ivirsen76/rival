import replaceEmailWithAddress from './replaceEmailWithAddress';

describe('replaceEmailWithAddress()', () => {
    it('Should return not change the values', () => {
        expect(replaceEmailWithAddress('some@gmail.com')).toBe('some@gmail.com');
        expect(replaceEmailWithAddress(null)).toBeNull();
        expect(replaceEmailWithAddress({})).toEqual({});
        expect(replaceEmailWithAddress({ name: 'Some ' })).toEqual({ name: 'Some ' });
    });

    it('Should change the values', () => {
        expect(replaceEmailWithAddress({ email: 'some@gmail.com' })).toEqual({ address: 'some@gmail.com' });
        expect(
            replaceEmailWithAddress({
                name: 'Igor',
                email: 'some@gmail.com',
            })
        ).toEqual({
            name: 'Igor',
            address: 'some@gmail.com',
        });
        expect(
            replaceEmailWithAddress([
                'more@gmail.com',
                { name: 'Igor', email: 'some@gmail.com' },
                { name: 'Roy', email: 'roy@gmail.com' },
            ])
        ).toEqual([
            'more@gmail.com',
            { name: 'Igor', address: 'some@gmail.com' },
            { name: 'Roy', address: 'roy@gmail.com' },
        ]);
    });
});
