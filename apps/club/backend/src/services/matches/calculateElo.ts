import 'dotenv/config';
import NodeCache from 'node-cache';
import { completeInjuryFullScore, completeInjuryFastScore, getOutcome } from './helpers';
import dayjs from '../../utils/dayjs';
import logger from '@rival-tennis-ladder/logger';
import { runQuery, closeConnection } from '../../db/connection';

const cache = new NodeCache();
const CACHE_KEY = 'elo';

const maxRd = 350;
const averageRd = 110;
const timeToResetRd = 365 * 6; // 6 years
const c2 = (maxRd ** 2 - averageRd ** 2) / timeToResetRd;

type Player = {
    id: number;
    elo: number;
    matches: number;
    prevPlayedAt: string;
    rd: number;
};

const getTimeDiff = (date1: string, date2: string) => {
    return (+new Date(date2) - +new Date(date1)) / (24 * 3600 * 1000);
};

export const getTotalGames = (score: string) => {
    const arr = score.match(/\d+/g);
    if (!arr) {
        return 0;
    }

    return arr.reduce((sum, num) => sum + Number(num), 0);
};

export const reverseScore = (score: string) =>
    score
        .split(' ')
        .map((set) => set.replace(/^(\d+)-(\d+)$/, '$2-$1'))
        .join(' ');

const scaleTlrToElo = (10 * 3) / 5;

const eloToTlr = (elo: number, baseTlr: number) => {
    return baseTlr + (elo - 1500) / scaleTlrToElo;
};

const tlrToElo = (tlr: number, baseTlr: number) => {
    return (tlr - baseTlr) * scaleTlrToElo + 1500;
};

const getTlr = ({
    first,
    second,
    outcome,
    playedAt,
    eloDiff,
    multiplier = 1,
    baseTlr,
}: {
    first: Player;
    second: Player;
    outcome: number;
    playedAt: string;
    eloDiff?: number;
    multiplier: number;
    baseTlr: number;
}) => {
    const pi = 3.1415926;
    const q = Math.log(10) / 400;
    const g = (rd: number) => 1 / Math.sqrt(1 + (3 * q ** 2 * rd ** 2) / pi ** 2);
    const e = (r: number, rj: number, rdj: number) => 1 / (1 + 10 ** ((-g(rdj) * (r - rj)) / 400));
    const getK = (rd: number) => 1.1 - 20 / (maxRd - rd + 20 / 0.4); // confidence in TLR (from 0.7 to 1.1)

    const firstElo = tlrToElo(first.elo, baseTlr);
    const secondElo = tlrToElo(second.elo, baseTlr);

    const expectedOutcome = 1 / (1 + 10 ** ((eloDiff ?? secondElo - firstElo) / 400));
    const outcomeDiff = (outcome - expectedOutcome) * multiplier;

    const firstRd = Math.min(Math.sqrt(first.rd ** 2 + c2 * getTimeDiff(first.prevPlayedAt, playedAt)), maxRd);
    const secondRd = Math.min(Math.sqrt(second.rd ** 2 + c2 * getTimeDiff(second.prevPlayedAt, playedAt)), maxRd);

    const firstE = e(firstElo, secondElo, secondRd);
    const firstD2 = 1 / (q ** 2 * (g(secondRd) ** 2 * firstE * (1 - firstE)));
    const firstK = getK(secondRd);

    const secondE = e(secondElo, firstElo, firstRd);
    const secondD2 = 1 / (q ** 2 * (g(firstRd) ** 2 * secondE * (1 - secondE)));
    const secondK = getK(firstRd);

    const newFirstElo = eloToTlr(firstElo + firstRd * outcomeDiff * firstK, baseTlr);
    const newSecondElo = eloToTlr(secondElo - secondRd * outcomeDiff * secondK, baseTlr);

    first.rd = Math.sqrt((1 / firstRd ** 2 + 1 / firstD2) ** -1);
    second.rd = Math.sqrt((1 / secondRd ** 2 + 1 / secondD2) ** -1);

    return [newFirstElo, newSecondElo, Math.round(firstRd), Math.round(secondRd)];
};

export const calculateElo = async () => {
    const levels = await runQuery('SELECT id FROM levels WHERE baseTlr IS NOT NULL AND type="single"');
    const levelIds = levels.map((level) => level.id);

    if (levelIds.length === 0) {
        closeConnection();
        return;
    }

    try {
        // @ts-expect-error - hard to type it
        const { users, startDate } = (() => {
            if (process.env.NODE_ENV === 'test' || process.env.CI || !cache.has(CACHE_KEY)) {
                return { users: {}, startDate: '1999-12-12 00:00:00' };
            }

            return cache.get(CACHE_KEY);
        })();

        const addUser = (id: number, baseTlr: number): Player => {
            if (!users[id]) {
                users[id] = {
                    id,
                    elo: baseTlr,
                    matches: 0,
                    prevPlayedAt: '1999-01-01',
                    rd: maxRd,
                };
            }

            return users[id];
        };

        const multiLadderMatches = (
            await runQuery(
                `SELECT id, sameAs FROM matches WHERE score IS NOT NULL AND sameAs is NOT NULL AND playedAt>"${startDate}"`
            )
        ).reduce((obj, item) => {
            obj[item.sameAs] = obj[item.sameAs] || [];
            obj[item.sameAs].push(item.id);
            return obj;
        }, {});

        const matches = await runQuery(
            `SELECT m.id,
                    m.challengerId,
                    m.acceptorId,
                    m.winner,
                    m.score,
                    m.challengerElo,
                    m.acceptorElo,
                    m.wonByDefault,
                    m.wonByInjury,
                    m.type,
                    m.playedAt,
                    m.challengerRd,
                    m.acceptorRd,
                    m.matchFormat,
                    l.baseTlr AS levelBaseTlr
                FROM matches AS m,
                    players AS p,
                    tournaments AS t,
                    levels AS l
                WHERE m.score IS NOT NULL AND
                    m.sameAs IS NULL AND
                    m.playedAt>"${startDate}" AND
                    m.challengerId=p.id AND
                    p.tournamentId=t.id AND
                    t.levelId=l.id AND
                    t.levelId IN (${levelIds.join(',')})
            ORDER BY m.playedAt, m.id
        `
        );

        const players = (await runQuery(`SELECT id, userId FROM players`)).reduce((obj, row) => {
            obj[row.id] = row.userId;
            return obj;
        }, {});

        // save cache only for fairly old data
        const dateMonthAgo = dayjs.tz().subtract(1, 'month').format('YYYY-MM-DD HH:mm:ss');

        for (const match of matches) {
            if (!cache.has(CACHE_KEY) && match.playedAt > dateMonthAgo) {
                cache.set(CACHE_KEY, {
                    users,
                    startDate: dateMonthAgo,
                });
            }

            const isFast4 = match.matchFormat === 2;
            const completeInjuryScore = isFast4 ? completeInjuryFastScore : completeInjuryFullScore;

            const challenger = addUser(players[match.challengerId], match.levelBaseTlr);
            const acceptor = addUser(players[match.acceptorId], match.levelBaseTlr);

            let newChallengerElo = challenger.elo;
            let newAcceptorElo = acceptor.elo;
            let challengerRd = maxRd;
            let acceptorRd = maxRd;

            if (!match.wonByDefault) {
                const score = (() => {
                    let result = match.score;
                    if (match.wonByInjury) {
                        result = completeInjuryScore(result, match.winner === match.challengerId);
                    }

                    return match.winner === match.challengerId ? result : reverseScore(result);
                })();

                const outcome = getOutcome(score);

                const multiplier = (() => {
                    if (!match.wonByInjury) {
                        return 1;
                    }

                    const num1 = getTotalGames(match.score);
                    const num2 = getTotalGames(score);

                    return num1 / num2;
                })();

                [newChallengerElo, newAcceptorElo, challengerRd, acceptorRd] = getTlr({
                    first: challenger,
                    second: acceptor,
                    outcome: match.winner === match.challengerId ? outcome : 1 - outcome,
                    playedAt: match.playedAt,
                    multiplier,
                    baseTlr: match.levelBaseTlr,
                });
            }

            const prevRoundedChallengerElo = Math.round(challenger.elo);
            const newRoundedChallengerElo = Math.round(newChallengerElo);
            const challengerEloChange = newRoundedChallengerElo - prevRoundedChallengerElo;
            if (!match.wonByDefault) {
                challenger.elo = newChallengerElo;
                challenger.prevPlayedAt = match.playedAt;
                challenger.matches++;
            }

            const prevRoundedAcceptorElo = Math.round(acceptor.elo);
            const newRoundedAcceptorElo = Math.round(newAcceptorElo);
            const acceptorEloChange = newRoundedAcceptorElo - prevRoundedAcceptorElo;
            if (!match.wonByDefault) {
                acceptor.elo = newAcceptorElo;
                acceptor.prevPlayedAt = match.playedAt;
                acceptor.matches++;
            }

            if (
                newRoundedChallengerElo !== match.challengerElo ||
                newRoundedAcceptorElo !== match.acceptorElo ||
                challengerRd !== match.challengerRd ||
                acceptorRd !== match.acceptorRd
            ) {
                const getQuery = (id: number) => `UPDATE matches
                    SET challengerElo=${newRoundedChallengerElo},
                        acceptorElo=${newRoundedAcceptorElo},
                        challengerEloChange=${challengerEloChange},
                        acceptorEloChange=${acceptorEloChange},
                        challengerMatches=${challenger.matches},
                        acceptorMatches=${acceptor.matches},
                        challengerRd=${challengerRd || 0},
                        acceptorRd=${acceptorRd || 0}
                    WHERE id=${id}`;

                await runQuery(getQuery(match.id));

                if (multiLadderMatches[match.id]) {
                    for (const matchId of multiLadderMatches[match.id]) {
                        await runQuery(getQuery(matchId));
                    }
                }
            }
        }
    } catch (e) {
        logger.error((e as Error).message);
    }

    closeConnection();
};
