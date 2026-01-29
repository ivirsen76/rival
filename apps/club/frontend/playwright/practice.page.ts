import { test, expect } from './base';
import { restoreDb, runQuery, expectRecordToExist } from '@rival/club.backend/src/db/helpers';
import dayjs from '@rival/club.backend/src/utils/dayjs';

test.beforeEach(async ({ login }) => {
    restoreDb();
});

test('Should create proposal and see all proposals on overview page', async ({
    page,
    common,
    login,
    overview,
    proposal,
}) => {
    await runQuery(`UPDATE users SET subscribeForProposals=1`);

    await login.loginAsPlayer1();
    await page.goto('/season/2021/spring/men-35');

    await overview.clickOtherAction('Propose practice');
    await proposal.pickSundayNextWeek();
    await proposal.placeField.fill('Bond park');
    await common.modal.locator('label').getByText('Practice points').click();
    await common.modal.locator('button').getByText('30 minutes').click();
    await proposal.commentField.fill('Time flexible');
    await common.modal.locator('button').getByText('Propose practice').click();
    await expect(common.alert).toContainText('Your proposal has been added.');

    await expectRecordToExist(
        'matches',
        { place: 'Bond park' },
        { challengerId: 2, practiceType: 2, duration: 30, comment: 'Time flexible' }
    );

    const email = await expectRecordToExist('emails', {
        recipientEmail: 'player2@gmail.com,player3@gmail.com,player4@gmail.com',
    });
    expect(email.subject).toContain('Ben Done proposed a new practice for');
    expect(email.subject).toContain('5:00 PM');
    expect(email.html).toContain('5:00 PM');
    expect(email.html).toContain('Ben Done');
    expect(email.html).toContain('Bond park');
    expect(email.html).toContain('Time flexible');
    expect(email.html).toContain('Practice points');
    expect(email.html).toContain('30 minutes');
    expect(email.html).toContain('/player/ben-done');

    await expect(overview.openProposalsArea).toContainText('Bond park');
    await expect(overview.openProposalsArea).toContainText('Time flexible');
    await expect(overview.openProposalsArea).toContainText('Practice points');
    await expect(overview.openProposalsArea).toContainText('30 minutes');

    // Check practice badge
    await expectRecordToExist('badges', { userId: 1, code: 'practice' });
});

test('Should not see finished practice in the Upcoming Sessions list', async ({
    page,
    common,
    login,
    overview,
    proposal,
}) => {
    const thisNight = dayjs.tz().hour(3).minute(0).second(0).format('YYYY-MM-DD HH:mm:ss');
    await runQuery(`UPDATE matches SET practiceType=1, playedAt="${thisNight}" WHERE id=9`);

    await login.loginAsPlayer1();
    await page.goto('/season/2021/spring/men-35');

    await expect(overview.openProposalsArea).toBeVisible();
    await expect(overview.upcomingMatchesArea).toBeHidden();
});

test('Should create proposal with other option', async ({ page, common, login, overview, proposal }) => {
    await runQuery(`UPDATE users SET subscribeForProposals=1`);

    await login.loginAsPlayer1();
    await page.goto('/season/2021/spring/men-35');

    await overview.clickOtherAction('Propose practice');
    await proposal.pickSundayNextWeek();
    await proposal.placeField.fill('Bond park');
    await common.modal.locator('label').getByText('Other').click();
    await proposal.commentField.fill('Time flexible');
    await common.modal.locator('button').getByText('Propose practice').click();
    await expect(common.alert).toContainText('Your proposal has been added.');

    await expectRecordToExist(
        'matches',
        { place: 'Bond park' },
        { challengerId: 2, practiceType: 99, duration: 60, comment: 'Time flexible' }
    );

    const email = await expectRecordToExist('emails', {
        recipientEmail: 'player2@gmail.com,player3@gmail.com,player4@gmail.com',
    });
    expect(email.subject).toContain('Ben Done proposed a new practice for');
    expect(email.subject).toContain('5:00 PM');
    expect(email.html).toContain('5:00 PM');
    expect(email.html).toContain('Ben Done');
    expect(email.html).toContain('Bond park');
    expect(email.html).toContain('1 hour');
    expect(email.html).toContain('Time flexible');
    expect(email.html).toContain('/player/ben-done');
    expect(email.html).not.toContain('Practice type:');

    await expect(overview.openProposalsArea).toContainText('Bond park');
    await expect(overview.openProposalsArea).toContainText('Time flexible');
    await expect(overview.openProposalsArea).toContainText('1 hour');
    await expect(overview.openProposalsArea).not.toContainText('Practice');
});

test('Should accept practice proposal', async ({ page, common, login, overview, proposal }) => {
    await runQuery(`UPDATE matches SET practiceType=1, duration=60 WHERE id=6`);

    await login.loginAsPlayer1();
    await page.goto('/season/2021/spring/men-35');

    const Proposal = overview.openProposalsArea.locator('[data-proposal="6"]');
    await Proposal.locator('button').getByText('Accept').click();
    await expect(common.modal).toContainText('Please confirm you want to accept this proposal.');
    await expect(common.modal).toContainText('Practice ball striking');
    await expect(common.modal).toContainText('1 hour');
    await expect(common.modal).toContainText('This is a practice session');
    await common.modal.locator('button').getByText('Accept').click();
    await expect(common.alert).toContainText('The proposal has been accepted.');

    await expect(Proposal).toBeHidden();

    const upcomingPractice = overview.upcomingMatchesArea.locator('[data-proposal="6"]');
    await expect(upcomingPractice).toContainText('Cristopher Hamiltonbeach');

    // Check that an email is sent
    const email = await expectRecordToExist('emails', { recipientEmail: 'player3@gmail.com' });
    expect(email.replyTo).toContain('Ben Done');
    expect(email.replyTo).toContain('player1@gmail.com');
    expect(email.subject).toContain('Ben Done accepted the practice proposal for');
    expect(email.html).toContain('Raleigh, Men 3.5, Pullen, Kentwood, Time and place flexible');
    expect(email.html).toContain('Ben Done</a></b> accepted the proposal for a practice in Men 3.5.');
    expect(email.html).toContain('player1@gmail.com');
    expect(email.html).toContain('123-456-7890');
    expect(email.html).toContain('sms:1234567890');
    expect(email.html).toContain('/player/ben-done');
    expect(email.html).toContain('Practice type:');
    expect(email.html).toContain('1 hour');
    expect(email.html).toContain('Ball striking');

    await login.loginAsPlayer3();
    await page.goto('/season/2021/spring/men-35');
    await expect(upcomingPractice).toContainText('Ben Done');
});
