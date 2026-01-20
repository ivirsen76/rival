import populateInformation, { defaultValues } from './populateInformation';

describe('populateInformation()', () => {
    it('Should return default values', () => {
        expect(populateInformation()).toEqual(defaultValues);
        expect(populateInformation({})).toEqual(defaultValues);
        expect(populateInformation('{}')).toEqual(defaultValues);
    });

    it('Should should merge values', () => {
        const information = {
            subscribeForProposals: {
                playFormats: [55],
                onlyNotPlaying: false,
                onlyCompetitive: true,
                weeklySchedule: [[1], [2], [3]],
            },
            some: 'value',
        };
        const expectedResult = {
            subscribeForProposals: {
                playFormats: [55],
                onlyNotPlaying: false,
                onlyCompetitive: true,
                onlyAgeCompatible: false,
                onlyMySchedule: false,
                weeklySchedule: [[1], [2], [3]],
            },
            some: 'value',
        };
        expect(populateInformation(information)).toEqual(expectedResult);
    });
});
