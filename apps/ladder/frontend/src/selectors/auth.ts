import getData from '../pages/About/Changelog/getData';

export const getUnseenUpdates = state => {
    if (!state.auth.user || !state.auth.config) {
        return [];
    }

    const { changelogSeenAt } = state.auth.user;

    return getData({ config: state.auth.config }).filter(item => !changelogSeenAt || item.date > changelogSeenAt);
};
