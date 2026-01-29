import { test, expect } from './base';
import { restoreDb, runQuery, expectRecordToExist, getNumRecords } from '@rival/ladder.backend/src/db/helpers';
import dayjs from '@rival/dayjs';

test.beforeEach(async ({ page }) => {
    restoreDb();
});

const oneTimeBadges = [
    { code: 'avatar', emptySummary: 'and press Create avatar' },
    { code: 'profile', emptySummary: 'fill out your About' },
    { code: 'allSeasonPlayer' },
    { code: 'takeItToLimit' },
    { code: 'dedication' },
    { code: 'universalPlayer' },
    { code: 'twoTiebreaks' },
    { code: 'twoWinsOneDay' },
    { code: 'davidGoliath' },
    { code: 'feedback', emptySummary: 'send in your feedback to get this badge' },
    { code: 'doubleBagel' },
    { code: 'statistician' },
    { code: 'revenge' },
];

test('Should see the login page when go to badges if not signed in', async ({ page, common, login }) => {
    await page.goto('/user/badges');

    await expect(page.locator('h3').getByText('Sign in')).toBeVisible();

    await login.emailField.fill('player1@gmail.com');
    await login.passwordField.fill(login.password);
    await page.locator('button').getByText('Sign in').click();

    await expect(common.body).toContainText('One-Time Badges');
});

test('Should see empty state for my badges', async ({ page, common, login }) => {
    await login.loginAsPlayer8();

    await page.goto('/user/badges');
    for (const badge of oneTimeBadges) {
        await page.locator(`[data-badge="${badge.code}"]`).click();
        await expect(common.modal.locator(`[data-badge-info="${badge.code}"]`)).toBeVisible();

        if (badge.emptySummary) {
            await expect(common.modal).toContainText(badge.emptySummary);
        }

        await page.locator('[aria-label="Close"]').click();
    }
});

test('Should see some user badges', async ({ page, common, login }) => {
    await runQuery(
        `INSERT INTO badges (userId, code, achievedAt) VALUES (8, 'seasonsParticipated:1', '2023-04-09 21:58:04');`
    );
    await login.loginAsPlayer8();

    await page.goto('/player/not-played-user');
    await page.locator('[data-recent-badges]').click();

    for (const badge of oneTimeBadges) {
        await page.locator(`[data-badge="${badge.code}"]`).click();

        const BadgeInfo = page.locator(`[data-badge-info="${badge.code}"]`);
        await expect(BadgeInfo).toBeVisible();

        if (badge.emptySummary) {
            await expect(BadgeInfo).not.toContainText(badge.emptySummary);
        }

        await page.keyboard.press('Escape');
    }
});

test('Should see doubles matches in badges stats', async ({ page, common, login }) => {
    await page.goto('/player/ben-done');
    await page.locator('[data-recent-badges]').click();
    await page.locator(`[data-badge="matchesPlayed"]`).click();
    await expect(common.body).toContainText('+20');
    await expect(common.body).toContainText('Ben D.');
    await expect(common.body).toContainText('Cristopher H.');
});

test('Should get a new badge after playing a match and get an email notification and credit', async ({
    page,
    common,
    login,
    match,
}) => {
    await login.loginAsPlayer1();
    await page.goto('/season/2021/spring/men-35');

    // Edit match first just to apply all badges
    {
        await page.locator('[data-match-actions="1"]').click();
        await page.locator('[data-edit-match="1"]').click();
        await common.modal.locator('button').getByText('Report match').click();
        await expect(common.alert).toContainText('The match has been reported');
    }

    await page.locator('button').getByText('Report').click();

    await match.pickChallengerOption('Matthew Burt');

    await page.locator('button').getByText('Next').click();

    await match.pickChallengerPoints(6);
    await match.pickAcceptorPoints(7);
    await new Promise((resolve) => setTimeout(resolve, 1000));

    await match.pickChallengerPoints(6);
    await match.pickAcceptorPoints(7);

    // Remove existing emails
    await runQuery(`DELETE FROM emails;`);

    await common.modal.locator('button').getByText('Report match').click();

    // Check that an email is sent
    const emailSent = await expectRecordToExist('emails', {
        recipientEmail: 'player1@gmail.com',
        subject: 'New Badge Earned!',
    });
    expect(emailSent.html).toContain('Conqueror');
    expect(emailSent.html).toContain('Tiebreaker');
    expect(emailSent.html).toContain('Die Hard');
    expect(emailSent.html).toContain('Win a certain number of tiebreaks.');

    const badgesTotal = emailSent.html.match(/<td width="100px"/g).length;
    expect(badgesTotal).toBe(3);

    await expectRecordToExist(
        'payments',
        { userId: 1, description: 'Badge Credit (Tiebreaker: 1)', sql: 'badgeId IS NOT NULL' },
        { type: 'discount', amount: 100 }
    );

    await expectRecordToExist(
        'payments',
        { userId: 1, description: 'Badge Credit (Die Hard)', sql: 'badgeId IS NOT NULL' },
        { type: 'discount', amount: 100 }
    );
});

test('Should get a new badge after proposing a match and get an email notification', async ({
    page,
    common,
    login,
    overview,
    proposal,
}) => {
    // reduce proposal number to 4
    await runQuery(`UPDATE matches SET initial=3 WHERE id=23 OR id=7 OR id=8;`);

    await login.loginAsPlayer1();
    await page.goto('/season/2021/spring/men-35');

    // Edit match first just to apply all badges
    {
        await page.locator('[data-match-actions="1"]').click();
        await page.locator('[data-edit-match="1"]').click();
        await common.modal.locator('button').getByText('Report match').click();
        await expect(common.alert).toContainText('The match has been reported');
    }

    await overview.proposeMatchButton.click();
    await proposal.pickSundayNextWeek();
    await proposal.placeField.fill('Bond park');

    // Remove existing emails
    await runQuery(`DELETE FROM emails;`);

    await common.modal.locator('button').getByText('Propose match').click();

    // Check that an email is sent
    const emailSent = await expectRecordToExist(
        'emails',
        { recipientEmail: 'player1@gmail.com' },
        { subject: 'New Badge Earned!' }
    );
    expect(emailSent.html).toContain('Matchmaker');

    const badgesTotal = emailSent.html.match(/<td width="100px"/g).length;
    expect(badgesTotal).toBe(1);
});

test('Should get a new badge after accepting a match and get an email notification', async ({
    page,
    common,
    login,
    overview,
    proposal,
}) => {
    // let's have 4 already accepted proposals
    await runQuery(
        `UPDATE matches SET acceptorId=10, acceptedAt="${dayjs
            .tz()
            .format('YYYY-MM-DD HH:mm:ss')}" WHERE id=8 OR id=9 OR id=22 OR id=23;`
    );

    await login.loginAsPlayer8();
    await page.goto('/season/2021/spring/men-40');

    // Propose match first just to apply all badges
    {
        await overview.proposeMatchButton.click();
        await proposal.pickSundayNextWeek();
        await proposal.placeField.fill('Bond park');
        await common.modal.locator('button').getByText('Propose match').click();
        await expect(common.alert).toContainText('has been sent');
    }

    const Proposal = page.locator('[data-proposal="41"]');
    await Proposal.locator('button').getByText('Accept').click();
    await common.modal.locator('button').getByText('Accept').click();
    await expect(common.alert).toContainText('has been accepted');

    await expectRecordToExist('badges', { userId: 8, code: 'proposalsAccepted:5' });

    // Check that an email is sent
    const emailSent = await expectRecordToExist(
        'emails',
        { recipientEmail: 'player8@gmail.com' },
        { subject: 'New Badge Earned!' }
    );
    expect(emailSent.html).toContain('Game Starter');

    const badgesTotal = emailSent.html.match(/<td width="100px"/g).length;
    expect(badgesTotal).toBe(1);
});

test('Should get a new badge for feedback and get an email notification', async ({ page, common, login }) => {
    await runQuery(`UPDATE settings SET newFeedbackNotification="admin@gmail.com"`);

    await login.loginAsPlayer1();
    await page.goto('/season/2021/spring/men-35');

    // Edit match first just to apply all badges
    {
        await page.locator('[data-match-actions="1"]').click();
        await page.locator('[data-edit-match="1"]').click();
        await common.modal.locator('button').getByText('Report match').click();
        await expect(common.alert).toContainText('The match has been reported');
    }

    await page.locator('button').getByText('Support').click();
    await page.locator('h4').getByText('Ask a question').click();

    await page.locator('textarea[name="description"]').fill('Some question');

    // Remove existing emails
    await runQuery(`DELETE FROM emails;`);

    await common.modalSubmitButton.click();
    await expect(common.alert).toContainText('Thank you!');

    // Check notification
    const notificationEmail = await expectRecordToExist(
        'emails',
        { recipientEmail: 'admin@gmail.com' },
        { subject: 'Feedback - question (Raleigh)' }
    );
    expect(notificationEmail.html).toContain('Some question');

    // Check that an email is sent
    const emailSent = await expectRecordToExist(
        'emails',
        { recipientEmail: 'player1@gmail.com' },
        { subject: 'New Badge Earned!' }
    );
    expect(emailSent.html).toContain('Support Group');

    const badgesTotal = emailSent.html.match(/<td width="100px"/g).length;
    expect(badgesTotal).toBe(1);
});

test('Should get a new badge for feedback and do not get an email notification', async ({ page, common, login }) => {
    await runQuery(`UPDATE users SET subscribeForBadges=0 WHERE id=1;`);

    await login.loginAsPlayer1();
    await page.goto('/season/2021/spring/men-35');

    await page.locator('button').getByText('Support').click();
    await page.locator('h4').getByText('Ask a question').click();
    await page.locator('textarea[name="description"]').fill('Some question');
    await common.modalSubmitButton.click();
    await expect(common.alert).toContainText('Thank you!');

    await new Promise((resolve) => setTimeout(resolve, 1000));
    expect(await getNumRecords('emails')).toBe(0);
});

test('Should get a new badge for avatar and get an email notification', async ({ page, common, login }) => {
    await runQuery(`UPDATE users SET createdAt="2020-04-20 11:43:50" WHERE id=8;`);

    await login.loginAsPlayer8();
    await page.goto('/season/2021/spring/men-40');

    // Accept a match first just to apply all badges
    {
        const Proposal = page.locator('[data-proposal="41"]');
        await Proposal.locator('button').getByText('Accept').click();
        await common.modal.locator('button').getByText('Accept').click();
        await expect(common.alert).toContainText('has been accepted');
    }

    await page.goto('/user/settings');
    await page.locator('button').getByText('Create avatar').click();

    // Remove existing emails
    await runQuery(`DELETE FROM emails;`);

    await page.locator('button').getByText('Save').click();
    await expect(common.modal).toBeHidden();

    // Check that an email is sent
    const emailSent = await expectRecordToExist(
        'emails',
        { recipientEmail: 'player8@gmail.com' },
        { subject: 'New Badge Earned!' }
    );
    expect(emailSent.html).toContain('Da Vinci');

    const badgesTotal = emailSent.html.match(/<td width="100px"/g).length;
    expect(badgesTotal).toBe(1);

    const { achievedAt } = await expectRecordToExist('badges', { userId: 8, code: 'avatar' });
    expect(achievedAt).toContain(dayjs().tz().format('YYYY-MM-DD'));

    await new Promise((resolve) => setTimeout(resolve, 1000)); // to be at least one second late
    await page.locator('button').getByText('Edit avatar').click();
    await page.locator('button').getByText('Save').click();
    await expect(common.modal).toBeHidden();

    const badge = await expectRecordToExist('badges', { userId: 8, code: 'avatar' });
    expect(badge.achievedAt).toBe(achievedAt);
});

test('Should get a new badge for profile info and get an email notification', async ({ page, common, login }) => {
    await runQuery(`UPDATE users SET createdAt="2020-04-20 11:43:50" WHERE id=8;`);

    await login.loginAsPlayer8();
    await page.goto('/season/2021/spring/men-40');

    // Accept a match first just to apply all badges
    {
        const Proposal = page.locator('[data-proposal="41"]');
        await Proposal.locator('button').getByText('Accept').click();
        await common.modal.locator('button').getByText('Accept').click();
        await expect(common.alert).toContainText('has been accepted');
    }

    await page.goto('/user/settings');

    // Remove existing emails
    await runQuery(`DELETE FROM emails;`);

    // Change tennis style
    await page.locator('a[data-edit-tennis-style]').click();
    await page.locator('select[name=dominantHand]').selectOption('Left');
    await common.modalSubmitButton.click();
    await expect(common.modal).toBeHidden();

    // Change tennis equipment
    await page.locator('a[data-edit-tennis-equipment]').click();
    await page.locator('textarea[name=racquet]').fill('111');
    await common.modalSubmitButton.click();
    await expect(common.modal).toBeHidden();

    // Change About Me section
    await page.locator('a[data-edit-personal-info]').click();
    await page.locator('textarea[name=personalInfo]').fill('New personal information');
    await page.locator('button').getByText('Submit').click();
    await expect(common.modal).toBeHidden();

    // Check that an email is sent
    const emailSent = await expectRecordToExist(
        'emails',
        { recipientEmail: 'player8@gmail.com' },
        { subject: 'New Badge Earned!' }
    );
    expect(emailSent.html).toContain('Construction Complete');

    const badgesTotal = emailSent.html.match(/<td width="100px"/g).length;
    expect(badgesTotal).toBe(1);

    const { achievedAt } = await expectRecordToExist('badges', { userId: 8, code: 'profile' });
    expect(achievedAt).toContain(dayjs().tz().format('YYYY-MM-DD'));

    await new Promise((resolve) => setTimeout(resolve, 1000)); // to be at least one second late
    await page.locator('a[data-edit-tennis-equipment]').click();
    await common.modalSubmitButton.click();
    await expect(common.modal).toBeHidden();

    const badge = await expectRecordToExist('badges', { userId: 8, code: 'profile' });
    expect(badge.achievedAt).toBe(achievedAt);
});
