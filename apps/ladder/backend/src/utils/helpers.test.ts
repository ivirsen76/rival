import {
    getNumberAsString,
    getListAsString,
    base64EncodeEmail,
    base64DecodeEmail,
    isProposalFitSchedule,
    getAge,
    getProposalGroups,
} from './helpers';
import _round from 'lodash/round';

describe('getNumberAsString', () => {
    it('Should return right string', () => {
        expect(getNumberAsString(1)).toBe('one');
        expect(getNumberAsString(2)).toBe('two');
        expect(getNumberAsString(3)).toBe('three');
        expect(getNumberAsString(4)).toBe('four');
        expect(getNumberAsString(5)).toBe('five');
    });
});

describe('getListAsString', () => {
    it('Should return right string', () => {
        expect(getListAsString(['first'])).toBe('first');
        expect(getListAsString(['first', 'second'])).toBe('first and second');
        expect(getListAsString(['first', 'second', 'third'])).toBe('first, second, and third');
        expect(getListAsString(['first', 'second', 'third', 'fourth'])).toBe('first, second, third, and fourth');
    });
});

describe('base64EncodeEmail()', () => {
    it('Should encode and then decode email', () => {
        const email = 'michaelwong@alumni.stanford.edu';
        const encoded = base64EncodeEmail(email);
        const decoded = base64DecodeEmail(encoded);

        expect(encoded).toMatch(/^[A-Za-z0-9_-]+$/);
        expect(decoded).toBe(email);
    });
});

describe('isProposalFitSchedule()', () => {
    it('Should return false for empty schedule', () => {
        const proposal = { playedAt: '2022-12-12 13:00:00', matchFormat: 0, practiceType: 0 };
        expect(isProposalFitSchedule(proposal, [])).toBe(false);
    });

    it('Should return true for super early morning', () => {
        const proposal = { playedAt: '2022-12-12 05:00:00', matchFormat: 0, practiceType: 0 };
        expect(isProposalFitSchedule(proposal, [[6, 9]])).toBe(true);
        expect(isProposalFitSchedule(proposal, [[7, 9]])).toBe(false);

        const proposal2 = { playedAt: '2022-12-12 03:00:00', matchFormat: 0, practiceType: 0 };
        expect(isProposalFitSchedule(proposal2, [[6, 9]])).toBe(true);
        expect(isProposalFitSchedule(proposal2, [[7, 9]])).toBe(false);
    });

    it('Should return true for super late night', () => {
        const proposal = { playedAt: '2022-12-12 22:00:00', matchFormat: 0, practiceType: 0 };
        expect(isProposalFitSchedule(proposal, [[18, 21]])).toBe(true);
        expect(isProposalFitSchedule(proposal, [[18, 20]])).toBe(false);

        const proposal2 = { playedAt: '2022-12-12 23:00:00', matchFormat: 0, practiceType: 0 };
        expect(isProposalFitSchedule(proposal2, [[18, 21]])).toBe(true);
        expect(isProposalFitSchedule(proposal2, [[18, 20]])).toBe(false);
    });

    it('Should return right value for regular match', () => {
        const proposal = { playedAt: '2022-12-12 13:00:00', matchFormat: 0, practiceType: 0 };
        expect(isProposalFitSchedule(proposal, [[11, 15]])).toBe(true);
        expect(isProposalFitSchedule(proposal, [[13, 15]])).toBe(true);
        expect(isProposalFitSchedule(proposal, [[11, 14]])).toBe(false);
        expect(isProposalFitSchedule(proposal, [[14, 20]])).toBe(false);
    });

    it('Should return right value for full 3rd set match', () => {
        const proposal = { playedAt: '2022-12-12 13:00:00', matchFormat: 1, practiceType: 0 };
        expect(isProposalFitSchedule(proposal, [[11, 16]])).toBe(true);
        expect(isProposalFitSchedule(proposal, [[13, 16]])).toBe(true);
        expect(isProposalFitSchedule(proposal, [[11, 15]])).toBe(false);
        expect(isProposalFitSchedule(proposal, [[14, 20]])).toBe(false);
    });

    it('Should return right value for Fast4 match', () => {
        const proposal = { playedAt: '2022-12-12 13:00:00', matchFormat: 2, practiceType: 0 };
        expect(isProposalFitSchedule(proposal, [[13, 14]])).toBe(true);
        expect(isProposalFitSchedule(proposal, [[11, 13]])).toBe(false);
        expect(isProposalFitSchedule(proposal, [[14, 20]])).toBe(false);
    });

    it('Should return right value for 30 minutes practice', () => {
        const proposal = { playedAt: '2022-12-12 13:00:00', matchFormat: 0, practiceType: 1, duration: 30 };
        expect(isProposalFitSchedule(proposal, [[13, 14]])).toBe(true);
        expect(isProposalFitSchedule(proposal, [[11, 13]])).toBe(false);
        expect(isProposalFitSchedule(proposal, [[14, 20]])).toBe(false);
    });

    it('Should return right value for 60 minutes practice', () => {
        const proposal = { playedAt: '2022-12-12 13:00:00', matchFormat: 0, practiceType: 1, duration: 60 };
        expect(isProposalFitSchedule(proposal, [[13, 14]])).toBe(true);
        expect(isProposalFitSchedule(proposal, [[11, 13]])).toBe(false);
        expect(isProposalFitSchedule(proposal, [[14, 20]])).toBe(false);
    });

    it('Should return right value for 90 minutes practice', () => {
        const proposal = { playedAt: '2022-12-12 13:00:00', matchFormat: 0, practiceType: 1, duration: 90 };
        expect(isProposalFitSchedule(proposal, [[13, 15]])).toBe(true);
        expect(isProposalFitSchedule(proposal, [[11, 14]])).toBe(false);
        expect(isProposalFitSchedule(proposal, [[14, 20]])).toBe(false);
    });
});

describe('getAge()', () => {
    it('Should return age', () => {
        const now = new Date('2022-12-12 13:00:00');
        expect(_round(getAge('2000-12-12', now), 2)).toBe(22);
        expect(_round(getAge('1976-12-07', now), 2)).toBe(46.01);
        expect(_round(getAge('1947-01-28', now), 2)).toBe(75.87);
    });
});

describe('getProposalGroups()', () => {
    it('Should return proposal groups', () => {
        const proposalEmails = [
            {
                id: 1,
                emails: [
                    { name: '1', email: '1@gmail.com' },
                    { name: '2', email: '2@gmail.com' },
                    { name: '3', email: '3@gmail.com' },
                ],
            },
            {
                id: 2,
                emails: [
                    { name: '1', email: '1@gmail.com' },
                    { name: '2', email: '2@gmail.com' },
                    { name: '3', email: '3@gmail.com' },
                ],
            },
            {
                id: 3,
                emails: [
                    { name: '1', email: '1@gmail.com' },
                    { name: '3', email: '3@gmail.com' },
                ],
            },
            {
                id: 4,
                emails: [
                    { name: '2', email: '2@gmail.com' },
                    { name: '4', email: '4@gmail.com' },
                    { name: '5', email: '5@gmail.com' },
                ],
            },
            {
                id: 5,
                emails: [
                    { name: '2', email: '2@gmail.com' },
                    { name: '4', email: '4@gmail.com' },
                    { name: '5', email: '5@gmail.com' },
                ],
            },
            {
                id: 6,
                emails: [
                    { name: '4', email: '4@gmail.com' },
                    { name: '5', email: '5@gmail.com' },
                ],
            },
        ];
        const expectedResult = [
            {
                emails: [
                    { name: '1', email: '1@gmail.com' },
                    { name: '3', email: '3@gmail.com' },
                ],
                proposals: [{ id: 1 }, { id: 2 }, { id: 3 }],
            },
            {
                emails: [{ name: '2', email: '2@gmail.com' }],
                proposals: [{ id: 1 }, { id: 2 }, { id: 4 }, { id: 5 }],
            },
            {
                emails: [
                    { name: '4', email: '4@gmail.com' },
                    { name: '5', email: '5@gmail.com' },
                ],
                proposals: [{ id: 4 }, { id: 5 }, { id: 6 }],
            },
        ];

        expect(getProposalGroups(proposalEmails)).toEqual(expectedResult);
    });

    it('Should return groups from one proposal', () => {
        const proposalEmails = [
            {
                id: 1,
                emails: [
                    { name: '1', email: '1@gmail.com' },
                    { name: '2', email: '2@gmail.com' },
                    { name: '3', email: '3@gmail.com' },
                ],
            },
        ];
        const expectedResult = [
            {
                emails: [
                    { name: '1', email: '1@gmail.com' },
                    { name: '2', email: '2@gmail.com' },
                    { name: '3', email: '3@gmail.com' },
                ],
                proposals: [{ id: 1 }],
            },
        ];

        expect(getProposalGroups(proposalEmails)).toEqual(expectedResult);
    });
});
