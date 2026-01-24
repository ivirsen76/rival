import type { Application } from '@feathersjs/feathers';
import getCombinedConfig from './getCombinedConfig';
import _capitalize from 'lodash/capitalize';
import _pick from 'lodash/pick';
import { decrypt, encrypt } from './crypt';
import logger from '@rival-tennis-ladder/logger';
import dayjs from './dayjs';
import { normal, h2, signature } from '../emailTemplates/normal';
import { getSeasonName } from '../services/seasons/helpers';
import getWeightedItemByIndex from './getWeightedItemByIndex';

const MAX_MESSAGES_SENT = 3;
const MESSAGES_PER_DAY = 50;

// Do not remove old items
// Comment them out when you don't need them anymore. It's necessary for tracking and history observation.
// const previewText1 = 'Enjoy flexible matches and friendly competition! Free entry for new players this season.';

// Do not remove old items
// Comment them out when you don't need them anymore. It's necessary for tracking and history observation.
const emailOptions = [
    //     {
    //         id: 1,
    //         name: 'Register Now CTA',
    //         params: {
    //             getSubject: config => 'Play Tennis When You Want - Join for Free!',
    //             getPreviewText: config => previewText1,
    //             getCta: config => `
    // <mj-text>Join today and start getting matches with players on your level.</mj-text>
    // <mj-button href="https://${config.url}.tennis-ladder.com/register?utm_source=newsletter&utm_medium=email&utm_campaign=first-register">Register Now</mj-button>`,
    //             showAdditionalExploreLink: true,
    //         },
    //     },
    //     {
    //         id: 2,
    //         name: 'Explore Ladder CTA',
    //         params: {
    //             getSubject: config => `Want More Tennis Around ${config.city}?`,
    //             getPreviewText: config => previewText1,
    //             getCta: config => `
    // <mj-text>Check out your local ladder for yourself:</mj-text>
    // <mj-button href="https://${config.url}.tennis-ladder.com/?utm_source=newsletter&utm_medium=email&utm_campaign=first-explore">Explore the ${config.city} ladder</mj-button>`,
    //         },
    //     },
    //     {
    //         id: 3,
    //         name: 'Register Now CTA with image',
    //         params: {
    //             getSubject: config => 'Play Tennis When You Want - Join for Free!',
    //             getPreviewText: config => previewText1,
    //             getCta: config => `
    // <mj-text>Join today and start getting matches with players on your level.</mj-text>
    // <mj-button href="https://${config.url}.tennis-ladder.com/register?utm_source=newsletter&utm_medium=email&utm_campaign=first-register">Register Now</mj-button>`,
    //             showAdditionalExploreLink: true,
    //             getImage: config =>
    //                 `<mj-image src="https://rival-tennis-ladder-images.s3.us-east-2.amazonaws.com/images/45087d640879140d68b00207371d05ad028a805dcff3411897fd8394ad28d74f.png" alt="Overview" href="https://${config.url}.tennis-ladder.com/?utm_source=newsletter&utm_medium=email&utm_campaign=first-image" />`,
    //         },
    //         weight: 2,
    //     },
    //     {
    //         id: 4,
    //         name: 'Explore Ladder CTA with image',
    //         params: {
    //             getSubject: config => `Want More Tennis Around ${config.city}?`,
    //             getPreviewText: config => previewText1,
    //             getCta: config => `
    // <mj-text>Check out your local ladder for yourself:</mj-text>
    // <mj-button href="https://${config.url}.tennis-ladder.com/?utm_source=newsletter&utm_medium=email&utm_campaign=first-explore">Explore the ${config.city} ladder</mj-button>`,
    //             getImage: config =>
    //                 `<mj-image src="https://rival-tennis-ladder-images.s3.us-east-2.amazonaws.com/images/45087d640879140d68b00207371d05ad028a805dcff3411897fd8394ad28d74f.png" alt="Overview" href="https://${config.url}.tennis-ladder.com/?utm_source=newsletter&utm_medium=email&utm_campaign=first-image" />`,
    //         },
    //         weight: 2,
    //     },
    {
        id: 5,
        name: 'Image with ladder overview',
        params: {
            getSubject: (config) => `Want More Tennis Around ${config.city}?`,
            getImage: (config) =>
                `<mj-image src="https://rival-tennis-ladder-images.s3.us-east-2.amazonaws.com/images/45087d640879140d68b00207371d05ad028a805dcff3411897fd8394ad28d74f.png" alt="Overview" href="https://${config.url}.tennis-ladder.com/?utm_source=newsletter&utm_medium=email&utm_campaign=second-image-overview" />`,
        },
    },
    {
        id: 6,
        name: 'Image with photo collage',
        params: {
            getSubject: (config) => `Want More Tennis Around ${config.city}? 🎾`,
            getImage: (config) =>
                `<mj-image src="https://rival-tennis-ladder-images.s3.us-east-2.amazonaws.com/images/photo-collage-1.jpg" alt="Players" href="https://${config.url}.tennis-ladder.com/?utm_source=newsletter&utm_medium=email&utm_campaign=second-image-photos" />`,
        },
    },
    {
        id: 7,
        name: 'With no image',
        params: {
            getSubject: (config) => `🎾 Want More Tennis Around ${config.city}?`,
        },
    },
];

const getGeneralMessage = ({ config, firstName, count, seasonName, isSeasonStarted, totalPlayers, params }) => {
    const { city } = config;

    const globalSiteLink = `https://tennis-ladder.com/?utm_source=newsletter&utm_medium=email&utm_campaign=second-index`;
    const exploreSiteLink = `https://${config.url}.tennis-ladder.com/?utm_source=newsletter&utm_medium=email&utm_campaign=second-explore`;

    return normal(
        `
${h2(firstName ? `Hello, ${firstName}!` : 'Hello!', 'padding-top="10px"')}        
<mj-text>The <b>${seasonName} Season</b> of <a href="${globalSiteLink}">Rival Tennis Ladder</a> is ${
            isSeasonStarted ? 'already underway' : 'coming soon'
        }, and we're inviting new players in <b>${city}</b> to <b>join for free</b>!</mj-text>
${params.getImage ? params.getImage(config) : ''}
<mj-text>Whether you're new to the area, looking for consistent matches, or just want to play more tennis, the ladder makes it easy to <b>find opponents on your level and play on your schedule</b>.</mj-text>
<mj-text>We already have <b>${totalPlayers > 100 ? totalPlayers : 'numerous'} players</b> ${
            isSeasonStarted ? 'competing' : 'registered'
        } in ${city} this season, and we'd love for you to join us!</mj-text>

<mj-text>Check out your local ladder for yourself:</mj-text>
<mj-button href="${exploreSiteLink}">Explore the ${config.city} ladder</mj-button>

${h2('Why Join Rival Tennis Ladder?')}

<mj-text>In short, Rival Tennis Ladder was <b>built for players, by players</b>. Here's why you'll love it:</mj-text>

<mj-text>
<ul style="margin: 0 !important; padding-top: 0px; padding-bottom: 0px;">
    <li style="margin-bottom: 10px;">🗓️ <b>Flexible scheduling:</b> Choose when and where to play - as much or as little as you want.</li>
    <li style="margin-bottom: 10px;">🤝 <b>Guaranteed opponents:</b> Get weekly match opportunities at your level.</li>
    <li style="margin-bottom: 10px;">🏆 <b>Prizes & trophies:</b> Play in the tournament to earn <b>Tennis Warehouse gift cards</b> and <b>engraved trophies</b>.</li>
    <li style="margin-bottom: 10px;">📈 <b>In-depth stats:</b> Track your results, rankings, and progress right in the app.</li>
    <li style="margin-bottom: 0px;">💸 <b>Free entry this season:</b> Join one <b>Singles</b> and one <b>Doubles</b> ladder at no cost.</li>
</ul>
</mj-text>

${h2("Let's Grow Tennis Together")}

<mj-text>Your support helps us grow tennis in your area and continue to expand the sport we all love for years to come. We'd love to welcome you to the Rival community this season.</mj-text>

${signature({ config })}
`,
        {
            config,
            previewText: 'Enjoy flexible matches and friendly competition! Free entry for new players this season.',
            showSocialIcons: false,
        }
    );
};

const sendGeneralMessage = async (app: Application, candidates) => {
    const sequelize = app.get('sequelizeClient');
    const config = await getCombinedConfig();

    const INITIAL_DELAY = 60; // in seconds
    const SEND_WINDOW = 8 * 3600; // 8 hours

    const currentDate = dayjs.tz();
    const currentDateStr = currentDate.format('YYYY-MM-DD HH:mm:ss');
    const dateHalfDayAgo = currentDate.subtract(12, 'hour').format('YYYY-MM-DD HH:mm:ss');
    const dateTwoMonthsAgo = currentDate.subtract(2, 'month').format('YYYY-MM-DD HH:mm:ss');
    const dateFourWeeksAgo = currentDate.subtract(4, 'week').format('YYYY-MM-DD HH:mm:ss');
    const dateInTwoWeeks = currentDate.add(2, 'week').format('YYYY-MM-DD HH:mm:ss');

    // check if we sent message in the recent 12 hours
    const [[message]] = await sequelize.query(
        `SELECT messageSentAt
           FROM candidates
          WHERE messageSentAt IS NOT NULL
       ORDER BY messageSentAt DESC
          LIMIT 0, 1`
    );
    if (message && dayjs.tz(message.messageSentAt).format('YYYY-MM-DD HH:mm:ss') > dateHalfDayAgo) {
        return;
    }

    // get current season
    const [[currentSeason]] = await sequelize.query(
        `SELECT id, year, season, startDate
           FROM seasons
          WHERE startDate>:dateFourWeeksAgo AND
                startDate<:dateInTwoWeeks
       ORDER BY startDate
          LIMIT 0, 1
    `,
        { replacements: { dateFourWeeksAgo, dateInTwoWeeks } }
    );
    if (!currentSeason) {
        return;
    }
    const seasonName = getSeasonName(currentSeason);
    const isSeasonStarted = currentSeason.startDate < currentDateStr;

    // get total players
    const [[{ totalPlayers }]] = await sequelize.query(
        `SELECT count(*) AS totalPlayers
           FROM players AS p,
                tournaments AS t
          WHERE p.tournamentId=t.id AND
                t.seasonId=:seasonId`,
        { replacements: { seasonId: currentSeason.id } }
    );

    let [userEmails] = await sequelize.query(`SELECT email FROM users`);
    userEmails = new Set(userEmails.map((item) => item.email.toLowerCase()));

    if (!candidates) {
        [candidates] = await sequelize.query(`
            SELECT id,
                   name,
                   address,
                   messages
              FROM candidates
             WHERE messages<${MAX_MESSAGES_SENT} AND
                   (messageSentAt IS NULL OR messageSentAt<"${dateTwoMonthsAgo}")
          ORDER BY messages, id
             LIMIT 0, 500`);
    }

    const registeredCandidates = [];
    candidates = candidates
        .filter((item) => {
            const email = decrypt(item.address).toLowerCase().trim();
            if (userEmails.has(email)) {
                registeredCandidates.push(item.id);
                return false;
            }

            return true;
        })
        .slice(0, MESSAGES_PER_DAY);

    // delete candidates which are already registered
    for (const id of registeredCandidates) {
        await sequelize.query(`DELETE FROM candidateroster WHERE candidateId=:id`, { replacements: { id } });
        await sequelize.query(`DELETE FROM candidates WHERE id=:id`, { replacements: { id } });
    }

    if (candidates.length === 0) {
        return;
    }

    const interval = SEND_WINDOW / candidates.length;
    const deviation = interval / 2;
    candidates = candidates.map((item, index) => ({
        id: item.id,
        name: item.name,
        email: decrypt(item.address).trim(),
        messages: item.messages,
        delay:
            item.delay ||
            Math.max(Math.floor(INITIAL_DELAY + index * interval + Math.random() * deviation - deviation / 2), 0),
    }));

    // comment out if don't need test candidate
    // candidates.push({
    //     id: 999999,
    //     name: 'Igor Eremeev',
    //     email: 'rival.tennis.ladder@gmail.com',
    //     messages: 0,
    //     delay: 0,
    // });

    let index = 0;
    for (const candidate of candidates) {
        const firstName = candidate.name ? _capitalize(candidate.name.split(' ')[0]) : null;
        const emailOption = getWeightedItemByIndex(emailOptions, index++);
        const trackingCode = `roster-${candidate.messages}-${emailOption.id}`;
        const isTestCandidate = candidate.id === 999999;

        await app.service('api/emails').create({
            to: [_pick(candidate, ['id', 'name', 'email', 'delay'])],
            from: { name: 'Rival Tennis Ladder', email: 'info@tennis-ladder.com' },
            subject: emailOption.params.getSubject(config),
            html: getGeneralMessage({
                config,
                firstName,
                count: candidate.messages,
                seasonName,
                isSeasonStarted,
                totalPlayers,
                params: emailOption.params,
            }),
            priority: 3,
            trackingCode: isTestCandidate ? 'test' : trackingCode,
        });

        if (!isTestCandidate) {
            await sequelize.query(
                `UPDATE candidates SET messages=${candidate.messages + 1}, messageSentAt=NOW() WHERE id=${candidate.id}`
            );
        }
    }

    logger.info(`Roster message sent to ${candidates.length} candidates`);
};

const processAtlanta = async (app: Application) => {
    const sequelize = app.get('sequelizeClient');

    const CATEGORY = 'Men';
    const PLAYED_BEFORE = '2024-01-01'; // TODO: probably calculate it based on the current date
    const dateTwoMonthsAgo = dayjs.tz().subtract(2, 'month').format('YYYY-MM-DD HH:mm:ss');

    const [candidates] = await sequelize.query(`
        SELECT c.id,
               c.name,
               c.address,
               c.messages,
               MAX(r.startDate) AS playedAt
          FROM candidates AS c,
               candidateroster AS cr,
               rosters AS r
         WHERE cr.candidateId=c.id AND
               cr.rosterId=r.id AND
               c.role="Player" AND
               c.messages<${MAX_MESSAGES_SENT} AND
               (c.messageSentAt IS NULL OR c.messageSentAt<"${dateTwoMonthsAgo}") AND
               r.category="${CATEGORY}"
      GROUP BY c.id
        HAVING playedAt<"${PLAYED_BEFORE}"
      ORDER BY c.messages, c.id
         LIMIT 0, 500`);

    await sendGeneralMessage(app, candidates);
};

const processAustin = async (app: Application) => {
    const sequelize = app.get('sequelizeClient');
    const dateTwoMonthsAgo = dayjs.tz().subtract(2, 'month').format('YYYY-MM-DD HH:mm:ss');

    const [candidates] = await sequelize.query(`
        SELECT id,
               name,
               address,
               messages
          FROM candidates
         WHERE messages<${MAX_MESSAGES_SENT} AND
               (messageSentAt IS NULL OR messageSentAt<"${dateTwoMonthsAgo}") AND
               createdAt>"2023"
      ORDER BY messages, id
         LIMIT 0, 500`);

    await sendGeneralMessage(app, candidates);
};

export default async (app: Application, email?: string) => {
    const config = await getCombinedConfig();

    if (email) {
        // send some arbitrary email for testing
        await sendGeneralMessage(app, [
            {
                id: 999999,
                name: 'Ben Done',
                address: encrypt(email),
                messages: 0,
                delay: 1,
            },
        ]);
        return;
    }

    if (config.url === 'atlanta') {
        await processAtlanta(app);
    }
    if (config.url === 'austin') {
        await processAustin(app);
    }
    // if (config.url === 'charlotte') {
    //     await sendGeneralMessage(app);
    // }
};
