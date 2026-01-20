import { normal, h2, getImageUrl, signature } from './normal';

export default config =>
    normal(
        `
${h2('Hello, #firstName#!', 'padding-top="10px"')}

<mj-text>First, thanks for joining the ${
            config.city
        } Rival Tennis Ladder! We appreciate your support and help in building this community in the Raleigh area.</mj-text>

${h2('Choosing the Right Ladder Level for You')}

<mj-text>We noticed that while you created an account, you haven't picked a ladder level to play in yet. Picking a ladder can seem like a hard decision, but it's actually quite easy! Here are some suggestions for what NTRP level to choose based on your tennis skills:</mj-text>

<mj-text>
    <ul style="margin: 0 !important; padding-top: 0px; padding-bottom: 0px;">
        <li style="margin-bottom: 10px;"><b>3.0 (Talented Beginner)</b> - Players at this level have been playing tennis long enough to be able to hit all types of tennis shots. They are developing medium-paced consistency in rallies, but they lack directional control, depth, and power. Strategy is not a major concern, and court coverage may be limited. Doubles players usually play one up and one back.</li>
        <li style="margin-bottom: 10px;"><b>3.5 (Intermediate)</b> - Players at this level have a few years of experience playing, and they are developing dependable strokes, depth, and variety (though still not consistently). Court coverage is better with these players, and they are thinking more about tactics. Players here may approach the net, and they are beginning to develop Doubles strategy.</li>
        <li style="margin-bottom: 10px;"><b>4.0 (Seasoned and Skillful)</b> - Players at this level have a few dependable strokes, as well as directional control and depth on both wings. These players can use a variety of shots (lobs, overheads, drop shots, approaches, and volleys) with some success, and they are occasionally forcing opponent errors on serves. Strategy and teamwork are evident in Doubles.</li>
        <li style="margin: 0 !important;"><b>4.5 (Advanced and Experienced)</b> - Players at this level are using significant power and spin to their advantage. Their footwork is quick and court coverage is comprehensive. Players here come with a game plan, and they can sometimes pivot to another strategy mid-game. Their first serve is powerful and accurate, while their second serve percentage is high. These players may overhit from time to time. In Doubles, they play aggressively at the net and coordinate with teammates often on adjustments.</li>
    </ul>
</mj-text>

<mj-text>Of course, remember, these ladder guidelines are just suggestions! The most important thing is to choose a ladder and start playing. If you don't feel challenged, or if you feel overwhelmed, you can always change your level during the season to one that better suits you. No problem!</mj-text>

${h2('How to Pick Your Level on Rival Tennis Ladder')}

<mj-text>Picking your ladder is easy!</mj-text>

<mj-text><a href="${process.env.TL_URL}/register">Click here to choose up to two ladders to play.</a></mj-text>

<mj-text>Here is what the ladder selection screen will look like:</mj-text>

<mj-image src="${getImageUrl(
            __dirname + '/images/chooseLadder.png'
        )}" alt="Choose ladders" width="518px" height="612px" />

<mj-text>If you want to play more than one ladder, that's cool too! Select up to one Singles ladder and one Doubles ladder of your choice. Which levels you choose is up to you! Either way, it's flexible, and you can pick the ladders you want to play and always change at a later date. So, sign up today for a ladder and start playing!</mj-text>

<mj-text>If you have any questions at all about how to sign up or choose a level, don't hesitate to reach out to us. We're always here to help!</mj-text>

${signature({ config })}`,
        { config }
    );
