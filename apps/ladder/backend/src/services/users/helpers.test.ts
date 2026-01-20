import {
    formatPhone,
    hidePhone,
    hideEmail,
    formatUserName,
    getWeekNumber,
    getDateByWeekNumber,
    getTbStats,
    getPlayerName,
} from './helpers';

describe('formatPhone()', () => {
    it('Should format phone', () => {
        expect(formatPhone()).toBe('');
        expect(formatPhone('1234567890')).toBe('123-456-7890');
    });
});

describe('hidePhone()', () => {
    it('Should hide phone', () => {
        expect(hidePhone()).toBe('XXX-XXX-XXXX');
    });
});

describe('hideEmail()', () => {
    it('Should hide email', () => {
        expect(hideEmail('some@gmail.com')).toBe('s***@*****.com');
        expect(hideEmail('')).toBe('a***@*****.com');
        expect(hideEmail()).toBe('a***@*****.com');
    });
});

describe('formatUserName()', () => {
    it('Should format user name', () => {
        expect(formatUserName('SOME')).toBe('Some');
        expect(formatUserName('some')).toBe('Some');
        expect(formatUserName('SOme')).toBe('SOme');
        expect(formatUserName('SoMe')).toBe('SoMe');
        expect(formatUserName('A.B.')).toBe('A.B.');
        expect(formatUserName('AB')).toBe('AB');
        expect(formatUserName('ABC')).toBe('Abc');
        expect(formatUserName('some-more')).toBe('some-more');
        expect(formatUserName("O'Connell")).toBe("O'Connell");
        expect(formatUserName('McGuire')).toBe('McGuire');
        expect(formatUserName('some-more')).toBe('some-more');
        expect(formatUserName(' some-more ')).toBe('some-more');
        expect(formatUserName('SOME MORE')).toBe('Some More');
        expect(formatUserName('SOME  MORE')).toBe('Some More');
        expect(formatUserName(' SOME  MORE ')).toBe('Some More');
        expect(formatUserName('SoMe MOre')).toBe('SoMe MOre');
    });
});

describe('getWeekNumber()', () => {
    it('Should return right week number', () => {
        expect(getWeekNumber('2022-12-31 23:59:59')).toBe(20221226);
        expect(getWeekNumber('2023-01-01 00:00:00')).toBe(20221226);
        expect(getWeekNumber('2023-01-01 23:59:59')).toBe(20221226);
        expect(getWeekNumber('2023-01-02 00:00:00')).toBe(20230102);
        expect(getWeekNumber('2023-01-02 00:00:01')).toBe(20230102);
        expect(getWeekNumber('2023-01-08 23:59:59')).toBe(20230102);
        expect(getWeekNumber('2023-01-09 00:00:00')).toBe(20230109);
    });
});

describe('getDateByWeekNumber()', () => {
    it('Should return right date', () => {
        expect(getDateByWeekNumber(20221226)).toBe('2022-12-26 00:00:00');
        expect(getDateByWeekNumber(20221227)).toBe('2022-12-26 00:00:00');
        expect(getDateByWeekNumber(20230101)).toBe('2022-12-26 00:00:00');
        expect(getDateByWeekNumber(20230102)).toBe('2023-01-02 00:00:00');
        expect(getDateByWeekNumber(20230109)).toBe('2023-01-09 00:00:00');
    });
});

describe('getTbStats()', () => {
    it('Should return right stats', () => {
        expect(getTbStats({ score: '7-6 7-6' })).toEqual([2, 0]);
        expect(getTbStats({ score: '7-6 6-7 1-0' })).toEqual([2, 1]);
        expect(getTbStats({ score: '7-6 6-7 7-6' })).toEqual([2, 1]);
        expect(getTbStats({ score: '2-6 6-2 6-4' })).toEqual([0, 0]);
        expect(getTbStats({ score: '1-0', wonByInjury: true })).toEqual([0, 0]);
        expect(getTbStats({ score: '7-6 1-0', wonByInjury: true })).toEqual([1, 0]);
        expect(getTbStats({ score: '7-6 6-7 1-0', wonByInjury: true })).toEqual([1, 1]);
        expect(getTbStats({ score: '7-6 6-7 7-6', wonByInjury: true })).toEqual([2, 1]);
    });
});

describe('getPlayerName()', () => {
    it('Should return right players name', () => {
        expect(getPlayerName({ firstName: 'Some', lastName: 'Guy' })).toBe('Some Guy');
        expect(getPlayerName([{ firstName: 'Some', lastName: 'Guy' }])).toBe('Some Guy');
        expect(
            getPlayerName([
                { firstName: 'Some', lastName: 'Guy' },
                { firstName: 'Another', lastName: 'Man' },
            ])
        ).toBe('Some G. / Another M.');
    });
});
