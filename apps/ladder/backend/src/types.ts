export type User = {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    slug: string;
    teamName: string;
    birthday: string;
    avatar: string;
    comeFrom: string;
    comeFromOther: string;
};

export type Player = {
    id: number;
    partnerId: number;
    isActive: number;
    teamName: string;
    userSlug: string;
    userId: number;
    tournamentId: number;
};

export type Match = {
    id: number;
    challengerId: number;
    acceptorId: number;
    winner: number;
    challengerRank: number;
    acceptorRank: number;
    challengerPoints: number;
    acceptorPoints: number;
    wonByDefault: number;
    wonByInjury: number;
    unavailable: number;
    matchFormat: number;
    score: string;
    playedAt: string;
};

export type Tournament = {
    tournamentId: number;
    seasonId: number;
    levelId: number;
    levelMinTlr: number;
    levelMaxTlr: number;
    levelBaseTlr: number;
    levelType: string;
    levelName: string;
    gender: string;
    isActivePlay: boolean;
    isFree: number;
};

export type Config = {
    city: string;
    state: string;
    isRaleigh: number;
    referralFirstMatchCredit: number;
    referralFirstPaymentCredit: number;
    doublesChampionReward: number;
    singlesChampionReward: number;
    singlesRunnerUpReward: number;
    minMatchesToEstablishTlr: number;
    minMatchesToPlanTournament: number;
    tournamentReminderWeeks: number;
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
    width: string;
    height: string;
};

export type Season = {
    year: number;
    season: string;
    startDate: string;
    endDate: string;
};

export type Level = {
    id: number;
    name: string;
    slug: string;
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

export type Coach = {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    bullets: string;
    locationAddress: string;
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
