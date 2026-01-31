import type { HookContext } from '@feathersjs/feathers';
import dayjs from '../../utils/dayjs';
import finalMatchTemplate from '../../emailTemplates/finalMatch';
import finalMatchByeTemplate from '../../emailTemplates/finalMatchBye';
import renderImage from '../../utils/renderImage';
import { getSeasonName } from '../seasons/helpers';
import getMatchInfo from './getMatchInfo';
import type { Image, Match, User } from '../../types';

const relationsDown: Record<number, [number, number]> = {
    7: [15, 14],
    6: [13, 12],
    5: [11, 10],
    4: [9, 8],
    3: [7, 6],
    2: [5, 4],
    1: [3, 2],
};

const sendFinalReminders = async (context: HookContext, tournamentId: number) => {
    const sequelize = context.app.get('sequelizeClient');
    const currentDate = dayjs.tz();

    const [[currentSeason]] = await sequelize.query(
        `SELECT s.*
           FROM tournaments AS t,
                seasons AS s
          WHERE t.seasonId=s.id
            AND t.id=:tournamentId`,
        { replacements: { tournamentId } }
    );

    type FinalMatch = Match & {
        levelType: string;
        levelName: string;
        challengerTeamName: string;
        challengerFirstName: string;
        challengerLastName: string;
        acceptorTeamName: string;
        acceptorFirstName: string;
        acceptorLastName: string;
    };

    const [matches] = (await sequelize.query(
        `
        SELECT m.id,
               m.challengerId,
               m.acceptorId,
               m.challengerSeed,
               m.acceptorSeed,
               m.finalSpot,
               m.createdAt,
               m.type,
               m.score,
               m.playedAt,
               m.updatedAt,
               l.name AS levelName,
               l.type AS levelType,
               pc.teamName AS challengerTeamName,
               uc.firstName AS challengerFirstName,
               uc.lastName AS challengerLastName,
               pa.teamName AS acceptorTeamName,
               ua.firstName AS acceptorFirstName,
               ua.lastName AS acceptorLastName,
               t.id AS tournamentId
          FROM matches AS m
     LEFT JOIN players AS pc ON m.challengerId=pc.id
     LEFT JOIN users AS uc ON pc.userId=uc.id
     LEFT JOIN players AS pa ON m.acceptorId=pa.id
     LEFT JOIN users AS ua ON pa.userId=ua.id
          JOIN tournaments AS t ON (pc.tournamentId=t.id || pa.tournamentId=t.id)
          JOIN levels AS l ON t.levelId=l.id
         WHERE t.id=:tournamentId AND
               m.type="final"`,
        { replacements: { tournamentId } }
    )) as [FinalMatch[]];

    if (matches.length === 0) {
        return;
    }

    const finalSpotMatch = matches.reduce(
        (obj, item) => {
            obj[item.finalSpot] = item;
            return obj;
        },
        {} as Record<string, FinalMatch>
    );

    const dateThreeWeeksAgo = currentDate.subtract(3, 'week').format('YYYY-MM-DD HH:mm:ss');
    const decidedMatches = matches.filter(
        (item) =>
            item.challengerId &&
            item.acceptorId &&
            item.score === null &&
            item.playedAt === null &&
            item.updatedAt > dateThreeWeeksAgo
    );

    const byeMatches = matches.filter((match) => {
        if (match.challengerId && match.acceptorId) {
            return false;
        }

        const isBye =
            (relationsDown[match.finalSpot] || []).filter((finalSpot) => finalSpotMatch[finalSpot]).length === 1;

        return isBye;
    });

    const seasonName = getSeasonName(currentSeason);
    const roundsTotal = Math.max(...matches.map((item) => item.finalSpot)) > 7 ? 4 : 3;

    // Decided matches
    {
        const ACTION_NAME = 'sendFinalMatchReminder';

        const sendEmail = ({
            emails,
            finalSpot,
            opponent,
            levelName,
            img,
            subject,
            showNewOpponentWarning,
        }: {
            emails: string[];
            finalSpot: number;
            opponent: User;
            levelName: string;
            img: Image;
            subject: string;
            showNewOpponentWarning: boolean;
        }) => {
            const html = finalMatchTemplate({
                config: context.params.config,
                seasonEndDate: currentSeason.endDate,
                finalSpot,
                opponent,
                seasonName,
                levelName,
                img,
                showNewOpponentWarning,
                roundsTotal,
            });

            // the final match reminder is not suitable (too late etc.)
            if (!html) {
                return;
            }

            context.app.service('api/emails').create({
                to: emails,
                subject,
                html,
                priority: 2,
            });
        };

        for (const match of decidedMatches) {
            const code = [match.challengerId, match.acceptorId].join(',');
            const [[action]] = await sequelize.query(
                `
                SELECT tableId, payload
                  FROM actions
                 WHERE name=:name AND tableId=::matchId
              ORDER BY createdAt DESC
                 LIMIT 0, 1`,
                { replacements: { name: ACTION_NAME, matchId: match.id } }
            );
            const payload = action ? JSON.parse(action.payload) : null;
            if (payload?.code === code) {
                continue;
            }

            const matchInfo = await getMatchInfo({ app: context.app, matchId: match.id });

            const isDoublesTeam = match.levelType === 'doubles-team';

            const props = encodeURIComponent(
                JSON.stringify({
                    ...matchInfo.imageProps,
                    emulateMyMatch: true,
                    showHeader: true,
                })
            );
            const img = await renderImage(`${process.env.TL_URL}/image/match?props=${props}`);

            const isRound16 = match.finalSpot > 7;
            const isQuarterFinal = match.finalSpot <= 7 && match.finalSpot > 3;
            const isSemiFinal = match.finalSpot <= 3 && match.finalSpot > 1;
            const subject = isRound16
                ? `${isDoublesTeam ? 'Your Team' : 'You'} Made the Round of 16 of the ${
                      match.levelName
                  } Final Tournament!`
                : isQuarterFinal
                  ? `${isDoublesTeam ? 'Your Team' : 'You'} Made the Quarterfinals of the ${
                        match.levelName
                    } Final Tournament!`
                  : isSemiFinal
                    ? `${isDoublesTeam ? 'Your Team is' : "You're"} in the Semifinals of the ${
                          match.levelName
                      } Final Tournament!`
                    : `Your Final Match Awaits for the ${match.levelName} Final Tournament!`;

            // sending to challenger
            sendEmail({
                emails: matchInfo.challengerEmails,
                finalSpot: matchInfo.match.finalSpot,
                opponent: matchInfo.acceptors[0],
                levelName: matchInfo.levelName,
                subject,
                img,
                showNewOpponentWarning: payload?.challengerId === match.challengerId,
            });

            // sending to acceptor
            sendEmail({
                emails: matchInfo.acceptorEmails,
                finalSpot: matchInfo.match.finalSpot,
                opponent: matchInfo.challengers[0],
                levelName: matchInfo.levelName,
                subject,
                img,
                showNewOpponentWarning: payload?.acceptorId === match.acceptorId,
            });

            // Save state that we sent a message
            await sequelize.query(`INSERT INTO actions (tableId, name, payload) VALUES (:matchId, :name, :payload)`, {
                replacements: {
                    matchId: match.id,
                    name: ACTION_NAME,
                    payload: JSON.stringify({ code, challengerId: match.challengerId, acceptorId: match.acceptorId }),
                },
            });
        }
    }

    // Bye matches
    {
        const ACTION_NAME = 'sendFinalByeReminder';

        for (const match of byeMatches) {
            const [actions] = await sequelize.query(`SELECT * FROM actions WHERE tableId=:matchId AND name=:name`, {
                replacements: { matchId: match.id, name: ACTION_NAME },
            });

            if (actions.length > 0) {
                continue;
            }

            const matchInfo = await getMatchInfo({ app: context.app, matchId: match.id });
            const isDoublesTeam = match.levelType === 'doubles-team';

            const playerSeed = match.challengerId ? match.challengerSeed : match.acceptorSeed;

            const relatedFinalSpot = relationsDown[match.finalSpot].find((finalSpot) => finalSpotMatch[finalSpot])!;
            const relatedMatch = finalSpotMatch[relatedFinalSpot];
            const opponent1 = isDoublesTeam
                ? relatedMatch.challengerTeamName
                : `${relatedMatch.challengerFirstName} ${relatedMatch.challengerLastName}`;
            const opponent2 = isDoublesTeam
                ? relatedMatch.acceptorTeamName
                : `${relatedMatch.acceptorFirstName} ${relatedMatch.acceptorLastName}`;

            const subject = `${isDoublesTeam ? 'Your Team is' : "You're"} Receiving a Bye for the ${
                match.levelName
            } Final Tournament!`;

            context.app.service('api/emails').create({
                to: matchInfo.emails,
                subject,
                html: finalMatchByeTemplate({
                    config: context.params.config,
                    seedNumber: playerSeed,
                    opponent1,
                    opponent2,
                    seasonName,
                    levelName: match.levelName,
                    levelType: match.levelType,
                }),
                priority: 2,
            });

            // Save state that we sent a message
            await sequelize.query(`INSERT INTO actions (tableId, name) VALUES (:matchId, :name)`, {
                replacements: { matchId: match.id, name: ACTION_NAME },
            });
        }
    }
};

export default sendFinalReminders;
