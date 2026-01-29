import { getEmailsFromList } from './helpers';

describe('getEmailsFromList()', () => {
    it('Should get emails from list', () => {
        expect(getEmailsFromList()).toEqual([]);
        expect(getEmailsFromList('')).toEqual([]);
        expect(getEmailsFromList(' ')).toEqual([]);
        expect(getEmailsFromList('some@gmail.com')).toEqual(['some@gmail.com']);
        expect(getEmailsFromList(' some@gmail.com; another@gmail.com ')).toEqual([
            'some@gmail.com',
            'another@gmail.com',
        ]);
    });
});
