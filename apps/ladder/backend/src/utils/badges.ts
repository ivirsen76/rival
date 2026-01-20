import formatElo from './formatElo';

export const getSeriesState = (code, levels, value) => {
    const len = levels.length;
    const index = levels.findIndex(item => item > value);
    const nextValue = levels[index];
    const percent = index === -1 ? 100 : (100 / len) * index;
    const label = levels[index === -1 ? len - 1 : index === 0 ? 0 : index - 1];
    const disabled = index === 0;
    const completed = value >= levels[len - 1];

    return {
        state: {
            props: {
                label,
                percent,
                disabled,
                completed,
            },
            completed,
            completedBadges: levels.filter((_, idx) => idx < index || completed).map(v => `${code}:${v}`),
            lastStep: nextValue === levels[levels.length - 1],
            value,
            nextDiff: completed ? 0 : nextValue - value,
        },
    };
};

export const badges = {
    seasonsParticipated: {
        code: 'seasonsParticipated',
        title: 'Seasons',
        description: 'Play at least one match in a certain number of seasons.',
        levels: [1, 5, 10, 20, 30, 40, 50],
        getState({ stats }) {
            const value = Object.keys(stats.seasonsParticipated).length;
            const { state } = getSeriesState(this.code, this.levels, value);

            state.props.type = 'calendar';
            state.props.shape = 'shield';
            state.props.colorHue = 330;
            state.valueExplanation = `season${value === 1 ? '' : 's'} participated`;

            state.payload = stats.seasonsPlayed;
            state.summaryTitle = 'Matches Played per Season';

            return state;
        },
    },
    matchesPlayed: {
        code: 'matchesPlayed',
        title: 'Grinder',
        description: 'Complete a certain number of matches.',
        levels: [5, 25, 50, 100, 250, 500, 750, 1000],
        getState({ stats }) {
            const value = stats.matchesTotal;
            const { state } = getSeriesState(this.code, this.levels, value);

            state.props.type = 'matchesPlayed';
            state.props.shape = 'shield3';
            state.props.colorHue = 0;
            state.valueExplanation = `matche${value === 1 ? '' : 's'} played`;

            state.payload = {
                matches: stats.payload.latestMatches || [],
            };
            state.summaryTitle = 'Latest Matches Played';

            return state;
        },
    },
    matchesWon: {
        code: 'matchesWon',
        title: 'Conqueror',
        description: 'Achieve a certain number of wins.',
        levels: [5, 25, 50, 100, 200, 300, 400, 500],
        getState({ stats }) {
            const value = stats.matchesWon;
            const { state } = getSeriesState(this.code, this.levels, value);

            state.props.type = 'sword';
            state.props.shape = 'shield4';
            state.props.colorHue = 30;
            state.valueExplanation = `matche${value === 1 ? '' : 's'} won`;

            state.payload = {
                matches: stats.payload.latestWins || [],
            };
            state.summaryTitle = 'Latest Matches Won';

            return state;
        },
    },
    proposalsCreated: {
        code: 'proposalsCreated',
        title: 'Matchmaker',
        description: 'Send a certain number of proposals.',
        levels: [5, 25, 50, 100, 150, 200, 250],
        getState({ stats }) {
            const value = stats.proposalsCreated;
            const { state } = getSeriesState(this.code, this.levels, value);

            state.props.type = 'time';
            state.props.shape = 'circle';
            state.props.colorHue = 100;
            state.valueExplanation = `proposal${value === 1 ? '' : 's'} sent`;

            state.payload = stats.payload.latestProposalsSent;
            state.summaryTitle = 'Latest Proposals Sent';

            return state;
        },
    },
    proposalsAccepted: {
        code: 'proposalsAccepted',
        title: 'Game Starter',
        description: 'Accept a certain number of proposals.',
        levels: [5, 25, 50, 100, 150, 200, 250],
        getState({ stats }) {
            const value = stats.proposalsAccepted;
            const { state } = getSeriesState(this.code, this.levels, value);

            state.props.type = 'check';
            state.props.shape = 'hexagon';
            state.props.colorHue = 150;
            state.valueExplanation = `proposal${value === 1 ? '' : 's'} accepted`;

            state.payload = stats.payload.latestProposalsAccepted;
            state.summaryTitle = 'Latest Accepted Proposals';

            return state;
        },
    },
    tlrGain: {
        code: 'tlrGain',
        title: 'Rising TLR',
        description: 'Improve your initial TLR.',
        levels: [20, 40, 60, 80, 100],
        getLabel: value => formatElo(value),
        getState({ stats }) {
            const value = stats.tlrGain;
            const { state } = getSeriesState(this.code, this.levels, value);

            state.props.type = 'tlr-graph';
            state.props.shape = 'diamond';
            state.props.colorHue = 185;
            state.props.label = formatElo(state.props.label);
            state.valueExplanation = `TLR point${value === 1 ? '' : 's'} gained`;
            state.payload = {
                startingTlr: stats.startingTlr > 0 ? stats.startingTlr : null,
                levels: this.levels,
            };

            return state;
        },
    },
    rivalries: {
        code: 'rivalries',
        title: 'Fedal',
        description: 'Establish a certain number of rivalries.',
        levels: [1, 10, 25, 50, 75, 100],
        getState({ stats }) {
            const value = stats.rivalries;
            const { state } = getSeriesState(this.code, this.levels, value);

            state.props.type = 'shake';
            state.props.shape = 'hexagon2';
            state.props.colorHue = 202;
            state.valueExplanation = `${value === 1 ? 'rivalry' : 'rivalries'} started`;

            state.payload = stats.payload.rivalries;

            return state;
        },
    },
    tiebreaker: {
        code: 'tiebreaker',
        title: 'Tiebreaker',
        description: 'Win a certain number of tiebreaks.',
        levels: [1, 10, 25, 50, 75, 100],
        getState({ stats }) {
            const value = stats.tiebreaks;
            const { state } = getSeriesState(this.code, this.levels, value);

            state.props.type = 'chain';
            state.props.shape = 'pentagon';
            state.props.colorHue = 230;
            state.valueExplanation = `tiebreak${value === 1 ? '' : 's'} won`;

            state.payload = {
                matches: stats.payload.tiebreaks || [],
            };
            state.summaryTitle = 'Latest Tiebreaks Won';

            return state;
        },
    },
    comebackKid: {
        code: 'comebackKid',
        title: 'Comeback Kid',
        description: 'Win a match after losing the first set.',
        levels: [1, 10, 25, 50, 75, 100],
        getState({ stats }) {
            const value = stats.comebacks || 0;
            const { state } = getSeriesState(this.code, this.levels, value);

            state.props.type = 'lightning';
            state.props.shape = 'diamond';
            state.props.colorHue = 260;
            state.valueExplanation = `comeback${value === 1 ? '' : 's'} performed`;

            state.payload = {
                matches: stats.payload.comebacks || [],
            };
            state.summaryTitle = 'Latest Comebacks';

            return state;
        },
    },
    tournament: {
        code: 'tournament',
        title: 'Tournament',
        description: 'Achieve a certain stage of a Final Tournament.',
        levels: ['quarterfinal', 'semifinal', 'final', 'champion'],
        isLevelSpecific: true,
        getLabel(value) {
            const labelMatch = {
                quarterfinal: 'QF',
                semifinal: 'SF',
                final: 'F',
                champion: 'C',
            };

            return labelMatch[value] || 'QF';
        },
        getState({ stats }) {
            const value = stats.tournamentResult;
            const len = this.levels.length;
            const index = this.levels.findIndex(item => item === value);
            const percent = index === -1 ? 0 : (100 / len) * (index + 1);
            const label = this.getLabel(value);
            const disabled = !value;
            const completed = index === len - 1;

            return {
                props: {
                    type: 'trophy',
                    shape: 'shield3',
                    colorHue: 290,
                    label,
                    percent,
                    disabled,
                    completed,
                },
                completed,
                completedBadges: this.levels
                    .filter((_, idx) => idx <= index || completed)
                    .map(v => `level${stats.id}:${this.code}:${v}`),
            };
        },
    },
    points: {
        code: 'points',
        title: 'Pooling Points',
        description: 'Reach a maximum number of ladder points during a single season.',
        levels: [100, 200, 300, 400, 500],
        isLevelSpecific: true,
        getState({ stats }) {
            const value = stats.maxPoints;
            const { state } = getSeriesState(`level${stats.id}:${this.code}`, this.levels, value);

            state.props.type = 'calculator';
            state.props.shape = 'hexagon2';
            state.props.colorHue = 30;
            state.valueExplanation = `point${value === 1 ? '' : 's'} reached`;

            state.payload = {
                seasonPoints: stats.seasonPoints,
            };
            state.summaryTitle = 'Most Points Seasons';

            return state;
        },
    },
    feedback: {
        code: 'feedback',
        title: 'Support Group',
        description: 'Provide feedback to the Rival Tennis Ladder team.',
        getState({ stats }) {
            const value = stats.feedbacks;
            const completed = value > 0;

            return {
                props: {
                    type: 'feedback',
                    shape: 'shield',
                    colorHue: 200,
                    disabled: !completed,
                    completed,
                },
                value,
                completed,
            };
        },
    },
    avatar: {
        code: 'avatar',
        title: 'Da Vinci',
        description: 'Create your avatar.',
        getState({ stats }) {
            const value = stats.isAvatarCreated;
            const completed = value;

            return {
                props: {
                    type: 'palette',
                    shape: 'shield',
                    colorHue: 200,
                    disabled: !completed,
                    completed,
                },
                completed,
            };
        },
    },
    profile: {
        code: 'profile',
        title: 'Construction Complete',
        description: 'Build your profile with About, Tennis Style, and Tennis Equipment sections.',
        getState({ stats }) {
            const value = stats.isProfileCompleted;
            const completed = value;

            return {
                props: {
                    type: 'construction',
                    shape: 'shield',
                    colorHue: 200,
                    disabled: !completed,
                    completed,
                },
                completed,
            };
        },
    },
    allSeasonPlayer: {
        code: 'allSeasonPlayer',
        title: 'All-Season Player',
        description: 'Play at least one match during each season.',
        getState({ stats }) {
            const value = stats.seasonsPlayed;
            const completed = Object.values(value).every(item => item.matches > 0);

            return {
                props: {
                    type: 'season',
                    shape: 'shield',
                    colorHue: 200,
                    disabled: !completed,
                    completed,
                },
                completed,
                payload: {
                    seasonsPlayed: stats.seasonsPlayed,
                    totalSeasons: Object.keys(stats.seasonsParticipated).length,
                },
                summaryTitle: 'Seasons Played',
            };
        },
    },
    statistician: {
        code: 'statistician',
        title: 'Statistician',
        description: 'Post your SwingVision stats for the first time.',
        getState({ stats }) {
            const value = stats.statsUploaded;
            const completed = value;

            return {
                props: {
                    type: 'diagram',
                    shape: 'shield',
                    colorHue: 200,
                    disabled: !completed,
                    completed,
                },
                completed,
                payload: {
                    matches: stats.payload.matchesWithStats || [],
                },
                summaryTitle: 'Matches with Statistics',
            };
        },
    },
    dedication: {
        code: 'dedication',
        title: 'Dedication',
        description: 'Play five or more matches in one week.',
        getState({ stats }) {
            const value = stats.maxPlayedInWeek;
            const completed = value >= 5;

            return {
                props: {
                    type: 'dumbbell',
                    shape: 'shield',
                    colorHue: 200,
                    disabled: !completed,
                    completed,
                },
                completed,
                payload: stats.payload.maxPlayedInWeek,
                summaryTitle: 'Dedicated Weeks',
            };
        },
    },
    takeItToLimit: {
        code: 'takeItToLimit',
        title: 'Take It to the Limit',
        description: 'Win a match consisting of 36 total games or more.',
        getState({ stats }) {
            const value = stats.wonManyGamesMatch;
            const completed = value;

            return {
                props: {
                    type: 'speed',
                    shape: 'shield',
                    colorHue: 200,
                    disabled: !completed,
                    completed,
                },
                completed,
                payload: {
                    matches: stats.payload.wonManyGamesMatch.recent || [],
                    close: stats.payload.wonManyGamesMatch.close || [],
                },
            };
        },
    },
    universalPlayer: {
        code: 'universalPlayer',
        title: 'Universal Player',
        description: 'Play a match in both a Singles and Doubles ladder during the same season.',
        getState({ stats }) {
            const value = stats.playedSinglesDoubles;
            const completed = value;

            return {
                props: {
                    type: 'swissKnife',
                    shape: 'shield',
                    colorHue: 200,
                    disabled: !completed,
                    completed,
                },
                completed,
            };
        },
    },
    twoWinsOneDay: {
        code: 'twoWinsOneDay',
        title: 'Double Impact',
        description: 'Win two matches in one day.',
        getState({ stats }) {
            const value = stats.doubleImpact;
            const completed = value;

            return {
                props: {
                    type: 'impact',
                    shape: 'shield',
                    colorHue: 200,
                    disabled: !completed,
                    completed,
                },
                payload: stats.payload.doubleImpact,
                summaryTitle: 'Related Days',
                completed,
            };
        },
    },
    davidGoliath: {
        code: 'davidGoliath',
        title: 'David vs. Goliath',
        description: 'Beat a player whose TLR is 0.50 points higher than yours.',
        getState({ stats }) {
            const value = stats.beatMuchStrongerPlayer;
            const completed = value;

            return {
                props: {
                    type: 'fist',
                    shape: 'shield',
                    colorHue: 200,
                    disabled: !completed,
                    completed,
                },
                payload: {
                    matches: (stats.payload.beatMuchStrongerPlayer || []).map(match => ({
                        ...match,
                        extraColumn: `${formatElo(
                            Math.abs(
                                match.challengerElo -
                                    match.challengerEloChange -
                                    (match.acceptorElo - match.acceptorEloChange)
                            )
                        )} TLR diff`,
                    })),
                },
                summaryTitle: 'Related Matches',
                completed,
            };
        },
    },
    twoTiebreaks: {
        code: 'twoTiebreaks',
        title: 'Die Hard',
        description: 'Beat a player by winning a match 7-6, 7-6.',
        getState({ stats }) {
            const value = stats.beatOnTwoTiebreaks;
            const completed = value;

            return {
                props: {
                    largeText: '77',
                    shape: 'shield',
                    colorHue: 200,
                    disabled: !completed,
                    completed,
                },
                payload: {
                    matches: stats.payload.beatOnTwoTiebreaks || [],
                },
                summaryTitle: 'Related Matches',
                completed,
            };
        },
    },
    doubleBagel: {
        code: 'doubleBagel',
        title: 'Double Bagel',
        description: 'Beat a player by winning a match 6-0, 6-0.',
        getState({ stats }) {
            const value = stats.doubleBageled;
            const completed = value;

            return {
                props: {
                    largeText: '00',
                    shape: 'shield',
                    colorHue: 200,
                    disabled: !completed,
                    completed,
                },
                payload: {
                    matches: stats.payload.doubleBageled || [],
                },
                summaryTitle: 'Related Matches',
                completed,
            };
        },
    },
    revenge: {
        code: 'revenge',
        title: 'Sweet Revenge',
        description: 'Beat a rival after losing to them at least 5 times.',
        getState({ stats }) {
            const value = stats.revenge;
            const completed = value;

            return {
                props: {
                    type: 'cake',
                    shape: 'shield',
                    colorHue: 200,
                    disabled: !completed,
                    completed,
                },
                payload: stats.payload.revenge,
                completed,
            };
        },
    },
    fury: {
        code: 'fury',
        title: 'Sleeping Fury',
        description: 'Win a set 6-0 after losing the first one.',
        getState({ stats }) {
            const value = stats.fury;
            const completed = value;

            return {
                props: {
                    type: 'tornado',
                    shape: 'shield',
                    colorHue: 200,
                    disabled: !completed,
                    completed,
                },
                payload: {
                    matches: stats.payload.fury || [],
                },
                completed,
            };
        },
    },
    oracle: {
        code: 'oracle',
        title: 'The Oracle',
        description: 'Win the Rival Bracket Battle.',
        getState({ stats }) {
            const value = stats.predictionWins;
            const completed = value > 0;

            return {
                props: {
                    type: 'crystalBall',
                    shape: 'shield',
                    colorHue: 200,
                    disabled: !completed,
                    completed,
                },
                payload: stats.payload.predictionWins || [],
                summaryTitle: 'Related Seasons',
                completed,
            };
        },
    },
    frame: {
        code: 'frame',
        title: 'Tennis Frame',
        description: 'Upload a photo to your profile.',
        getState({ stats }) {
            const value = stats.photoUploaded;
            const completed = Boolean(value);

            return {
                props: {
                    type: 'camera',
                    shape: 'shield',
                    colorHue: 200,
                    disabled: !completed,
                    completed,
                },
                completed,
            };
        },
    },
    practice: {
        code: 'practice',
        title: 'Practician',
        description: 'Create a practice proposal.',
        getState({ stats }) {
            const value = stats.practiceProposed;
            const completed = Boolean(value);

            return {
                props: {
                    type: 'practice',
                    shape: 'shield',
                    colorHue: 200,
                    disabled: !completed,
                    completed,
                },
                completed,
            };
        },
    },
};

const list = {
    oneTime: [
        badges.avatar,
        badges.profile,
        badges.allSeasonPlayer,
        badges.takeItToLimit,
        badges.dedication,
        badges.universalPlayer,
        badges.twoTiebreaks,
        badges.twoWinsOneDay,
        badges.davidGoliath,
        badges.feedback,
        badges.doubleBagel,
        badges.statistician,
        badges.revenge,
        badges.fury,
        badges.oracle,
        badges.frame,
        badges.practice,
    ],
    series: [
        badges.seasonsParticipated,
        badges.matchesPlayed,
        badges.matchesWon,
        badges.proposalsCreated,
        badges.proposalsAccepted,
        badges.tlrGain,
        badges.rivalries,
        badges.tiebreaker,
        badges.comebackKid,
    ],
    levels: [badges.tournament, badges.points],
};

export const allBadges = Object.values(badges);
export default list;
