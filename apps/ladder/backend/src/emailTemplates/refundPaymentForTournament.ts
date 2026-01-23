import type { Config } from '../types';
import { normal, h2, signature } from './normal';

export default (config: Config, { cancelCode, creditAmount, levelName, seasonName }) => {
    const cancelText =
        cancelCode === 'notEnoughMatches'
            ? `<b>fewer than ${config.minMatchesToPlanTournament} matches were played</b> before the final week of the regular season.`
            : `we didn’t receive <b>at least 4 player registrations for the tournament</b>.`;

    return normal(
        `
    ${h2('Hello, #firstName#!', 'padding-top="10px"')}
    <mj-text>Thank you for your participation in the ${seasonName} ${levelName} ladder! We really appreciate your support and involvement in this ladder this past season.</mj-text>

    ${h2(`${levelName} Tournament Cancellation`)}
    <mj-text>While we love to have tournaments for as many ladders as possible, this season the ${levelName} ladder didn’t qualify for a tournament because ${cancelText}</mj-text>
    <mj-text>Please understand that we have these limitations to keep all of our ladder tournaments competitive and fun for everyone involved. We are hopeful next season this ladder will meet all prerequisites required.</mj-text>

    ${h2("We're Giving You a Credit to Your Account")}
    <mj-text>While this circumstance may happen from time to time, we believe in making sure you get your money’s worth! That’s why we’re giving you a <b>credit to your account of $${
        creditAmount / 100
    }</b> based on your initial payment for the ${levelName} ladder. Feel free to use this credit to pay for future seasons of your choice.</mj-text>
    <mj-text>Check out your <a href="${
        process.env.TL_URL
    }/user/wallet">Rival Wallet</a> to see your current balance and past transactions.</mj-text>

    ${h2('Thanks for Playing!')}
    <mj-text>Thanks, once again, for playing on the ${levelName} ladder this past season. Your contribution to this community is essential for our continued success. We would love to see you on the courts for the next season${
        cancelCode === 'notEnoughMatches' ? '!' : '. As a reminder, registration begins today!'
    }</mj-text>

    ${signature({ config })}`,
        { config }
    );
};
