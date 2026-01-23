import type { Config } from '../types';
import { normal, h2, signature } from './normal';

export default (
    config: Config,
    { elo, eloImg, currentLevel, isLevelSuitable, suggestedLevel, moveDirection, isTournamentRestriction }
) => {
    const eloUrl = `${process.env.TL_URL}/tlr`;

    const suggestedMessage = (() => {
        if (isLevelSuitable) {
            return `<mj-text>Right now, you are on the <b>${currentLevel}</b> ladder. Based on your current TLR, we believe you're already on the best ladder for your level!</mj-text>`;
        }

        if (suggestedLevel && moveDirection) {
            return `<mj-text>Right now, you are currently on the <b>${currentLevel}</b> ladder. Based on your current TLR, we recommend you move ${moveDirection} to the <b>${suggestedLevel}</b> ladder for the best tennis ladder experience. Here, we believe you will find the most number of players of an equivalent level of skill.</mj-text>`;
        }

        return '';
    })();

    return normal(
        `
    ${h2('Hello, #firstName#!', 'padding-top="10px"')}
    <mj-text>With your most recent match, you've finished your <b>first ${
        config.minMatchesToEstablishTlr
    } matches</b> on Rival Tennis Ladder! Not only is this a great achievement in general, but it means you now have an established TLR, or Tennis Ladder Rating, for your account. Not quite sure what that means? Well, let's take a look together!</mj-text>

    ${h2('Your TLR and You')}

    <mj-text><a href="${eloUrl}">Tennis Ladder Rating (TLR)</a> is our way of assessing player skill in Rival Tennis Ladder. Acting as a dynamic NTRP number, this rating allows us to guide players through their tennis journey and align them best with players and the ladder that fits them the most.</mj-text>

    <mj-image src="${eloImg.src}" width="${eloImg.width}px" alt="${elo}" />
    
    <mj-text>Based on your first ${
        config.minMatchesToEstablishTlr
    } matches, we calculated your TLR to be <b>${elo}</b>.</mj-text>

    ${suggestedMessage}
    ${
        isTournamentRestriction
            ? `<mj-text>Since your initial TLR is ${elo}, <b>you will not be eligible for the ${currentLevel} Final Tournament</b> this season.</mj-text>`
            : ''
    }

    ${h2('TLR and Progression')}

    <mj-text>Remember, while your TLR is <b>${elo}</b> now, it will change with each match you play based on your opponent’s strength and the outcome of each match. The more matches you play, the more your TLR will fluctuate and evolve over time. As your TLR changes, use it to guide you to the right ladder and the best possible pool of players for competition.</mj-text>

   <mj-text>As always, thanks for playing on Rival Tennis Ladder, and we wish you the best of luck in improving your TLR throughout each season. If you have any questions about your TLR, switching ladders, or anything in between, don’t hesitate to reach out to us.</mj-text>

${signature({ config })}`,
        { config }
    );
};
