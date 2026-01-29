// @ts-nocheck
import _capitalize from 'lodash/capitalize';

export const calculateNextOrder = (settings) => {
    const {
        payments,
        allTournaments,
        tournaments,
        joinReason,
        joinForFree = [],
        singlesCost,
        doublesCost,
        earlyRegistrationDiscount,
        additionalLadderDiscount,
        tooHighTlrDiscount,
        isEarlyRegistration,
        partners,
        establishedElo,
    } = settings;

    const paidTournamentsIds = payments.map((item) => item.tournamentId).filter(Boolean);
    let paidTournamentsThisSeason = allTournaments.filter((item) => paidTournamentsIds.includes(item.id)).length;
    const result = [];
    for (const tournament of tournaments) {
        const discounts = [];

        const ladderCost = (() => {
            if (joinForFree.includes(tournament.id)) {
                return 0;
            }

            const isTooHighTlrDiscount = (() => {
                if (tournament.levelType !== 'single') {
                    return false;
                }
                if (!tournament.levelMaxTlr) {
                    return false;
                }
                if (!establishedElo) {
                    return false;
                }

                return establishedElo > tournament.levelMaxTlr;
            })();

            let cost = tournament.levelType.includes('doubles') ? doublesCost : singlesCost;
            if (isEarlyRegistration) {
                discounts.push('early registration');
                cost -= earlyRegistrationDiscount;
            }
            if (paidTournamentsThisSeason > 0) {
                discounts.push('additional ladder');
                cost -= additionalLadderDiscount;
            }
            if (isTooHighTlrDiscount) {
                discounts.push('no tournament');
                cost -= tooHighTlrDiscount;
            }

            return cost;
        })();

        result.push({
            position: 1,
            type: 'product',
            tournamentId: tournament.id,
            description: `${tournament.seasonYear} ${_capitalize(tournament.seasonSeason)} - ${
                tournament.levelName
            } Ladder${discounts.length > 0 ? ` (${discounts.join(', ')})` : ''}`,
            cost: -ladderCost,
            ...(joinReason ? { joinReason } : {}),
        });

        if (!joinForFree.includes(tournament.id)) {
            paidTournamentsThisSeason++;
        }
    }

    const prevBalance = payments.reduce((sum: number, payment) => sum + payment.amount, 0);
    const total = result.reduce((sum, item) => sum - item.cost, 0);
    const newBalance = Math.max(prevBalance - total, 0);

    if (prevBalance > 0 && total > 0) {
        result.push({
            position: 1003,
            type: 'balance',
            description: 'From Wallet',
            cost: Math.min(prevBalance, total),
        });
    }

    const transactions = result.sort((a, b) => a.position - b.position).map(({ position, ...item }) => item);
    const payload = { transactions };
    if (partners) {
        payload.partners = Object.fromEntries(Object.entries(partners).filter(([_, value]) => value));
    }

    return {
        payload,
        total: transactions.filter((item) => item.type !== 'info').reduce((sum, item) => sum - item.cost, 0),
        prevBalance,
        newBalance,
    };
};
