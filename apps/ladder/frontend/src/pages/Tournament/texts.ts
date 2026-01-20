export const getSinglesTournament8Text = (entity = 'player') => `
<p>The Top 8 ${entity}s who sign up for the tournament are playing.</p>

<h3>Draw</h3>
<p>The Final Tournament brackets will automatically generate at midnight on Sunday, $sunday0.</p>

<h3>Seeding</h3>
<p>Tournament seeding will operate according to the following parameters:</p>
<ul>
    <li>The first and second seeds can only play in the Final.</li>
    <li>The Top 4 seeds cannot meet before the Semifinals.</li>
    <li>All ${entity}s are randomly distributed.</li>
</ul>

<h3>Time</h3>
<p>The tournament will occur over two weeks and here's the schedule:</p>
<p>
    <b>Quarterfinals</b> are between Monday, $monday1, and Saturday, $saturday1.<br>
    <b>Semifinals</b> are between Sunday, $sunday1, and Friday, $friday2.<br>
    <b>Final</b> is on the weekend of $saturday2 - $sunday2.
</p>`;

export const getSinglesTournament12Text = (entity = 'player') => `
<p>The Top 12 ${entity}s who sign up for the tournament are playing.</p>

<h3>Draw</h3>
<p>The Final Tournament brackets will automatically generate at midnight on Sunday, $sunday0.</p>

<h3>Seeding</h3>
<p>Tournament seeding will operate according to the following parameters:</p>
<ul>
    <li>The first and second seeds can only play in the Final.</li>
    <li>The Top 4 seeds cannot meet before the Semifinals and will receive a first-round Bye.</li>
    <li>The Top 8 seeds cannot meet before the Quarterfinals.</li>
    <li>All ${entity}s are randomly distributed.</li>
</ul>

<h3>Time</h3>
<p>
    <b>Round of 16 participants</b> will play between Monday, $monday1, and Saturday, $saturday1.<br>
    <b>Quarterfinalists</b> will play between Sunday, $sunday1, and Friday, $friday2.<br>
    <b>Semifinalists</b> will play on Saturday, $saturday2.<br>
    <b>Finalists</b> will play on Sunday, $sunday2.
</p>`;

export const getSinglesTournament16Text = (entity = 'player') => `
<p>The Top 16 ${entity}s who sign up for the tournament are playing.</p>

<h3>Draw</h3>
<p>The Final Tournament brackets will automatically generate at midnight on Sunday, $sunday0.</p>

<h3>Seeding</h3>
<p>Tournament seeding will operate according to the following parameters:</p>
<ul>
    <li>The first and second seeds can only play in the Final.</li>
    <li>The Top 4 seeds cannot meet before the Semifinals.</li>
    <li>The Top 8 seeds cannot meet before the Quarterfinals.</li>
    <li>All ${entity}s are randomly distributed.</li>
</ul>

<h3>Time</h3>
<p>
    <b>Round of 16 participants</b> will play between Monday, $monday1, and Saturday, $saturday1.<br>
    <b>Quarterfinalists</b> will play between Sunday, $sunday1, and Friday, $friday2.<br>
    <b>Semifinalists</b> will play on Saturday, $saturday2.<br>
    <b>Finalists</b> will play on Sunday, $sunday2.
</p>`;

export const getDoublesTournamentText = () => `
<p>The Top 4 players who sign up for the tournament are playing.</p>

<h3>Draw</h3>
<p>The Final Tournament bracket will automatically generate at midnight on Sunday, $sunday0.</p>

<h3>Time</h3>
<p><b>Final match</b> will be on Sunday, $sunday1, at 3 PM</p>
<p>The match will have three Doubles rounds, where four players will rotate teams in a Round Robin format. Each team will play 8 games (24 total), and the ladder winner is the player who wins the most games.</p>`;
