import matchFormatOptions from '../proposals/matchFormatOptions';
import merge from 'deepmerge';

export const defaultValues = {
    subscribeForProposals: {
        playFormats: [...matchFormatOptions.map(item => item.value), 99],
        onlyNotPlaying: true,
        onlyCompetitive: false,
        onlyAgeCompatible: false,
        onlyMySchedule: false,
        weeklySchedule: new Array(7).fill([]),
    },
};

export default information => {
    if (!information) {
        information = {};
    }
    if (typeof information === 'string') {
        information = JSON.parse(information);
    }

    return merge(defaultValues, information, { arrayMerge: (target, source) => source });
};
