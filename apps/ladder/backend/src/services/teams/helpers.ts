import type { Option } from '../../types';

export const teamNameOptions: Option[] = [
    { value: 1, label: 'Servebots' },
    { value: 2, label: 'Challengers' },
    { value: 3, label: 'Grinders' },
    { value: 4, label: 'Pushers' },
    { value: 5, label: 'Smashers' },
    { value: 6, label: 'Love Handles' },
    { value: 7, label: 'Alley Gators' },
    { value: 8, label: 'Racqueteers' },
    { value: 9, label: 'Game Set Match' },
    { value: 10, label: 'Game Changers' },
    { value: 11, label: 'Court Crushers' },
    { value: 12, label: 'Grand Slammers' },
    { value: 13, label: 'Net Ninjas' },
    { value: 14, label: 'Racquet Warriors' },
    { value: 15, label: 'Baseliners' },
    { value: 16, label: 'Court Jesters' },
    { value: 17, label: 'Drop Shot Divas' },
    { value: 18, label: 'Love Gurus' },
    { value: 19, label: 'Racquet Scientists' },
    { value: 20, label: 'Slice Girls' },
    { value: 21, label: 'Volley Llamas' },
    { value: 22, label: 'Court Kings' },
    { value: 23, label: 'Lobbyists' },
    { value: 24, label: 'Ace Venturas' },
    { value: 25, label: 'Ball Hogs' },
    { value: 26, label: 'Baseline Bandits' },
    { value: 27, label: 'Servivors' },
    { value: 28, label: 'Blabalots' },
    { value: 29, label: 'Hall of Framers' },
    { value: 30, label: 'One Hit Wonders' },
    { value: 31, label: 'Breaking Baddies' },
];

export const tlrBudget3 = 4800;
export const minMatches = 10;
export const maxTeamMembers = 5;

export const getTlrLimit = (players: any[]) => {
    const tlrs = players
        .filter((player) => player.weekTlr)
        .map((player) => player.weekTlr)
        .sort((a, b) => b - a);

    if (tlrs.length >= 2) {
        return tlrBudget3 - tlrs[0] - tlrs[1];
    }

    return 9999;
};

export const getTeamName = (team: any) => {
    if (team.name === 0) {
        return '';
    }

    if (team.name === 99) {
        return team.customName;
    }

    return teamNameOptions.find((item) => item.value === team.name)?.label || '';
};
