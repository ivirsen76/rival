import { toCSV } from './saveAsCsv';

describe('toCSV()', () => {
    it(`Should return right CSV`, () => {
        const list = [
            {
                Name: 'Something',
                'Another name': 'My, Name',
                'Complicated Value': '"Pretty" good, value',
                Number: 1,
                String: '1',
            },
            {
                Name: 'Something 2',
                'Another name': 'My, Name 2',
                'Complicated Value': '"Pretty" good, value 2',
                Number: 2,
                String: '2',
            },
        ];
        const expectedResult =
            'Name,Another name,Complicated Value,Number,String\n' +
            'Something,"My, Name","""Pretty"" good, value",1,1\n' +
            'Something 2,"My, Name 2","""Pretty"" good, value 2",2,2';

        expect(toCSV(list)).toBe(expectedResult);
    });
});
