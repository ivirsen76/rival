import type { UserInformation } from '../../types';
import matchFormatOptions from '../proposals/matchFormatOptions';
import merge from 'deepmerge';

export const defaultValues: UserInformation = {
    subscribeForProposals: {
        playFormats: [...matchFormatOptions.map((item) => item.value), 99],
        onlyNotPlaying: true,
        onlyCompetitive: false,
        onlyAgeCompatible: false,
        onlyMySchedule: false,
        weeklySchedule: new Array(7).fill([]),
    },
};

export default (information?: string | Record<string, any>) => {
    if (!information) {
        return defaultValues;
    }

    if (typeof information === 'string') {
        information = JSON.parse(information);
    }

    return merge(defaultValues, information as Record<string, any>, { arrayMerge: (_, source) => source });
};
