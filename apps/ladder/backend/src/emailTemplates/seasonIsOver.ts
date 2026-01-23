import type { Config } from '../types';
import { normal, h2, h3, getImageUrl, signature } from './normal';
import { getSeasonName } from '../services/seasons/helpers';
import dayjs from '../utils/dayjs';
import formatElo from '../utils/formatElo';
import { getPlayerName } from '../services/users/helpers';

const renderPlayer = ({ player, title, description, points, formatNumber }) => {
    return `
        <mj-column padding-top="30px" padding-bottom="30px">
            ${h3(title, 'padding-top="0px" padding-bottom="0px" align="center"')}
            <mj-text align="center" padding-top="0px" padding-bottom="0px">${description}</mj-text>
            <mj-image src="${player.avatar.src}" alt="Avatar" width="122px" height="140px" />
            ${h3(getPlayerName(player), 'padding-top="10px" padding-bottom="0px" align="center"')}
            <mj-text align="center" padding-top="0px"><b>${
                formatNumber ? formatNumber(player.number) : player.number
            }</b> ${points}</mj-text>
        </mj-column>`;
};

export default (config: Config, { prevSeason, nextSeason, stats, players }) => {
    const prevSeasonName = getSeasonName(prevSeason);
    const nextSeasonName = getSeasonName(nextSeason);
    const weeks = Math.round(dayjs.tz(prevSeason.endDate).diff(dayjs.tz(prevSeason.startDate), 'week', true));
    const nextSeasonStartDate = dayjs.tz(nextSeason.startDate).format('MMM D');
    const city = config.city;
    const { TL_URL } = process.env;

    return normal(
        `
    ${h2('Hello, #firstName#!', 'padding-top="10px"')}
    <mj-text>Wow! What an amazing ${prevSeasonName} season of the ${city} Rival Tennis Ladder! Before we move on to the next season, we want to share some stats and our picks for Rival Tennis Ladder All-Stars from the ${prevSeasonName} ladders.</mj-text>

    ${h2(`${prevSeasonName} Rival Ladder Stats`)}
    <mj-text>Let’s take a look back at the stats to see what happened across the last ${weeks} weeks!</mj-text>
    <mj-text>
      <ul style="margin: 0 !important; padding-top: 0px; padding-bottom: 0px;">
        <li style="margin: 0 !important;"><b>${stats.matchesPlayed}</b> Matches played</li>
        <li style="margin: 0 !important;"><b>${stats.registrations}</b> Player registrations</li>
        <li style="margin: 0 !important;"><b>${stats.proposals}</b> Proposals sent</li>
        <li style="margin: 0 !important;"><b>${stats.rivalries}</b> Rivalries started</li>
        <li style="margin: 0 !important;"><b>${stats.pointsGained}</b> Ladder points gained</li>
        <li style="margin: 0 !important;"><b>${formatElo(stats.tlrPointsGained)}</b> TLR points gained</li>
      </ul>
    </mj-text>

    ${h2(`${prevSeasonName} Rival Ladder Player Highlights`)}

    <mj-text>Every season, we like to focus on a few players who really went above and beyond to improve their games and push themselves to the next level. Check out these players who are our Rival Tennis Ladder All-Stars for ${prevSeasonName}:</mj-text>

    </mj-column>
    </mj-section>
    <mj-section background-color="#ffffff" padding-top="0px" padding-bottom="0px">
        ${renderPlayer({
            player: players.grinder,
            title: 'The Grinder',
            description: 'Most Matches Played',
            points: 'Matches played',
        })}
        ${renderPlayer({
            player: players.highAchiever,
            title: 'The High Achiever',
            description: 'Most Ladder Points',
            points: 'Ladder points gained',
        })}
    </mj-section>
    <mj-section background-color="#ffffff" padding-top="0px" padding-bottom="0px">
        ${renderPlayer({
            player: players.mostImproved,
            title: 'Most Improved',
            description: 'Greatest TLR Progress',
            points: 'TLR points gained',
            formatNumber: (num) => formatElo(num),
        })}
        ${renderPlayer({
            player: players.planner,
            title: 'The Planner',
            description: 'Most Proposals Sent',
            points: 'Proposals sent',
        })}
    </mj-section>
    <mj-section background-color="#ffffff">
    <mj-column>

    <mj-text>From the matches and players to the points and rivalries, it was an active season for Rival Tennis Ladder in ${city}! Who knows? Next season, you could be an Rival Tennis Ladder All-Star!</mj-text>

    ${h2('Sending Friendly Proposals')}

    <mj-text>While we are currently in between seasons, you can still continue to play on Rival Tennis Ladder by proposing a friendly match or practice! Simply navigate to your ${prevSeasonName} ladder and propose much like normal.</mj-text>
    <mj-image src="${getImageUrl(
        __dirname + '/images/friendlyProposals.png'
    )}" alt="Friendly Proposal" width="336px" height="140px" border="1px solid #ddd;" border-radius="5px" />

    ${h2(`${nextSeasonName} Season`)}
    <mj-text>That said, we’d love to see you next season! Please join us for the ${nextSeasonName} season <b>beginning on Monday, ${nextSeasonStartDate}</b>. You can sign up right now on the <a href="${TL_URL}/register">Registration Page</a>.</mj-text>

    ${signature({ config })}`,
        { config }
    );
};
