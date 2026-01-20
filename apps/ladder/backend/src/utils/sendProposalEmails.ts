import dayjs from './dayjs';
import getCombinedConfig from './getCombinedConfig';
import { getEstablishedEloAllUsers, getEmailContact } from '../services/users/helpers';
import { POOL_PARTNER_ID } from '../constants';
import getMatchInfo from '../services/matches/getMatchInfo';
import populateInformation from '../services/users/populateInformation';
import newProposalTemplate from '../emailTemplates/newProposal';
import getCustomEmail from '../emailTemplates/getCustomEmail';
import { renderProposal } from '../emailTemplates/normal';
import { isProposalFitSchedule, getAge, getProposalGroups } from './helpers';

let isExecuting = false;

const sendProposalEmails = async (app, forceSending = false) => {
    if (isExecuting) {
        return;
    }
    isExecuting = true;

    const processProposals = async () => {
        const sequelize = app.get('sequelizeClient');
        const config = await getCombinedConfig();
        const { TL_URL } = process.env;

        const currentDate = dayjs.tz();
        const minDate = currentDate.subtract(1, 'hour').format('YYYY-MM-DD HH:mm:ss');
        const maxDate = currentDate.subtract(config.proposalEmailWaitTime, 'millisecond').format('YYYY-MM-DD HH:mm:ss');

        let groups;
        {
            const [rows] = await sequelize.query(
                `SELECT u.firstName,
                        u.lastName,
                        u.email,
                        u.isSoftBan,
                        u.birthday,
                        l.name AS levelName,
                        l.slug AS levelSlug,
                        l.type AS levelType,
                        p.userId AS challengerUserId,
                        p.tournamentId,
                        p.partnerId,
                        s.year AS seasonYear,
                        s.season AS season,
                        s.endDate AS seasonEndDate,
                        m.challengerId,
                        m.playedAt,
                        m.createdAt,
                        m.isCompetitive,
                        m.isAgeCompatible,
                        m.place,
                        m.comment,
                        m.practiceType,
                        m.matchFormat,
                        m.duration,
                        m.id
                   FROM levels AS l, seasons AS s, tournaments AS t, players AS p, matches AS m, users AS u
                  WHERE m.challengerId=p.id AND
                        p.userId=u.id AND
                        p.tournamentId=t.id AND
                        t.levelId=l.id AND
                        t.seasonId=s.id AND
                        m.initial=1 AND
                        m.isProposalSent=0 AND
                        m.playedAt>:currentDate AND
                        m.createdAt>:minDate
               ORDER BY m.createdAt DESC`,
                { replacements: { minDate, currentDate: currentDate.format('YYYY-MM-DD HH:mm:ss') } }
            );

            groups = rows.reduce((obj, item) => {
                const keyItems = [item.challengerId, item.isCompetitive];
                // doubles proposals will always be separated
                if (item.levelType !== 'single') {
                    keyItems.push(item.id);
                }

                const key = keyItems.join('-');
                obj[key] ||= [];
                obj[key].push(item);
                return obj;
            }, {});
        }

        // Don't send recent groups yet
        const groupsToProcess = Object.values(groups).filter((item) => item[0].createdAt < maxDate || forceSending);
        if (groupsToProcess.length === 0) {
            return;
        }

        const avoidedUsers = {};
        {
            const [rows] = await sequelize.query('SELECT userId, opponentId FROM userrelations WHERE avoid=1');
            for (const row of rows) {
                avoidedUsers[row.userId] ||= [];
                avoidedUsers[row.userId].push(row.opponentId);

                avoidedUsers[row.opponentId] ||= [];
                avoidedUsers[row.opponentId].push(row.userId);
            }
        }

        const futureMatches = {};
        {
            const [rows] = await sequelize.query(
                `SELECT pc.userId AS challengerUserId,
                        pc2.userId AS challenger2UserId,
                        pa.userId AS acceptorUserId,
                        pa2.userId AS acceptor2UserId,
                        m.playedAt
                   FROM matches AS m
                   JOIN players AS pc ON m.challengerId=pc.id
                   JOIN players AS pa ON m.acceptorId=pa.id
              LEFT JOIN players AS pc2 ON m.challenger2Id=pc2.id
              LEFT JOIN players AS pa2 ON m.acceptor2Id=pa2.id
                  WHERE m.wonByDefault=0 AND
                        m.unavailable=0 AND
                        m.acceptedAt IS NOT NULL AND
                        m.playedAt>:date`,
                { replacements: { date: currentDate.format('YYYY-MM-DD') + ' 00:00:00' } }
            );

            for (const row of rows) {
                const date = row.playedAt.slice(0, 10);
                futureMatches[date] ||= new Set();
                futureMatches[date].add(row.challengerUserId);
                futureMatches[date].add(row.challenger2UserId);
                futureMatches[date].add(row.acceptorUserId);
                futureMatches[date].add(row.acceptor2UserId);
            }
        }

        const establishedEloAllUsers = await getEstablishedEloAllUsers({ config, sequelize });

        const getEmails = async (proposal) => {
            const proposerAge = proposal.birthday ? getAge(proposal.birthday) : 9999;
            const proposalWeekDay = dayjs.tz(proposal.playedAt).isoWeekday();
            const proposalPlayFormat = proposal.practiceType !== 0 ? 99 : proposal.matchFormat;
            const proposerElo = establishedEloAllUsers[proposal.challengerUserId];

            const competitiveUsers = new Set();
            if (proposerElo) {
                for (const [userId, elo] of Object.entries(establishedEloAllUsers)) {
                    if (Math.abs(elo - proposerElo) <= config.maxCompetitiveTlrGap) {
                        competitiveUsers.add(Number(userId));
                    }
                }
            }

            // get tournament users
            const [users] = await sequelize.query(
                `SELECT u.id,
                        u.firstName,
                        u.lastName,
                        u.email,
                        u.isSoftBan,
                        u.subscribeForProposals,
                        u.birthday,
                        u.information,
                        p.id AS playerId,
                        p.partnerId
                   FROM users AS u, players AS p
                  WHERE p.userId=u.id AND
                        p.tournamentId=:tournamentId AND
                        u.id!=:challengerUserId AND
                        p.isActive=1
               ORDER BY u.id`,
                { replacements: { tournamentId: proposal.tournamentId, challengerUserId: proposal.challengerUserId } }
            );

            const partners = users.reduce((obj, item) => {
                if (item.partnerId) {
                    obj[item.partnerId] ||= [];
                    obj[item.partnerId].push(item);
                }
                return obj;
            }, {});

            const captainId = proposal.partnerId || proposal.challengerId;

            const emails = users
                .filter((user) => {
                    if (user.subscribeForProposals !== 1) {
                        return false;
                    }

                    if (proposal.levelType === 'doubles-team') {
                        // captain without partners
                        if (!user.partnerId && !partners[user.playerId]) {
                            return false;
                        }
                        // player from Player Pool
                        if (user.partnerId === POOL_PARTNER_ID) {
                            return false;
                        }
                        // players from the same team
                        if (user.partnerId === captainId || user.playerId === captainId) {
                            return false;
                        }
                    }

                    const information = populateInformation(user.information);
                    if (proposal.levelType === 'single') {
                        if (proposal.isCompetitive && proposerElo && !competitiveUsers.has(user.id)) {
                            return false;
                        }

                        if (
                            information.subscribeForProposals.onlyCompetitive &&
                            establishedEloAllUsers[user.id] &&
                            !competitiveUsers.has(user.id)
                        ) {
                            return false;
                        }

                        if (avoidedUsers[proposal.challengerUserId]?.includes(user.id)) {
                            return false;
                        }

                        // do not send soft-banned player proposal to new players
                        if (proposal.isSoftBan && !establishedEloAllUsers[user.id]) {
                            return false;
                        }

                        // do not send new player proposal to soft-banned users
                        if (user.isSoftBan && !establishedEloAllUsers[proposal.challengerUserId]) {
                            return false;
                        }

                        // check age is not suitable
                        if (proposal.isAgeCompatible || information.subscribeForProposals.onlyAgeCompatible) {
                            if (!user.birthday) {
                                return false;
                            }

                            const userAge = getAge(user.birthday);
                            if (Math.abs(proposerAge - userAge) > config.maxAgeCompatibleGap) {
                                return false;
                            }
                        }
                    }

                    // check if match format is not suitable
                    if (!information.subscribeForProposals.playFormats.includes(proposalPlayFormat)) {
                        return false;
                    }

                    // check if user is already playing
                    if (information.subscribeForProposals.onlyNotPlaying) {
                        const date = proposal.playedAt.slice(0, 10);
                        if (futureMatches[date]?.has(user.id)) {
                            return false;
                        }
                    }

                    // check it doesn't fit user schedule
                    if (information.subscribeForProposals.onlyMySchedule) {
                        const schedule = information.subscribeForProposals.weeklySchedule[proposalWeekDay - 1];
                        if (!isProposalFitSchedule(proposal, schedule)) {
                            return false;
                        }
                    }

                    return true;
                })
                .map(getEmailContact);

            return emails;
        };

        const getCurrentUser = (proposal) => ({
            id: proposal.challengerUserId,
            firstName: proposal.firstName,
            lastName: proposal.lastName,
            email: proposal.email,
            roles: 'player',
        });

        const sendSingle = async (proposal, emails) => {
            const playedAt = dayjs.tz(proposal.playedAt).format('ddd, MMM D, h:mm A');
            const { challengerName, challengerLinkedName } = await getMatchInfo({
                app,
                currentUser: getCurrentUser(proposal),
                matchId: proposal.id,
            });

            const isFriendlyProposal = proposal.seasonEndDate < dayjs.tz().format('YYYY-MM-DD HH:mm:ss');
            const entity = proposal.practiceType ? 'practice' : isFriendlyProposal ? 'friendly match' : 'match';
            await app.service('api/emails').create({
                replyTo: getEmailContact(proposal),
                to: emails,
                subject: `${challengerName} proposed a new ${entity} for ${playedAt}`,
                html: newProposalTemplate(config, {
                    level: proposal.levelName,
                    proposal,
                    proposalPlayer: challengerLinkedName,
                    proposalLink: `${TL_URL}/season/${proposal.seasonYear}/${proposal.season}/${proposal.levelSlug}`,
                    isFriendlyProposal,
                    previewText: `${config.city}, ${proposal.levelName}, ${proposal.place}${
                        proposal.comment ? `, ${proposal.comment}` : ''
                    }`,
                }),
            });
            await sequelize.query('UPDATE matches SET isProposalSent=1 WHERE id=:id', {
                replacements: { id: proposal.id },
            });
        };

        // batch proposals from the same player
        const sendMultiple = async (proposals, emails) => {
            // sort them in acceding order
            proposals.sort((a, b) => a.playedAt.localeCompare(b.playedAt));
            const proposal = proposals[0];
            const total = proposals.length;

            const proposalLink = `${TL_URL}/season/${proposal.seasonYear}/${proposal.season}/${proposal.levelSlug}`;
            const { challengerName, challengerLinkedName } = await getMatchInfo({
                app,
                currentUser: getCurrentUser(proposal),
                matchId: proposal.id,
            });

            const isFriendlyProposal = proposal.seasonEndDate < dayjs.tz().format('YYYY-MM-DD HH:mm:ss');
            await app.service('api/emails').create({
                replyTo: getEmailContact(proposal),
                to: emails,
                subject: `${challengerName} proposed ${total} new ${isFriendlyProposal ? 'friendly ' : ''}matches in ${
                    proposal.levelName
                }`,
                html: getCustomEmail({
                    config,
                    compose: () => `
<mj-text><b>${challengerLinkedName}</b> proposed ${total} ${
                        isFriendlyProposal ? 'friendly ' : ''
                    }matches in <a href="${proposalLink}">${proposal.levelName}</a>:</mj-text>

  ${proposals
      .map(
          (item, index) => `
<mj-table font-size="16px" line-height="24px">
    <tr>
        <td style="width: 24px; vertical-align: top;">${index + 1}.</td>
        <td>${renderProposal(item)}</td>
    </tr>
</mj-table>`
      )
      .join('')}

<mj-text>Getting too many proposal emails? <a href="#adjustProposalsLink#">Adjust frequency</a></mj-text>`,
                }),
            });

            for (const item of proposals) {
                await sequelize.query('UPDATE matches SET isProposalSent=1 WHERE id=:id', {
                    replacements: { id: item.id },
                });
            }
        };

        for (const group of groupsToProcess) {
            for (const proposal of group) {
                proposal.emails = await getEmails(proposal);
            }

            const list = getProposalGroups(group);
            for (const { proposals, emails } of list) {
                if (proposals.length === 1) {
                    await sendSingle(proposals[0], emails);
                } else {
                    await sendMultiple(proposals, emails);
                }
            }
        }
    };

    try {
        await processProposals();
    } catch (e) {
        isExecuting = false;
        throw e;
    }

    isExecuting = false;
};

export default sendProposalEmails;
