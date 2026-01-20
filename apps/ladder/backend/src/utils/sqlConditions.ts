export const getStatsMatches = (alias = '') => {
    if (alias) {
        alias += '.';
    }

    return `${alias}score IS NOT NULL AND ${alias}sameAs IS NULL AND ${alias}unavailable=0 AND ${alias}wonByDefault=0`;
};
