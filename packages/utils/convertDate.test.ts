import convertDate from './convertDate';

describe('convertDate()', () => {
    const options = {
        dds: 'dds',
        '1/1/111': '1/1/111',
        '1/1/2001': '2001-01-01',
        '1/1/01': '2001-01-01',
        '1/1/25': '2025-01-01',
        '1/1/26': '1926-01-01',
        '1/1/76': '1976-01-01',
        '1/01/76': '1976-01-01',
    };

    for (const [input, output] of Object.entries(options)) {
        it(`Should return right value for "${input}"`, () => {
            expect(convertDate(input)).toBe(output);
        });
    }
});
