import type { Tournament } from '../../types';
import formatElo from '../../utils/formatElo';

export const getSuitableTournaments = (
    tournaments: Tournament[],
    elo: number,
    gender: string,
    registerForFree: boolean = false,
    userTournaments: number[] = []
) => {
    const orderedTournaments = tournaments
        .filter((item) => item.gender === gender)
        .sort((a, b) => {
            if (a.levelType !== b.levelType) {
                return a.levelType === 'single' ? -1 : 1;
            }

            return Math.abs(a.levelBaseTlr - elo) - Math.abs(b.levelBaseTlr - elo);
        });

    const ladders = {
        all: new Set(),
        suitable: new Set(),
        additional: new Set(),
        free: new Set(),
    };

    const hasActiveLadder = orderedTournaments.some((item) => item.levelType === 'single' && item.isActivePlay);

    let foundActiveTournament = false;
    for (const t of orderedTournaments) {
        const isSuitable = elo >= t.levelMinTlr && elo <= t.levelMaxTlr;

        if (t.levelType === 'single' && ladders.suitable.size === 0) {
            // first closest ladder is always suitable
            ladders.all.add(t.tournamentId);
            ladders.suitable.add(t.tournamentId);
        } else if (isSuitable) {
            ladders.all.add(t.tournamentId);

            if (t.levelType === 'single') {
                ladders.suitable.add(t.tournamentId);
            }
        } else if (hasActiveLadder && !foundActiveTournament) {
            ladders.all.add(t.tournamentId);

            if (t.levelType === 'single') {
                ladders.additional.add(t.tournamentId);
            }
        }

        if (t.levelType === 'single' && t.isActivePlay) {
            foundActiveTournament = true;
        }
    }

    const result: {
        all?: Tournament[];
        suitable?: Tournament[];
        additional?: Tournament[];
        free?: Tournament[];
    } = {};
    result.all = tournaments.filter((item) => ladders.all.has(item.tournamentId));
    result.suitable = tournaments.filter((item) => ladders.suitable.has(item.tournamentId));
    result.additional = tournaments.filter((item) => ladders.additional.has(item.tournamentId));
    result.free = registerForFree ? [] : result.all.filter((item) => !item.isActivePlay || item.isFree);

    const formatList = (list: Tournament[]) => {
        if (list.length === 1) {
            return `[${list[0].levelName}]`;
        }
        if (list.length === 2) {
            return `[${list[0].levelName}] or [${list[1].levelName}]`;
        }

        return `${list
            .slice(0, list.length - 1)
            .map((item) => `[${item.levelName}]`)
            .join(', ')}, or [${list[list.length - 1].levelName}]`;
    };

    const suggestedLadders = (list: Tournament[]) => {
        if (list.length === 1) {
            return `the [${list[0].levelName}] ladder`;
        }
        if (list.length === 2) {
            return `either the ${formatList(list)} ladders`;
        }

        return `the ${formatList(list)} ladders`;
    };

    const text = (() => {
        const formattedElo = formatElo(elo);

        const freeLadders =
            result.free.filter((ladder) => !userTournaments.includes(ladder.tournamentId)).length === 0
                ? ''
                : ` Due to the low level of activity last season, you can join some ladders for free.`;

        if (result.additional.length === 0) {
            return `Since your [TLR is ${formattedElo}], you're allowed to join only the following ladders. Other ladders are too weak or too strong for you.${freeLadders}`;
        }

        const suitableLadders = `Since your [TLR is ${formattedElo}], you should play on ${suggestedLadders(
            result.suitable
        )}.`;
        const additionalLadders =
            result.additional.length === 0
                ? ''
                : ` However, we will allow you to play on ${suggestedLadders(result.additional)} as well.`;

        return `${suitableLadders}${additionalLadders}${freeLadders}`;
    })();

    const getTournamentId = (item: Tournament) => item.tournamentId;

    return {
        all: result.all.map(getTournamentId),
        suitable: result.suitable.map(getTournamentId),
        additional: result.additional.map(getTournamentId),
        free: result.free.map(getTournamentId),
        text,
    };
};

export const getPartners = (pairs: number[][]) => {
    const result: Record<string, number[]> = {};

    pairs
        .sort((a, b) => (a[1] === b[1] ? a[0] - b[0] : a[1] - b[1]))
        .forEach(([id, partnerId]) => {
            if (!partnerId) {
                result[id] = [id];
            } else if (result[partnerId]) {
                result[partnerId].push(id);
                result[id] = result[partnerId];
            }
        });

    return result;
};
