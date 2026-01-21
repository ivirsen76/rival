import { test, expect, Page } from './base';
import {
    restoreDb,
    getRecord,
    expectRecordToExist,
    runQuery,
    overrideConfig,
} from '@rival/ladder.backend/src/db/helpers';
import dayjs from '@rival/ladder.backend/src/utils/dayjs';
import { decrypt } from '@rival/ladder.backend/src/utils/crypt';

test.beforeEach(async ({ page }) => {
    restoreDb();
});

// Helpers
const getLocation = (page: Page) => page.evaluate(() => window.location.href);

test('Should see tournament panel even without played matches', async ({ page, common, login }) => {
    await page.goto('/player/inactive-user');
    await expect(common.body).toContainText('Men Doubles');
    await expect(common.body).toContainText('Men 3.5');
    await expect(common.body).toContainText('2021 Spring');
    await expect(common.body).toContainText('TLR not established');
});

test('Should see validation errors during changing password', async ({ page, common, login }) => {
    await login.loginAsPlayer1();
    await page.goto('/user/settings');
    await page.locator('button').getByText('Change password').click();
    await page.locator('button').getByText('Submit').click();
    await expect(common.body).toContainText('Current password is wrong');
});

test('Should show or hide age', async ({ page, common, login }) => {
    const age = '26 years old';

    await page.goto('/player/ben-done');
    await expect(common.body).toContainText('Some info about me');
    await expect(common.body).not.toContainText(age);

    await runQuery('UPDATE users SET showAge=1 WHERE id=1');
    await page.goto('/player/ben-done');
    await expect(common.body).toContainText(age);
});

test('Should change password', async ({ page, common, login }) => {
    await login.loginAsPlayer1();
    await page.goto('/user/settings');
    await page.locator('button').getByText('Change password').click();
    await page.locator('input[name=oldPassword]').fill(login.password);
    await page.locator('input[name=password]').fill('12345678');
    await page.locator('button').getByText('Submit').click();
    await expect(common.alert).toContainText('You password has been changed successfully');
    await expect(common.body).toContainText('Personal Info');

    const user = await getRecord('users', { email: 'player1@gmail.com' });
    expect(decrypt(user.salt)).toBe('12345678');

    await page.goto('/login');
    await page.locator('input[name=email]').fill('player1@gmail.com');
    await page.locator('input[name=password]').fill('12345678');
    await page.locator('button').getByText('Sign in').click();
    await expect(common.body).toContainText('Ben Done');
});

test('Should get to profile via menu', async ({ page, common, login }) => {
    await login.loginAsPlayer1();
    await page.goto('/');
    await page.locator('[data-top-menu] a').getByText('Ben Done').click();
    await page.locator('[data-top-menu] a').getByText('Settings').click();
    await expect(common.body).toContainText('Personal Info');
});

test('Should get to profile via my player page', async ({ page, common, login }) => {
    await login.loginAsPlayer1();
    await page.goto('/player/ben-done');
    await expect(common.body).toContainText('Some info about me');
    await expect(common.body).not.toContainText('Additional Info');
    await page.locator('a').getByText('Edit my profile').click();
    await expect(common.body).toContainText('Personal Info');
});

test('Should not see profile link for other players', async ({ page, common, login }) => {
    await login.loginAsPlayer1();
    await page.goto('/player/gary-mill');
    await expect(page.locator('a').getByText('Edit my profile')).toBeHidden();
});

test('Should see the login page when go to profile if not signed in', async ({ page, common, login }) => {
    await page.goto('/user/settings');

    await expect(page.locator('h3').getByText('Sign in')).toBeVisible();
    expect(await getLocation(page)).not.toContain('redirectAfterLogin');

    await login.emailField.fill('player1@gmail.com');
    await login.passwordField.fill(login.password);
    await page.locator('button').getByText('Sign in').click();

    await expect(common.body).toContainText('Personal Info');
});

test('Should see validation error on personal info form', async ({ page, common, login, user }) => {
    await login.loginAsPlayer1();
    await page.goto('/user/settings');
    await page.locator('a[data-edit-personal-info]').click();

    await user.firstNameField.fill('%^&%');
    await page.locator('button').getByText('Submit').click();

    await expect(common.modal).toContainText('First name should contain');
});

test('Should change player personal info', async ({ page, common, login, user }) => {
    await runQuery('UPDATE users SET birthday="1999-01-01" WHERE id=1');

    await login.loginAsPlayer1();
    await page.goto('/user/settings');

    const Area = page.locator('[data-personal-info-area]');
    await expect(Area).toContainText('Ben Done');
    await expect(Area).toContainText('player1@gmail.com');
    await expect(Area).toContainText('123-456-7890');
    await expect(Area).toContainText('Male');
    await expect(Area).toContainText('Some info about me');
    await expect(Area).toContainText('Jan 1, 1999');

    await page.locator('a[data-edit-personal-info]').click();

    await expect(user.firstNameField).toHaveValue('Ben');
    await expect(user.lastNameField).toHaveValue('Done');
    await expect(user.personalInfoField).toHaveValue('Some info about me');
    await expect(user.showAgeField).not.toBeChecked();

    await user.firstNameField.fill('BOB ');
    await user.lastNameField.fill(' lisson');
    await user.enterBirthday('1/1/1800');
    await user.showAgeField.click();
    await user.personalInfoField.fill('New personal information');

    await page.locator('select[name=gender]').selectOption('Female');

    await page.locator('button').getByText('Submit').click();
    await expect(common.modal).toContainText('You cannot be over 100 years old');

    await user.enterBirthday('12/7/1976');
    await page.locator('button').getByText('Submit').click();

    await expect(common.modal).toBeHidden();
    await expect(Area).toContainText('Bob Lisson');
    await expect(Area).toContainText('Female');
    await expect(Area).toContainText('New personal information');
    await expect(Area).toContainText('Dec 7, 1976');

    const { information } = await expectRecordToExist(
        'users',
        { id: 1 },
        {
            firstName: 'Bob',
            lastName: 'Lisson',
            phone: '1234567890',
            gender: 'female',
            birthday: '1976-12-07',
            showAge: 1,
        }
    );
    expect(information).toContain('"value":"Ben Done"');
    expect(information).toContain('"value":"1999-01-01"');

    await page.locator('a[data-edit-personal-info]').click();
    await expect(common.modal).toContainText('Dec 7, 1976 - 49 years old');
    await expect(user.showAgeField).toBeChecked();
});

test('Should change player email', async ({ page, common, login, user }) => {
    await runQuery('UPDATE users SET isWrongEmail=1 WHERE id=1');

    await login.loginAsPlayer1();
    await page.goto('/user/settings');
    await page.locator('button').getByText('Change email').click();

    await user.emailField.fill('player1@gmail.com');
    await page.locator('button').getByText('Submit').click();
    await expect(common.modal).toContainText("The email hasn't changed");

    await user.emailField.fill('player2@gmail.com');
    await page.locator('button').getByText('Submit').click();
    await expect(common.modal).toContainText('already used');

    await user.emailField.fill('new@gmail.com');
    await page.locator('button').getByText('Submit').click();

    await expect(common.modal).toContainText('Verify your new email');
    const Area = page.locator('[data-personal-info-area]');
    await expect(Area).toContainText('player1@gmail.com');

    await expectRecordToExist('users', { id: 1 }, { newEmail: 'new@gmail.com' });

    const emailSent = await getRecord('emails', { recipientEmail: 'new@gmail.com' });
    const emailVerificationCode = emailSent.subject.slice(0, 6);
    expect(emailVerificationCode).toMatch(/^\d{6}$/);
    expect(emailSent.html).toContain(emailVerificationCode);

    await page.locator('input[name="code"]').fill('0' + emailVerificationCode.slice(1));
    await expect(common.body).toContainText('Confirmation code is wrong');

    await page.locator('input[name="code"]').fill(emailVerificationCode);
    await expect(common.body).toContainText('Email was successfully changed');
    await expect(Area).toContainText('new@gmail.com');
    await page.locator('button').getByText('Ok, got it!').click();

    const { information } = await expectRecordToExist(
        'users',
        { id: 1 },
        { email: 'new@gmail.com', newEmail: '', newEmailCode: '', isWrongEmail: 0 }
    );
    expect(information).toContain('"value":"player1@gmail.com"');
});

test('Should change player phone', async ({ page, common, login, user }) => {
    await runQuery(`UPDATE users SET isPhoneVerified=0 WHERE id=1`);

    await login.loginAsPlayer1();
    await page.goto('/user/settings');
    await page.locator('button').getByText('Change phone').click();
    await page.locator('button').getByText('Submit').click();
    await expect(common.modal).toContainText('Phone is required');

    await user.phoneField.fill('1234567890');
    await expect(common.modal).toContainText("Your phone number hasn't changed");

    await user.phoneField.fill('1112223334');
    await page.locator('button').getByText('Submit').click();

    await expect(common.modal).toContainText('Verify your phone');
    await expect(common.modal).toContainText('111-222-3334');
    await expect(common.modal).toContainText('Resend code in 29s');

    await page.locator('input[name="code"]').fill('222222');
    await expect(common.modal).toContainText('Verifying');
    await expect(common.modal).toContainText('Confirmation code is wrong');

    await page.locator('input[name="code"]').fill('111111');
    await expect(common.modal).toContainText('Verifying');

    await expect(common.alert).toContainText('successfully changed your phone number');
    await expect(common.body).toContainText('111-222-3334');

    const { information } = await expectRecordToExist('users', { id: 1 }, { isPhoneVerified: 1, phone: '1112223334' });
    expect(information).toContain('1234567890');
});

test('Should change subscriptions', async ({ page, common, login, form }) => {
    await login.loginAsPlayer1();
    await page.goto('/user/settings');

    await page.locator('a[data-edit-subscriptions]').click();
    await page.locator('[data-button-in-row]').getByText('Regular').click();
    await page.locator('[data-button-in-row]').getByText('Practice').click();

    await expect(common.modal).not.toContainText('competitive');
    await page.locator('label').getByText('Only age suitable proposals').click();
    await page.locator('label').getByText('Only if it fits my weekly schedule').click();
    await form.selectSchedulePeriod(1, 9, 15); // merge next three periods
    await form.selectSchedulePeriod(1, 8, 12);
    await form.selectSchedulePeriod(1, 17, 20);
    await form.selectSchedulePeriod(2, 14, 10); // reverse selection
    await form.selectSchedulePeriod(2, 12, 15); // move period
    await form.selectSchedulePeriod(3, 8, 12); // normal hours
    await form.selectSchedulePeriod(3, 12, 11); // adjust duration
    await form.selectSchedulePeriod(3, 8, 7); // adjust duration
    await form.selectSchedulePeriod(4, 7, 8); // too small
    await expect(common.tooltip).toContainText('Min 2 hours');
    await expect(common.tooltip).toBeHidden();
    await page.locator('label').getByText('Badges updates').click();
    await page.locator('button').getByText('Submit').click();

    await expect(common.modal).toBeHidden();

    const user = await expectRecordToExist(
        'users',
        { id: 1 },
        {
            subscribeForProposals: 1,
            subscribeForReminders: 1,
            subscribeForNews: 1,
            subscribeForBadges: 0,
        }
    );

    const information = JSON.parse(user.information);
    expect(information).toMatchObject({
        history: {
            name: [{ value: 'Paul Pusher', date: '2020-12-12 00:00:00' }],
        },
        subscribeForProposals: {
            playFormats: [1, 2],
            onlyNotPlaying: true,
            onlyCompetitive: false,
            onlyAgeCompatible: true,
            onlyMySchedule: true,
            weeklySchedule: [
                [],
                [
                    [8, 15],
                    [17, 20],
                ],
                [[13, 17]],
                [[7, 11]],
                [],
                [],
                [],
            ],
        },
    });
});

test('Should get calendar link', async ({ page, common, login }) => {
    await login.loginAsPlayer1();
    await page.goto('/user/settings');

    await expect(common.body).toContainText('Apple Calendar');
    await page.locator('button').getByText('Copy calendar link').click();

    await expectRecordToExist('logs', { userId: 1 }, { code: 'copyCalendarLink' });
});

test('Should change player tennis style', async ({ page, common, login }) => {
    await login.loginAsPlayer1();
    await page.goto('/user/settings');
    await page.locator('a[data-edit-tennis-style]').click();

    await page.locator('select[name=dominantHand]').selectOption('Left');
    await page.locator('select[name=forehandStyle]').selectOption('One-handed');
    await page.locator('select[name=backhandStyle]').selectOption('Two-handed');
    await page.locator('select[name=playerType]').selectOption('Defensive');
    await page.locator('select[name=shot]').selectOption('Volley');

    await common.modalSubmitButton.click();
    await expect(common.modal).toBeHidden();

    const Area = page.locator('[data-tennis-style-area]');
    await expect(Area).toContainText('Left');
    await expect(Area).toContainText('One-handed');
    await expect(Area).toContainText('Two-handed');
    await expect(Area).toContainText('Defensive');
    await expect(Area).toContainText('Volley');

    await expectRecordToExist(
        'users',
        { id: 1 },
        {
            dominantHand: 'left',
            forehandStyle: 'oneHanded',
            backhandStyle: 'twoHanded',
            playerType: 'defensive',
            shot: 'volley',
        }
    );
});

test('Should change player tennis equipment', async ({ page, common, login }) => {
    await login.loginAsPlayer1();
    await page.goto('/user/settings');
    await page.locator('a[data-edit-tennis-equipment]').click();

    await page.locator('textarea[name=racquet]').fill('111');
    await page.locator('textarea[name=strings]').fill('222');
    await page.locator('textarea[name=shoes]').fill('333');
    await page.locator('textarea[name=bag]').fill('444');
    await page.locator('textarea[name=brand]').fill('555');
    await page.locator('textarea[name=overgrip]').fill('666');
    await page.locator('textarea[name=balls]').fill('777');

    await common.modalSubmitButton.click();
    await expect(common.modal).toBeHidden();

    const Area = page.locator('[data-tennis-equipment-area]');
    await expect(Area).toContainText('111');
    await expect(Area).toContainText('222');
    await expect(Area).toContainText('333');
    await expect(Area).toContainText('444');
    await expect(Area).toContainText('555');
    await expect(Area).toContainText('666');
    await expect(Area).toContainText('777');

    await expectRecordToExist(
        'users',
        { id: 1 },
        {
            racquet: '111',
            strings: '222',
            shoes: '333',
            bag: '444',
            brand: '555',
            overgrip: '666',
            balls: '777',
        }
    );
});

test('Should change appearance', async ({ page, common, login, homepage }) => {
    await login.loginAsPlayer1();
    await page.goto('/user/settings');
    await expect(page.locator('html[data-bs-theme="light"]')).toBeVisible();

    await page.locator('[data-appearance="dark"]').click();
    await expect(page.locator('html[data-bs-theme="dark"]')).toBeVisible();

    await login.logout();

    await homepage.checkVisible();
    await expect(page.locator('html[data-bs-theme="light"]')).toBeVisible();

    await login.loginAsPlayer1();
    await expect(page.locator('html[data-bs-theme="dark"]')).toBeVisible();
});

test('Should change some settings and not validate other settings', async ({ page, common, login, homepage }) => {
    // reset birthday which is not valid
    await runQuery('UPDATE users SET birthday=NULL WHERE id=1');

    await login.loginAsPlayer1();
    await page.goto('/user/settings');
    await expect(page.locator('html[data-bs-theme="light"]')).toBeVisible();

    await page.locator('[data-appearance="dark"]').click();
    await expect(page.locator('html[data-bs-theme="dark"]')).toBeVisible();

    await page.locator('a[data-edit-tennis-style]').click();
    await page.locator('select[name=dominantHand]').selectOption('Left');
    await common.modalSubmitButton.click();
    await expect(common.modal).toBeHidden();

    await expectRecordToExist('users', { id: 1 }, { appearance: 'dark', dominantHand: 'left' });
});

test('Should create avatar', async ({ page, common, login, user }) => {
    await login.loginAsPlayer1();
    await page.goto('/user/settings');
    await page.locator('button').getByText('Edit avatar').click();
    await page.locator('button[data-piece="topType"]').click();
    await page.locator('[data-piece-option="LongHairDreads"]').click();
    await page.locator('button').getByText('Save').click();

    await expect(common.modal).toBeHidden();

    const { avatarObject } = await getRecord('users', { id: 1 });
    expect(avatarObject).toContain('LongHairDreads');

    await page.locator('a[data-edit-personal-info]').click();
    await user.firstNameField.fill('Bob');
    await page.locator('button').getByText('Submit').click();
    await expect(common.modal).toBeHidden();

    const updatedUser = await getRecord('users', { id: 1 });
    expect(updatedUser.avatarObject).toContain('LongHairDreads');
});

test('Should see all avatar pieces for men', async ({ page, common, login }) => {
    await login.loginAsPlayer1();
    await page.goto('/user/settings');
    await page.locator('button').getByText('Edit avatar').click();
    await expect(page.locator('button[data-piece="facialHairType"]')).toBeVisible();

    await page.locator('button[data-piece="topType"]').click();
    await expect(page.locator('[data-piece-option="ShortHairSides"]')).toBeVisible();
    await expect(page.locator('[data-piece-option="LongHairStraight"]')).toBeVisible();
});

test('Should see all avatar pieces fro female', async ({ page, common, login }) => {
    await login.loginAsPlayer5();
    await page.goto('/user/settings');
    await page.locator('button').getByText('Create avatar').click();
    await expect(page.locator('button[data-piece="topType"]')).toBeVisible();
    await expect(page.locator('button[data-piece="facialHairType"]')).toBeVisible();

    await page.locator('button[data-piece="topType"]').click();
    await expect(page.locator('[data-piece-option="LongHairStraight"]')).toBeVisible();
    await expect(page.locator('[data-piece-option="ShortHairSides"]')).toBeVisible();
});

test('Should update first name and get a new slug', async ({ page, common, login, user, topMenu }) => {
    await login.loginAsPlayer1();

    // Cache the result
    await page.goto('/season/2021/spring/men-35');
    await expect(common.body).toContainText('Ongoing season');

    await page.locator('[data-top-menu] a').getByText('Ben Done').click();
    await page.locator('[data-top-menu] a').getByText('Settings').click();

    await page.locator('a[data-edit-personal-info]').click();
    await user.firstNameField.fill('Dude');
    await page.locator('button').getByText('Submit').click();
    await expect(common.modal).toBeHidden();

    await topMenu.getMenuLink('Seasons').click();
    await topMenu.getMenuLink('2021').click();
    await topMenu.getMenuLink('Spring').click();
    await topMenu.getMenuLink('Men 3.5').click();
    await page.locator('[data-player-list]').locator('a').getByText('Dude Done').click();

    await expect(common.body).toContainText('123-456-7890');
    expect(await getLocation(page)).toContain('dude-done');
});

test('Should see information that final tournament is canceled', async ({ page, common, login, match }) => {
    const dateOneWeekAgo = dayjs.tz().add(5, 'day').format('YYYY-MM-DD HH:mm:ss');
    await runQuery(`UPDATE seasons SET endDate="${dateOneWeekAgo}" WHERE id=1`);

    await login.loginAsPlayer1();
    await page.goto('/season/2021/spring/men-35');

    await expect(common.body).toContainText('Final Tournament');
    await expect(common.body).toContainText('No tournament is scheduled for the Men 3.5');
    await expect(common.body).toContainText('fewer than 20 matches');
    await expect(common.body).toContainText(match.REFUND_MESSAGE);
});

test('Should not see information about refund', async ({ page, common, login, match }) => {
    const dateOneWeekAgo = dayjs.tz().add(5, 'day').format('YYYY-MM-DD HH:mm:ss');
    await runQuery(`UPDATE seasons SET endDate="${dateOneWeekAgo}" WHERE id=1`);
    await runQuery(`UPDATE seasons SET isFree=1`);

    await login.loginAsPlayer1();
    await page.goto('/season/2021/spring/men-35');

    await expect(common.body).toContainText('No tournament is scheduled');
    await expect(common.body).not.toContainText(match.REFUND_MESSAGE);
});

test('Should not be able to participate in a ladder because of high TLR at the beginning of the season', async ({
    page,
    common,
    login,
    overview,
}) => {
    const dateOneWeekAgo = dayjs.tz().add(5, 'day').format('YYYY-MM-DD HH:mm:ss');
    await runQuery(`UPDATE seasons SET endDate="${dateOneWeekAgo}" WHERE id=1`);
    await runQuery(`UPDATE matches SET challengerElo=452, playedAt="2020-02-02 16:00:00" WHERE id=2`);
    await overrideConfig({ minMatchesToPlanTournament: 2, minMatchesToEstablishTlr: 1 });

    await login.loginAsPlayer1();
    await page.goto('/season/2021/spring/men-35');
    await expect(common.body).toContainText(overview.tooHighTlrAtTheSeasonStart);
    await expect(common.body).not.toContainText('I am going');
    await expect(overview.playerList.locator('[data-final-too-strong="2"]')).toBeVisible();
});

test('Should not be able to participate in a ladder because of high initial TLR', async ({
    page,
    common,
    login,
    overview,
}) => {
    const dateOneWeekAgo = dayjs.tz().add(5, 'day').format('YYYY-MM-DD HH:mm:ss');
    await runQuery(`UPDATE seasons SET endDate="${dateOneWeekAgo}" WHERE id=1`);
    await runQuery(`UPDATE matches SET challengerElo=452, challengerMatches=1 WHERE id=2`);
    await runQuery(`UPDATE matches SET challengerMatches=11 WHERE id!=2`);
    await overrideConfig({ minMatchesToPlanTournament: 2, minMatchesToEstablishTlr: 1 });

    await login.loginAsPlayer1();
    await page.goto('/season/2021/spring/men-35');
    await expect(common.body).toContainText(overview.tooHighInitialTlr);
    await expect(common.body).not.toContainText('I am going');
    await expect(overview.playerList.locator('[data-final-too-strong="2"]')).toBeVisible();
});

test('Should change readyForFinal status', async ({ page, common, login }) => {
    const dateOneWeekAgo = dayjs.tz().add(5, 'day').format('YYYY-MM-DD HH:mm:ss');
    await runQuery(`UPDATE seasons SET endDate="${dateOneWeekAgo}" WHERE id=1`);
    await overrideConfig({ minMatchesToPlanTournament: 2 });

    await login.loginAsPlayer1();
    await page.goto('/season/2021/spring/men-35');
    await expect(common.body).toContainText('Are you available to play?');
    await page.locator('a').getByText('Tournament information').click();
    await expect(common.modal).toContainText('Tournament seeding will operate');
    await expect(common.modal).toContainText('Quarterfinals are between');
    await expect(common.modal).not.toContainText('$sunday');

    await page.locator('.btn-close').click();
    await new Promise((resolve) => setTimeout(resolve, 500));

    await page.locator('button').getByText('I am going').click();
    await common.modal.locator('button').getByText('I am going').click();
    await expect(common.body).toContainText('You are registered for the tournament');
    await expect(page.locator('[data-final-available="2"]')).toBeVisible();
    await expect(common.body).toContainText('Tournament information');

    await page.locator('a').getByText('Changed your mind?').click();
    await page.locator('button').getByText('I will skip').click();
    await expect(common.body).toContainText(`You've decided to skip the tournament`);
    await expect(page.locator('[data-final-available="2"]')).toBeHidden();

    await page.locator('a').getByText('Changed your mind?').click();
    await expect(common.body).toContainText('Are you available to play?');
});

test('Should not allow to change readyForFinal status because there is no matches played', async ({
    page,
    common,
    login,
}) => {
    const dateInOneWeek = dayjs.tz().add(5, 'day').format('YYYY-MM-DD HH:mm:ss');
    const dateWeekAgo = dayjs.tz().subtract(1, 'week').format('YYYY-MM-DD HH:mm:ss');
    await runQuery(`UPDATE seasons SET endDate="${dateInOneWeek}" WHERE id=1`);
    await runQuery(`UPDATE matches SET playedAt="${dateWeekAgo}"`);
    await overrideConfig({ minMatchesToPlanTournament: 1 });

    await login.loginAsPlayer9();
    await page.goto('/season/2021/spring/men-40-dbls');
    await expect(common.body).toContainText('You must play at least one match to register for the tournament');
    await expect(common.body).toContainText('Tournament information');
});

test('Should see the tournament information', async ({ page, common, login }) => {
    const dateOneWeekAgo = dayjs.tz().add(5, 'day').format('YYYY-MM-DD HH:mm:ss');
    await runQuery(`UPDATE seasons SET endDate="${dateOneWeekAgo}" WHERE id=1`);
    await overrideConfig({ minMatchesToPlanTournament: 2 });

    await login.loginAsPlayer1();
    await page.goto('/season/2021/spring/men-35');
    await expect(common.body).toContainText('The Top 8 players');
    await expect(common.body).toContainText('Are you available to play?');
    await page.locator('a').getByText('Tournament information').click();
    await expect(common.body).toContainText('Tournament seeding will operate');
    await expect(common.body).toContainText('Quarterfinals are between Monday');
    await expect(common.body).not.toContainText('$sunday');
});

// check
test('Should not see tournamentText for Raleigh', async ({ page, common, login }) => {
    const dateOneWeekAgo = dayjs.tz().add(5, 'day').format('YYYY-MM-DD HH:mm:ss');
    await runQuery(`UPDATE seasons SET endDate="${dateOneWeekAgo}" WHERE id=1`);
    await overrideConfig({ isRaleigh: 1, minMatchesToPlanTournament: 2 });

    await login.loginAsPlayer1();
    await page.goto('/season/2021/spring/men-35');
    await expect(common.body).toContainText('Are you available to play?');
    await expect(common.body).toContainText('Tournament information');
});

test('Show see the message that the player cannot join two tournament finals', async ({ page, common, login }) => {
    const dateOneWeekAgo = dayjs.tz().add(1, 'week').format('YYYY-MM-DD HH:mm:ss');
    await runQuery(`UPDATE seasons SET endDate="${dateOneWeekAgo}" WHERE id=1`);
    await runQuery(`UPDATE players SET readyForFinal=1 WHERE id=5`);
    await overrideConfig({ minMatchesToPlanTournament: 2 });

    await login.loginAsPlayer2();
    await page.goto('/season/2021/spring/men-35');
    await expect(common.body).toContainText(`You've already signed up for the Men 4.0 tournament`);
    await expect(common.body).toContainText('Tournament information');
});

test('Do not show readyForFinal status before 2 weeks for the final', async ({ page, common, login }) => {
    await login.loginAsPlayer1();
    await page.goto('/season/2021/spring/men-35');
    await expect(common.body).toContainText('Ongoing season');
    await expect(page.locator('[data-final-participation]')).toBeHidden();
});

test('Should be able to unsubscribe from the email link', async ({ page, common, login, form }) => {
    // this link is active till December 2028
    const unsubscribeLink =
        '/action/bmFtZT11bnN1YnNjcmliZSZlbWFpbD1wbGF5ZXIxQGdtYWlsLmNvbSZkPTk0NjA4MDAwJnQ9MTc2NjU1MjM5OSZoPTI1NmQ1OTRjYmVmNTA2NWJlY2Jk';

    await page.goto(unsubscribeLink);
    await expect(common.body).toContainText('player1@gmail.com');
    await page.locator('[data-button-in-row]').getByText('Regular').click();
    await page.locator('[data-button-in-row]').getByText('Practice').click();
    await page.locator('label').getByText("Send only if I'm not playing at that day").click();
    await page.locator('label').getByText('Only competitive proposals').click();
    await page.locator('label').getByText('Only age suitable proposals').click();
    await page.locator('label').getByText('Only if it fits my weekly schedule').click();
    await form.selectSchedulePeriod(2, 10, 16);
    await form.selectSchedulePeriod(3, 7, 11);
    await page.locator('label').getByText('Ladder announcements').click();
    await page.locator('label').getByText('Badges updates').click();
    await page.locator('button').getByText('Update').click();

    await expect(common.modal).toContainText('You subscriptions successfully updated');

    const user = await expectRecordToExist(
        'users',
        { email: 'player1@gmail.com' },
        {
            subscribeForProposals: 1,
            subscribeForReminders: 1,
            subscribeForNews: 0,
            subscribeForBadges: 0,
        }
    );

    const information = JSON.parse(user.information);
    expect(information).toMatchObject({
        subscribeForProposals: {
            playFormats: [1, 2],
            onlyNotPlaying: false,
            onlyCompetitive: true,
            onlyAgeCompatible: true,
            onlyMySchedule: true,
            weeklySchedule: [[], [], [[10, 16]], [[7, 11]], [], [], []],
        },
    });
});

test('Should see Top Players stat', async ({ page, common, login }) => {
    const matches = await runQuery('SELECT * FROM matches WHERE score IS NOT NULL');
    for (const match of matches) {
        for (let i = 0; i < 20; i++) {
            await runQuery(`INSERT INTO matches (initial, challengerId, acceptorId, winner, score, playedAt)
                    VALUES (1, ${match.challengerId}, ${match.acceptorId}, ${match.winner}, "${match.score}", "2020-10-10 10:10:10")`);
        }
    }

    const notPlayersMessage = 'No players yet';
    const notInListMessage = 'You are not in this list';

    await login.loginAsPlayer1();

    await page.goto('/top');
    await expect(common.body).toContainText('Most Matches Played');
    await expect(common.body).toContainText('Cristopher Hamiltonbeach');
    await expect(common.body).toContainText('You played 105 matches (Top 25%)');
    await expect(common.body).not.toContainText(notPlayersMessage);
    await expect(common.body).not.toContainText(notInListMessage);

    await page.locator('button').getByText('Women').click();
    await expect(common.body).toContainText(notPlayersMessage);
    await expect(common.body).toContainText(notInListMessage);

    await page.locator('button').getByText('All genders').click();
    await expect(common.body).toContainText('You played 105 matches (Top 25%)');

    await page.locator('#tl-page-body a').getByText('Seasons').click();
    await expect(common.body).toContainText('Most Seasons Played');

    await page.locator('#tl-page-body a').getByText('Comebacks').click();
    await expect(common.body).toContainText('Most Comebacks');
    await expect(common.body).toContainText('You have 21 comebacks (Top 50%).');
    await expect(common.body).toContainText('Gary Mill');
});
