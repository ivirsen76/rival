export type User = {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    slug: string;
    teamName: string;
};

export type Match = {
    id: number;
    challengerId: number;
    acceptorId: number;
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
