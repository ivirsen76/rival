import { test, expect } from './base';
import {
    restoreDb,
    runQuery,
    getNumRecords,
    getRecord,
    expectRecordToExist,
    expectNumRecords,
    cleanRedisCache,
    overrideConfig,
} from '@rival/ladder.backend/src/db/helpers';
import dayjs from '@rival/dayjs';

test.beforeEach(async ({ login }) => {
    restoreDb();
    await login.loginAsPlayer1();
});

// From overview page
(() => {
    test('Should see all proposals on overview page', async ({ page, common, login }) => {
        await page.goto('/season/2021/spring/men-35');

        await expect(page.locator('[data-proposal="7"]')).toBeVisible();
        await expect(page.locator('[data-proposal="6"]')).toBeVisible();
        await expect(page.locator('[data-proposal="8"]')).toBeHidden();
    });

    test('Should show proposal validation', async ({ page, common, login, overview }) => {
        await page.goto('/season/2021/spring/men-35');
        await overview.proposeMatchButton.click();
        await common.modal.locator('button').getByText('Propose match').click();
        await expect(common.modal).toContainText('Date is required');
        await expect(common.modal).toContainText('Location is required');
    });

    test('Should add proposal', async ({ page, common, login, overview, proposal }) => {
        await page.goto('/season/2021/spring/men-35');
        await overview.proposeMatchButton.click();
        await proposal.pickSundayNextWeek();
        await proposal.placeField.fill('Bond park');
        await proposal.commentField.fill('Time flexible');
        await common.modal.locator('button').getByText('Propose match').click();

        await expect(common.alert).toContainText('has been added');

        const Proposal = page.locator('[data-proposal]', { hasText: 'Bond park' });
        await expect(Proposal).toContainText('Time flexible');
        await expect(Proposal).toContainText('5:00 PM');
        await expect(Proposal).toContainText('Delete');
        await expect(Proposal).not.toContainText('Accept');
    });

    test('Should create proposal with the warning about the night hour', async ({
        page,
        common,
        overview,
        proposal,
    }) => {
        await page.goto('/season/2021/spring/men-35');
        await overview.proposeMatchButton.click();
        await proposal.dateField.click();
        await proposal.sundayNextWeek.click();
        await page.locator('button').getByText('PM').click();
        await proposal.closeTimePicker();
        await common.modal.locator('button').getByText('Propose match').click();

        await expect(common.confirmation).toContainText('at night.');
        await expect(common.confirmation).toContainText('5:00 AM');
        await common.confirmation.locator('button').getByText('Cancel').click();

        // wait for animation is gone
        await new Promise((resolve) => setTimeout(resolve, 1000));

        await common.modal.locator('button').getByText('Propose match').click();
        await common.confirmation.locator('button').getByText('Yes').click();
        await expect(common.modal).toContainText('Location is required');

        await proposal.placeField.fill('Bond park');
        await common.modal.locator('button').getByText('Propose match').click();
        await expect(common.alert).toContainText('has been added');
    });

    test('Should not allow to create overlapped proposals', async ({ page, common, overview, proposal }) => {
        await page.goto('/season/2021/spring/men-35');
        await overview.proposeMatchButton.click();
        await proposal.pickSundayNextWeek();
        await proposal.placeField.fill('Bond park');
        await common.modal.locator('button').getByText('Propose match').click();
        await expect(common.alert).toContainText('has been added');

        await overview.proposeMatchButton.click();
        await proposal.placeField.fill('Bond park');
        await proposal.dateField.click();
        await proposal.sundayNextWeek.click();
        await page.locator('[data-hour-change="up"]').click();
        await page.locator('[data-minute-change="down"]').click();
        await proposal.closeTimePicker();
        await common.modal.locator('button').getByText('Propose match').click();

        await expect(common.modal).toContainText(
            'You already have a proposal for 5:00 PM. Match proposals must be at least 2 hours apart.'
        );
    });

    test('Should accept proposal', async ({ page, common, login, overview }) => {
        await page.goto('/season/2021/spring/men-35');
        const Proposal = page.locator('[data-proposal="6"]');

        await Proposal.locator('button').getByText('Accept').click();
        await expect(common.modal).toContainText('Please confirm');
        await common.modal.locator('button').getByText('Accept').click();
        await expect(common.alert).toContainText('has been accepted');

        await expect(Proposal).toBeHidden();
        await expect(overview.upcomingMatchesArea).toContainText('Cristopher');

        // Check that an email is sent
        await new Promise((resolve) => setTimeout(resolve, 500));
        const emailSent = await getRecord('emails', { recipientEmail: 'player3@gmail.com' });
        expect(emailSent.replyTo).toContain('Ben Done');
        expect(emailSent.replyTo).toContain('player1@gmail.com');
        expect(emailSent.subject).toContain('Ben Done accepted the match proposal for');
        expect(emailSent.html).toContain('Raleigh, Men 3.5, Pullen, Kentwood, Time and place flexible');
        expect(emailSent.html).toContain('Ben Done</a></b> accepted the proposal for a match in Men 3.5.');
        expect(emailSent.html).toContain('player1@gmail.com');
        expect(emailSent.html).toContain('123-456-7890');
        expect(emailSent.html).toContain('sms:1234567890');
        expect(emailSent.html).toContain('/player/ben-done');

        // Check the date is in local zone
        const acceptedProposal = await getRecord('matches', { id: 6 });
        const diff = dayjs.tz().diff(dayjs.tz(acceptedProposal.acceptedAt), 'second');
        expect(Math.abs(diff)).toBeLessThan(10);
    });

    test('Should not send a proposal for wrong emails', async ({ page, common, login }) => {
        await runQuery(`UPDATE users SET isWrongEmail=1 WHERE id=5`);

        await page.goto('/season/2021/spring/men-35');
        const Proposal = page.locator('[data-proposal="6"]');

        await Proposal.locator('button').getByText('Accept').click();
        await common.modal.locator('button').getByText('Accept').click();
        await expect(common.alert).toContainText('has been accepted');

        // Check that an email is not sent
        await new Promise((resolve) => setTimeout(resolve, 1000));
        const emailSent = await getRecord('emails', { recipientEmail: 'player3@gmail.com' });
        expect(emailSent).toBeFalsy();
    });

    test('Should not send a proposal for banned players', async ({ page, common, login }) => {
        await runQuery(`UPDATE users SET banDate="2099-01-01 11:11:11" WHERE id=5`);

        await page.goto('/season/2021/spring/men-35');
        const Proposal = page.locator('[data-proposal="6"]');

        await Proposal.locator('button').getByText('Accept').click();
        await common.modal.locator('button').getByText('Accept').click();
        await expect(common.alert).toContainText('has been accepted');

        // Check that an email is not sent
        await new Promise((resolve) => setTimeout(resolve, 1000));
        const emailSent = await getRecord('emails', { recipientEmail: 'player3@gmail.com' });
        expect(emailSent).toBeFalsy();
    });

    test('Should delete my proposal', async ({ page, common, login }) => {
        await page.goto('/season/2021/spring/men-35');
        const Proposal = page.locator('[data-proposal="7"]');

        await Proposal.locator('button').getByText('Delete').click();
        await expect(common.modal).toContainText('Please confirm');
        await common.modal.locator('button').getByText('Delete').click();
        await expect(common.alert).toContainText('has been deleted');
        await expect(Proposal).toBeHidden();
    });

    test('Should send proposal email for those who subscribed for this', async ({
        page,
        common,
        overview,
        proposal,
    }) => {
        await page.goto('/season/2021/spring/men-35');
        await overview.proposeMatchButton.click();
        await proposal.pickSundayNextWeek();
        await proposal.placeField.fill('Bond park');
        await proposal.commentField.fill('Time flexible');
        await common.modal.locator('button').getByText('Propose match').click();

        await expect(common.alert).toContainText('has been added');

        await expectNumRecords('emails', { sql: 'subject!="New Badge Earned!"' }, 1);

        const emailSent = await getRecord('emails', { recipientEmail: 'player2@gmail.com' });
        expect(emailSent.subject).toContain('Ben Done proposed a new match');
        expect(emailSent.subject).toContain('5:00 PM');
        expect(emailSent.html).toContain('Raleigh, Men 3.5, Bond park, Time flexible');
        expect(emailSent.html).toContain('5:00 PM');
        expect(emailSent.html).toContain('Ben Done');
        expect(emailSent.html).toContain('Bond park');
        expect(emailSent.html).toContain('Time flexible');
        expect(emailSent.html).toContain('/player/ben-done');

        const [proposalUrl] = emailSent.html.match(/\/season\/[\w/-]+/);

        await page.goto(proposalUrl);
        await expect(common.body).toContainText('2021 Spring');
        await expect(common.body).toContainText('Ongoing season');

        await expectRecordToExist('matches', { place: 'Bond park' }, { isProposalSent: 1 });
    });

    test('Should send batch proposals email for those who subscribed for this', async ({
        page,
        common,
        overview,
        proposal,
    }) => {
        const tomorrow = dayjs.tz().add(1, 'day').format('YYYY-MM-DD HH:mm:ss');
        await runQuery(
            `INSERT INTO matches SET initial=1, challengerId=2, place="Sanderford", comment="Rigid", playedAt="${tomorrow}"`
        );

        await page.goto('/season/2021/spring/men-35');
        await overview.proposeMatchButton.click();
        await proposal.pickSundayNextWeek();
        await proposal.placeField.fill('Bond park');
        await proposal.commentField.fill('Time flexible');
        await common.modal.locator('button').getByText('Propose match').click();

        await expect(common.alert).toContainText('has been added');

        await expectNumRecords('emails', { sql: 'subject!="New Badge Earned!"' }, 1);

        const emailSent = await expectRecordToExist('emails', { recipientEmail: 'player2@gmail.com' });
        expect(emailSent.subject).toContain('Ben Done proposed 2 new matches');
        expect(emailSent.html).toContain('5:00 PM');
        expect(emailSent.html).toContain('Ben Done');
        expect(emailSent.html).toContain('Sanderford');
        expect(emailSent.html).toContain('Rigid');
        expect(emailSent.html).toContain('Bond park');
        expect(emailSent.html).toContain('Time flexible');
        expect(emailSent.html).toContain('/player/ben-done');

        const [proposalUrl] = emailSent.html.match(/\/season\/[\w/-]+/);

        await page.goto(proposalUrl);
        await expect(common.body).toContainText('2021 Spring');
        await expect(common.body).toContainText('Ongoing season');

        await expectRecordToExist('matches', { place: 'Sanderford' }, { isProposalSent: 1 });
        await expectRecordToExist('matches', { place: 'Bond park' }, { isProposalSent: 1 });
    });

    test('Should send batch proposals email divided by filter', async ({ page, common, overview, proposal }) => {
        await runQuery(`UPDATE users SET subscribeForProposals=1`);

        const nextMonday = dayjs.tz().add(1, 'week').isoWeekday(1).format('YYYY-MM-DD HH:mm:ss');
        await runQuery(
            `INSERT INTO matches SET initial=1, challengerId=2, place="Sanderford", playedAt="${nextMonday}"`
        );
        await runQuery(
            `INSERT INTO matches SET initial=1, challengerId=2, place="Springfield", playedAt="${nextMonday}"`
        );

        await runQuery(
            `UPDATE users SET information='${JSON.stringify({
                subscribeForProposals: {
                    onlyNotPlaying: false,
                    onlyMySchedule: true,
                    weeklySchedule: [[[6, 21]], [], [], [], [], [], []],
                },
            })}' WHERE id=5 OR id=2`
        );

        await page.goto('/season/2021/spring/men-35');
        await overview.proposeMatchButton.click();
        await proposal.pickSundayNextWeek();
        await proposal.placeField.fill('Bond park');
        await common.modal.locator('button').getByText('Propose match').click();

        await expect(common.alert).toContainText('has been added');

        const email1 = await expectRecordToExist('emails', {
            subject: 'Ben Done proposed 2 new matches in Men 3.5',
            recipientEmail: 'player2@gmail.com,player3@gmail.com',
        });
        expect(email1.html).toContain('Sanderford');
        expect(email1.html).toContain('Springfield');
        expect(email1.html).not.toContain('Bond park');

        const email2 = await expectRecordToExist('emails', {
            subject: 'Ben Done proposed 3 new matches in Men 3.5',
            recipientEmail: 'player4@gmail.com',
        });
        expect(email2.html).toContain('Sanderford');
        expect(email2.html).toContain('Springfield');
        expect(email2.html).toContain('Bond park');

        await expectRecordToExist('matches', { place: 'Sanderford' }, { isProposalSent: 1 });
        await expectRecordToExist('matches', { place: 'Springfield' }, { isProposalSent: 1 });
        await expectRecordToExist('matches', { place: 'Bond park' }, { isProposalSent: 1 });
    });

    test('Should send batch proposals email divided by filter including single email', async ({
        page,
        common,
        overview,
        proposal,
    }) => {
        await runQuery(`UPDATE users SET subscribeForProposals=1`);

        const nextMonday = dayjs.tz().add(1, 'week').isoWeekday(1).format('YYYY-MM-DD HH:mm:ss');
        await runQuery(
            `INSERT INTO matches SET initial=1, challengerId=2, place="Sanderford", comment="Flexible", matchFormat=2, playedAt="${nextMonday}"`
        );
        await runQuery(
            `INSERT INTO matches SET initial=1, challengerId=2, place="Springfield", comment="Flexible", playedAt="${nextMonday}"`
        );

        await runQuery(
            `UPDATE users SET information='${JSON.stringify({
                subscribeForProposals: { onlyNotPlaying: false, playFormats: [2] },
            })}' WHERE id=2`
        );
        await runQuery(
            `UPDATE users SET information='${JSON.stringify({
                subscribeForProposals: {
                    onlyNotPlaying: false,
                    onlyMySchedule: true,
                    weeklySchedule: [[[6, 21]], [], [], [], [], [], []],
                },
            })}' WHERE id=5`
        );

        await page.goto('/season/2021/spring/men-35');
        await overview.proposeMatchButton.click();
        await proposal.pickSundayNextWeek();
        await proposal.placeField.fill('Bond park');
        await common.modal.locator('button').getByText('Propose match').click();

        await expect(common.alert).toContainText('has been added');

        const email1 = await expectRecordToExist('emails', { recipientEmail: 'player2@gmail.com' });
        expect(email1.subject).toContain('Ben Done proposed a new match for Mon');
        expect(email1.html).toContain('Sanderford');
        expect(email1.html).not.toContain('Springfield');
        expect(email1.html).not.toContain('Bond park');
        expect(email1.html).toContain('Fast4');

        const email2 = await expectRecordToExist('emails', {
            subject: 'Ben Done proposed 2 new matches in Men 3.5',
            recipientEmail: 'player3@gmail.com',
        });
        expect(email2.html).toContain('Sanderford');
        expect(email2.html).toContain('Springfield');
        expect(email2.html).not.toContain('Bond park');
        expect(email1.html).toContain('Fast4');

        const email3 = await expectRecordToExist('emails', {
            subject: 'Ben Done proposed 3 new matches in Men 3.5',
            recipientEmail: 'player4@gmail.com',
        });
        expect(email3.html).toContain('Sanderford');
        expect(email3.html).toContain('Springfield');
        expect(email3.html).toContain('Bond park');
        expect(email1.html).toContain('Fast4');

        await expectRecordToExist('matches', { place: 'Sanderford' }, { isProposalSent: 1 });
        await expectRecordToExist('matches', { place: 'Springfield' }, { isProposalSent: 1 });
        await expectRecordToExist('matches', { place: 'Bond park' }, { isProposalSent: 1 });
    });

    test('Should not send proposal email for avoided players', async ({ page, common, login, overview, proposal }) => {
        await runQuery(`UPDATE users SET subscribeForProposals=1`);
        await runQuery(`INSERT INTO userrelations (userId, opponentId, avoid) VALUES (1, 2, 1)`);
        await runQuery(`INSERT INTO userrelations (userId, opponentId, avoid) VALUES (5, 6, 1)`);

        // Don't see proposal from Gary
        await page.goto('/season/2021/spring/men-35/proposals');
        await expect(common.body).not.toContainText('Lake Lynn');
        await page.goto('/season/2021/spring/men-35');
        await expect(common.body).not.toContainText('Lake Lynn');

        await overview.proposeMatchButton.click();
        await proposal.pickSundayNextWeek();
        await proposal.placeField.fill('Bond park');
        await common.modal.locator('button').getByText('Propose match').click();

        await expect(common.alert).toContainText('has been added');

        const emailSent = await expectRecordToExist('emails', { sql: 'subject LIKE "Ben Done proposed a new match%"' });
        expect(emailSent.recipientEmail).not.toContain('player2@gmail.com');
        expect(emailSent.recipientEmail).toContain('player3@gmail.com');
        expect(emailSent.recipientEmail).toContain('player4@gmail.com');

        // Check if Gary doesn't see Ben's proposals
        await page.goto('/login');
        await page.locator('input[name="email"]').fill('player2@gmail.com');
        await page.locator('input[name="password"]').fill(login.password);
        await page.locator('button').getByText('Sign in').click();
        await expect(common.body).toContainText('Gary Mill');

        await page.goto('/season/2021/spring/men-35/proposals');
        await expect(common.body).not.toContainText('Bond park');
        await expect(common.body).not.toContainText('Millbrook');
        await page.goto('/season/2021/spring/men-35');
        await expect(common.body).not.toContainText('Bond park');
        await expect(common.body).not.toContainText('Millbrook');
    });

    test('Should add competitive proposal', async ({ page, common, login, overview, proposal }) => {
        await overrideConfig({ minMatchesToEstablishTlr: 3 });
        await runQuery(`UPDATE users SET subscribeForProposals=1`);
        await runQuery(`UPDATE matches SET challengerMatches=3, acceptorMatches=3`);

        // Emulate player2@gmail.com has really high TLR
        await runQuery(`UPDATE matches SET challengerElo=3000 WHERE challengerId=1 || challengerId=18`);
        await runQuery(`UPDATE matches SET acceptorElo=3000 WHERE acceptorId=1 || acceptorId=18`);

        // Emulate player3@gmail.com played not enough matches to establish TLR
        await runQuery(`UPDATE matches SET challengerMatches=2 WHERE challengerId=4`);
        await runQuery(`UPDATE matches SET acceptorMatches=2 WHERE acceptorId=4`);

        await page.goto('/season/2021/spring/men-35');
        await overview.proposeMatchButton.click();
        await proposal.pickSundayNextWeek();
        await proposal.placeField.fill('Bond park');
        await proposal.advancedSettingsLink.click();
        await expect(common.modal).toContainText('Visible to 3 players');
        await page.locator('label').getByText('Competitive proposal').click();
        await expect(common.modal).toContainText('Visible to 1 player');
        await common.modal.locator('button').getByText('Propose match').click();

        await expect(common.alert).toContainText('has been added');

        await expectRecordToExist('matches', { place: 'Bond park' }, { isCompetitive: 1 });
        const email = await expectRecordToExist('emails', { recipientEmail: 'player3@gmail.com' });
        await expect(email.subject).toContain('Ben Done proposed a new match for Sun');

        const Proposal = page.locator('[data-proposal]').getByText('Bond park');
        await expect(Proposal).toBeVisible();

        await login.loginAsPlayer2();
        await page.goto('/season/2021/spring/men-35');
        await expect(common.body).toContainText('Proposals');
        await expect(Proposal).toBeHidden();
        await page.locator('a').getByText('Proposals').click();
        await expect(Proposal).toBeHidden();

        await login.loginAsPlayer4();
        await page.goto('/season/2021/spring/men-35');
        await expect(common.body).toContainText('Proposals');
        await expect(Proposal).toBeHidden();
        await page.locator('a').getByText('Proposals').click();
        await expect(Proposal).toBeHidden();

        // Check guests
        await login.logout();
        await page.goto('/season/2021/spring/men-35');
        await expect(common.body).toContainText('Proposals');
        await expect(Proposal).toBeHidden();
        await page.locator('a').getByText('Proposals').click();
        await expect(Proposal).toBeHidden();
    });

    test('Should add age-compatible proposal', async ({ page, common, login, overview, proposal }) => {
        await runQuery(`UPDATE users SET birthday="1950-01-01" WHERE id=2`);
        await runQuery(`UPDATE users SET subscribeForProposals=1`);

        await page.goto('/season/2021/spring/men-35');
        await overview.proposeMatchButton.click();
        await proposal.pickSundayNextWeek();
        await proposal.placeField.fill('Bond park');
        await proposal.advancedSettingsLink.click();
        await expect(proposal.playerNumberBadge).toContainText('3 players');
        await proposal.ageCompatibleField.click();
        await expect(proposal.playerNumberBadge).toContainText('2 players');

        await common.modal.locator('button').getByText('Propose match').click();
        await expect(common.alert).toContainText('has been added');

        await expectRecordToExist('matches', { place: 'Bond park' }, { isAgeCompatible: 1 });
        const email = await expectRecordToExist('emails', { recipientEmail: 'player3@gmail.com,player4@gmail.com' });
        await expect(email.subject).toContain('Ben Done proposed a new match for Sun');

        const Proposal = page.locator('[data-proposal]').getByText('Bond park');
        await expect(Proposal).toBeVisible();

        await login.loginAsPlayer2();
        await page.goto('/season/2021/spring/men-35');
        await expect(overview.openProposalsArea).toBeVisible();
        await expect(Proposal).toBeHidden();
        await page.locator('a').getByText('Proposals').click();
        await expect(Proposal).toBeHidden();

        await login.loginAsPlayer3();
        await page.goto('/season/2021/spring/men-35');
        await expect(overview.openProposalsArea).toBeVisible();
        await expect(Proposal).toBeVisible();
        await page.locator('a').getByText('Proposals').click();
        await expect(Proposal).toBeVisible();

        await login.loginAsPlayer4();
        await page.goto('/season/2021/spring/men-35');
        await expect(overview.openProposalsArea).toBeVisible();
        await expect(Proposal).toBeVisible();
        await page.locator('a').getByText('Proposals').click();
        await expect(Proposal).toBeVisible();

        // Check guests
        await login.logout();
        await page.goto('/season/2021/spring/men-35');
        await expect(overview.openProposalsArea).toBeVisible();
        await expect(Proposal).toBeHidden();
        await page.locator('a').getByText('Proposals').click();
        await expect(Proposal).toBeHidden();
    });

    test('Should send emails to everybody', async ({ page, common, login, overview, proposal }) => {
        await runQuery(`UPDATE users SET subscribeForProposals=1`);

        await page.goto('/season/2021/spring/men-35');
        await overview.proposeMatchButton.click();
        await proposal.pickSundayNextWeek();
        await proposal.placeField.fill('Bond park');
        await common.modal.locator('button').getByText('Propose match').click();
        await expect(common.alert).toContainText('has been added');

        const email = await expectRecordToExist('emails', {
            recipientEmail: 'player2@gmail.com,player3@gmail.com,player4@gmail.com',
        });
        await expect(email.subject).toContain('Ben Done proposed a new match for Sun');
    });

    test('Should send correct emails with play format filter', async ({ page, common, login, overview, proposal }) => {
        await runQuery(`UPDATE users SET subscribeForProposals=1`);
        const filter = JSON.stringify({ subscribeForProposals: { playFormats: [1, 2, 99] } });
        await runQuery(`UPDATE users SET information='${filter}' WHERE id=2`);

        await page.goto('/season/2021/spring/men-35');
        await overview.proposeMatchButton.click();
        await proposal.pickSundayNextWeek();
        await proposal.placeField.fill('Bond park');
        await common.modal.locator('button').getByText('Propose match').click();
        await expect(common.alert).toContainText('has been added');

        const email = await expectRecordToExist('emails', { recipientEmail: 'player3@gmail.com,player4@gmail.com' });
        await expect(email.subject).toContain('Ben Done proposed a new match for Sun');
    });

    test('Should send correct emails with playing at that day filter', async ({
        page,
        common,
        login,
        overview,
        proposal,
    }) => {
        const filter = JSON.stringify({ subscribeForProposals: { onlyNotPlaying: true } });
        const sundayNextWeek = dayjs.tz().add(1, 'week').isoWeekday(7).hour(12).format('YYYY-MM-DD HH:mm:ss');
        await runQuery(`UPDATE users SET subscribeForProposals=1, information='${filter}'`);
        await runQuery(`UPDATE matches SET playedAt="${sundayNextWeek}" WHERE id=9`);

        await page.goto('/season/2021/spring/men-35');
        await overview.proposeMatchButton.click();
        await proposal.pickSundayNextWeek();
        await proposal.placeField.fill('Bond park');
        await common.modal.locator('button').getByText('Propose match').click();
        await expect(common.alert).toContainText('has been added');

        const email = await expectRecordToExist('emails', { recipientEmail: 'player3@gmail.com,player4@gmail.com' });
        expect(email.subject).toContain('Ben Done proposed a new match for Sun');
    });

    test('Should send correct emails with competitive proposal filter', async ({
        page,
        common,
        login,
        overview,
        proposal,
    }) => {
        await runQuery(`UPDATE users SET subscribeForProposals=1`);
        const filter = JSON.stringify({ subscribeForProposals: { onlyCompetitive: true } });
        await runQuery(`UPDATE users SET information='${filter}' WHERE id=2`);

        await overrideConfig({ minMatchesToEstablishTlr: 3 });
        await runQuery(`UPDATE matches SET challengerMatches=3, acceptorMatches=3`);

        // Emulate player2@gmail.com has really high TLR
        await runQuery(`UPDATE matches SET challengerElo=3000 WHERE challengerId=1 || challengerId=18`);
        await runQuery(`UPDATE matches SET acceptorElo=3000 WHERE acceptorId=1 || acceptorId=18`);

        await page.goto('/season/2021/spring/men-35');
        await overview.proposeMatchButton.click();
        await proposal.pickSundayNextWeek();
        await proposal.placeField.fill('Bond park');
        await common.modal.locator('button').getByText('Propose match').click();
        await expect(common.alert).toContainText('has been added');

        const email = await expectRecordToExist('emails', { recipientEmail: 'player3@gmail.com,player4@gmail.com' });
        await expect(email.subject).toContain('Ben Done proposed a new match for Sun');
    });

    test('Should send correct emails with age-compatible proposal filter', async ({
        page,
        common,
        login,
        overview,
        proposal,
    }) => {
        await runQuery(`UPDATE users SET subscribeForProposals=1`);
        const filter = JSON.stringify({ subscribeForProposals: { onlyAgeCompatible: true } });
        await runQuery(`UPDATE users SET information='${filter}', birthday="1950-01-01" WHERE id=2`);

        await page.goto('/season/2021/spring/men-35');
        await overview.proposeMatchButton.click();
        await proposal.pickSundayNextWeek();
        await proposal.placeField.fill('Bond park');
        await common.modal.locator('button').getByText('Propose match').click();
        await expect(common.alert).toContainText('has been added');

        const email = await expectRecordToExist('emails', { recipientEmail: 'player3@gmail.com,player4@gmail.com' });
        await expect(email.subject).toContain('Ben Done proposed a new match for Sun');
    });

    test('Should send correct emails with weekly schedule age-compatible proposal filter', async ({
        page,
        common,
        login,
        overview,
        proposal,
    }) => {
        await runQuery(`UPDATE users SET subscribeForProposals=1`);
        const filter = JSON.stringify({
            subscribeForProposals: {
                onlyMySchedule: true,
                weeklySchedule: [[[6, 21]], [[6, 21]], [[6, 21]], [[6, 21]], [[6, 21]], [[6, 21]], []],
            },
        });
        await runQuery(`UPDATE users SET information='${filter}', birthday="1950-01-01" WHERE id=2`);

        await page.goto('/season/2021/spring/men-35');
        await overview.proposeMatchButton.click();
        await proposal.pickSundayNextWeek();
        await proposal.placeField.fill('Bond park');
        await common.modal.locator('button').getByText('Propose match').click();
        await expect(common.alert).toContainText('has been added');

        const email = await expectRecordToExist('emails', { recipientEmail: 'player3@gmail.com,player4@gmail.com' });
        expect(email.subject).toContain('Ben Done proposed a new match for Sun');
    });

    test('Should send proposal which can satisfy all filters', async ({ page, common, login, overview, proposal }) => {
        await runQuery(`UPDATE users SET subscribeForProposals=1`);
        const filter = JSON.stringify({
            subscribeForProposals: {
                playFormats: [2],
                onlyNotPlaying: true,
                onlyCompetitive: true,
                onlyAgeCompatible: true,
                onlyMySchedule: true,
                weeklySchedule: [[], [], [], [], [], [], [[17, 18]]],
            },
        });
        await runQuery(`UPDATE users SET information='${filter}', birthday="1950-01-01"`);

        // Emulate everybody has similar TLR
        await overrideConfig({ minMatchesToEstablishTlr: 3 });
        await runQuery(`UPDATE matches SET challengerElo=300, acceptorElo=300, challengerMatches=3, acceptorMatches=3`);

        await page.goto('/season/2021/spring/men-35');
        await overview.proposeMatchButton.click();
        await proposal.pickSundayNextWeek();
        await proposal.placeField.fill('Bond park');
        await proposal.advancedSettingsLink.click();
        await common.modal.locator('button').getByText('Fast4').click();

        await common.modal.locator('button').getByText('Propose match').click();
        await expect(common.alert).toContainText('has been added');

        const email = await expectRecordToExist('emails', {
            recipientEmail: 'player2@gmail.com,player3@gmail.com,player4@gmail.com',
        });
        expect(email.subject).toContain('Ben Done proposed a new match for Sun');
    });

    test('Should not see the new players proposals for soft-banned user', async ({
        page,
        common,
        login,
        overview,
        proposal,
    }) => {
        await runQuery(`UPDATE users SET isSoftBan=1 WHERE id=2`);
        await runQuery(`UPDATE matches SET challengerId=4 WHERE id=6`);
        await overrideConfig({ minMatchesToEstablishTlr: 4 });

        await login.loginAsPlayer2();
        await page.goto('/season/2021/spring/men-35');

        await expect(overview.openProposalsArea).toContainText('Millbrook');
        await expect(overview.openProposalsArea).toContainText('Lake Lynn');
        await expect(overview.openProposalsArea).not.toContainText('Pullen');

        await page.goto('/season/2021/spring/men-35/proposals');
        await expect(common.body).toContainText('Millbrook');
        await expect(common.body).toContainText('Lake Lynn');
        await expect(common.body).not.toContainText('Pullen');
    });

    test('Should not see the soft-banned user proposal for new players', async ({
        page,
        common,
        login,
        overview,
        proposal,
    }) => {
        await runQuery(`UPDATE users SET isSoftBan=1 WHERE id=2`);

        await login.loginAsPlayer4();
        await page.goto('/season/2021/spring/men-35');

        await expect(overview.openProposalsArea).toContainText('Pullen');
        await expect(overview.openProposalsArea).toContainText('Millbrook');
        await expect(overview.openProposalsArea).not.toContainText('Lake Lynn');

        await page.goto('/season/2021/spring/men-35/proposals');
        await expect(common.body).toContainText('Pullen');
        await expect(common.body).toContainText('Millbrook');
        await expect(common.body).not.toContainText('Lake Lynn');
    });

    test("The soft-banned user adds a proposal and new players won't get an email", async ({
        page,
        common,
        login,
        overview,
        proposal,
    }) => {
        await runQuery(`UPDATE users SET subscribeForProposals=1`);
        await runQuery(`UPDATE users SET isSoftBan=1 WHERE id=2`);
        await overrideConfig({ minMatchesToEstablishTlr: 3 });

        await login.loginAsPlayer2();
        await page.goto('/season/2021/spring/men-35');

        await overview.proposeMatchButton.click();
        await proposal.pickSundayNextWeek();
        await proposal.placeField.fill('Bond park');
        await common.modal.locator('button').getByText('Propose match').click();
        await expect(common.alert).toContainText('has been added');

        const emailSent = await expectRecordToExist('emails', {
            recipientEmail: 'player1@gmail.com,player3@gmail.com',
        });
        expect(emailSent.subject).toContain('Gary Mill proposed a new match for Sun');
    });

    test("The new user adds a proposal and soft-banned players won't get an email", async ({
        page,
        common,
        login,
        overview,
        proposal,
    }) => {
        await runQuery(`UPDATE users SET subscribeForProposals=1`);
        await runQuery(`UPDATE users SET isSoftBan=1 WHERE id=2`);
        await overrideConfig({ minMatchesToEstablishTlr: 3 });

        await login.loginAsPlayer4();
        await page.goto('/season/2021/spring/men-35');

        await overview.proposeMatchButton.click();
        await proposal.pickSundayNextWeek();
        await proposal.placeField.fill('Bond park');
        await common.modal.locator('button').getByText('Propose match').click();
        await expect(common.alert).toContainText('has been added');

        const emailSent = await expectRecordToExist('emails', {
            recipientEmail: 'player1@gmail.com,player3@gmail.com',
        });
        expect(emailSent.subject).toContain('Matthew Burt proposed a new match for Sun');
    });

    test('Should add proposal for Fast4 match', async ({ page, common, login, overview, proposal }) => {
        await page.goto('/season/2021/spring/men-35');
        await overview.proposeMatchButton.click();
        await proposal.pickSundayNextWeek();
        await proposal.placeField.fill('Bond park');
        await proposal.advancedSettingsLink.click();

        await page.locator('button').getByText('Fast4').click();
        await common.modal.locator('button').getByText('Propose match').click();
        await expect(common.alert).toContainText('has been added');

        await expectRecordToExist('matches', { place: 'Bond park' }, { matchFormat: 2 });

        const Proposal = overview.openProposalsArea.locator('[data-proposal]', { hasText: 'Bond park' });
        await expect(Proposal).toContainText('Fast4');

        const emailSent = await expectRecordToExist('emails', {
            recipientEmail: 'player2@gmail.com',
        });
        expect(emailSent.subject).toContain('Ben Done proposed a new match for Sun');
        expect(emailSent.html).toContain('Match format:</b> Fast4');
    });

    test('Should accept Fast4 proposal', async ({ page, common, login, overview }) => {
        await runQuery(`UPDATE matches SET matchFormat=2 WHERE id=6`);

        await page.goto('/season/2021/spring/men-35');
        const Proposal = page.locator('[data-proposal="6"]');

        await Proposal.locator('button').getByText('Accept').click();
        await expect(common.modal).toContainText('Please confirm');
        await expect(common.modal).toContainText('This is a Fast4 match proposal following these rules');
        await common.modal.locator('button').getByText('Accept').click();
        await expect(common.alert).toContainText('has been accepted');

        await expect(Proposal).toBeHidden();

        const Match = overview.upcomingMatchesArea.locator('[data-match="6"]');
        await expect(Match).toContainText('Cristopher');
        await Match.locator('[data-match-actions="6"]').click();
        await expect(page.locator('[data-match-actions-content]')).toContainText('Fast4');
    });
})();

(() => {
    test('Should see all proposals', async ({ page, common, login }) => {
        await page.goto('/season/2021/spring/men-35/proposals');

        await expect(page.locator('[data-proposal="7"] button')).toContainText('Delete');
        await expect(page.locator('[data-proposal="7"] button')).not.toContainText('Unaccept');
        await expect(page.locator('[data-proposal="7"] button')).not.toContainText('Accept');

        await expect(page.locator('[data-proposal="6"] button')).not.toContainText('Delete');
        await expect(page.locator('[data-proposal="6"] button')).not.toContainText('Unaccept');
        await expect(page.locator('[data-proposal="6"] button')).toContainText('Accept');

        await expect(page.locator('[data-proposal="8"] button')).toContainText('Delete');
        await expect(page.locator('[data-proposal="8"] button')).not.toContainText('Unaccept');
        await expect(page.locator('[data-proposal="8"] button')).not.toContainText('Accept');

        await expect(page.locator('[data-proposal="9"] button')).not.toContainText('Delete');
        await expect(page.locator('[data-proposal="9"] button')).toContainText('Unaccept');
        await expect(page.locator('[data-proposal="9"] button')).not.toContainText('Accept');
    });

    test('Should add proposal on Proposals page', async ({ page, common, proposal }) => {
        await page.goto('/season/2021/spring/men-35/proposals');
        await page.locator('button').getByText('Propose match').click();
        await proposal.pickSundayNextWeek();
        await proposal.placeField.fill('Bond park');
        await proposal.commentField.fill('Time flexible');
        await common.modal.locator('button').getByText('Propose match').click();

        await expect(common.alert).toContainText('has been added');

        const Proposal = page.locator('[data-proposal]', { hasText: 'Bond park' });
        await expect(Proposal).toContainText('Time flexible');
        await expect(Proposal).toContainText('5:00 PM');
        await expect(Proposal).toContainText('Delete');
        await expect(Proposal).not.toContainText('Accept');
    });

    test('Should accept proposal on proposals page', async ({ page, common, login }) => {
        await page.goto('/season/2021/spring/men-35/proposals');
        const Proposal = page.locator('[data-proposal="6"]');

        await Proposal.locator('button').getByText('Accept').click();
        await common.modal.locator('button').getByText('Accept').click();
        await expect(common.alert).toContainText('has been accepted');

        await expect(Proposal.locator('button').getByText('Unaccept')).toBeVisible();
    });

    test('Should delete my proposal on proposals page', async ({ page, common, login }) => {
        await page.goto('/season/2021/spring/men-35/proposals');
        const Proposal = page.locator('[data-proposal="7"]');

        await Proposal.locator('button').getByText('Delete').click();
        await expect(common.modal).toContainText('Please confirm');
        await common.modal.locator('button').getByText('Delete').click();
        await expect(common.alert).toContainText('has been deleted');
        await expect(Proposal).toBeHidden();

        // Check that we didn't send any messages
        await new Promise((resolve) => setTimeout(resolve, 500));
        expect(await getNumRecords('emails')).toBe(0);
    });

    test('Should delete my accepted proposal on proposals page', async ({ page, common, login }) => {
        await runQuery(`UPDATE matches SET challengerId=2, acceptorId=1 WHERE id=9`);

        await page.goto('/season/2021/spring/men-35/proposals');
        const Proposal = page.locator('[data-proposal="9"]');

        await Proposal.locator('button').getByText('Delete').click();
        await expect(common.modal).toContainText('Gary Mill already accepted your proposal.');
        await expect(common.modal).not.toContainText('Be aware');
        await page.locator('input[name="reason"]').fill('I am sick');
        await common.modal.locator('button').getByText('Delete proposal').click();
        await expect(common.alert).toContainText('has been deleted');

        await expect(page.locator('[data-match-actions="9"]')).toBeHidden();

        // Check that the message has been sent
        await new Promise((resolve) => setTimeout(resolve, 500));
        const emailSent = await getRecord('emails', { recipientEmail: 'player2@gmail.com' });
        expect(emailSent.subject).toContain('Ben Done deleted the proposal for');
        expect(emailSent.html).toContain('Ben Done');
        expect(emailSent.html).toContain('I am sick');
        expect(emailSent.html).toContain('deleted the proposal');
        expect(emailSent.html).toContain('player1@gmail.com');
        expect(emailSent.html).toContain('123-456-7890');
        expect(emailSent.html).toContain('sms:1234567890');
    });

    test('Should see a warning about default when deleting an accepted proposal', async ({ page, common, login }) => {
        const dataIn23Hours = dayjs.tz().add(23, 'hour').format('YYYY-MM-DD HH:mm:ss');
        await runQuery(`UPDATE matches SET challengerId=2, acceptorId=1, playedAt="${dataIn23Hours}" WHERE id=9`);

        await page.goto('/season/2021/spring/men-35/proposals');
        const Proposal = page.locator('[data-proposal="9"]');

        await Proposal.locator('button').getByText('Delete').click();
        await page.locator('input[name="reason"]').fill('I am sick');
        await expect(common.modal).toContainText('Be aware');
    });

    test('Should cancel already accepted proposal on proposals page', async ({ page, common, login }) => {
        await page.goto('/season/2021/spring/men-35/proposals');
        const Proposal = page.locator('[data-proposal="9"]');
        await Proposal.locator('button').getByText('Unaccept').click();
        await page.locator('input[name="reason"]').fill('I am sick');
        await common.modal.locator('button').getByText('Unaccept proposal').click();
        await expect(common.alert).toContainText('has been unaccepted');

        await expect(Proposal).not.toContainText('Accepted by');

        // Check that the message has been sent
        await new Promise((resolve) => setTimeout(resolve, 500));
        const emailSent = await getRecord('emails', { recipientEmail: 'player2@gmail.com' });
        expect(emailSent.subject).toContain('Ben Done unaccepted the proposal for');
        expect(emailSent.html).toContain('Ben Done');
        expect(emailSent.html).toContain('unaccepted the proposal');
        expect(emailSent.html).toContain('player1@gmail.com');
        expect(emailSent.html).toContain('123-456-7890');
        expect(emailSent.html).toContain('sms:1234567890');
    });
})();

// Expired proposals
(() => {
    const dateTwoDaysAgo = dayjs.tz().subtract(2, 'day').format('YYYY-MM-DD HH:mm:ss');

    test('See old proposals as expired', async ({ page, common, login }) => {
        await runQuery(`UPDATE matches SET playedAt="${dateTwoDaysAgo}" WHERE initial=1`);

        await page.goto('/season/2021/spring/men-35/proposals');
        await expect(common.body).not.toContainText('Unaccept');
        await expect(common.body).not.toContainText('Delete');
    });

    test('Should show error when accepting old proposal', async ({ page, common, login }) => {
        const Proposal = page.locator('[data-proposal="6"]');

        await page.goto('/season/2021/spring/men-35');
        await expect(Proposal).toBeVisible();

        await runQuery(`UPDATE matches SET playedAt="${dateTwoDaysAgo}" WHERE initial=1`);

        await Proposal.locator('button').getByText('Accept').click();
        await common.modal.locator('button').getByText('Accept').click();
        await expect(common.alert).toContainText('The proposal is expired');
        await expect(common.loader).toBeHidden();
    });

    test('Should show error when proposal is already accepted', async ({ page, common, login }) => {
        const Proposal = page.locator('[data-proposal="6"]').first();

        await page.goto('/season/2021/spring/men-35');
        await expect(Proposal).toBeVisible();

        await Proposal.locator('button').getByText('Accept').click();

        await runQuery(`UPDATE matches SET acceptorId=1, acceptedAt="${dateTwoDaysAgo}" WHERE id=6`);
        cleanRedisCache();

        await common.modal.locator('button').getByText('Accept').click();
        await expect(common.alert).toContainText('The proposal is already accepted by Gary Mill.');
        await expect(common.loader).toBeHidden();
        await expect(Proposal).toBeHidden();
    });
})();

// Friendly proposals
(() => {
    const dateTwoDaysAgo = dayjs.tz().subtract(2, 'day').format('YYYY-MM-DD HH:mm:ss');

    test('Should create friendly proposal', async ({ page, common, proposal, overview }) => {
        await runQuery(`UPDATE seasons SET endDate="${dateTwoDaysAgo}" WHERE id=1`);

        await page.goto('/season/2021/spring/men-35');

        await overview.proposeFriendlyMatchButton.click();
        await expect(common.modal).toContainText("The score isn't reported for friendly match.");
        await proposal.pickSundayNextWeek();
        await proposal.placeField.fill('Bond park');
        await proposal.commentField.fill('Time flexible');
        await common.modal.locator('button').getByText('Propose match').click();

        await expect(common.alert).toContainText('has been added');

        await new Promise((resolve) => setTimeout(resolve, 500)); // to save emails in DB
        const emailSent = await getRecord('emails');
        expect(emailSent.to).toContain('player2@gmail.com');
        expect(emailSent.subject).toContain('Ben Done proposed a new friendly match');
        expect(emailSent.subject).toContain('5:00 PM');
        expect(emailSent.html).toContain('Men 3.5');
        expect(emailSent.html).toContain('5:00 PM');
        expect(emailSent.html).toContain('Ben Done');
        expect(emailSent.html).toContain('Bond park');
        expect(emailSent.html).toContain('Time flexible');

        const Proposal = page.locator('[data-proposal]', { hasText: 'Bond park' });
        await expect(Proposal).toContainText('Time flexible');
        await expect(Proposal).toContainText('5:00 PM');
        await expect(Proposal).toContainText('Delete');
        await expect(Proposal).not.toContainText('Accept');

        // Delete my proposal
        await Proposal.locator('button').getByText('Delete').click();
        await common.modal.locator('button').getByText('Delete').click();
        await expect(common.alert).toContainText('has been deleted');
        await expect(Proposal).toBeHidden();
    });

    test('Should accept friendly proposal', async ({ page, common, login }) => {
        await runQuery(`UPDATE seasons SET endDate="${dateTwoDaysAgo}" WHERE id=1`);

        await page.goto('/season/2021/spring/men-35');
        const Proposal = page.locator('[data-proposal="6"]');

        await Proposal.locator('button').getByText('Accept').click();
        await common.modal.locator('button').getByText('Accept').click();
        await expect(common.alert).toContainText('has been accepted');
        await expect(Proposal).toBeHidden();

        // Check that email is sent
        await new Promise((resolve) => setTimeout(resolve, 500));
        const emailSent = await getRecord('emails', { recipientEmail: 'player3@gmail.com' });
        expect(emailSent.subject).toContain('Ben Done accepted the match proposal for');
        expect(emailSent.html).toContain('Ben Done</a></b> accepted the proposal for a match in Men 3.5.');
        expect(emailSent.html).toContain('player1@gmail.com');
        expect(emailSent.html).toContain('123-456-7890');
        expect(emailSent.html).toContain('sms:1234567890');
    });

    test('Should cancel already accepted friendly proposal on proposals page', async ({ page, common, login }) => {
        await runQuery(`UPDATE seasons SET endDate="${dateTwoDaysAgo}" WHERE id=1`);

        await page.goto('/season/2021/spring/men-35/proposals');
        const Proposal = page.locator('[data-proposal="9"]');

        await Proposal.locator('button').getByText('Unaccept').click();
        await page.locator('input[name="reason"]').fill('I am sick');
        await common.modal.locator('button').getByText('Unaccept proposal').click();
        await expect(common.alert).toContainText('has been unaccepted');

        await expect(Proposal).not.toContainText('Accepted by');
    });

    test('Should create friendly proposal on proposals page', async ({ page, common, login }) => {
        await runQuery(`UPDATE seasons SET endDate="${dateTwoDaysAgo}" WHERE id=1`);

        await page.goto('/season/2021/spring/men-35/proposals');
        await page.locator('button').getByText('Propose match').click();
        await expect(common.modal.locator('button').getByText('Propose match')).toBeVisible();
    });
})();
