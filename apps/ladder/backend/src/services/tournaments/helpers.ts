import formatElo from '../../utils/formatElo';

export const getSuitableTournaments = (tournaments, elo, gender, registerForFree = false, userTournaments = []) => {
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

    ladders.all = tournaments.filter((item) => ladders.all.has(item.tournamentId));
    ladders.suitable = tournaments.filter((item) => ladders.suitable.has(item.tournamentId));
    ladders.additional = tournaments.filter((item) => ladders.additional.has(item.tournamentId));
    ladders.free = registerForFree ? [] : ladders.all.filter((item) => !item.isActivePlay || item.isFree);

    const formatList = (list) => {
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

    const suggestedLadders = (list) => {
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
            ladders.free.filter((ladder) => !userTournaments.includes(ladder.tournamentId)).length === 0
                ? ''
                : ` Due to the low level of activity last season, you can join some ladders for free.`;

        if (ladders.additional.length === 0) {
            return `Since your [TLR is ${formattedElo}], you're allowed to join only the following ladders. Other ladders are too weak or too strong for you.${freeLadders}`;
        }

        const suitableLadders = `Since your [TLR is ${formattedElo}], you should play on ${suggestedLadders(
            ladders.suitable
        )}.`;
        const additionalLadders =
            ladders.additional.length === 0
                ? ''
                : ` However, we will allow you to play on ${suggestedLadders(ladders.additional)} as well.`;

        return `${suitableLadders}${additionalLadders}${freeLadders}`;
    })();

    ladders.all = ladders.all.map((item) => item.tournamentId);
    ladders.suitable = ladders.suitable.map((item) => item.tournamentId);
    ladders.additional = ladders.additional.map((item) => item.tournamentId);
    ladders.free = ladders.free.map((item) => item.tournamentId);

    return {
        ...ladders,
        text,
    };
};

export const getPartners = (pairs) => {
    const result = {};

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
