import { normal, h2, signature } from './normal';

export default (config, { seedNumber, opponent1, opponent2, seasonName, levelName, levelType, previewText = '' }) => {
    const isDoublesTeam = levelType === 'doubles-team';

    return normal(
        `
${h2('Hello, #firstName#!', 'padding-top="10px"')}

<mj-text>Congrats on making the Final Tournament for the ${seasonName} ${levelName} ladder!</mj-text>


${h2('First-Round Bye')}

<mj-text>Since ${
            isDoublesTeam ? 'your team is' : 'you are'
        } the No. ${seedNumber} seed, you will be receiving a Bye for the first round of the Final Tournament. So, take a rest!</mj-text>

<mj-text>Your next opponent will be <b>${opponent1}</b> or <b>${opponent2}</b>.</mj-text>


${h2('Upcoming Schedule')}

<mj-text>Once <b>${opponent1}</b> and <b>${opponent2}</b> finish their first-round match, you will receive an email with the details about the next round. Then, you can schedule your match and proceed forward.</mj-text>

${signature({ config })}
`,
        { config }
    );
};
