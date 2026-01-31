// @ts-nocheck
import validate from './commonValidate';
import _cloneDeep from 'lodash/cloneDeep';
import _set from 'lodash/set';

describe('validate()', () => {
    const correctValues = {
        firstName: 'Some.',
        lastName: "Another d'Second",
        email: 'some@gmail.com',
        gender: 'male',
        personalInfo: 'some',
        dominantHand: 'right',
        forehandStyle: 'oneHanded',
        backhandStyle: 'oneHanded',
        playerType: 'defensive',
        shot: 'volley',
        racquet: 'Babolat',
        strings: 'Prince',
        shoes: 'Adidas',
        bag: 'Babolat',
        brand: 'Babolat',
        overgrip: 'Gamma',
        balls: 'Wilson',
        birthday: '1990-01-01',
        information: {
            subscribeForProposals: {
                playFormats: [0, 1, 2, 99],
                onlyNotPlaying: true,
                onlyCompetitive: false,
                onlyAgeCompatible: false,
                onlyMySchedule: false,
                weeklySchedule: new Array(7).fill([]),
            },
        },
    };

    const checkForErrors = (fieldName, values) => {
        describe(`${fieldName} errors`, () => {
            for (const value of values) {
                it(`Should show error for value "${value}" (${typeof value})`, () => {
                    const data = _cloneDeep(correctValues);
                    _set(data, fieldName, value);
                    expect(validate(data)[fieldName]).toBeDefined();
                });
            }
        });
    };

    it('Should show no errors', () => {
        expect(Object.keys(validate(correctValues)).length).toBe(0);

        expect(
            Object.keys(
                validate({
                    ...correctValues,
                    dominantHand: 'left',
                    racquet: 'a'.repeat(250),
                    strings: 'a'.repeat(250),
                })
            ).length
        ).toBe(0);

        expect(
            Object.keys(
                validate({
                    ...correctValues,
                    dominantHand: null,
                    racquet: '',
                    strings: '',
                })
            ).length
        ).toBe(0);
    });

    checkForErrors('firstName', [null, '', 123, '%#^$', 'a'.repeat(21)]);
    checkForErrors('lastName', [null, '', 123, '%#^$', 'a'.repeat(21)]);
    checkForErrors('email', [null, '', 123, '%#^$', 'ass', 'some@email', 'some@email.']);
    checkForErrors('gender', [null, 123, 'some']);
    checkForErrors('personalInfo', [123, 'a'.repeat(501)]);
    checkForErrors('dominantHand', [123, 'a'.repeat(251)]);
    checkForErrors('forehandStyle', [123, 'a'.repeat(251)]);
    checkForErrors('backhandStyle', [123, 'a'.repeat(251)]);
    checkForErrors('playerType', [123, 'a'.repeat(251)]);
    checkForErrors('shot', [123, 'a'.repeat(251)]);
    checkForErrors('racquet', [123, 'a'.repeat(251)]);
    checkForErrors('strings', [123, 'a'.repeat(251)]);
    checkForErrors('shoes', [123, 'a'.repeat(251)]);
    checkForErrors('bag', [123, 'a'.repeat(251)]);
    checkForErrors('brand', [123, 'a'.repeat(251)]);
    checkForErrors('overgrip', [123, 'a'.repeat(251)]);
    checkForErrors('balls', [123, 'a'.repeat(251)]);
    checkForErrors('information.subscribeForProposals.playFormats', [[3], ['string']]);
    checkForErrors('information.subscribeForProposals.onlyNotPlaying', [1, 'str', []]);
    checkForErrors('information.subscribeForProposals.onlyCompetitive', [1, 'str', []]);
    checkForErrors('information.subscribeForProposals.onlyAgeCompatible', [1, 'str', []]);
    checkForErrors('information.subscribeForProposals.onlyMySchedule', [1, 'str', []]);
    checkForErrors('information.subscribeForProposals.weeklySchedule', [
        new Array(0),
        new Array(6).fill([]),
        new Array(8).fill([]),
    ]);
});
