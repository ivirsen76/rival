import validate from './validate';

describe('validate()', () => {
    const correctValues = {
        score: [
            [6, 2],
            [4, 4],
            [3, 5],
        ],
    };

    const checkForErrors = (fieldName, values) => {
        describe(`${fieldName} errors`, () => {
            for (const value of values) {
                it(`Should show error for value "${value}" (${typeof value})`, () => {
                    expect(validate({ ...correctValues, [fieldName]: value })[fieldName]).toBeDefined();
                });
            }
        });
    };

    it('Should show no errors', () => {
        expect(Object.keys(validate(correctValues)).length).toBe(0);
    });

    checkForErrors('score', [
        [[], []],
        null,
        '',
        'wrong',
        10.2,
        -1,
        3,
        '3-5',
        [[6, 3], [], []],
        [['string'], [], []],
        [['3', '5'], [], []],
        [[-1, 9], [], []],
        [[3.5, 4.5], [], []],
        [[6, 2], [4, 4], []],
    ]);
});
