import { test, expect } from './base';
import { restoreDb, expectRecordToExist, runQuery, overrideConfig, getNumRecords, expectNumRecords } from './db';
import { getActionLink } from '@rival/ladder.backend/src/utils/action';
import dayjs from '@rival/ladder.backend/src/utils/dayjs';

const closeCurrentSeason = async () => {
    const dateTwoDaysAgo = dayjs.tz().subtract(2, 'day').format('YYYY-MM-DD HH:mm:ss');
    await runQuery(`UPDATE seasons SET endDate="${dateTwoDaysAgo}" WHERE id=1`);
};

const populateTeams = async () => {
    await runQuery('INSERT INTO players SET id=20, userId=1, tournamentId=11, teamName="Servebots"');
    await runQuery('INSERT INTO players SET id=21, userId=2, tournamentId=11, partnerId=20');
    await runQuery('INSERT INTO players SET id=23, userId=5, tournamentId=11, teamName="Game-Set-Match"');
    await runQuery('INSERT INTO players SET id=22, userId=6, tournamentId=11, partnerId=23');

    await runQuery(`INSERT INTO matches
        SET id=53,
            initial=1,
            challengerId=21,
            challenger2Id=20,
            challengerRank=1,
            place="Lake Lynn",
            playedAt="${dayjs.tz().add(12, 'hour').format('YYYY-MM-DD HH:mm:ss')}",
            createdAt="2021-05-03 11:00:00",
            isProposalSent=1`);
};

test.beforeEach(async ({ page }) => {
    restoreDb();
    await populateTeams();
});

test('We can see that player is already registered', async ({ page, common, login, register }) => {
    await runQuery(`INSERT INTO players (userId, tournamentId) VALUES (7, 11)`);

    await login.loginAsPlayer5();
    await register.goto();

    await expect(common.body).toContainText('already registered');
});

test('We can register and provide team name and partners to join the Doubles team', async ({
    page,
    common,
    login,
    register,
    overview,
    doublesTeam,
}) => {
    await login.loginAsPlayer5();

    await register.goto();
    await register.getLadderCheckbox('Men Team Doubles').click();

    await common.modal.locator('label', { hasText: 'Invite friends via email' }).click();
    await common.modalSubmitButton.click();
    await expect(common.modal).toContainText("Teammate's email is required.");
    await expect(common.modal).toContainText('Team name is required.');

    await register.email1Field.fill('player5@gmail.com');
    await register.email2Field.fill('wrongemail');
    await register.teamNameField.fill(' SERV_EBOTS ');
    await common.modalSubmitButton.click();
    await expect(common.body).toContainText('You cannot use your email.');
    await expect(common.body).toContainText('Wrong email format.');
    await expect(common.body).toContainText('Only letters, digits');

    await register.email1Field.fill('player1@gmail.com');
    await register.email2Field.fill('');
    await register.teamNameField.fill(' BaLL LOVErs ');
    await common.modalSubmitButton.click();
    await expect(common.body).toContainText("You're inviting player1@gmail.com");

    await register.agreeCheckbox.click();
    await register.registerButton.click();
    await expect(common.modal).toContainText('You are successfully registered!');

    await expectRecordToExist('players', { userId: 7, tournamentId: 11 }, { teamName: 'Ball Lovers' });

    // Check captain email
    const captainEmail = await expectRecordToExist(
        'emails',
        { subject: 'Your Reign as a Doubles Team Captain Begins Today!' },
        { recipientEmail: 'player5@gmail.com' }
    );
    expect(captainEmail.html).toContain('You can invite up to 2 teammates to your team.');
    const linksFromCaptainEmail = captainEmail.html.match(/href="https?:\/\/[^"]+"/g) || [];
    const joinDoublesLinkFromCaptainEmail = linksFromCaptainEmail
        .filter((str: string) => str.includes('/a/joinDoubles/'))[0]
        .slice(6, -1);

    // Check partner 1 email
    const email = await expectRecordToExist(
        'emails',
        { subject: 'Inactive User Invited You to Play Doubles!' },
        { recipientEmail: 'player1@gmail.com' }
    );
    expect(email.html).toContain('Inactive User');
    expect(email.html).toContain('invited');
    expect(email.html).toContain('/season/2021/spring/men-40-dbls-team');

    const links = email.html.match(/href="https?:\/\/[^"]+"/g) || [];
    const joinDoublesLink = links.filter((str: string) => str.includes('/a/joinDoubles/'))[0].slice(6, -1);

    await register.goToLadderButton.click();
    await expect(common.body).toContainText('Men Team Doubles');
    await expect(overview.playerList).toContainText('Inactive User');

    // Join the team using email link
    await login.loginAsPlayer8();
    await page.goto(joinDoublesLink);
    await expect(common.modal).toContainText('successfuly joined the Doubles');
    await register.goToLadderButton.click();
    await overview.checkTeam('Ball Lovers', ['Inactive User', 'Not Played User']);

    // Check that captain can still see the join team link
    await login.loginAsPlayer5();
    await page.goto('/season/2021/spring/men-40-dbls-team');
    await expect(doublesTeam.joinTeamLink).toBeVisible();

    await page.getByRole('button', { name: 'Copy' }).click();
    await expect(common.body).toContainText('Copied!');
    const anotherJoinTeamLink = await common.getClipboardValue();

    // Join third player
    await login.loginAsPlayer9();
    await page.goto(anotherJoinTeamLink);
    await expect(common.modal).toContainText('successfuly joined the Doubles');
    await register.goToLadderButton.click();
    await overview.checkTeam('Ball Lovers', ['Inactive User', 'Not Played User', 'Doubles Player']);

    // Check that captain cannot Invite more teammembers
    await login.loginAsPlayer5();
    await page.goto('/season/2021/spring/men-40-dbls-team');
    await expect(overview.proposeMatchButton).toBeVisible();
    await expect(doublesTeam.joinTeamLink).toBeHidden();

    // Check that fourth player cannot join
    await login.logout();
    await page.goto(joinDoublesLinkFromCaptainEmail);
    await expect(common.body).toContainText('The team already has the maximum of 3 players.');
});

test('We can register for the free ladder and partner will get an email', async ({
    page,
    common,
    login,
    register,
    overview,
}) => {
    await overrideConfig({ minMatchesToPay: 0 });
    await login.loginAsPlayer9();

    await register.goto();
    await expect(page.locator('[data-free-level="men-40-dbls-free"]')).toBeVisible();
    await register.getLadderCheckbox('Men Free Doubles').click();

    await common.modal.locator('label', { hasText: 'Invite friends via email' }).click();
    await register.email1Field.fill('first@gmail.com');
    await register.email2Field.fill('second@gmail.com');
    await register.teamNameField.fill(' Tough  GUYS ');
    await common.modalSubmitButton.click();
    await expect(common.body).toContainText("You're inviting first@gmail.com and second@gmail.com");

    await register.agreeCheckbox.click();
    await register.goToCheckoutButton.click();

    await expect(common.body).toContainText('$0.00');
    await register.confirmOrderButton.click();
    await expect(common.modal).toContainText('Order processed successfully!');

    await expectRecordToExist('players', { userId: 9, tournamentId: 13 }, { teamName: 'Tough Guys' });
    await register.goToLadderButton.click();
    await expect(common.body).toContainText('Men Free Doubles');
    await expect(overview.playerList).toContainText('Doubles Player');

    // Check partner 1 email
    const email = await expectRecordToExist(
        'emails',
        { subject: 'Doubles Player Invited You to Play Doubles!' },
        { recipientEmail: 'first@gmail.com,second@gmail.com' }
    );
    expect(email.html).toContain('Doubles Player');
    expect(email.html).toContain('invited');
    expect(email.html).toContain('/season/2021/spring/men-40-dbls-free');

    const links = email.html.match(/href="https?:\/\/[^"]+"/g) || [];
    const joinDoublesLink = links.filter((str: string) => str.includes('/a/joinDoubles/'))[0].slice(6, -1);

    // Join player
    await login.loginAsPlayer5();
    await page.goto(joinDoublesLink);
    await expect(common.modal).toContainText('successfuly joined the Doubles');
    await register.goToLadderButton.click();
    await overview.checkTeam('Tough Guys', ['Doubles Player', 'Inactive User']);
});

test('We can register and get player from the Pool', async ({ common, login, register }) => {
    await runQuery('INSERT INTO players SET userId=8, tournamentId=11, partnerId=999999, partnerInfo="I am flexible."');
    await runQuery('INSERT INTO players SET userId=9, tournamentId=11, partnerId=999999, partnerInfo="I am free."');

    await login.loginAsPlayer5();

    await register.goto();
    await register.getLadderCheckbox('Men Team Doubles').click();
    await expect(common.modal).toContainText('2 players are available now.');

    await common.modal.locator('label', { hasText: 'Recruit a teammate from the Player Pool' }).click();
    await expect(common.modal).toContainText('I am free.');
    await expect(common.modal).toContainText('I am flexible.');
    await common.modal.locator('label', { hasText: 'Doubles Player' }).click();
    await common.modal.locator('.badge').getByText('Love Gurus').click();
    await common.modalSubmitButton.click();
    await expect(common.body).toContainText("You're adding Doubles Player from the Player Pool.");

    await register.agreeCheckbox.click();
    await register.registerButton.click();
    await expect(common.modal).toContainText('You are successfully registered!');

    const { id } = await expectRecordToExist(
        'players',
        { userId: 7, tournamentId: 11 },
        { partnerId: null, teamName: 'Love Gurus' }
    );
    await expectRecordToExist('players', { userId: 9, tournamentId: 11 }, { partnerId: id });

    // Check that teammate will get an email
    const email = await expectRecordToExist(
        'emails',
        { subject: 'Inactive User Added You to Their Doubles Team!' },
        { recipientEmail: 'player9@gmail.com' }
    );
    expect(email.html).toContain('Inactive User');
    expect(email.html).toContain('/player/inactive-user');
    expect(email.html).toContain('added you to their Doubles Team!');
    expect(email.html).toContain('player5@gmail.com');
    expect(email.html).toContain('920-391-9531');

    await register.goToLadderButton.click();
    await expect(common.body).toContainText('Open Proposals');
    await expect(common.body).toContainText('Reminders About Rival Rules');
    await expect(common.body).not.toContainText('Team Captain');
    await expect(common.body).toContainText('Report');
    await expect(common.body).toContainText('Love Gurus');
});

test('We can see message that Player Pool is empty', async ({ common, login, register }) => {
    await login.loginAsPlayer5();

    await register.goto();
    await register.getLadderCheckbox('Men Team Doubles').click();
    await expect(common.modal).toContainText('No players available.');
});

test('We can register and join the player Pool', async ({ page, common, login, register, overview, doublesTeam }) => {
    // Captain without teammate should get an email.
    await runQuery('INSERT INTO players SET userId=8, tournamentId=11');

    // Another player from pool should get an email as well.
    await runQuery('INSERT INTO players SET userId=9, tournamentId=11, partnerId=999999, partnerInfo="I am free."');

    await login.loginAsPlayer5();

    await register.goto();
    await register.getLadderCheckbox('Men Team Doubles').click();

    await common.modal.locator('label', { hasText: 'Join the Player Pool' }).click();
    await register.partnerInfoField.fill('I am flexible');
    await common.modalSubmitButton.click();
    await expect(common.body).toContainText('Joining the Player Pool.');

    await register.agreeCheckbox.click();
    await register.registerButton.click();
    await expect(common.modal).toContainText('You are successfully registered!');

    await expectRecordToExist(
        'players',
        { userId: 7, tournamentId: 11 },
        { partnerId: 999999, partnerInfo: 'I am flexible' }
    );

    // Check that captains will get an email
    const email = await expectRecordToExist(
        'emails',
        { subject: 'Inactive User Joined the Doubles Player Pool!' },
        { recipientEmail: 'player8@gmail.com,player9@gmail.com' }
    );
    expect(email.html).toContain('Inactive User');
    expect(email.html).toContain('joined');
    expect(email.html).toContain('920-391-9531');
    expect(email.html).toContain('player5@gmail.com');
    expect(email.html).toContain('I am flexible');
    expect(email.html).toContain('/season/2021/spring/men-40-dbls-team');

    await register.goToLadderButton.click();
    await expect(common.body).toContainText('Open Proposals');
    await expect(common.body).not.toContainText('Reminders About Rival Rules');
    await expect(common.body).not.toContainText('Team Captain');
    await expect(common.body).not.toContainText('Report');
});

test('We can register and join the player Pool for paid season', async ({
    page,
    common,
    login,
    register,
    overview,
    doublesTeam,
}) => {
    await overrideConfig({ minMatchesToPay: 1 });

    // Captain without teammate should get an email.
    await runQuery('INSERT INTO players SET userId=8, tournamentId=13');

    // Another player from pool should get an email as well.
    await runQuery('INSERT INTO players SET userId=9, tournamentId=13, partnerId=999999, partnerInfo="I am free."');

    await login.loginAsPlayer1();

    await register.goto();
    await register.getLadderCheckbox('Men Free Doubles').click();

    await common.modal.locator('label', { hasText: 'Join the Player Pool' }).click();
    await register.partnerInfoField.fill('I am flexible');
    await common.modalSubmitButton.click();
    await expect(common.body).toContainText('Joining the Player Pool.');

    await register.agreeCheckbox.click();
    await register.goToCheckoutButton.click();
    await register.confirmOrderButton.click();
    await expect(common.modal).toContainText('Order processed successfully!');

    await expectRecordToExist(
        'players',
        { userId: 1, tournamentId: 13 },
        { partnerId: 999999, partnerInfo: 'I am flexible' }
    );

    // Check that captains will get an email
    const email = await expectRecordToExist(
        'emails',
        { subject: 'Ben Done Joined the Doubles Player Pool!' },
        { recipientEmail: 'player8@gmail.com,player9@gmail.com' }
    );
    expect(email.html).toContain('Ben Done');
    expect(email.html).toContain('joined');
    expect(email.html).toContain('123-456-7890');
    expect(email.html).toContain('player1@gmail.com');
    expect(email.html).toContain('I am flexible');
    expect(email.html).toContain('/season/2021/spring/men-40-dbls-free');

    await register.goToLadderButton.click();
    await expect(overview.playerPoolArea).toContainText('Ben Done');
    await expect(common.body).toContainText('Open Proposals');
    await expect(common.body).not.toContainText('Reminders About Rival Rules');
    await expect(common.body).not.toContainText('Team Captain');
    await expect(common.body).not.toContainText('Report');
});

test('We can register and join the player Pool after getting back from payment', async ({
    page,
    common,
    login,
    register,
    overview,
    doublesTeam,
}) => {
    await overrideConfig({ minMatchesToEstablishTlr: 1, minMatchesToPay: 0 });

    await login.loginAsPlayer1();

    await register.goto();
    await register.getLadderCheckbox('Men Free Doubles').click();

    await common.modal.locator('label', { hasText: 'Join the Player Pool' }).click();
    await register.partnerInfoField.fill('I am flexible');
    await common.modalSubmitButton.click();
    await expect(common.body).toContainText('Joining the Player Pool.');

    await register.agreeCheckbox.click();
    await register.goToCheckoutButton.click();

    await register.changeLadderLink.click();

    await register.agreeCheckbox.click();
    await register.goToCheckoutButton.click();

    await register.confirmOrderButton.click();
    await expect(common.modal).toContainText('Order processed successfully!');

    await expectRecordToExist(
        'players',
        { userId: 1, tournamentId: 13 },
        { partnerId: 999999, partnerInfo: 'I am flexible' }
    );
});

test('Captain can accept player from Player Pool', async ({ page, common, login, overview }) => {
    await runQuery(
        'INSERT INTO players SET userId=8, tournamentId=11, partnerId=999999, partnerInfo="I am flexible on weekends. Have a vacation from July 14 to July 21."'
    );

    await login.loginAsPlayer1();
    await page.goto('/season/2021/spring/men-40-dbls-team');
    const playerFromThePool = page.locator('[data-player-pool="8"]');
    await expect(playerFromThePool).toContainText('Not Played User');
    await expect(playerFromThePool).toContainText('I am flexible on weekends.');
    await playerFromThePool.locator('button').getByText('Add to Team').click();

    await expect(common.modal).toContainText('Are you sure you want to add Not Played User to your Doubles Team?');
    await expect(common.modal).not.toContainText('Captain');
    await common.modal.locator('button').getByText('Yes').click();

    await expect(common.alert).toContainText('Not Played User joined your team.');

    await expectRecordToExist('players', { userId: 8, tournamentId: 11 }, { partnerId: 20 });

    await expect(overview.playerPoolArea).toBeHidden();
    await expect(playerFromThePool).toBeHidden();
    await overview.checkTeam('Servebots', ['Ben Done', 'Gary Mill', 'Not Played User']);

    // Check that teammate will get an email
    const email = await expectRecordToExist(
        'emails',
        { subject: 'Ben Done Added You to Their Doubles Team!' },
        { recipientEmail: 'player8@gmail.com' }
    );
    expect(email.html).toContain('Ben Done');
    expect(email.html).toContain('/player/ben-done');
    expect(email.html).toContain('added you to their Doubles Team!');
});

test('The player from Player Pool can accept another player from it', async ({
    page,
    common,
    login,
    overview,
    register,
}) => {
    const { insertId: playerId } = await runQuery(
        'INSERT INTO players SET userId=7, tournamentId=11, partnerId=999999, partnerInfo="I am flexible."'
    );
    await runQuery('INSERT INTO players SET userId=8, tournamentId=11, partnerId=999999, partnerInfo="I am free."');

    await login.loginAsPlayer5();
    await page.goto('/season/2021/spring/men-40-dbls-team');
    const playerFromThePool = page.locator('[data-player-pool="8"]');
    await playerFromThePool.locator('button').getByText('Create Team').click();

    await expect(common.modal).toContainText(
        'By adding Not Played User to your Doubles Team, you will become a Team Captain.'
    );
    await common.modal.locator('button').getByText('Create Team').click();
    await expect(common.modal).toContainText('Team name is required.');
    await register.teamNameField.fill(' whatEVER ');
    await common.modal.locator('button').getByText('Create Team').click();

    await expect(common.alert).toContainText('Not Played User joined your team.');

    await expectRecordToExist('players', { userId: 7, tournamentId: 11 }, { partnerId: null, teamName: 'Whatever' });
    await expectRecordToExist('players', { userId: 8, tournamentId: 11 }, { partnerId: playerId });

    await expect(overview.playerPoolArea).toBeVisible();
    await expect(common.body).toContainText('No players available');
    await expect(playerFromThePool).toBeHidden();
    await expect(overview.playerList).toContainText('Whatever');

    // Check that captains will get an email
    const email = await expectRecordToExist(
        'emails',
        { subject: 'Inactive User Added You to Their Doubles Team!' },
        { recipientEmail: 'player8@gmail.com' }
    );
    expect(email.html).toContain('Inactive User');
    expect(email.html).toContain('/player/inactive-user');
    expect(email.html).toContain('added you to their Doubles Team!');
    expect(email.html).toContain('player5@gmail.com');
    expect(email.html).toContain('920-391-9531');
});

test('The player from Player Pool can edit additional information', async ({ page, common, login, register }) => {
    await runQuery('INSERT INTO players SET userId=7, tournamentId=11, partnerId=999999, partnerInfo="I am flexible."');

    await login.loginAsPlayer5();
    await page.goto('/season/2021/spring/men-40-dbls-team');
    const playerFromThePool = page.locator('[data-player-pool="7"]');
    await playerFromThePool.locator('button').getByText('Edit').click();

    await register.partnerInfoField.fill('Talk to me');
    await common.modalSubmitButton.click();
    await expect(common.alert).toContainText("You've successfuly updated your information.");

    await expect(common.body).toContainText('Talk to me');
});

test('The player from Player Pool can delete himself', async ({ page, common, login, overview }) => {
    await runQuery('INSERT INTO players SET userId=7, tournamentId=11, partnerId=999999, partnerInfo="I am flexible."');

    await login.loginAsPlayer5();
    await page.goto('/season/2021/spring/men-40-dbls-team');
    const playerFromThePool = page.locator('[data-player-pool="7"]');
    await playerFromThePool.locator('button').getByText('Remove').click();

    await expect(common.modal).toContainText(
        'Are you sure you want to remove yourself from the Player Pool and the ladder?'
    );
    await common.modal.locator('button').getByText('Yes').click();

    await expect(common.alert).toContainText("You've been successfuly removed from the Player Pool.");

    expect(await getNumRecords('players', { userId: 7, tournamentId: 11 })).toBe(0);

    await expect(overview.playerPoolArea).toBeHidden();
    await expect(playerFromThePool).toBeHidden();
});

test('The Single captain can move himself to Player Pool', async ({ page, common, login, overview }) => {
    await runQuery('INSERT INTO players SET userId=7, tournamentId=11');
    await runQuery('INSERT INTO players SET userId=8, tournamentId=11, partnerId=999999');
    await runQuery('INSERT INTO players SET userId=9, tournamentId=11');

    await login.loginAsPlayer5();
    await page.goto('/season/2021/spring/men-40-dbls-team');
    await overview.playerPoolArea.locator('button').getByText('Join the Player Pool').click();

    await expect(common.modal).toContainText('You are joining the Player Pool and disbanding your current Team.');
    await common.modal.locator('textarea').fill('I am flexible');
    await common.modal.locator('button').getByText('Submit').click();

    await expect(common.alert).toContainText("You've been successfuly moved to the Player Pool.");

    await expectRecordToExist(
        'players',
        { userId: 7, tournamentId: 11 },
        { partnerId: 999999, partnerInfo: 'I am flexible' }
    );

    await expect(overview.playerPoolArea).toContainText('Inactive User');

    // Check that captains and other Pool Players will get an email
    const email = await expectRecordToExist(
        'emails',
        { subject: 'Inactive User Joined the Doubles Player Pool!' },
        { recipientEmail: 'player8@gmail.com,player9@gmail.com' }
    );
    expect(email.html).toContain('Inactive User');
    expect(email.html).toContain('joined');
    expect(email.html).toContain('920-391-9531');
    expect(email.html).toContain('player5@gmail.com');
    expect(email.html).toContain('I am flexible');
    expect(email.html).toContain('/season/2021/spring/men-40-dbls-team');
});

test('The Single captain moved to Player Pool and somebody joined using his former captain link', async ({
    page,
    common,
    login,
    overview,
    register,
}) => {
    await runQuery('INSERT INTO players SET userId=7, tournamentId=11, teamName="Love Love"');

    await login.loginAsPlayer5();
    await page.goto('/season/2021/spring/men-40-dbls-team');

    // Get invite link
    await page.getByRole('button', { name: 'Copy' }).click();
    await expect(common.body).toContainText('Copied!');
    const joinDoublesLink = await common.getClipboardValue();

    await overview.playerPoolArea.locator('button').getByText('Join the Player Pool').click();
    await common.modal.locator('button').getByText('Submit').click();
    await expect(common.alert).toContainText("You've been successfuly moved to the Player Pool.");

    await login.loginAsPlayer8();
    await page.goto(joinDoublesLink);

    await expect(common.modal).toContainText('successfuly joined the Doubles');
    await register.goToLadderButton.click();
    await overview.checkTeam('Love Love', ['Inactive User', 'Not Played User']);
});

test('We can register for the free ladder when TLR is too high', async ({
    page,
    common,
    login,
    register,
    overview,
}) => {
    await overrideConfig({ minMatchesToEstablishTlr: 1, minMatchesToPay: 0 });
    await runQuery(`UPDATE matches SET challengerElo=550, acceptorElo=550`);
    await login.loginAsPlayer1();

    await register.goto();
    await register.playAnotherLadder('I got injured');
    await expect(page.locator('[data-free-level="men-45"]')).toBeVisible();
    await expect(page.locator('[data-free-level="men-40-dbls-free"]')).toBeVisible();
    await register.getLadderCheckbox('Men Free Doubles').click();

    await common.modal.locator('label', { hasText: 'Invite friends via email' }).click();
    await register.email1Field.fill('first@gmail.com');
    await register.teamNameField.fill('HeLLo');
    await common.modalSubmitButton.click();

    await register.agreeCheckbox.click();
    await register.goToCheckoutButton.click();

    await expect(common.body).toContainText('$0.00');
    await register.confirmOrderButton.click();
    await expect(common.modal).toContainText('Order processed successfully!');

    await expectRecordToExist('players', { userId: 1, tournamentId: 13 }, { teamName: 'Hello' });
    await register.goToLadderButton.click();
    await expect(common.body).toContainText('Men Free Doubles');
    await expect(overview.playerList).toContainText('Ben Done');

    await expectRecordToExist(
        'emails',
        { subject: 'Ben Done Invited You to Play Doubles!' },
        { recipientEmail: 'first@gmail.com' }
    );
});

test('We can register and join Doubles ladders (free and paid) paying from wallet', async ({
    page,
    common,
    login,
    register,
}) => {
    await runQuery(
        `INSERT INTO payments (userId, type, description, amount) VALUES (5, 'discount', 'Referral credit', 10000)`
    );

    await closeCurrentSeason();
    await login.loginAsPlayer3();

    await register.goto();
    await expect(page.locator('[data-free-level="men-40-dbls-free"]')).toBeVisible();
    await expect(page.locator('[data-free-level="men-40-dbls-team"]')).toBeHidden();

    await register.getLadderCheckbox('Men Team Doubles').click();
    await common.modal.locator('label', { hasText: 'Invite friends via email' }).click();
    await register.email1Field.fill('first@gmail.com');
    await register.teamNameField.fill('Machos');
    await common.modalSubmitButton.click();

    await register.getLadderCheckbox('Men Free Doubles').click();
    await common.modal.locator('label', { hasText: 'Invite friends via email' }).click();
    await register.email1Field.fill('second@gmail.com');
    await register.teamNameField.fill('HeLLo');
    await common.modalSubmitButton.click();

    await register.agreeCheckbox.click();
    await register.goToCheckoutButton.click();

    await expect(common.body).toContainText('-$20.00');
    await register.confirmOrderButton.click();
    await expect(common.modal).toContainText('The ladder officially begins');

    await expectRecordToExist(
        'emails',
        { recipientEmail: 'first@gmail.com' },
        { subject: 'Cristopher Hamiltonbeach Invited You to Play Doubles!' }
    );
    await expectRecordToExist(
        'emails',
        { recipientEmail: 'second@gmail.com' },
        { subject: 'Cristopher Hamiltonbeach Invited You to Play Doubles!' }
    );
});

test('We can register for Single ladder after registering for Doubles', async ({ page, common, login, register }) => {
    await runQuery('INSERT INTO players SET userId=7, tournamentId=11');

    await login.loginAsPlayer5();
    await register.goto();
    await register.getLadderCheckbox('Men 3.0').click();
    await register.agreeCheckbox.click();
    await register.registerButton.click();

    await expect(common.modal).toContainText('You are successfully registered!');

    // Check that we don't send doubles captain message again
    await page.waitForTimeout(1000);
    expect(await getNumRecords('emails')).toBe(0);
});

test('We can register for free if it is our first season', async ({ common, login, register }) => {
    await runQuery('INSERT INTO players SET userId=7, tournamentId=11');
    await overrideConfig({ minMatchesToPay: 0 });

    await login.loginAsPlayer5();
    await register.goto();
    await register.getLadderCheckbox('Men 3.0').click();
    await register.agreeCheckbox.click();
    await register.registerButton.click();

    await expect(common.modal).toContainText('You are successfully registered!');
});

{
    const getDoublesLinkForPlayer5 = async ({ tournamentId = 11 } = {}) => {
        const { insertId: playerId } = await runQuery(
            `INSERT INTO players SET userId=7, tournamentId=${tournamentId}, teamName="Early Birds"`
        );
        const link = await getActionLink({ payload: { name: 'joinDoubles', playerId } });
        return { link, playerId };
    };

    test('We cannot join the doubles as partner is not playing anymore', async ({ page, common, login }) => {
        const { link, playerId } = await getDoublesLinkForPlayer5();
        await runQuery(`UPDATE players SET partnerId=999 WHERE id=${playerId}`);

        await page.goto(link);

        await expect(common.body).toContainText('The player who provided this link is no longer a captain.');

        await new Promise((resolve) => setTimeout(resolve, 1000));
        await expect(common.alert).toBeHidden();
    });

    test('We cannot join the doubles as the season is over', async ({ page, common, login }) => {
        const { link } = await getDoublesLinkForPlayer5();
        await runQuery(`UPDATE seasons SET endDate="2021-11-11 00:00:00"`);

        await page.goto(link);

        await expect(common.body).toContainText('The season is over.');
    });

    test('The player cannot join by his own link', async ({ page, common, login }) => {
        const { link } = await getDoublesLinkForPlayer5();

        await login.loginAsPlayer5();
        await page.goto(link);

        await expect(common.body).toContainText("It's your captain link. You should share it to other teammates.");
    });

    test('The player cannot join the doubles as he already a captain of a different team with teammates', async ({
        page,
        common,
        login,
    }) => {
        const { link } = await getDoublesLinkForPlayer5();

        await login.loginAsPlayer1();
        await page.goto(link);

        await expect(common.body).toContainText('You are already a captain of a different team.');
    });

    test('The player cannot join the doubles as he already a teammate of a different team', async ({
        page,
        common,
        login,
    }) => {
        const { link } = await getDoublesLinkForPlayer5();

        await login.loginAsPlayer2();
        await page.goto(link);

        await expect(common.body).toContainText('You are already a teammate in a different team.');
    });

    test('The player cannot join the doubles with already 3 players', async ({ page, common, login }) => {
        const { id: playerId } = await expectRecordToExist('players', { userId: 1, tournamentId: 11 });
        const link = await getActionLink({ payload: { name: 'joinDoubles', playerId } });

        await login.loginAsPlayer5();
        await page.goto(link);
        await expect(common.modal).toContainText('successfuly joined the Doubles');

        await login.loginAsPlayer9();
        await page.goto(link);
        await expect(common.body).toContainText('The team already has the maximum of 3 players.');
    });

    test('The logged-in player can join the Doubles for the current season', async ({
        page,
        common,
        login,
        doublesTeam,
        overview,
        register,
    }) => {
        const { link, playerId } = await getDoublesLinkForPlayer5();

        await page.goto('/season/2021/spring/men-40-dbls-team');
        await expect(overview.playerList).toContainText('Inactive User');

        await login.loginAsPlayer8();
        await page.goto(link);

        await expect(common.modal).toContainText('successfuly joined the Doubles');
        await register.goToLadderButton.click();
        await overview.checkTeam('Early Birds', ['Inactive User', 'Not Played User']);
        await expect(common.body).toContainText(overview.rulesReminderText);

        await expectRecordToExist('players', { userId: 8, tournamentId: 11 }, { partnerId: playerId });

        // Check email for captain
        const email = await expectRecordToExist(
            'emails',
            { subject: 'Not Played User Joined Your Doubles Team!' },
            { recipientEmail: 'player5@gmail.com' }
        );
        expect(email.html).toContain('Not Played User');
        expect(email.html).toContain('joined');
    });

    test('Single captain can join another team', async ({ page, common, login, doublesTeam, overview, register }) => {
        const { link } = await getDoublesLinkForPlayer5();

        await login.loginAsPlayer8();
        await register.goto();

        await register.getLadderCheckbox('Men Team Doubles').click();

        await common.modal.locator('label', { hasText: 'Invite friends via email' }).click();
        await register.email1Field.fill('first@gmail.com');
        await register.teamNameField.fill('Forever');
        await common.modalSubmitButton.click();

        await register.agreeCheckbox.click();
        await register.registerButton.click();
        await expect(common.modal).toContainText('You are successfully registered!');

        await page.goto(link);
        await expect(common.modal).toContainText('successfuly joined the Doubles');
        await register.goToLadderButton.click();
        await overview.checkTeam('Early Birds', ['Inactive User', 'Not Played User']);
    });

    test('The logged-in player can join the Doubles for the upcoming season', async ({
        page,
        common,
        login,
        doublesTeam,
        overview,
        register,
    }) => {
        const { link, playerId } = await getDoublesLinkForPlayer5({ tournamentId: 12 });

        await login.loginAsPlayer1();
        await page.goto(link);

        await expect(common.modal).toContainText('successfuly joined the Doubles');
        await expect(common.modal).toContainText('The ladder officially begins');
        await register.goToLadderButton.click();
        await overview.checkTeam('Early Birds', ['Inactive User', 'Ben Done']);
        await expect(overview.area).not.toContainText('TLR');

        await expectRecordToExist('players', { userId: 1, tournamentId: 12 }, { partnerId: playerId });
    });

    test('Join the Double by logging in for two players', async ({
        page,
        common,
        login,
        doublesTeam,
        overview,
        register,
    }) => {
        const { link, playerId } = await getDoublesLinkForPlayer5();

        await page.goto(link);
        await register.signInLink.click();
        await login.emailField.fill('player8@gmail.com');
        await login.passwordField.fill(login.password);
        await login.signInButton.click();

        await expect(common.modal).toContainText('successfuly joined the Doubles');
        await register.goToLadderButton.click();
        await overview.checkTeam('Early Birds', ['Inactive User', 'Not Played User']);

        await expectRecordToExist('players', { userId: 8, tournamentId: 11 }, { partnerId: playerId });

        // Join another player
        await login.logout();
        await page.goto(link);
        await register.signInLink.click();
        await login.emailField.fill('player9@gmail.com');
        await login.passwordField.fill(login.password);
        await login.signInButton.click();

        await expect(common.modal).toContainText('successfuly joined the Doubles');

        // Join third player should be prohibited
        // await login.logout();
        // await page.goto(link);
        // await expect(common.body).toContainText('The team is full'); // TODO: adjust error message
    });

    test('Join the Double by registering', async ({ page, common, login, doublesTeam, overview, register, user }) => {
        const { link, playerId } = await getDoublesLinkForPlayer5();

        await page.goto(link);

        await register.firstNameField.fill('Peter');
        await register.lastNameField.fill('Allen');
        await register.emailField.fill('peter@gmail.com');
        await register.phoneField.fill('1112223333');
        await register.passwordField.fill(login.password);
        await user.enterBirthday('1/1/2000');
        await register.submitPlayerButton.click();

        await register.verifyEmail('peter@gmail.com');

        await expect(common.modal).toContainText('successfuly joined the Doubles');
        await register.goToLadderButton.click();
        await overview.checkTeam('Early Birds', ['Inactive User', 'Peter Allen']);

        const record = await expectRecordToExist('users', { email: 'peter@gmail.com' });
        await expectRecordToExist('players', { userId: record.id, tournamentId: 11 }, { partnerId: playerId });
    });
}

// Check interface elements
{
    // current season
    {
        test('Captain can get joinDoublesLink', async ({ page, common, login, overview, doublesTeam }) => {
            await runQuery(`INSERT INTO players SET userId=7, tournamentId=11`);

            await login.loginAsPlayer5();
            await page.goto('/season/2021/spring/men-40-dbls-team');

            await expect(common.body).toContainText('Teams2');
            await overview.checkTeam('Game-Set-Match', ['Cristopher Hamiltonbeach', 'Matthew Burt']);
            await common.closeModal();
            await expect(doublesTeam.joinTeamLink).toBeVisible();
            await expect(overview.proposeMatchButton).toBeHidden();
            await expect(common.body).not.toContainText(overview.rulesReminderText);
            await expect(common.body).not.toContainText('Accept');

            await page.getByRole('button', { name: 'Copy' }).click();
            await expect(common.body).toContainText('Copied!');

            const clipboard = await common.getClipboardValue();
            await page.goto(clipboard);

            await expect(common.body).toContainText("It's your captain link. You should share it to other teammates.");

            await page.goto('/season/2021/spring/men-40-dbls-team/matches');
            await expect(common.body).toContainText('No matches found');
            await expect(overview.reportMatchButton).toBeHidden();

            await page.goto('/season/2021/spring/men-40-dbls-team/proposals');
            await expect(common.body).toContainText('Lake Lynn');
            await expect(common.body).toContainText('Servebots');
            await expect(overview.proposeMatchButton).toBeHidden();
            await expect(common.body).not.toContainText('Accept');
        });

        test('Captain for team of 2 can see proper interface for the current season', async ({
            page,
            common,
            login,
            overview,
            doublesTeam,
        }) => {
            await login.loginAsPlayer1();
            await page.goto('/season/2021/spring/men-40-dbls-team');

            await expect(overview.proposeMatchButton).toBeVisible();
            await expect(doublesTeam.joinTeamLink).toBeVisible();

            const Proposal = page.locator('[data-proposal="53"]');
            await expect(Proposal).not.toContainText('Accept');
        });

        test('Second partner can see proper interface for the current season', async ({
            page,
            common,
            login,
            overview,
            doublesTeam,
        }) => {
            await login.loginAsPlayer2();
            await page.goto('/season/2021/spring/men-40-dbls-team');

            await expect(overview.proposeMatchButton).toBeHidden();
            await expect(doublesTeam.joinTeamLink).toBeHidden();
            await expect(common.body).not.toContainText('Accept');
            await expect(common.body).toContainText(overview.rulesReminderText);

            await page.locator('button').getByText('Got it!').click();

            await common.reloadPage();
            await expect(common.body).toContainText('Open Proposals');

            await page.goto('/season/2021/spring/men-40-dbls-team/matches');
            await expect(common.body).toContainText('No matches found');
            await expect(overview.reportMatchButton).toBeHidden();

            await page.goto('/season/2021/spring/men-40-dbls-team/proposals');
            await expect(common.body).toContainText('Lake Lynn');
            await expect(overview.proposeMatchButton).toBeHidden();
            await expect(common.body).not.toContainText('Accept');
        });
    }

    // future season
    {
        test('Captain for team of 2 can see proper interface for the future season', async ({
            page,
            login,
            overview,
            doublesTeam,
        }) => {
            const { insertId: captainId } = await runQuery(
                `INSERT INTO players SET userId=1, tournamentId=12, teamName="Sunrise"`
            );
            await runQuery(`INSERT INTO players SET userId=7, tournamentId=12, partnerId=${captainId}`);

            await login.loginAsPlayer1();
            await page.goto('/season/2022/spring/men-40-dbls-team');

            await overview.checkTeam('Sunrise', ['Ben Done', 'Inactive User']);
            await expect(doublesTeam.joinTeamLink).toBeVisible();
            await expect(overview.proposeMatchButton).toBeHidden();
        });

        test('Second partner can see proper interface for the future season', async ({
            page,
            login,
            overview,
            doublesTeam,
        }) => {
            const { insertId: captainId } = await runQuery(
                `INSERT INTO players SET userId=1, tournamentId=12, teamName="Sunrise"`
            );
            await runQuery(`INSERT INTO players SET userId=7, tournamentId=12, partnerId=${captainId}`);

            await login.loginAsPlayer5();
            await page.goto('/season/2022/spring/men-40-dbls-team');

            await overview.checkTeam('Sunrise', ['Ben Done', 'Inactive User']);
            await expect(doublesTeam.joinTeamLink).toBeHidden();
            await expect(overview.proposeMatchButton).toBeHidden();
        });
    }
}

// Proposals for Captain of 2
{
    test('Captain of 2 can add a proposal', async ({ page, common, login, overview, proposal }) => {
        await overrideConfig({ minMatchesToEstablishTlr: 1 });
        await runQuery(`INSERT INTO players SET userId=7, tournamentId=11`);
        await runQuery('INSERT INTO players SET userId=8, tournamentId=11, partnerId=999999');
        await runQuery('UPDATE users SET subscribeForProposals=1');

        await login.loginAsPlayer1();
        await page.goto('/season/2021/spring/men-40-dbls-team');

        await overview.proposeMatchButton.click();
        await expect(common.modal).toContainText('Propose match');

        await proposal.pickSundayNextWeek();
        await proposal.placeField.fill('Bandana park');
        await common.modal.locator('button').getByText('Propose match').click();

        await expect(common.alert).toContainText('has been added');

        const Proposal = overview.openProposalsArea.locator('[data-proposal]', { hasText: 'Bandana park' });
        await overview.checkTeamLink(Proposal, 'Servebots', ['Ben Done', 'Gary Mill']);
        await expect(Proposal).toContainText('5:00 PM');
        await expect(Proposal).toContainText('Delete');
        await expect(Proposal).not.toContainText('Accept');

        const emailSent = await expectRecordToExist('emails', {
            recipientEmail: 'player3@gmail.com,player4@gmail.com',
        });
        expect(emailSent.subject).toContain('Servebots (Ben D. / Gary M.) proposed a new match');
        expect(emailSent.subject).toContain('5:00 PM');
        expect(emailSent.replyTo).toContain('Ben Done');
        expect(emailSent.replyTo).toContain('player1@gmail.com');
        expect(emailSent.html).toContain('Servebots');
        expect(emailSent.html).toContain('Ben D.</a> /');
        expect(emailSent.html).toContain('Gary M.</a>');
        expect(emailSent.html).toContain('proposed a new match');
        expect(emailSent.html).toContain('Raleigh, Men Team Doubles, Bandana park');
        expect(emailSent.html).toContain('5:00 PM');

        await Proposal.locator('button').getByText('Delete').click();
        await expect(common.modal).toContainText('Servebots');
        await common.modal.locator('button').getByText('Delete').click();
        await expect(common.modal).toBeHidden();
        await expect(Proposal).toBeHidden();

        const emailDeletedProposal = await expectRecordToExist('emails', {
            recipientEmail: 'player2@gmail.com',
        });
        expect(emailDeletedProposal.subject).toContain('Servebots (Ben D. / Gary M.) deleted the proposal for');
        expect(emailDeletedProposal.subject).toContain('5:00 PM');
        expect(emailDeletedProposal.replyTo).toContain('Ben Done');
        expect(emailDeletedProposal.replyTo).toContain('player1@gmail.com');
        expect(emailDeletedProposal.html).toContain('Servebots');
        expect(emailDeletedProposal.html).toContain('Ben D.</a> / ');
        expect(emailDeletedProposal.html).toContain('Gary M.</a>');
        expect(emailDeletedProposal.html).toContain('deleted the proposal for a match in Men Team Doubles');
        expect(emailDeletedProposal.html).not.toContain('Reason');
        expect(emailDeletedProposal.html).not.toContain('undefined');
    });

    test('Captain of 2 can add a proposal, wait for accept, and then delete it', async ({
        page,
        common,
        login,
        overview,
        proposal,
        match,
    }) => {
        await overrideConfig({ minMatchesToEstablishTlr: 1 });
        await runQuery(`INSERT INTO players SET userId=7, tournamentId=11`);
        await runQuery('INSERT INTO players SET userId=8, tournamentId=11, partnerId=999999');
        await runQuery('UPDATE users SET subscribeForProposals=1');

        await login.loginAsPlayer1();
        await page.goto('/season/2021/spring/men-40-dbls-team');

        await overview.proposeMatchButton.click();
        await proposal.pickSundayNextWeek();
        await proposal.placeField.fill('Bandana park');
        await common.modal.locator('button').getByText('Propose match').click();

        await expect(common.alert).toContainText('has been added');

        const Proposal = overview.openProposalsArea.locator('[data-proposal]', { hasText: 'Bandana park' });

        // Another team accepting the proposal
        await login.loginAsPlayer3();
        await page.goto('/season/2021/spring/men-40-dbls-team');
        await Proposal.locator('button').getByText('Accept').click();
        await common.modal.locator('button').getByText('Accept').click();
        await expect(common.alert).toContainText('has been accepted');
        await expect(Proposal).toBeHidden();

        await login.loginAsPlayer1();
        await page.goto('/season/2021/spring/men-40-dbls-team');
        await overview.upcomingMatchesArea.locator('[data-match-actions]').click();
        await page.locator('button').getByText('Delete proposal').click();
        await expect(common.modal).toContainText('Game-Set-Match already accepted');
        await match.reasonField.fill('I am sick');
        await common.modal.locator('button').getByText('Delete proposal').click();
        await expect(common.alert).toContainText('has been deleted');

        const emailDeletedProposal = await expectRecordToExist('emails', {
            recipientEmail: 'player2@gmail.com,player3@gmail.com,player4@gmail.com',
        });
        expect(emailDeletedProposal.subject).toContain('Servebots (Ben D. / Gary M.) deleted the proposal for');
        expect(emailDeletedProposal.subject).toContain('5:00 PM');
        expect(emailDeletedProposal.replyTo).toContain('Ben Done');
        expect(emailDeletedProposal.replyTo).toContain('player1@gmail.com');
        expect(emailDeletedProposal.html).toContain('Servebots');
        expect(emailDeletedProposal.html).toContain('Ben D.</a> / ');
        expect(emailDeletedProposal.html).toContain('Gary M.</a>');
        expect(emailDeletedProposal.html).toContain('Reason:</b> I am sick');
        expect(emailDeletedProposal.html).toContain('deleted the proposal for a match in Men Team Doubles');
        expect(emailDeletedProposal.html).toContain('Ben Done');
        expect(emailDeletedProposal.html).toContain('player1@gmail.com');
        expect(emailDeletedProposal.html).toContain('123-456-7890');
    });

    test('Captain of 2 can accept proposal and unaccept it', async ({ page, common, login, overview }) => {
        await runQuery('INSERT INTO players SET userId=8, tournamentId=11, partnerId=999999');

        await login.loginAsPlayer3();
        await page.goto('/season/2021/spring/men-40-dbls-team');

        const Proposal = overview.openProposalsArea.locator('[data-proposal="53"]');
        await Proposal.locator('button').getByText('Accept').click();
        await common.modal.locator('button').getByText('Accept').click();
        await expect(common.alert).toContainText('has been accepted');
        await expect(Proposal).toBeHidden();

        const Match = overview.upcomingMatchesArea.locator('[data-match="53"]');
        await overview.checkTeamLink(Match, 'Game-Set-Match', ['Cristopher Hamiltonbeach', 'Matthew Burt']);

        const emailSent = await expectRecordToExist('emails', {
            recipientEmail: 'player1@gmail.com,player2@gmail.com,player4@gmail.com',
        });
        expect(emailSent.subject).toContain(
            'Game-Set-Match (Cristopher H. / Matthew B.) accepted the match proposal for'
        );
        expect(emailSent.replyTo).toContain('Cristopher Hamiltonbeach');
        expect(emailSent.replyTo).toContain('player3@gmail.com');
        expect(emailSent.html).toContain('Game-Set-Match');
        expect(emailSent.html).toContain('Cristopher H.</a> / ');
        expect(emailSent.html).toContain('Matthew B.</a>');
        expect(emailSent.html).toContain('accepted the proposal for a match in Men Team Doubles.');
        expect(emailSent.html).toContain('Cristopher Hamiltonbeach');
        expect(emailSent.html).toContain('player3@gmail.com');
        expect(emailSent.html).toContain('206-227-1435');
        expect(emailSent.html).toContain('Lake Lynn');

        await runQuery('DELETE FROM emails');

        // Unaccept the proposal
        await overview.upcomingMatchesArea.locator('[data-match-actions="53"]').click();
        await expect(common.body).not.toContainText('Send email to everyone');
        await page.locator('button').getByText('Unaccept proposal').click();
        await page.locator('input[name="reason"]').fill('I am sick');
        await common.modal.locator('button').getByText('Unaccept proposal').click();
        await expect(common.alert).toContainText('has been unaccepted');

        // Check that the message has been sent
        const emailUnacceptProposal = await expectRecordToExist('emails', {
            recipientEmail: 'player1@gmail.com,player2@gmail.com,player4@gmail.com',
        });
        expect(emailUnacceptProposal.subject).toContain(
            'Game-Set-Match (Cristopher H. / Matthew B.) unaccepted the proposal for'
        );
        expect(emailUnacceptProposal.replyTo).toContain('Cristopher Hamiltonbeach');
        expect(emailUnacceptProposal.replyTo).toContain('player3@gmail.com');
        expect(emailUnacceptProposal.html).toContain('Game-Set-Match');
        expect(emailUnacceptProposal.html).toContain('Cristopher H.</a> / ');
        expect(emailUnacceptProposal.html).toContain('Matthew B.</a>');
        expect(emailUnacceptProposal.html).toContain('unaccepted the proposal for a match in Men Team Doubles');
        expect(emailUnacceptProposal.html).toContain('Reason:</b> I am sick');
        expect(emailUnacceptProposal.html).toContain('Cristopher Hamiltonbeach');
        expect(emailUnacceptProposal.html).toContain('player3@gmail.com');
        expect(emailUnacceptProposal.html).toContain('206-227-1435');
    });
}

// Proposal for Teammate of 2
{
    test('Teammate of 2 can add a proposal', async ({ page, common, login, overview, proposal }) => {
        await overrideConfig({ minMatchesToEstablishTlr: 1 });
        await runQuery(`INSERT INTO players SET userId=7, tournamentId=11`);
        await runQuery('INSERT INTO players SET userId=8, tournamentId=11, partnerId=999999');
        await runQuery('UPDATE users SET subscribeForProposals=1');

        await login.loginAsPlayer2();
        await page.goto('/season/2021/spring/men-40-dbls-team');

        await overview.proposeMatchButton.click();
        await expect(common.modal).toContainText('Propose match');

        await proposal.pickSundayNextWeek();
        await proposal.placeField.fill('Bandana park');
        await common.modal.locator('button').getByText('Propose match').click();

        await expect(common.alert).toContainText('has been added');

        const Proposal = overview.openProposalsArea.locator('[data-proposal]', { hasText: 'Bandana park' });
        await overview.checkTeamLink(Proposal, 'Servebots', ['Gary Mill', 'Ben Done']);
        await expect(Proposal).toContainText('5:00 PM');
        await expect(Proposal).toContainText('Delete');
        await expect(Proposal).not.toContainText('Accept');

        const emailSent = await expectRecordToExist('emails', {
            recipientEmail: 'player3@gmail.com,player4@gmail.com',
        });
        expect(emailSent.subject).toContain('Servebots (Gary M. / Ben D.) proposed a new match');
        expect(emailSent.subject).toContain('5:00 PM');
        expect(emailSent.replyTo).toContain('Gary Mill');
        expect(emailSent.replyTo).toContain('player2@gmail.com');
        expect(emailSent.html).toContain('Servebots');
        expect(emailSent.html).toContain('Gary M.</a> /');
        expect(emailSent.html).toContain('Ben D.</a>');
        expect(emailSent.html).toContain('proposed a new match');
        expect(emailSent.html).toContain('Raleigh, Men Team Doubles, Bandana park');
        expect(emailSent.html).toContain('5:00 PM');

        await Proposal.locator('button').getByText('Delete').click();
        await expect(common.modal).toContainText('Servebots');
        await common.modal.locator('button').getByText('Delete').click();
        await expect(common.modal).toBeHidden();
        await expect(Proposal).toBeHidden();

        const emailDeletedProposal = await expectRecordToExist('emails', {
            recipientEmail: 'player1@gmail.com',
        });
        expect(emailDeletedProposal.subject).toContain('Servebots (Gary M. / Ben D.) deleted the proposal for');
        expect(emailDeletedProposal.subject).toContain('5:00 PM');
        expect(emailDeletedProposal.replyTo).toContain('Gary Mill');
        expect(emailDeletedProposal.replyTo).toContain('player2@gmail.com');
        expect(emailDeletedProposal.html).toContain('Servebots');
        expect(emailDeletedProposal.html).toContain('Gary M.</a> /');
        expect(emailDeletedProposal.html).toContain('Ben D.</a>');
        expect(emailDeletedProposal.html).toContain('deleted the proposal for a match in Men Team Doubles');
        expect(emailDeletedProposal.html).toContain('Gary Mill');
        expect(emailDeletedProposal.html).not.toContain('Reason');
        expect(emailDeletedProposal.html).not.toContain('undefined');
    });

    test('Teammate of 2 can add a proposal, wait for accept, and then delete it', async ({
        page,
        common,
        login,
        overview,
        proposal,
        match,
    }) => {
        await overrideConfig({ minMatchesToEstablishTlr: 1 });
        await runQuery(`INSERT INTO players SET userId=7, tournamentId=11`);
        await runQuery('INSERT INTO players SET userId=8, tournamentId=11, partnerId=999999');
        await runQuery('UPDATE users SET subscribeForProposals=1');

        await login.loginAsPlayer2();
        await page.goto('/season/2021/spring/men-40-dbls-team');

        await overview.proposeMatchButton.click();
        await proposal.pickSundayNextWeek();
        await proposal.placeField.fill('Bandana park');
        await common.modal.locator('button').getByText('Propose match').click();

        await expect(common.alert).toContainText('has been added');

        const Proposal = overview.openProposalsArea.locator('[data-proposal]', { hasText: 'Bandana park' });

        // Another team accepting the proposal
        await login.loginAsPlayer4();
        await page.goto('/season/2021/spring/men-40-dbls-team');
        await Proposal.locator('button').getByText('Accept').click();
        await common.modal.locator('button').getByText('Accept').click();
        await expect(common.alert).toContainText('has been accepted');
        await expect(Proposal).toBeHidden();
        await overview.checkTeamLink(overview.upcomingMatchesArea.locator('[data-match]'), 'Game-Set-Match', [
            'Matthew Burt',
            'Cristopher Hamiltonbeach',
        ]);

        await login.loginAsPlayer2();
        await page.goto('/season/2021/spring/men-40-dbls-team');
        await overview.upcomingMatchesArea.locator('[data-match-actions]').click();
        await page.locator('button').getByText('Delete proposal').click();
        await expect(common.modal).toContainText('Game-Set-Match');
        await match.reasonField.fill('I am sick');
        await common.modal.locator('button').getByText('Delete proposal').click();
        await expect(common.alert).toContainText('has been deleted');

        const emailDeletedProposal = await expectRecordToExist('emails', {
            recipientEmail: 'player1@gmail.com,player3@gmail.com,player4@gmail.com',
        });
        expect(emailDeletedProposal.subject).toContain('Servebots (Gary M. / Ben D.) deleted the proposal for');
        expect(emailDeletedProposal.subject).toContain('5:00 PM');
        expect(emailDeletedProposal.replyTo).toContain('Gary Mill');
        expect(emailDeletedProposal.replyTo).toContain('player2@gmail.com');
        expect(emailDeletedProposal.html).toContain('Gary M.</a> /');
        expect(emailDeletedProposal.html).toContain('Ben D.</a>');
        expect(emailDeletedProposal.html).toContain('Reason:</b> I am sick');
        expect(emailDeletedProposal.html).toContain('deleted the proposal for a match in Men Team Doubles');
        expect(emailDeletedProposal.html).toContain('Gary Mill');
        expect(emailDeletedProposal.html).toContain('player2@gmail.com');
        expect(emailDeletedProposal.html).toContain('760-727-3334');
    });

    test('Teammate of 2 can accept proposal and unaccept it', async ({ page, common, login, overview }) => {
        await runQuery('INSERT INTO players SET userId=8, tournamentId=11, partnerId=999999');

        await login.loginAsPlayer4();
        await page.goto('/season/2021/spring/men-40-dbls-team');

        const Proposal = overview.openProposalsArea.locator('[data-proposal="53"]');
        await Proposal.locator('button').getByText('Accept').click();
        await common.modal.locator('button').getByText('Accept').click();
        await expect(common.alert).toContainText('has been accepted');
        await expect(Proposal).toBeHidden();

        const Match = overview.upcomingMatchesArea.locator('[data-match="53"]');
        await expect(Match).toContainText('Servebots1');
        await expect(Match).toContainText('Game-Set-Match1');
        await overview.checkTeamLink(Match, 'Game-Set-Match', ['Matthew Burt', 'Cristopher Hamiltonbeach']);

        const emailSent = await expectRecordToExist('emails', {
            recipientEmail: 'player1@gmail.com,player2@gmail.com,player3@gmail.com',
        });
        expect(emailSent.subject).toContain(
            'Game-Set-Match (Matthew B. / Cristopher H.) accepted the match proposal for'
        );
        expect(emailSent.replyTo).toContain('Matthew Burt');
        expect(emailSent.replyTo).toContain('player4@gmail.com');
        expect(emailSent.html).toContain('Matthew B.</a> /');
        expect(emailSent.html).toContain('Cristopher H.</a>');
        expect(emailSent.html).toContain('accepted the proposal for a match in Men Team Doubles.');
        expect(emailSent.html).toContain('Matthew Burt');
        expect(emailSent.html).toContain('player4@gmail.com');
        expect(emailSent.html).toContain('920-391-9530');
        expect(emailSent.html).toContain('Lake Lynn');

        await runQuery('DELETE FROM emails');

        // Unaccept the proposal
        await overview.upcomingMatchesArea.locator('[data-match-actions="53"]').click();
        await expect(common.body).not.toContainText('Send email to everyone');
        await page.locator('button').getByText('Unaccept proposal').click();
        await page.locator('input[name="reason"]').fill('I am sick');
        await common.modal.locator('button').getByText('Unaccept proposal').click();
        await expect(common.alert).toContainText('has been unaccepted');

        // Check that the message has been sent
        const emailUnacceptProposal = await expectRecordToExist('emails', {
            recipientEmail: 'player1@gmail.com,player2@gmail.com,player3@gmail.com',
        });
        expect(emailUnacceptProposal.subject).toContain(
            'Game-Set-Match (Matthew B. / Cristopher H.) unaccepted the proposal for'
        );
        expect(emailUnacceptProposal.replyTo).toContain('Matthew Burt');
        expect(emailUnacceptProposal.replyTo).toContain('player4@gmail.com');
        expect(emailUnacceptProposal.html).toContain('Matthew B.</a> /');
        expect(emailUnacceptProposal.html).toContain('Cristopher H.</a>');
        expect(emailUnacceptProposal.html).toContain('unaccepted the proposal for a match in Men Team Doubles');
        expect(emailUnacceptProposal.html).toContain('Reason:</b> I am sick');
        expect(emailUnacceptProposal.html).toContain('Matthew Burt');
        expect(emailUnacceptProposal.html).toContain('player4@gmail.com');
        expect(emailUnacceptProposal.html).toContain('920-391-9530');
    });
}

// Proposals for Captain of 3
{
    test('Captain of 3 can add a proposal', async ({ page, common, login, overview, proposal }) => {
        await runQuery('INSERT INTO players SET userId=7, tournamentId=11, partnerId=23');

        await login.loginAsPlayer3();
        await page.goto('/season/2021/spring/men-40-dbls-team');

        await overview.proposeMatchButton.click();
        await common.modal.locator('button').getByText('Inactive User').click();
        await proposal.pickSundayNextWeek();
        await proposal.placeField.fill('Bandana park');
        await common.modal.locator('button').getByText('Propose match').click();
        await expect(common.alert).toContainText('has been added');

        const Proposal = overview.openProposalsArea.locator('[data-proposal]', { hasText: 'Bandana park' });
        await overview.checkTeamLink(Proposal, 'Game-Set-Match', ['Cristopher Hamiltonbeach', 'Inactive User']);
        await expect(Proposal).toContainText('5:00 PM');
        await expect(Proposal).toContainText('Delete');
        await expect(Proposal).not.toContainText('Accept');

        const emailSent = await expectRecordToExist('emails', {
            recipientEmail: 'player1@gmail.com,player2@gmail.com',
        });
        expect(emailSent.subject).toContain('Game-Set-Match (Cristopher H. / Inactive U.) proposed a new match');
        expect(emailSent.subject).toContain('5:00 PM');
        expect(emailSent.replyTo).toContain('Cristopher Hamiltonbeach');
        expect(emailSent.replyTo).toContain('player3@gmail.com');
        expect(emailSent.html).toContain('Game-Set-Match');
        expect(emailSent.html).toContain('Cristopher H.</a> / ');
        expect(emailSent.html).toContain('Inactive U.</a>');
        expect(emailSent.html).toContain('proposed a new match');
        expect(emailSent.html).toContain('Raleigh, Men Team Doubles, Bandana park');
        expect(emailSent.html).toContain('5:00 PM');

        // Delete the proposal
        await Proposal.locator('button').getByText('Delete').click();
        await expect(common.modal).toContainText('Game-Set-Match');
        await common.modal.locator('button').getByText('Delete').click();
        await expect(common.modal).toBeHidden();
        await expect(Proposal).toBeHidden();

        const emailDeletedProposal = await expectRecordToExist('emails', {
            recipientEmail: 'player5@gmail.com',
        });
        expect(emailDeletedProposal.subject).toContain(
            'Game-Set-Match (Cristopher H. / Inactive U.) deleted the proposal for'
        );
        expect(emailDeletedProposal.subject).toContain('5:00 PM');
        expect(emailDeletedProposal.replyTo).toContain('Cristopher Hamiltonbeach');
        expect(emailDeletedProposal.replyTo).toContain('player3@gmail.com');
        expect(emailDeletedProposal.html).toContain('Game-Set-Match');
        expect(emailDeletedProposal.html).toContain('Cristopher H.</a> / ');
        expect(emailDeletedProposal.html).toContain('Inactive U.</a>');
        expect(emailDeletedProposal.html).toContain('deleted the proposal for a match in Men Team Doubles');
        expect(emailDeletedProposal.html).not.toContain('Reason');
        expect(emailDeletedProposal.html).not.toContain('undefined');
    });

    test('Captain of 3 can add a proposal, wait for accept, and then delete it', async ({
        page,
        common,
        login,
        overview,
        proposal,
        match,
    }) => {
        await runQuery('INSERT INTO players SET userId=7, tournamentId=11, partnerId=23');

        await login.loginAsPlayer3();
        await page.goto('/season/2021/spring/men-40-dbls-team');

        await overview.proposeMatchButton.click();
        await common.modal.locator('button').getByText('Matthew Burt').click();
        await proposal.pickSundayNextWeek();
        await proposal.placeField.fill('Bandana park');
        await common.modal.locator('button').getByText('Propose match').click();
        await expect(common.alert).toContainText('has been added');

        const Proposal = overview.openProposalsArea.locator('[data-proposal]', { hasText: 'Bandana park' });

        // Another team accepting the proposal
        await login.loginAsPlayer1();
        await page.goto('/season/2021/spring/men-40-dbls-team');
        await Proposal.locator('button').getByText('Accept').click();
        await common.modal.locator('button').getByText('Accept').click();
        await expect(common.alert).toContainText('has been accepted');
        await expect(Proposal).toBeHidden();

        await runQuery('DELETE FROM emails');

        // Delete the proposal
        await login.loginAsPlayer3();
        await page.goto('/season/2021/spring/men-40-dbls-team');
        await overview.checkTeamLink(overview.upcomingMatchesArea, 'Game-Set-Match', [
            'Cristopher Hamiltonbeach',
            'Matthew Burt',
        ]);
        await overview.checkTeamLink(overview.upcomingMatchesArea, 'Servebots', ['Ben Done', 'Gary Mill']);
        await overview.upcomingMatchesArea.locator('[data-match-actions]').click();
        await page.locator('button').getByText('Delete proposal').click();
        await expect(common.modal).toContainText('Servebots');
        await match.reasonField.fill('I am sick');
        await common.modal.locator('button').getByText('Delete proposal').click();
        await expect(common.alert).toContainText('has been deleted');

        const emailDeletedProposal = await expectRecordToExist('emails', {
            recipientEmail: 'player1@gmail.com,player2@gmail.com,player4@gmail.com',
        });
        expect(emailDeletedProposal.subject).toContain(
            'Game-Set-Match (Cristopher H. / Matthew B.) deleted the proposal for'
        );
        expect(emailDeletedProposal.subject).toContain('5:00 PM');
        expect(emailDeletedProposal.replyTo).toContain('Cristopher Hamiltonbeach');
        expect(emailDeletedProposal.replyTo).toContain('player3@gmail.com');
        expect(emailDeletedProposal.html).toContain('Game-Set-Match');
        expect(emailDeletedProposal.html).toContain('Cristopher H.</a> / ');
        expect(emailDeletedProposal.html).toContain('Matthew B.</a>');
        expect(emailDeletedProposal.html).toContain('Reason:</b> I am sick');
        expect(emailDeletedProposal.html).toContain('deleted the proposal for a match in Men Team Doubles');
        expect(emailDeletedProposal.html).toContain('Cristopher Hamiltonbeach');
        expect(emailDeletedProposal.html).toContain('player3@gmail.com');
        expect(emailDeletedProposal.html).toContain('206-227-1435');
    });

    test('Captain of 3 can accept a proposal and pick players to play', async ({ page, common, login, overview }) => {
        await runQuery('INSERT INTO players SET userId=7, tournamentId=11, partnerId=23');
        await runQuery('INSERT INTO players SET userId=8, tournamentId=11, partnerId=999999');

        await login.loginAsPlayer3();
        await page.goto('/season/2021/spring/men-40-dbls-team');

        const Proposal = page.locator('[data-proposal="53"]');
        await Proposal.locator('button').getByText('Accept').click();
        await common.modal.locator('button').getByText('Accept').click();
        await expect(common.modal).toContainText('Pick who is going to play with you');

        await common.modal.locator('button').getByText('Inactive User').click();
        await common.modal.locator('button').getByText('Accept').click();

        await expect(common.alert).toContainText('has been accepted');
        await expect(Proposal).toBeHidden();

        const Match = overview.upcomingMatchesArea.locator('[data-match="53"]');
        await overview.checkTeamLink(Match, 'Game-Set-Match', ['Cristopher', 'Inactive']);
        await expect(Match).toContainText('Score');
        await expect(Match).not.toContainText('Accept');

        const emailSent = await expectRecordToExist('emails', {
            recipientEmail: 'player1@gmail.com,player2@gmail.com,player5@gmail.com',
        });
        expect(emailSent.subject).toContain(
            'Game-Set-Match (Cristopher H. / Inactive U.) accepted the match proposal for'
        );
        expect(emailSent.replyTo).toContain('Cristopher Hamiltonbeach');
        expect(emailSent.replyTo).toContain('player3@gmail.com');
        expect(emailSent.html).toContain('Game-Set-Match');
        expect(emailSent.html).toContain('Cristopher H.</a> / ');
        expect(emailSent.html).toContain('Inactive U.</a>');
        expect(emailSent.html).toContain('accepted the proposal for a match in Men Team Doubles.');
        expect(emailSent.html).toContain('Cristopher Hamiltonbeach');
        expect(emailSent.html).toContain('player3@gmail.com');
        expect(emailSent.html).toContain('206-227-1435');
        expect(emailSent.html).toContain('Lake Lynn');

        await runQuery('DELETE FROM emails');

        // Unaccept the proposal
        await overview.upcomingMatchesArea.locator('[data-match-actions="53"]').click();
        await expect(common.body).not.toContainText('Send email to everyone');
        await page.locator('button').getByText('Unaccept proposal').click();
        await page.locator('input[name="reason"]').fill('I am sick');
        await common.modal.locator('button').getByText('Unaccept proposal').click();
        await expect(common.alert).toContainText('has been unaccepted');

        // Check that the message has been sent
        const emailUnacceptProposal = await expectRecordToExist('emails', {
            recipientEmail: 'player1@gmail.com,player2@gmail.com,player5@gmail.com',
        });
        expect(emailUnacceptProposal.subject).toContain(
            'Game-Set-Match (Cristopher H. / Inactive U.) unaccepted the proposal for'
        );
        expect(emailUnacceptProposal.replyTo).toContain('Cristopher Hamiltonbeach');
        expect(emailUnacceptProposal.replyTo).toContain('player3@gmail.com');
        expect(emailUnacceptProposal.html).toContain('Game-Set-Match');
        expect(emailUnacceptProposal.html).toContain('Cristopher H.</a> / ');
        expect(emailUnacceptProposal.html).toContain('Inactive U.</a>');
        expect(emailUnacceptProposal.html).toContain('unaccepted the proposal for a match in Men Team Doubles');
        expect(emailUnacceptProposal.html).toContain('Reason:</b> I am sick');
        expect(emailUnacceptProposal.html).toContain('Cristopher Hamiltonbeach');
        expect(emailUnacceptProposal.html).toContain('player3@gmail.com');
        expect(emailUnacceptProposal.html).toContain('206-227-1435');
    });

    test('Acceptor Captain of 3 can accept a proposal and replace players later', async ({
        page,
        common,
        login,
        overview,
    }) => {
        await runQuery('INSERT INTO players SET userId=7, tournamentId=11, partnerId=23');

        await login.loginAsPlayer3();
        await page.goto('/season/2021/spring/men-40-dbls-team');

        const Proposal = page.locator('[data-proposal="53"]');
        const Match = overview.upcomingMatchesArea.locator('[data-match="53"]');
        const MatchActions = overview.upcomingMatchesArea.locator('[data-match-actions="53"]');

        await Proposal.locator('button').getByText('Accept').click();
        await common.modal.locator('button').getByText('Inactive User').click();
        await common.modal.locator('button').getByText('Accept').click();

        await expect(common.alert).toContainText('has been accepted');

        // Check not playing player cannot see actions
        await login.loginAsPlayer4();
        await page.goto('/season/2021/spring/men-40-dbls-team');
        await expect(Match).toBeVisible();
        await expect(MatchActions).toBeHidden();

        // Replace players
        await login.loginAsPlayer3();
        await page.goto('/season/2021/spring/men-40-dbls-team');
        await MatchActions.click();
        await page.locator('button').getByText('Replace players').click();
        await common.modal.locator('button').getByText('Matthew Burt').click();
        await common.modal.locator('button').getByText('Replace players').click();
        await expect(common.alert).toContainText('Players have been replaced');

        await expect(common.modal).toBeHidden();
        await overview.checkTeamLink(Match, 'Game-Set-Match', ['Cristopher', 'Matthew']);

        await expectRecordToExist(
            'matches',
            { id: 53 },
            {
                acceptorId: 23,
                acceptor2Id: 22,
            }
        );
    });

    test('Challenger Teammate of 3 can accept a proposal and replace players later', async ({
        page,
        common,
        login,
        overview,
    }) => {
        await runQuery('INSERT INTO players SET userId=7, tournamentId=11, partnerId=20');

        await login.loginAsPlayer3();
        await page.goto('/season/2021/spring/men-40-dbls-team');

        const Proposal = page.locator('[data-proposal="53"]');
        const Match = overview.upcomingMatchesArea.locator('[data-match="53"]');
        const MatchActions = overview.upcomingMatchesArea.locator('[data-match-actions="53"]');

        await Proposal.locator('button').getByText('Accept').click();
        await common.modal.locator('button').getByText('Accept').click();
        await expect(common.alert).toContainText('has been accepted');
        await MatchActions.click();
        await expect(common.body).not.toContainText('Replace');

        await login.loginAsPlayer1();
        await page.goto('/season/2021/spring/men-40-dbls-team');

        // Replace players
        await MatchActions.click();
        await expect(common.body).not.toContainText('Send email to everyone');
        await page.locator('button').getByText('Replace players').click();
        await common.modal.locator('button').getByText('Inactive User').click();
        await common.modal.locator('button').getByText('Replace players').click();
        await expect(common.alert).toContainText('Players have been replaced');

        await expect(common.modal).toBeHidden();
        await overview.checkTeamLink(Match, 'Servebots', ['Ben', 'Inactive']);

        await expectRecordToExist(
            'matches',
            { id: 53 },
            {
                challengerId: 20,
                challenger2Id: 24,
            }
        );
    });
}

// Proposals for Teammate of 3 for other teammates
{
    test('Teammate of three can add proposal and pick teammate to play', async ({
        page,
        common,
        login,
        overview,
        proposal,
    }) => {
        await runQuery('INSERT INTO players SET userId=7, tournamentId=11, partnerId=23');
        await runQuery('INSERT INTO players SET userId=8, tournamentId=11, partnerId=999999');

        await login.loginAsPlayer4();
        await page.goto('/season/2021/spring/men-40-dbls-team');

        await overview.proposeMatchButton.click();
        await expect(common.modal).not.toContainText('Matthew Burt');
        await common.modalSubmitButton.click();
        await expect(common.modal).toContainText('Pick who is going to play with you');

        await common.modal.locator('button').getByText('Inactive User').click();

        await proposal.pickSundayNextWeek();
        await proposal.placeField.fill('Bandana park');
        await common.modal.locator('button').getByText('Propose match').click();

        await expect(common.alert).toContainText('has been added');

        const Proposal = page.locator('[data-open-proposals]').locator('[data-proposal]', { hasText: 'Bandana park' });
        await expect(Proposal).toContainText('5:00 PM');
        await expect(Proposal).toContainText('Delete');
        await expect(Proposal).not.toContainText('Accept');
        await overview.checkTeamLink(Proposal, 'Game-Set-Match', ['Matthew', 'Inactive']);

        const emailSent = await expectRecordToExist('emails', {
            recipientEmail: 'player1@gmail.com,player2@gmail.com',
        });
        expect(emailSent.subject).toContain('Game-Set-Match (Matthew B. / Inactive U.) proposed a new match');
        expect(emailSent.subject).toContain('5:00 PM');
        expect(emailSent.replyTo).toContain('Matthew Burt');
        expect(emailSent.replyTo).toContain('player4@gmail.com');
        expect(emailSent.html).toContain('Game-Set-Match');
        expect(emailSent.html).toContain('Matthew B.</a> /');
        expect(emailSent.html).toContain('Inactive U.</a>');
        expect(emailSent.html).toContain('proposed a new match');
        expect(emailSent.html).toContain('Raleigh, Men Team Doubles, Bandana park');
        expect(emailSent.html).toContain('5:00 PM');

        // Delete the proposal
        await Proposal.locator('button').getByText('Delete').click();
        await expect(common.modal).toContainText('Game-Set-Match');
        await common.modal.locator('button').getByText('Delete').click();
        await expect(common.modal).toBeHidden();
        await expect(Proposal).toBeHidden();

        const emailDeletedProposal = await expectRecordToExist('emails', {
            recipientEmail: 'player5@gmail.com',
        });
        expect(emailDeletedProposal.subject).toContain(
            'Game-Set-Match (Matthew B. / Inactive U.) deleted the proposal for'
        );
        expect(emailDeletedProposal.subject).toContain('5:00 PM');
        expect(emailDeletedProposal.replyTo).toContain('Matthew Burt');
        expect(emailDeletedProposal.replyTo).toContain('player4@gmail.com');
        expect(emailDeletedProposal.html).toContain('Matthew B.</a> /');
        expect(emailDeletedProposal.html).toContain('Inactive U.</a>');
        expect(emailDeletedProposal.html).toContain('deleted the proposal for a match in Men Team Doubles');
        expect(emailDeletedProposal.html).not.toContain('Reason');
        expect(emailDeletedProposal.html).not.toContain('undefined');
    });

    test('Teammate of three can add proposal, wait for it accepted and then delete it', async ({
        page,
        common,
        login,
        overview,
        proposal,
        match,
    }) => {
        await runQuery('INSERT INTO players SET userId=7, tournamentId=11, partnerId=23');
        await runQuery('INSERT INTO players SET userId=8, tournamentId=11, partnerId=999999');

        await login.loginAsPlayer4();
        await page.goto('/season/2021/spring/men-40-dbls-team');

        await overview.proposeMatchButton.click();
        await common.modal.locator('button').getByText('Cristopher Hamiltonbeach').click();

        await proposal.pickSundayNextWeek();
        await proposal.placeField.fill('Bandana park');
        await common.modal.locator('button').getByText('Propose match').click();
        await expect(common.alert).toContainText('has been added');

        const Proposal = page.locator('[data-open-proposals]').locator('[data-proposal]', { hasText: 'Bandana park' });

        // Accept proposal
        await login.loginAsPlayer2();
        await page.goto('/season/2021/spring/men-40-dbls-team');
        await Proposal.locator('button').getByText('Accept').click();
        await common.modal.locator('button').getByText('Accept').click();
        await expect(common.alert).toContainText('has been accepted');
        await expect(Proposal).toBeHidden();

        await runQuery('DELETE FROM emails');

        // Delete the proposal
        await login.loginAsPlayer4();
        await page.goto('/season/2021/spring/men-40-dbls-team');
        await expect(overview.upcomingMatchesArea).toContainText('Game-Set-Match1');
        await expect(overview.upcomingMatchesArea).toContainText('Servebots1');
        await overview.upcomingMatchesArea.locator('[data-match-actions]').click();
        await page.locator('button').getByText('Delete proposal').click();
        await expect(common.modal).toContainText('Servebots already accepted your proposal');
        await match.reasonField.fill('I am sick');
        await common.modal.locator('button').getByText('Delete proposal').click();
        await expect(common.alert).toContainText('has been deleted');

        const emailDeletedProposal = await expectRecordToExist('emails', {
            recipientEmail: 'player1@gmail.com,player2@gmail.com,player3@gmail.com',
        });
        expect(emailDeletedProposal.subject).toContain(
            'Game-Set-Match (Matthew B. / Cristopher H.) deleted the proposal for'
        );
        expect(emailDeletedProposal.subject).toContain('5:00 PM');
        expect(emailDeletedProposal.replyTo).toContain('Matthew Burt');
        expect(emailDeletedProposal.replyTo).toContain('player4@gmail.com');
        expect(emailDeletedProposal.html).toContain('Game-Set-Match');
        expect(emailDeletedProposal.html).toContain('Matthew B.</a> /');
        expect(emailDeletedProposal.html).toContain('Cristopher H.</a>');
        expect(emailDeletedProposal.html).toContain('Reason:</b> I am sick');
        expect(emailDeletedProposal.html).toContain('deleted the proposal for a match in Men Team Doubles');
        expect(emailDeletedProposal.html).toContain('Matthew Burt');
        expect(emailDeletedProposal.html).toContain('player4@gmail.com');
        expect(emailDeletedProposal.html).toContain('920-391-9530');
    });

    test('Teammate of three can accept proposal and pick teammates to play', async ({
        page,
        common,
        login,
        doublesTeam,
        overview,
    }) => {
        await runQuery('INSERT INTO players SET userId=7, tournamentId=11, partnerId=23');
        await runQuery('INSERT INTO players SET userId=8, tournamentId=11, partnerId=999999');

        await login.loginAsPlayer4();
        await page.goto('/season/2021/spring/men-40-dbls-team');

        const Proposal = page.locator('[data-proposal="53"]');
        await Proposal.locator('button').getByText('Accept').click();
        await common.modal.locator('button').getByText('Accept').click();
        await expect(common.modal).toContainText('Pick a teammate');
        await expect(common.modal).toContainText(doublesTeam.contactInfo);

        await common.modal.locator('button').getByText('Inactive User').click();
        await common.modal.locator('button').getByText('Accept').click();

        await expect(common.alert).toContainText('has been accepted');
        await expect(Proposal).toBeHidden();

        const Match = overview.upcomingMatchesArea.locator('[data-match="53"]');
        await expect(Match).toContainText('Game-Set-Match1');
        await expect(Match).toContainText('Score');
        await expect(Match).not.toContainText('Accept');

        const emailSent = await expectRecordToExist('emails', {
            recipientEmail: 'player1@gmail.com,player2@gmail.com,player5@gmail.com',
        });
        expect(emailSent.subject).toContain(
            'Game-Set-Match (Matthew B. / Inactive U.) accepted the match proposal for'
        );
        expect(emailSent.replyTo).toContain('Matthew Burt');
        expect(emailSent.replyTo).toContain('player4@gmail.com');
        expect(emailSent.html).toContain('Game-Set-Match');
        expect(emailSent.html).toContain('Matthew B.</a> /');
        expect(emailSent.html).toContain('Inactive U.</a>');
        expect(emailSent.html).toContain('accepted the proposal for a match in Men Team Doubles.');
        expect(emailSent.html).toContain('Matthew Burt');
        expect(emailSent.html).toContain('player4@gmail.com');
        expect(emailSent.html).toContain('920-391-9530');
        expect(emailSent.html).toContain('Lake Lynn');

        await runQuery('DELETE FROM emails');

        // Unaccept the proposal
        await overview.upcomingMatchesArea.locator('[data-match-actions="53"]').click();
        await expect(common.body).not.toContainText('Send email to everyone');
        await page.locator('button').getByText('Unaccept proposal').click();
        await page.locator('input[name="reason"]').fill('I am sick');
        await common.modal.locator('button').getByText('Unaccept proposal').click();
        await expect(common.alert).toContainText('has been unaccepted');

        // Check that the message has been sent
        const emailUnacceptProposal = await expectRecordToExist('emails', {
            recipientEmail: 'player1@gmail.com,player2@gmail.com,player5@gmail.com',
        });
        expect(emailUnacceptProposal.subject).toContain(
            'Game-Set-Match (Matthew B. / Inactive U.) unaccepted the proposal for'
        );
        expect(emailUnacceptProposal.replyTo).toContain('Matthew Burt');
        expect(emailUnacceptProposal.replyTo).toContain('player4@gmail.com');
        expect(emailUnacceptProposal.html).toContain('Game-Set-Match');
        expect(emailUnacceptProposal.html).toContain('Matthew B.</a> /');
        expect(emailUnacceptProposal.html).toContain('Inactive U.</a>');
        expect(emailUnacceptProposal.html).toContain('unaccepted the proposal for a match in Men Team Doubles');
        expect(emailUnacceptProposal.html).toContain('Reason:</b> I am sick');
        expect(emailUnacceptProposal.html).toContain('Matthew Burt');
        expect(emailUnacceptProposal.html).toContain('player4@gmail.com');
        expect(emailUnacceptProposal.html).toContain('920-391-9530');
    });
}

{
    test('Captain of 2 can schedule a match with another 2-member team', async ({
        page,
        common,
        login,
        overview,
        proposal,
        match,
    }) => {
        await login.loginAsPlayer1();
        await page.goto('/season/2021/spring/men-40-dbls-team');

        await overview.clickOtherAction('Schedule match');
        await expect(common.modal).toContainText('Schedule a match both teams have already');
        await expect(match.challengerSelect).not.toContainText('Inactive User');

        await match.pickChallengerOption('Game-Set-Match');
        await expect(match.acceptorSelect).toHaveValue('20');
        await match.nextButton.click();

        await proposal.pickSundayNextWeek();
        await proposal.placeField.fill('Preston park');
        await common.modalSubmitButton.click();

        await expect(common.alert).toContainText('Your match has been scheduled.');
        await expectRecordToExist('matches', { place: 'Preston park' }, { comment: null });

        await expect(overview.upcomingMatchesArea).toContainText('Game-Set-Match1');
        await expect(overview.upcomingMatchesArea).toContainText('Servebots1');
        await expect(overview.upcomingMatchesArea).toContainText('Sun');

        // Check email
        {
            const email = await expectRecordToExist('emails', { subject: 'Your Match Is Scheduled' });
            expect(email.html).toContain('Game-Set-Match');
            expect(email.html).toContain('Cristopher H.</a> / ');
            expect(email.html).toContain('Matthew B.</a>');
            expect(email.html).toContain('Servebots');
            expect(email.html).toContain('Ben D.</a> / ');
            expect(email.html).toContain('Gary M.</a>');
            expect(email.html).toContain('Preston park');
            expect(email.recipientEmail).toBe('player2@gmail.com,player3@gmail.com,player4@gmail.com');
        }

        // Reschedule the match
        await overview.upcomingMatchesArea.locator('[data-match-actions]').click();
        await expect(overview.matchActionsArea).toContainText('Preston park');
        await expect(overview.matchActionsArea).not.toContainText('Proposal');
        await expect(overview.matchActionsArea).not.toContainText('Delete proposal');

        await overview.matchActionsArea.locator('button').getByText('Reschedule').click();
        await expect(common.modal).toContainText(match.REGULAR_RESCHEDULE_TEXT);
        await expect(common.modal).not.toContainText(match.FINAL_SCHEDULE_TEXT);

        await expect(proposal.placeField).toHaveValue('Preston park');
        await proposal.placeField.fill('Lions park');
        await common.modal.locator('button').getByText('Reschedule match').click();
        await expect(common.alert).toContainText('The match was successfuly rescheduled.');

        // Check another email
        {
            const email = await expectRecordToExist('emails', { subject: 'Your Match Was Rescheduled' });
            expect(email.html).toContain('scheduled a match');
            expect(email.html).toContain('Game-Set-Match');
            expect(email.html).toContain('Cristopher H.</a> / ');
            expect(email.html).toContain('Matthew B.</a>');
            expect(email.html).toContain('Servebots');
            expect(email.html).toContain('Ben D.</a> / ');
            expect(email.html).toContain('Gary M.</a>');
            expect(email.html).toContain('Lions park');
            expect(email.recipientEmail).toBe('player2@gmail.com,player3@gmail.com,player4@gmail.com');
        }

        // Check if it's rescheduled
        await overview.upcomingMatchesArea.locator('button[data-match-actions]').click();
        await expect(overview.matchActionsArea).toContainText('Lions park');

        // Delete the match
        await overview.matchActionsArea.locator('button').getByText('Delete match').click();
        await page.locator('input[name="reason"]').fill('I am sick');
        await common.modal.locator('button').getByText('Delete match').click();
        await expect(common.alert).toContainText('The match has been deleted');
        await expect(overview.upcomingMatchesArea).toBeHidden();

        // Check delete email
        {
            const email = await expectRecordToExist('emails', {
                subject: 'Ben Done Deleted Your Scheduled Match',
            });
            expect(email.html).toContain('deleted your scheduled match');
            expect(email.html).toContain('Ben Done</a>');
            expect(email.html).toContain('player1@gmail.com</a>');
            expect(email.html).toContain('123-456-7890</a>');
            expect(email.html).toContain('I am sick.');
            expect(email.recipientEmail).toBe('player2@gmail.com,player3@gmail.com,player4@gmail.com');
        }
    });

    test('Teammate of three can schedule a match with another team', async ({
        page,
        common,
        login,
        overview,
        proposal,
        match,
    }) => {
        await runQuery('INSERT INTO players SET userId=7, tournamentId=11, partnerId=23');
        await runQuery('INSERT INTO players SET userId=8, tournamentId=11, partnerId=999999');

        await login.loginAsPlayer4();
        await page.goto('/season/2021/spring/men-40-dbls-team');

        await overview.clickOtherAction('Schedule match');
        await match.pickAcceptorOption('Servebots');
        await match.nextButton.click();

        await common.modal.locator('button').getByText('Cristopher Hamiltonbeach').click();
        await common.modal.locator('button').getByText('Matthew Burt').click();
        await match.nextButton.click();

        await proposal.pickSundayNextWeek();
        await proposal.placeField.fill('Preston park');
        await common.modalSubmitButton.click();

        await expect(common.alert).toContainText('Your match has been scheduled.');
        await expectRecordToExist('matches', { place: 'Preston park' }, { comment: null });

        await expect(overview.upcomingMatchesArea).toContainText('Game-Set-Match1');
        await expect(overview.upcomingMatchesArea).toContainText('Servebots1');
        await expect(overview.upcomingMatchesArea).toContainText('Sun');

        // Check email
        {
            const email = await expectRecordToExist('emails', { subject: 'Your Match Is Scheduled' });
            expect(email.html).toContain('Game-Set-Match');
            expect(email.html).toContain('Cristopher H.</a> / ');
            expect(email.html).toContain('Matthew B.</a>');
            expect(email.html).toContain('Servebots');
            expect(email.html).toContain('Ben D.</a> / ');
            expect(email.html).toContain('Gary M.</a>');
            expect(email.html).toContain('Preston park');
            expect(email.recipientEmail).toBe('player1@gmail.com,player2@gmail.com,player3@gmail.com');
        }
    });

    test('Team should be preselected when scheduling a match by a teammate', async ({
        page,
        login,
        overview,
        match,
    }) => {
        await login.loginAsPlayer2();
        await page.goto('/season/2021/spring/men-40-dbls-team');

        await overview.clickOtherAction('Schedule match');

        await match.pickChallengerOption('Game-Set-Match');
        await expect(match.acceptorSelect).toHaveValue('20');
    });

    test('Captain of 3 can schedule a match with another 3-member team', async ({
        page,
        common,
        login,
        overview,
        proposal,
        match,
    }) => {
        await runQuery(`INSERT INTO players SET userId=7, tournamentId=11, partnerId=20`);
        await runQuery(`INSERT INTO players SET userId=8, tournamentId=11, partnerId=23`);

        await login.loginAsPlayer1();
        await page.goto('/season/2021/spring/men-40-dbls-team');

        await overview.clickOtherAction('Schedule match');
        await expect(common.modal).toContainText('Schedule a match both teams have already');
        await expect(match.challengerSelect).not.toContainText('Inactive User');

        await match.pickChallengerOption('Game-Set-Match');
        await match.nextButton.click();

        await expect(common.modal).toContainText('Pick two players who will play the match');
        await page.locator('button').getByText('Cristopher Hamiltonbeach').click();
        await page.locator('button').getByText('Not Played User').click();
        await page.locator('button').getByText('Ben Done').click();
        await page.locator('button').getByText('Inactive User').click();
        await match.nextButton.click();

        await proposal.pickSundayNextWeek();
        await proposal.placeField.fill('Preston park');
        await common.modalSubmitButton.click();

        await expect(common.alert).toContainText('Your match has been scheduled.');
        await expectRecordToExist('matches', { place: 'Preston park' }, { comment: null });

        await overview.checkTeamLink(overview.upcomingMatchesArea, 'Game-Set-Match', ['Cristopher', 'Not Played']);
        await overview.checkTeamLink(overview.upcomingMatchesArea, 'Servebots', ['Ben Done', 'Inactive User']);
        await expect(overview.upcomingMatchesArea).toContainText('Sun');

        // Check email
        {
            const email = await expectRecordToExist('emails', { subject: 'Your Match Is Scheduled' });
            expect(email.html).toContain('Game-Set-Match');
            expect(email.html).toContain('Cristopher H.</a> / ');
            expect(email.html).toContain('Not Played U.</a>');
            expect(email.html).toContain('Servebots');
            expect(email.html).toContain('Ben D.</a> / ');
            expect(email.html).toContain('Inactive U.</a>');
            expect(email.html).toContain('Preston park');
            expect(email.recipientEmail).toBe('player3@gmail.com,player5@gmail.com,player8@gmail.com');
        }

        // Reschedule the match
        await overview.upcomingMatchesArea.locator('[data-match-actions]').click();
        await expect(overview.matchActionsArea).toContainText('Preston park');
        await expect(overview.matchActionsArea).not.toContainText('Proposal');
        await expect(overview.matchActionsArea).not.toContainText('Delete proposal');

        await overview.matchActionsArea.locator('button').getByText('Reschedule').click();
        await expect(common.modal).toContainText(match.REGULAR_RESCHEDULE_TEXT);
        await expect(common.modal).not.toContainText(match.FINAL_SCHEDULE_TEXT);

        await expect(proposal.placeField).toHaveValue('Preston park');
        await proposal.placeField.fill('Lions park');
        await common.modal.locator('button').getByText('Reschedule match').click();
        await expect(common.alert).toContainText('The match was successfuly rescheduled.');

        // Check another email
        {
            const email = await expectRecordToExist('emails', { subject: 'Your Match Was Rescheduled' });
            expect(email.html).toContain('scheduled a match');
            expect(email.html).toContain('Game-Set-Match');
            expect(email.html).toContain('Cristopher H.</a> / ');
            expect(email.html).toContain('Not Played U.</a>');
            expect(email.html).toContain('Servebots');
            expect(email.html).toContain('Ben D.</a> / ');
            expect(email.html).toContain('Inactive U.</a>');
            expect(email.html).toContain('Lions park');
            expect(email.recipientEmail).toBe('player3@gmail.com,player5@gmail.com,player8@gmail.com');
        }

        // Check if it's rescheduled
        await overview.upcomingMatchesArea.locator('button[data-match-actions]').click();
        await expect(overview.matchActionsArea).toContainText('Lions park');

        // Delete the match
        await overview.matchActionsArea.locator('button').getByText('Delete match').click();
        await page.locator('input[name="reason"]').fill('I am sick');
        await common.modal.locator('button').getByText('Delete match').click();
        await expect(common.alert).toContainText('The match has been deleted');
        await expect(overview.upcomingMatchesArea).toBeHidden();

        // Check delete email
        {
            const email = await expectRecordToExist('emails', {
                subject: 'Ben Done Deleted Your Scheduled Match',
            });
            expect(email.html).toContain('deleted your scheduled match');
            expect(email.html).toContain('Ben Done</a>');
            expect(email.html).toContain('player1@gmail.com</a>');
            expect(email.html).toContain('123-456-7890</a>');
            expect(email.html).toContain('I am sick.');
            expect(email.recipientEmail).toBe('player3@gmail.com,player5@gmail.com,player8@gmail.com');
        }
    });

    test('Another captain can accept a proposal and report the score', async ({
        page,
        common,
        login,
        overview,
        match,
    }) => {
        await runQuery('UPDATE users SET subscribeForProposals=1');

        await login.loginAsPlayer3();
        await page.goto('/season/2021/spring/men-40-dbls-team');

        const Proposal = page.locator('[data-proposal="53"]');
        await Proposal.locator('button').getByText('Accept').click();
        await common.modal.locator('button').getByText('Accept').click();
        await expect(common.alert).toContainText('has been accepted');

        await expect(Proposal).toBeHidden();
        await expect(overview.upcomingMatchesArea).toContainText('Servebots1');
        await expect(overview.upcomingMatchesArea).toContainText('Game-Set-Match1');
        await expect(overview.upcomingMatchesArea).not.toContainText('TLR');

        const emailSent = await expectRecordToExist('emails', {
            recipientEmail: 'player1@gmail.com,player2@gmail.com,player4@gmail.com',
        });
        expect(emailSent.subject).toContain(
            'Game-Set-Match (Cristopher H. / Matthew B.) accepted the match proposal for'
        );
        expect(emailSent.replyTo).toContain('Cristopher Hamiltonbeach');
        expect(emailSent.replyTo).toContain('player3@gmail.com');
        expect(emailSent.html).toContain(' accepted the proposal');
        expect(emailSent.html).toContain('/player/cristopher-hamiltonbeach">Cristopher H.</a>');
        expect(emailSent.html).toContain('/player/matthew-burt">Matthew B.</a>');
        expect(emailSent.html).toContain('Cristopher Hamiltonbeach</a>');
        expect(emailSent.html).toContain('player3@gmail.com');
        expect(emailSent.html).toContain('206-227-1435');

        await overview.upcomingMatchesArea.locator('a').getByText('Score').click();

        await match.pickChallengerPoints(3);
        await new Promise((resolve) => setTimeout(resolve, 1000));

        await match.pickChallengerPoints(2);
        await new Promise((resolve) => setTimeout(resolve, 1000));

        await expect(common.modal).toContainText('+9');
        await expect(common.modal).toContainText('+24');
        await common.modalSubmitButton.click();
        await expect(common.modal).toBeHidden();

        await expect(common.body).toContainText('+9');
        await expect(common.body).toContainText('+24');

        await expectRecordToExist(
            'matches',
            { id: 53 },
            { challengerId: 21, challenger2Id: 20, acceptorId: 23, acceptor2Id: 22 }
        );

        const emailResultSent = await expectRecordToExist('emails', { subject: 'You Have New Match Results!' });
        expect(emailResultSent.recipientEmail).toContain('player1@gmail.com,player2@gmail.com,player4@gmail.com');
        expect(emailResultSent.html).toContain('Cristopher Hamiltonbeach</b> reported the results of your match on');
        expect(emailResultSent.html).toContain('Men Team Doubles');
        expect(emailResultSent.html).toContain('/season/2021/spring/men-40-dbls-team');
    });

    test('Captain of 3 can report the score and pick played teammates', async ({
        page,
        common,
        login,
        overview,
        match,
    }) => {
        await runQuery(
            'UPDATE matches SET challenger2Id=NULL, acceptorId=23, acceptedAt="2021-05-03 17:50:47" WHERE id=53'
        );
        const { insertId: playerId } = await runQuery(
            'INSERT INTO players SET userId=7, tournamentId=11, partnerId=23'
        );

        await login.loginAsPlayer3();
        await page.goto('/season/2021/spring/men-40-dbls-team');

        await overview.upcomingMatchesArea.locator('a').getByText('Score').click();
        await expect(common.modal).toContainText('Game-Set-Match:');
        await common.modal.locator('button').getByText('Matthew Burt').click();
        await common.modal.locator('button').getByText('Inactive User').click();
        await common.modal.locator('button').getByText('Next').click();

        await expect(common.modal).toContainText('Servebots');
        await expect(common.modal).toContainText('Game-Set-Match');

        await match.pickChallengerPoints(3);
        await new Promise((resolve) => setTimeout(resolve, 1000));

        await match.pickChallengerPoints(2);

        await expect(common.modal).toContainText('+9');
        await expect(common.modal).toContainText('+24');
        await common.modalSubmitButton.click();
        await expect(common.modal).toBeHidden();

        await expect(common.body).toContainText('+9');
        await expect(common.body).toContainText('+24');
        await expect(overview.todayMatchesArea).toContainText('Game-Set-Match');
        await expect(overview.playerList).toContainText('1 - 01 - 0');
        await expect(overview.playerList).toContainText('0 - 10 - 1');
        await expect(overview.playerList).toContainText('2-1Servebots');

        await expectRecordToExist(
            'matches',
            { id: 53 },
            { challengerId: 20, challenger2Id: 21, acceptorId: 22, acceptor2Id: playerId }
        );

        const emailSent = await expectRecordToExist('emails', { subject: 'You Have New Match Results!' });
        expect(emailSent.recipientEmail).toContain(
            'player1@gmail.com,player2@gmail.com,player4@gmail.com,player5@gmail.com'
        );
        expect(emailSent.html).toContain('Cristopher Hamiltonbeach</b> reported the results of your match on');
        expect(emailSent.html).toContain('Men Team Doubles');
        expect(emailSent.html).toContain('/season/2021/spring/men-40-dbls-team');
    });

    test('Captain can report the injure score', async ({ page, common, login, overview, match }) => {
        await runQuery(
            'UPDATE matches SET acceptorId=23, acceptor2Id=22, acceptedAt="2021-05-03 17:50:47" WHERE id=53'
        );

        await login.loginAsPlayer3();
        await page.goto('/season/2021/spring/men-40-dbls-team');

        await overview.upcomingMatchesArea.locator('a').getByText('Score').click();

        await match.pickMatchResult('Team retired');
        await common.modalSubmitButton.click();

        await match.pickChallengerPoints(3);
        await match.pickAcceptorPoints(6);
        await new Promise((resolve) => setTimeout(resolve, 1000));

        await match.pickChallengerPoints(2);
        await match.pickAcceptorPoints(2);

        await expect(common.modal).toContainText('+9');
        await expect(common.modal).toContainText('+24');
        await common.modalSubmitButton.click();
        await expect(common.modal).toBeHidden();

        await expect(common.body).toContainText('+9');
        await expect(common.body).toContainText('+24');
        await expect(overview.todayMatchesArea).toContainText('Servebots1');
        await expect(overview.todayMatchesArea).toContainText('Game-Set-Match1');
        await expect(overview.playerList).toContainText('1 - 01 - 0');
        await expect(overview.playerList).toContainText('0 - 10 - 1');
        await expect(overview.playerList).toContainText('2-1Servebots');

        await page.locator('[data-points-calculation="53"]').hover();
        await expect(common.tooltip).toContainText('by Servebots');

        await expectRecordToExist(
            'matches',
            { id: 53 },
            { challengerId: 21, challenger2Id: 20, acceptorId: 23, acceptor2Id: 22, wonByInjury: 1 }
        );

        const emailSent = await expectRecordToExist('emails', { subject: 'You Have New Match Results!' });
        expect(emailSent.recipientEmail).toContain('player1@gmail.com,player2@gmail.com,player4@gmail.com');
        expect(emailSent.html).toContain('Cristopher Hamiltonbeach</b> reported the results of your match on');
        expect(emailSent.html).toContain('Men Team Doubles');
        expect(emailSent.html).toContain('/season/2021/spring/men-40-dbls-team');
    });

    test('Captain can report the default score', async ({ page, common, login, overview, match }) => {
        await runQuery(
            'UPDATE matches SET acceptorId=23, acceptor2Id=22, acceptedAt="2021-05-03 17:50:47" WHERE id=53'
        );

        await login.loginAsPlayer3();
        await page.goto('/season/2021/spring/men-40-dbls-team');

        await overview.upcomingMatchesArea.locator('a').getByText('Score').click();

        await match.pickMatchResult('Team defaulted');
        await expect(match.getBadgeWithPoints('+0')).toBeVisible();
        await expect(match.getBadgeWithPoints('+20')).toBeVisible();
        await common.modalSubmitButton.click();
        await expect(common.modal).toBeHidden();

        await expect(common.body).toContainText('+0');
        await expect(common.body).toContainText('+20');
        await expectRecordToExist(
            'matches',
            { id: 53 },
            { score: '0-6 0-6', wonByDefault: 1, challengerEloChange: null, acceptorEloChange: null }
        );

        // Check that an email is sent
        const emailSent = await expectRecordToExist('emails', {
            recipientEmail: 'player1@gmail.com,player2@gmail.com,player4@gmail.com',
            subject: 'You Have New Match Results!',
        });
        expect(emailSent.html).toContain('Cristopher Hamiltonbeach</b> reported the results of your match on');
        expect(emailSent.html).toContain('Men Team Doubles');
        expect(emailSent.html).toContain('/season/2021/spring/men-40-dbls-team');
        expect(emailSent.html).toContain('Cristopher H. / Matthew B. won by default against Gary M. / Ben D.');
    });

    test('Captain can report score from scratch', async ({ page, common, login, overview, match }) => {
        await runQuery(`INSERT INTO players SET userId=7, tournamentId=11`);

        await login.loginAsPlayer1();
        await page.goto('/season/2021/spring/men-40-dbls-team');

        await overview.reportMatchButton.click();
        await expect(match.challengerSelect).not.toContainText('Inactive User');

        await match.pickChallengerOption('Game-Set-Match');
        await expect(match.acceptorSelect).toHaveValue('20');
        await match.nextButton.click();

        await match.pickChallengerPoints(1);
        await new Promise((resolve) => setTimeout(resolve, 1000));

        await match.pickChallengerPoints(1);
        await new Promise((resolve) => setTimeout(resolve, 1000));

        await expect(common.modal).toContainText('+6');
        await expect(common.modal).toContainText('+27');
        await common.modalSubmitButton.click();
        await expect(common.modal).toBeHidden();

        await expect(common.body).toContainText('+6');
        await expect(common.body).toContainText('+27');

        await expectRecordToExist(
            'matches',
            { score: '1-6 1-6' },
            { challengerId: 23, challenger2Id: 22, acceptorId: 20, acceptor2Id: 21 }
        );
    });

    test('Should preselect my team when no captain is reporing the match', async ({ page, login, overview, match }) => {
        await login.loginAsPlayer2();
        await page.goto('/season/2021/spring/men-40-dbls-team');

        await overview.reportMatchButton.click();

        await match.pickChallengerOption('Game-Set-Match');
        await expect(match.acceptorSelect).toHaveValue('20');
    });
}

test('Captain can change team name', async ({ page, common, login, overview, match, register }) => {
    await login.loginAsPlayer1();
    await page.goto('/season/2021/spring/men-40-dbls-team');

    await overview.clickOtherAction('Change team name');
    await expect(register.teamNameField).toHaveValue('Servebots');
    await register.teamNameField.fill('Game-Set-Match');
    await common.modalSubmitButton.click();
    await expect(common.modal).toContainText('The name is already used.');

    await register.teamNameField.fill('WHATEver');
    await common.modalSubmitButton.click();

    await expect(common.alert).toContainText('The team name has been changed.');
    await expect(common.modal).toBeHidden();

    await expect(overview.playerList).toContainText('Whatever');

    await expectRecordToExist('players', { id: 20 }, { teamName: 'Whatever' });
});

// Replace the captain
{
    test('Captain try to replace captain and then cancel it', async ({ page, common, login, overview }) => {
        await login.loginAsPlayer1();
        await page.goto('/season/2021/spring/men-40-dbls-team');

        await overview.clickOtherAction('Replace team captain');
        await expect(common.modal).toContainText('Are you sure you want to make Gary Mill the Team Captain?');
        await common.modal.locator('button').getByText('Cancel').click();
        await expect(common.modal).toBeHidden();
        await expect(overview.inviteTeammateArea).toBeVisible();
    });

    test('Captain of two replace the captain to another player', async ({ page, common, login, overview }) => {
        await login.loginAsPlayer1();
        await page.goto('/season/2021/spring/men-40-dbls-team');

        await overview.clickOtherAction('Replace team captain');
        await expect(common.modal).toContainText('Are you sure you want to make Gary Mill the Team Captain?');
        await common.modal.locator('button').getByText('Yes').click();
        await expect(common.alert).toContainText('The captain has been replaced.');
        await expect(common.modal).toBeHidden();
        await expect(overview.inviteTeammateArea).toBeHidden();

        await expectRecordToExist('players', { id: 20 }, { teamName: null, partnerId: 21 });
        await expectRecordToExist('players', { id: 21 }, { teamName: 'Servebots', partnerId: null });

        const email = await expectRecordToExist('emails', { subject: 'Ben Done Made You the Team Captain' });
        expect(email.recipientEmail).toContain('player2@gmail.com');
        expect(email.replyTo).toContain('Ben Done');
        expect(email.replyTo).toContain('player1@gmail.com');
        expect(email.html).toContain('Ben Done</b> made you the Team Captain of the <b>Servebots</b> doubles team.');
    });

    test('Captain of three replace the captain to another player', async ({ page, common, login, overview }) => {
        const { insertId: newCaptainId } = await runQuery(
            'INSERT INTO players SET userId=8, tournamentId=11, partnerId=20'
        );

        await login.loginAsPlayer1();
        await page.goto('/season/2021/spring/men-40-dbls-team');

        await overview.clickOtherAction('Replace team captain');
        await expect(common.modal).toContainText('Pick who is going to be the new Team Captain:');
        await expect(common.modalSubmitButton).toBeDisabled();
        await common.modal.locator('button').getByText('Not Played User').click();
        await common.modalSubmitButton.click();
        await expect(common.alert).toContainText('The captain has been replaced.');
        await expect(common.modal).toBeHidden();
        await expect(overview.inviteTeammateArea).toBeHidden();

        await expectRecordToExist('players', { id: 20 }, { teamName: null, partnerId: newCaptainId });
        await expectRecordToExist('players', { id: 21 }, { teamName: null, partnerId: newCaptainId });
        await expectRecordToExist('players', { id: newCaptainId }, { teamName: 'Servebots', partnerId: null });

        const email = await expectRecordToExist('emails', { subject: 'Ben Done Made You the Team Captain' });
        expect(email.recipientEmail).toContain('player8@gmail.com');
        expect(email.replyTo).toContain('Ben Done');
        expect(email.replyTo).toContain('player1@gmail.com');
        expect(email.html).toContain('Ben Done</b> made you the Team Captain of the <b>Servebots</b> doubles team.');
    });
}

// Partner can leave the team
{
    test('The partner can leave the team', async ({ page, common, login, overview }) => {
        await runQuery('INSERT INTO players SET userId=8, tournamentId=11, partnerId=20');

        await login.loginAsPlayer8();
        await page.goto('/season/2021/spring/men-40-dbls-team');

        await overview.clickOtherAction('Leave the team');
        await common.modalSubmitButton.click();
        await expect(common.modal).toContainText('Reason is required.');
        await common.modal.locator('input[name="reason"]').fill('I am sick');
        await common.modalSubmitButton.click();
        await expect(common.alert).toContainText('You successfuly left the team.');
        await expect(common.modal).toBeHidden();
        await expect(overview.proposeMatchButton).toBeHidden();

        const email = await expectRecordToExist('emails', { subject: 'Not Played User Left Your Doubles Team' });
        expect(email.replyTo).toContain('Not Played User');
        expect(email.replyTo).toContain('player8@gmail.com');
        expect(email.recipientEmail).toContain('player1@gmail.com');
        expect(email.html).toContain('Not Played User</b> left the <b>Servebots</b> doubles team.');
        expect(email.html).toContain('Reason:</b> I am sick');
    });

    test('The partner can leave the team and old proposals are removed', async ({ page, common, login, overview }) => {
        await runQuery('UPDATE matches SET playedAt="2025-08-08 06:25:45" WHERE id=53');

        await login.loginAsPlayer2();
        await page.goto('/season/2021/spring/men-40-dbls-team');

        await overview.clickOtherAction('Leave the team');
        await common.modal.locator('input[name="reason"]').fill('I am sick');
        await common.modalSubmitButton.click();
        await expect(common.alert).toContainText('You successfuly left the team.');
        await expect(common.modal).toBeHidden();
        await expect(overview.proposeMatchButton).toBeHidden();

        const email = await expectRecordToExist('emails', { subject: 'Gary Mill Left Your Doubles Team' });
        expect(email.replyTo).toContain('Gary Mill');
        expect(email.replyTo).toContain('player2@gmail.com');
        expect(email.recipientEmail).toContain('player1@gmail.com');
        expect(email.html).toContain('Gary Mill</b> left the <b>Servebots</b> doubles team.');
        expect(email.html).toContain('Reason:</b> I am sick');
    });

    test('The partner cannot leave the team because he has an open proposal', async ({
        page,
        common,
        login,
        overview,
    }) => {
        await login.loginAsPlayer2();
        await page.goto('/season/2021/spring/men-40-dbls-team');

        await overview.clickOtherAction('Leave the team');
        await expect(common.modal).toContainText('You cannot leave the team as you have an open proposal.');
        await expect(common.modalSubmitButton).toBeHidden();
    });

    test('The partner cannot leave the team because he has some matches played', async ({
        page,
        common,
        login,
        overview,
    }) => {
        await runQuery(
            'UPDATE matches SET challenger2Id=20, acceptorId=22, acceptor2Id=23, acceptedAt="2025-08-17 06:25:45", score="6-1 6-1" WHERE id=53'
        );

        await login.loginAsPlayer2();
        await page.goto('/season/2021/spring/men-40-dbls-team');

        await overview.clickOtherAction('Leave the team');
        await expect(common.modal).toContainText('You cannot leave the team because you already played a match.');
        await expect(common.modalSubmitButton).toBeHidden();
    });

    test('The partner cannot leave the team because he has an upcoming match', async ({
        page,
        common,
        login,
        overview,
    }) => {
        const dateNextWeek = dayjs.tz().add(1, 'week').format('YYYY-MM-DD HH:mm:ss');

        await runQuery(
            `UPDATE matches SET challenger2Id=20, acceptorId=22, acceptor2Id=23, acceptedAt="2025-08-17 06:25:45", playedAt="${dateNextWeek}" WHERE id=53`
        );

        await login.loginAsPlayer2();
        await page.goto('/season/2021/spring/men-40-dbls-team');

        await overview.clickOtherAction('Leave the team');
        await expect(common.modal).toContainText('You cannot leave the team because you have an upcoming match.');
        await expect(common.modalSubmitButton).toBeHidden();
    });
}

// Tournament participation
{
    test('The captain can see tournament information', async ({ page, common, login, overview }) => {
        await runQuery(
            `UPDATE matches SET challenger2Id=20, acceptorId=22, acceptor2Id=23, playedAt="2025-08-10 06:25:45", score="6-1 6-1" WHERE id=53`
        );

        const dateInFiveDays = dayjs.tz().add(5, 'day').format('YYYY-MM-DD HH:mm:ss');
        await runQuery(`UPDATE seasons SET endDate="${dateInFiveDays}" WHERE id=1`);
        await overrideConfig({ minMatchesToPlanTournament: 1 });

        await login.loginAsPlayer1();
        await page.goto('/season/2021/spring/men-40-dbls-team');

        await expect(common.body).toContainText('The Top 8 teams who register');
        await expect(common.body).toContainText('Is your team available to play?');
        await expect(common.body).toContainText('We are going');
        await expect(common.body).toContainText('We will skip');

        await page.locator('a').getByText('Tournament information').click();
        await expect(common.modal).toContainText('The Top 8 teams who sign up');
        await expect(common.modal).toContainText('All teams are randomly distributed.');
        await common.closeModal();

        await page.locator('button').getByText('We are going').click();
        await expect(common.modal).toContainText('Only register if your team can play');
        await expect(common.modal).toContainText('Is your team going to play');
        await common.modal.locator('button').getByText('We are going').click();

        await expect(common.modal).toBeHidden();
        await expect(common.body).toContainText('You are registered for the tournament!');
    });

    test('The partner can see tournament information and captain responsibility', async ({
        page,
        common,
        login,
        overview,
    }) => {
        await runQuery(
            `UPDATE matches SET challenger2Id=20, acceptorId=22, acceptor2Id=23, playedAt="2025-08-10 06:25:45", score="6-1 6-1" WHERE id=53`
        );

        const dateInFiveDays = dayjs.tz().add(5, 'day').format('YYYY-MM-DD HH:mm:ss');
        await runQuery(`UPDATE seasons SET endDate="${dateInFiveDays}" WHERE id=1`);
        await overrideConfig({ minMatchesToPlanTournament: 1 });

        await login.loginAsPlayer2();
        await page.goto('/season/2021/spring/men-40-dbls-team');
        await expect(overview.playerList).toBeVisible();
        await expect(overview.finalParticipationArea).toContainText(
            'The Team Captain can change participation status.'
        );
    });

    test('The Pool Player cannot see tournament information', async ({ page, common, login, overview }) => {
        await runQuery(
            `UPDATE matches SET challenger2Id=20, acceptorId=22, acceptor2Id=23, playedAt="2025-08-10 06:25:45", score="6-1 6-1" WHERE id=53`
        );
        await runQuery('INSERT INTO players SET userId=7, tournamentId=11, partnerId=999999');

        const dateInFiveDays = dayjs.tz().add(5, 'day').format('YYYY-MM-DD HH:mm:ss');
        await runQuery(`UPDATE seasons SET endDate="${dateInFiveDays}" WHERE id=1`);
        await overrideConfig({ minMatchesToPlanTournament: 1 });

        await login.loginAsPlayer5();
        await page.goto('/season/2021/spring/men-40-dbls-team');
        await expect(overview.playerList).toBeVisible();
        await expect(overview.finalParticipationArea).toBeHidden();
    });

    test('Can show players in the Team list', async ({ page, common, login, overview }) => {
        await page.goto('/season/2021/spring/men-40-dbls-team');
        await expect(overview.playerList).toContainText('Servebots');
        await expect(overview.playerList).not.toContainText('Gary Mill');

        await overview.showPlayersToggle.click();
        await expect(overview.playerList).toContainText('Gary Mill');
        await expect(overview.playerList).toContainText('Matthew Burt');

        await overview.showPlayersToggle.click();
        await expect(overview.playerList).not.toContainText('Gary Mill');
        await expect(overview.playerList).not.toContainText('Matthew Burt');
    });
}

// Admin features
{
    test('Admin can create a team based on Pool players', async ({ page, common, login, overview }) => {
        await runQuery('INSERT INTO players SET userId=7, tournamentId=11, partnerId=999999');
        await runQuery('INSERT INTO players SET userId=8, tournamentId=11, partnerId=999999');
        await runQuery('INSERT INTO players SET userId=9, tournamentId=11, partnerId=999999');

        await login.loginAsAdmin();
        await page.goto('/season/2021/spring/men-40-dbls-team/admin');
        await page.locator('button').getByText('Create team from Player Pool').click();
        await common.modal.locator('input[name="teamName"]').fill('Some Name');
        await common.modal.locator('label').getByText('Inactive User').click();
        await common.modal.locator('label').getByText('Doubles Player').click();
        await common.modalSubmitButton.click();

        await expect(common.alert).toContainText('The team was successfuly created.');
        await page.goto('/season/2021/spring/men-40-dbls-team');
        await expect(overview.playerList).toContainText('Some Name');

        const captain = await expectRecordToExist(
            'players',
            { userId: 7, tournamentId: 11 },
            { teamName: 'Some Name', partnerId: null }
        );
        await expectRecordToExist(
            'players',
            { userId: 9, tournamentId: 11 },
            { teamName: null, partnerId: captain.id }
        );

        const captainEmail = await expectRecordToExist('emails', { recipientEmail: 'player5@gmail.com' });
        expect(captainEmail.subject).toContain("You've Been Added to a Doubles Team!");
        expect(captainEmail.html).toContain('Some Name');
        expect(captainEmail.html).toContain('You will be the Team Captain this season.');
        expect(captainEmail.html).toContain('Inactive User');
        expect(captainEmail.html).toContain('player5@gmail.com');
        expect(captainEmail.html).toContain('920-391-9531');
        expect(captainEmail.html).toContain('Doubles Player');
        expect(captainEmail.html).toContain('player9@gmail.com');

        const partnerEmail = await expectRecordToExist('emails', { recipientEmail: 'player9@gmail.com' });
        expect(partnerEmail.subject).toContain("You've Been Added to a Doubles Team!");
        expect(partnerEmail.html).toContain('Some Name');
        expect(partnerEmail.html).toContain('<b>Inactive User</b> will be your Team Captain this season.');
        expect(partnerEmail.html).toContain('player5@gmail.com');
        expect(partnerEmail.html).toContain('920-391-9531');
        expect(partnerEmail.html).toContain('Doubles Player');
        expect(partnerEmail.html).toContain('player9@gmail.com');
    });
}

// Final tournament
{
    const generateThreeTeamBrackets = async () => {
        await runQuery('INSERT INTO players SET id=30, userId=7, tournamentId=11, teamName="Buddies"');
        await runQuery(`INSERT INTO players SET id=31, userId=8, tournamentId=11, partnerId=30`);

        await runQuery(`INSERT INTO matches
            SET initial=1,
                challengerId=20,
                challenger2Id=21,
                acceptorId=22,
                acceptor2Id=23,
                playedAt="2025-05-03 11:00:00",
                score="6-3 6-3",
                winner=20`);
        await runQuery(`INSERT INTO matches
            SET initial=1,
                challengerId=20,
                challenger2Id=21,
                acceptorId=30,
                acceptor2Id=31,
                playedAt="2025-05-04 11:00:00",
                score="7-5 7-5",
                winner=20`);
        for (const id of [20, 23, 30]) {
            await runQuery(`UPDATE players SET readyForFinal=1 WHERE id=${id}`);
        }

        // Close current season
        const dateTwoDaysAgo = dayjs.tz().subtract(2, 'day').format('YYYY-MM-DD HH:mm:ss');
        await runQuery(`UPDATE seasons SET endDate="${dateTwoDaysAgo}" WHERE id=1`);

        await overrideConfig({ minMatchesToPlanTournament: 1, minPlayersToRunTournament: 2 });
    };

    test('Tournament brackets are generated and emails are sent', async ({ page, common, login, overview }) => {
        await generateThreeTeamBrackets();
        await page.goto('/season/2021/spring/men-40-dbls-team');

        const semiEmail1 = await expectRecordToExist('emails', {
            recipientEmail: 'player3@gmail.com,player4@gmail.com',
        });
        expect(semiEmail1.subject).toContain(
            'Your Team is in the Semifinals of the Men Team Doubles Final Tournament!'
        );
        expect(semiEmail1.html).toContain('you will be facing <b>Buddies</b>');
        expect(semiEmail1.html).toContain('Once you decide on a place and time with <b>Buddies</b>');
        expect(semiEmail1.html).toContain('Captain');
        expect(semiEmail1.html).toContain('Inactive User</a>');

        const semiEmail2 = await expectRecordToExist('emails', {
            recipientEmail: 'player5@gmail.com,player8@gmail.com',
        });
        expect(semiEmail2.subject).toContain(
            'Your Team is in the Semifinals of the Men Team Doubles Final Tournament!'
        );
        expect(semiEmail2.html).toContain('you will be facing <b>Game-Set-Match</b>');
        expect(semiEmail2.html).toContain('Once you decide on a place and time with <b>Game-Set-Match</b>');
        expect(semiEmail2.html).toContain('Captain');
        expect(semiEmail2.html).toContain('Cristopher Hamiltonbeach</a>');

        const byeEmail = await expectRecordToExist('emails', { recipientEmail: 'player1@gmail.com,player2@gmail.com' });
        expect(byeEmail.subject).toContain('Your Team is Receiving a Bye for the Men Team Doubles Final Tournament!');
        expect(byeEmail.html).toContain('Since your team is the No. 1');
        expect(byeEmail.html).toContain('<b>Buddies</b> or <b>Game-Set-Match</b>');
        expect(byeEmail.html).toContain('<b>Buddies</b> and <b>Game-Set-Match</b>');
    });

    test('Generate tournament bracket and report match with 3-player team and the winner should be set right', async ({
        page,
        common,
        login,
        overview,
        match,
    }) => {
        await runQuery(`INSERT INTO players SET id=31, userId=8, tournamentId=11, partnerId=20`);
        await runQuery(`INSERT INTO matches
            SET initial=1,
                challengerId=20,
                challenger2Id=21,
                acceptorId=22,
                acceptor2Id=23,
                playedAt="2025-05-03 11:00:00",
                score="6-3 6-3",
                winner=20`);
        for (const id of [20, 23]) {
            await runQuery(`UPDATE players SET readyForFinal=1 WHERE id=${id}`);
        }

        // Close current season
        const dateTwoDaysAgo = dayjs.tz().subtract(2, 'day').format('YYYY-MM-DD HH:mm:ss');
        await runQuery(`UPDATE seasons SET endDate="${dateTwoDaysAgo}" WHERE id=1`);

        await overrideConfig({ minMatchesToPlanTournament: 1, minPlayersToRunTournament: 2 });

        await login.loginAsPlayer2();
        await page.goto('/season/2021/spring/men-40-dbls-team');
        await overview.finalTournamentArea.locator('a').getByText('Score').click();
        await common.modal.locator('button').getByText('Gary Mill').click();
        await common.modal.locator('button').getByText('Not Played User').click();
        await common.modal.locator('button').getByText('Next').click();

        await match.pickAcceptorPoints(3);
        await new Promise((resolve) => setTimeout(resolve, 1000));

        await match.pickAcceptorPoints(2);
        await new Promise((resolve) => setTimeout(resolve, 1000));

        await common.modalSubmitButton.click();
        await expect(common.modal).toBeHidden();

        await expectRecordToExist(
            'matches',
            { type: 'final' },
            { challengerId: 21, challenger2Id: 31, acceptorId: 23, acceptor2Id: 22, winner: 21 }
        );
    });

    test('Generate tournament bracket, report the results, and claim the trophy', async ({
        page,
        common,
        login,
        overview,
        match,
    }) => {
        await generateThreeTeamBrackets();
        await runQuery('INSERT INTO players SET id=50, userId=9, tournamentId=11, partnerId=23');

        await login.loginAsPlayer3();
        await page.goto('/season/2021/spring/men-40-dbls-team');

        await overview.finalTournamentArea.locator('a').getByText('Score').click();
        await common.modal.locator('button').getByText('Cristopher Hamiltonbeach').click();
        await common.modal.locator('button').getByText('Matthew Burt').click();
        await common.modal.locator('button').getByText('Next').click();
        await match.pickChallengerPoints(3);
        await new Promise((resolve) => setTimeout(resolve, 1000));
        await match.pickChallengerPoints(2);
        await common.modalSubmitButton.click();
        await expect(common.modal).toBeHidden();

        await overview.finalTournamentArea.locator('a').getByText('Score').click();
        await common.modal.locator('button').getByText('Cristopher Hamiltonbeach').click();
        await common.modal.locator('button').getByText('Matthew Burt').click();
        await common.modal.locator('button').getByText('Next').click();
        await match.pickChallengerPoints(3);
        await new Promise((resolve) => setTimeout(resolve, 1000));
        await match.pickChallengerPoints(2);
        await common.modalSubmitButton.click();
        await expect(common.modal).toBeHidden();

        await expect(overview.winnerArea).toContainText('Game-Set-Match');
        await expect(overview.claimAwardArea).toContainText('Congratulations, Game-Set-Match!');
        await expect(overview.claimAwardArea).toContainText('As the Doubles Champions');
        await expect(overview.claimAwardArea).toContainText('played at least one match');
        await expect(overview.claimAwardArea).toContainText('$15 credit');
        await expect(overview.claimAwardArea).toContainText(
            "Fill in the following form, and we'll send the trophies to you to share with your team"
        );
        await expect(overview.claimAwardArea).not.toContainText('Gift Card');

        // check other teammates
        await login.loginAsPlayer4();
        await page.goto('/season/2021/spring/men-40-dbls-team');
        await expect(overview.winnerArea).toBeVisible();
        await expect(overview.claimAwardArea).toBeHidden();

        // Get back to captain
        await login.loginAsPlayer3();
        await page.goto('/season/2021/spring/men-40-dbls-team');

        await overview.streetField.fill('908 Sutter Gate Ln');
        await overview.cityField.fill('Morrisville');
        await overview.zipField.fill('27560');
        await page.locator('button').getByText('Claim reward').click();

        await expect(common.modal).toContainText('Congratulations!');
        await expect(common.modal).toContainText('awarded every teammate who played at least one match $15 credit.');
        await expect(common.modal).toContainText("You'll receive your team's trophies in 2-3 weeks.");
        await expect(overview.claimAwardArea).toBeHidden();

        await expectRecordToExist(
            'players',
            { id: 23 },
            { address: '908 Sutter Gate Ln, Morrisville, NC, 27560', rewardType: 'credit' }
        );
        await expectRecordToExist(
            'payments',
            { userId: 5, badgeId: null },
            { type: 'discount', description: 'Champion award for Men Team Doubles', amount: 1500 }
        );
        await expectRecordToExist(
            'payments',
            { userId: 6, badgeId: null },
            { type: 'discount', description: 'Champion award for Men Team Doubles', amount: 1500 }
        );
        const email = await expectRecordToExist(
            'emails',
            { subject: 'You Got $15 in Credit for Winning the Tournament!' },
            { recipientEmail: 'player4@gmail.com' }
        );
        expect(email.html).toContain('your Team Captain (Cristopher Hamiltonbeach)');
        expect(email.html).toContain('$15 credit');

        // just to wait for all payments sent
        await new Promise((resolve) => setTimeout(resolve, 1000));
        await expectNumRecords('payments', { description: 'Champion award for Men Team Doubles' }, 2);
    });

    test('Generate tournament bracket, report the results, and claim the reward in Raleigh', async ({
        page,
        common,
        login,
        overview,
        match,
    }) => {
        await generateThreeTeamBrackets();
        await overrideConfig({ minMatchesToPlanTournament: 1, minPlayersToRunTournament: 2, isRaleigh: 1 });

        await login.loginAsPlayer3();
        await page.goto('/season/2021/spring/men-40-dbls-team');

        await overview.finalTournamentArea.locator('a').getByText('Score').click();
        await match.pickChallengerPoints(3);
        await new Promise((resolve) => setTimeout(resolve, 1000));
        await match.pickChallengerPoints(2);
        await common.modalSubmitButton.click();
        await expect(common.modal).toBeHidden();

        await overview.finalTournamentArea.locator('a').getByText('Score').click();
        await match.pickChallengerPoints(3);
        await new Promise((resolve) => setTimeout(resolve, 1000));
        await match.pickChallengerPoints(2);
        await common.modalSubmitButton.click();
        await expect(common.modal).toBeHidden();

        await expect(overview.winnerArea).toContainText('Game-Set-Match');
        await expect(overview.claimAwardArea).toContainText('Congratulations, Game-Set-Match!');
        await expect(overview.claimAwardArea).toContainText('$15 credit and an engraved trophy');
        await expect(overview.claimAwardArea).toContainText(
            "You can pick up your team's trophies at Millbrook Exchange Tennis Center after"
        );
        await expect(overview.streetField).toBeHidden();

        await page.locator('button').getByText('Claim reward').click();

        await expect(common.modal).toContainText('Congratulations!');
        await expect(common.modal).toContainText('awarded every teammate who played at least one match $15 credit.');
        await expect(common.modal).toContainText(
            "You can pick up your team's trophies at Millbrook Exchange Tennis Center after"
        );
        await expect(common.modal).not.toContainText('2-3 weeks.');
        await expect(overview.claimAwardArea).toBeHidden();

        await expectRecordToExist('players', { id: 23 }, { address: '-', rewardType: 'credit' });
        await expectRecordToExist(
            'payments',
            { userId: 5, badgeId: null },
            { type: 'discount', description: 'Champion award for Men Team Doubles', amount: 1500 }
        );
        await expectRecordToExist(
            'payments',
            { userId: 6, badgeId: null },
            { type: 'discount', description: 'Champion award for Men Team Doubles', amount: 1500 }
        );
        const email = await expectRecordToExist(
            'emails',
            { subject: 'You Got $15 in Credit for Winning the Tournament!' },
            { recipientEmail: 'player4@gmail.com' }
        );
        expect(email.html).toContain('your Team Captain (Cristopher Hamiltonbeach)');
        expect(email.html).toContain('$15 credit');

        // just to wait for all payments sent
        await new Promise((resolve) => setTimeout(resolve, 1000));
        await expectNumRecords('payments', { description: 'Champion award for Men Team Doubles' }, 2);
    });

    test('Teammate can add a friendly proposal and pick teammate to play', async ({
        page,
        common,
        login,
        overview,
        proposal,
    }) => {
        await generateThreeTeamBrackets();

        await login.loginAsPlayer4();
        await page.goto('/season/2021/spring/men-40-dbls-team');

        await overview.proposeFriendlyMatchButton.click();

        await proposal.pickSundayNextWeek();
        await proposal.placeField.fill('Bandana park');
        await common.modal.locator('button').getByText('Propose match').click();

        await expect(common.alert).toContainText('has been added');

        const Proposal = page.locator('[data-open-proposals]').locator('[data-proposal]', { hasText: 'Bandana park' });
        await expect(Proposal).toContainText('5:00 PM');
        await expect(Proposal).toContainText('Delete');
        await expect(Proposal).not.toContainText('Accept');
        await overview.checkTeamLink(Proposal, 'Game-Set-Match', ['Matthew', 'Cristopher']);

        const emailSent = await expectRecordToExist('emails', {
            recipientEmail: 'player1@gmail.com,player2@gmail.com,player5@gmail.com,player8@gmail.com',
        });
        expect(emailSent.subject).toContain(
            'Game-Set-Match (Matthew B. / Cristopher H.) proposed a new friendly match for'
        );
        expect(emailSent.subject).toContain('5:00 PM');
        expect(emailSent.replyTo).toContain('Matthew Burt');
        expect(emailSent.replyTo).toContain('player4@gmail.com');
        expect(emailSent.html).toContain('Game-Set-Match');
        expect(emailSent.html).toContain('Matthew B.</a> /');
        expect(emailSent.html).toContain('Cristopher H.</a>');
        expect(emailSent.html).toContain('proposed a new friendly match');
        expect(emailSent.html).toContain('Raleigh, Men Team Doubles, Bandana park');
        expect(emailSent.html).toContain('5:00 PM');
    });
}
