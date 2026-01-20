import { normal, h2 } from './normal';

export default (config, { isWinner, levelName, levelLink, levelType, isFree }) => {
    const prize = (() => {
        if (levelType === 'doubles-team') {
            return config.doublesChampionReward / 100;
        }

        if (isFree) {
            return isWinner ? config.singlesChampionReward / 100 / 2 : 0;
        }

        return isWinner ? config.singlesChampionReward / 100 : config.singlesRunnerUpReward / 100;
    })();
    const prizeType = levelType === 'doubles-team' ? 'credit' : 'gift card';

    // prettier-ignore
    return normal(
        `${h2('Hello, #firstName#!', 'padding-top="10px"')}

<mj-text>Congratulations on ${isWinner ? 'winning the tournament' : 'coming in Second Place'} in the ${config.city} Rival ${levelName} ladder!</mj-text>

<mj-text>As the ${isWinner ? 'champion' : 'runner-up'}, you'll be receiving ${prize > 0 ? `a $${prize} ${prizeType} and ` : ''}an engraved ${isWinner ? 'Champion' : 'Runner-Up'} Trophy! Just one step left! Visit the ${levelName} ladder to claim your award.</mj-text>

<mj-button href="${levelLink}">Claim your award</mj-button>

<mj-text>Thanks for playing, and we'll see you next season!</mj-text>`,
        { config }
    );
};
