import dayjs from '@rival/dayjs';
import { getPoints } from './helpers';
import logger from '@rival-tennis-ladder/logger';
import { runQuery, closeConnection } from '../../db/connection';
import type { Match } from '../../types';

const getAverageRank = (rank1: number, rank2: number): number => Math.floor((rank1 + rank2) / 2);

const calculateRank = async (tournamentId: number) => {
    try {
        const [{ startDate, endDate, levelType }] = await runQuery(`
            SELECT s.startDate,
                   s.endDate,
                   l.type AS levelType
              FROM tournaments AS t
              JOIN seasons AS s ON t.seasonId=s.id
              JOIN levels AS l ON t.levelId=l.id
             WHERE t.id=${tournamentId}
        `);
        const isDoubles = levelType === 'doubles';
        const isDoublesTeam = levelType === 'doubles-team';

        // don't recalculate rank if the season has passed
        if (dayjs.tz().isAfter(dayjs.tz(endDate))) {
            closeConnection();
            return;
        }

        const playerList = await runQuery(`
            SELECT id,
                   partnerId
              FROM players
             WHERE tournamentid=${tournamentId}
        `);
        const players = playerList.reduce((obj, item) => {
            obj[item.id] = { id: item.id, rank: 1, points: 0 };
            return obj;
        }, {});
        const captains = playerList.reduce((obj, item) => {
            if (item.partnerId) {
                obj[item.id] = item.partnerId;
            }
            return obj;
        }, {});

        const query = `
            SELECT m.id,
                   m.challengerId,
                   m.acceptorId,
                   m.winner,
                   m.challengerRank,
                   m.acceptorRank,
                   m.challengerPoints,
                   m.acceptorPoints,
                   m.challenger2Id,
                   m.challenger2Rank,
                   m.challenger2Points,
                   m.acceptor2Id,
                   m.acceptor2Rank,
                   m.acceptor2Points,
                   m.playedAt,
                   m.score,
                   m.wonByDefault,
                   m.unavailable,
                   m.wonByInjury,
                   m.matchFormat
              FROM matches AS m
              JOIN players AS p
                ON m.challengerId=p.id AND p.tournamentId=${tournamentId}
             WHERE m.type="regular" AND m.playedAt IS NOT NULL
          ORDER BY m.playedAt, m.id
        `;
        const matchList = await runQuery(query);

        const currentDate = dayjs.tz().format('YYYY-MM-DD HH:mm:ss');
        let end = dayjs.tz(startDate).add(1, 'week');
        let endString = end.format('YYYY-MM-DD HH:mm:ss');
        for (const match of matchList) {
            if (match.playedAt >= endString) {
                do {
                    end = end.add(1, 'week');
                    endString = end.format('YYYY-MM-DD HH:mm:ss');
                } while (match.playedAt >= endString);

                const sorted = Object.values(players).sort((a, b) => b.points - a.points);

                let prevRank = 0;
                for (let i = 0; i < sorted.length; i++) {
                    const { id, points } = sorted[i];
                    if (i === 0 || points < sorted[i - 1].points) {
                        prevRank = players[id].rank = i + 1;
                    } else {
                        players[id].rank = prevRank;
                    }
                }
            }

            const challengerId = captains[match.challengerId] || match.challengerId;
            const acceptorId = captains[match.acceptorId] || match.acceptorId;

            const challengerRank = players[challengerId].rank as number;
            const acceptorRank = acceptorId ? (players[acceptorId].rank as number) : null;
            const challenger2Rank = !isDoublesTeam && match.challenger2Id ? players[match.challenger2Id].rank : null;
            const acceptor2Rank = !isDoublesTeam && match.acceptor2Id ? players[match.acceptor2Id].rank : null;
            if (!match.score) {
                // Proposal
                if (
                    challengerRank !== match.challengerRank ||
                    acceptorRank !== match.acceptorRank ||
                    challenger2Rank !== match.challenger2Rank ||
                    acceptor2Rank !== match.acceptor2Rank
                ) {
                    await runQuery(
                        `UPDATE matches
                            SET challengerRank=${challengerRank},
                                acceptorRank=${acceptorRank},
                                challenger2Rank=${challenger2Rank},
                                acceptor2Rank=${acceptor2Rank}
                          WHERE id=${match.id}`
                    );
                }
            } else {
                // Match
                const { challengerPoints, acceptorPoints, winner } = getPoints({
                    ...match,
                    challengerRank: isDoubles ? getAverageRank(challengerRank, challenger2Rank) : challengerRank,
                    acceptorRank: isDoubles ? getAverageRank(acceptorRank!, acceptor2Rank) : acceptorRank,
                } as Match);

                // don't increase points starting from the current week
                if (currentDate > endString) {
                    players[challengerId].points += challengerPoints;
                    players[acceptorId].points += acceptorPoints;

                    if (isDoubles) {
                        players[match.challenger2Id].points += challengerPoints;
                        players[match.acceptor2Id].points += acceptorPoints;
                    }
                }

                if (isDoubles) {
                    if (
                        challengerRank !== match.challengerRank ||
                        acceptorRank !== match.acceptorRank ||
                        challengerPoints !== match.challengerPoints ||
                        acceptorPoints !== match.acceptorPoints ||
                        challenger2Rank !== match.challenger2Rank ||
                        acceptor2Rank !== match.acceptor2Rank ||
                        challengerPoints !== match.challenger2Points ||
                        acceptorPoints !== match.acceptor2Points ||
                        winner !== match.winner
                    ) {
                        await runQuery(
                            `UPDATE matches
                                SET challengerRank=${challengerRank},
                                    acceptorRank=${acceptorRank},
                                    challengerPoints=${challengerPoints},
                                    acceptorPoints=${acceptorPoints},
                                    challenger2Rank=${challenger2Rank},
                                    acceptor2Rank=${acceptor2Rank},
                                    challenger2Points=${challengerPoints},
                                    acceptor2Points=${acceptorPoints},
                                    winner=${winner}
                              WHERE id=${match.id}`
                        );
                    }
                } else if (
                    challengerRank !== match.challengerRank ||
                    acceptorRank !== match.acceptorRank ||
                    challengerPoints !== match.challengerPoints ||
                    acceptorPoints !== match.acceptorPoints ||
                    winner !== match.winner
                ) {
                    await runQuery(
                        `UPDATE matches
                            SET challengerRank=${challengerRank},
                                acceptorRank=${acceptorRank},
                                challengerPoints=${challengerPoints},
                                acceptorPoints=${acceptorPoints},
                                winner=${winner}
                          WHERE id=${match.id}`
                    );
                }
            }
        }

        // set rank for final matches
        const finalMatches = await runQuery(`
            SELECT m.*
              FROM matches AS m
              JOIN players AS p
                ON (m.challengerId=p.id OR (m.challengerId IS NULL AND m.acceptorId=p.id)) AND
                   p.tournamentId=${tournamentId}
             WHERE m.type="final"
        `);
        for (const match of finalMatches) {
            const challengerRank = match.challengerId ? players[match.challengerId].rank : null;
            const acceptorRank = match.acceptorId ? players[match.acceptorId].rank : null;
            if (challengerRank !== match.challengerRank || acceptorRank !== match.acceptorRank) {
                await runQuery(
                    `UPDATE matches
                        SET challengerRank=${challengerRank},
                            acceptorRank=${acceptorRank}
                      WHERE id=${match.id}`
                );
            }
        }
    } catch (e) {
        logger.error((e as Error).message);
    }

    closeConnection();
};

export default calculateRank;
