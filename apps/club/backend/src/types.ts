export type UserInformation = {
    subscribeForProposals: {
        playFormats: number[];
        onlyNotPlaying: boolean;
        onlyCompetitive: boolean;
        onlyAgeCompatible: boolean;
        onlyMySchedule: boolean;
        weeklySchedule: [number, number][][];
    };
    partnerName?: string;
};

export type User = {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    slug: string;
    roles: string;
    teamName?: string;
    birthday?: string;
    avatar?: string | object;
    information?: UserInformation;
};

export type Player = {
    id: number;
    partnerId: number;
    isActive: number;
    teamName: string | null;
    userSlug: string;
    userId: number;
    tournamentId: number;
};

export type Match = {
    id: number;
    challengerId: number;
    acceptorId: number;
    challenger2Id: number;
    acceptor2Id: number;
    winner: number;
    challengerRank: number;
    acceptorRank: number;
    challengerPoints: number;
    acceptorPoints: number;
    challengerMatches: number;
    acceptorMatches: number;
    challengerElo: number;
    acceptorElo: number;
    challengerEloChange: number;
    acceptorEloChange: number;
    challengerSeed: number;
    acceptorSeed: number;
    challengerUserId: number;
    acceptorUserId: number;
    wonByDefault: number;
    wonByInjury: number;
    matchFormat: number;
    practiceType: number;
    score: string;
    playedAt: string;
    finalSpot: number;
    createdAt: string;
    updatedAt: string;
    acceptedAt: string;
    same: string;
    place: string;
    comment: string;
};

export type Tournament = {
    id?: number;
    tournamentId: number;
    seasonId?: number;
    levelId?: number;
    levelMinTlr: number;
    levelMaxTlr: number;
    levelBaseTlr: number;
    levelType: string;
    levelName: string;
    gender?: string;
    isActivePlay: boolean;
    isFree?: number;
};

export type Config = {
    city: string;
    state: string;
    isRaleigh: number;
    minMatchesToEstablishTlr: number;
    minMatchesToPlanTournament: number;
    tournamentReminderWeeks: number;
    minPlayersForActiveLadder: number;
    minMatchesForActiveLadder: number;
    minMatchesToPay: number;
    url: string;
};

export type Proposal = {
    playedAt: string;
    matchFormat: number;
    place: string;
    comment: string;
    practiceType: number;
    duration: number;
};

export type Image = {
    src: string;
    width: number;
    height: number;
};

export type Season = {
    id: number;
    year: number;
    season: 'spring' | 'summer' | 'fall' | 'winter';
    startDate: string;
    endDate: string;
    isFree: number;
};

export type Level = {
    id: number;
    name: string;
    slug: string;
    baseTlr: number;
};

export type Badge = {
    image: string;
    title: string;
    description: string;
};

export type PhotoModeration = {
    label: string;
    percent: number;
};

export type RivalryHistory = {
    date: string;
    isWinner: boolean;
    score: string;
};

export type Photo = {
    id: number;
    userId: number;
    width: number;
    height: number;
    title: string;
    url400: string;
    userSlug: string;
    allowShare: number;
    allowComments: number;
    isApproved: number;
    createdAt: string;
    attributes: {
        url: string;
        title: string;
        userSlug: string;
    };
};

export type Option = {
    value: number | string;
    label: string;
};

export type Schedule = [number, number][];

export type Reaction = {
    userId: number;
    photoId: number;
    code: string;
    createdAt: string;
};

export type Comment = {
    userId: number;
    photoId: number;
    message: string;
    createdAt: string;
};

export type Recipient = {
    email: string;
    variables: Record<string, string>;
};
