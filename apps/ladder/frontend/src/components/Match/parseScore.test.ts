import parseScore from './parseScore';

describe('parseScore', () => {
    it('Should return parsedScore', () => {
        const expectedResult = [
            [6, 7],
            [7, 5],
            [1, 0],
        ];
        expect(parseScore('6-7 7-5 1-0')).toEqual(expectedResult);
    });
});
