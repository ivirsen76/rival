import { test, expect } from './base';
import { restoreDb, runQuery } from '@rival/ladder.backend/src/db/helpers';
import dayjs from '@rival/ladder.backend/src/utils/dayjs';

test.beforeEach(async ({ page }) => {
    restoreDb();
});

test('Should sign in and sign out using menu options', async ({ page, common, login, topMenu }) => {
    await page.goto('/');
    await expect(common.body).not.toContainText('Ben Done');

    await topMenu.signInLink.click();
    await login.emailField.fill('player1@gmail.com');
    await login.passwordField.fill(login.password);
    await login.signInButton.click();

    await expect(common.body).toContainText('Ben Done');

    await topMenu.userLink.click();
    await topMenu.signOutLink.click();

    // Check that LoginLink still works
    await login.signInLink.click();
    await expect(login.signInButton).toBeVisible();
});

test('Should sign in and redirect to the current tournament', async ({ page, common, login }) => {
    await page.goto('/');
    await expect(common.body).not.toContainText('Ben Done');

    await login.signInLink.click();
    await login.emailField.fill('player1@gmail.com');
    await login.passwordField.fill(login.password);
    await login.signInButton.click();

    await expect(common.body).toContainText('Ben Done');
    await expect(common.body).toContainText('2021 Spring');
    await expect(common.body).toContainText('Men Doubles');
});

test('Should sign in and sign out using pages', async ({ page, common, login }) => {
    await page.goto('/login');
    await expect(common.body).not.toContainText('Ben Done');

    await login.emailField.fill('player1@gmail.com');
    await login.passwordField.fill(login.password);
    await login.signInButton.click();

    await expect(common.body).toContainText('Ben Done');

    await page.goto('/logout');
    await expect(common.body).toContainText('Sign in');
});

test('Should not sign in for the user who is not verified', async ({ page, common, login }) => {
    await runQuery(`UPDATE users SET isVerified=0, verificationCode="123456"`);
    await page.goto('/login');

    await login.emailField.fill('player1@gmail.com');
    await login.passwordField.fill(login.password);
    await login.signInButton.click();
    await expect(common.body).toContainText('Your email is not verified');

    await login.verifyEmailLink.click();
    await login.verifyEmail('player1@gmail.com');

    await expect(common.body).toContainText('Ben Done');
});

test('Should not sign in for the banned user', async ({ page, common, login }) => {
    const dateInWeek = dayjs.tz().add(1, 'week').format('YYYY-MM-DD HH:mm:ss');
    await runQuery(`UPDATE users SET banDate="${dateInWeek}", banReason="something" WHERE id=6`);

    await page.goto('/login');

    await login.emailField.fill('player4@gmail.com');
    await login.passwordField.fill(login.password);
    await login.signInButton.click();
    await expect(common.body).toContainText('You are banned');
});

test('Should allow to sign in for the banned user when banDate is passed', async ({ page, common, login }) => {
    const dateWeekAgo = dayjs.tz().subtract(1, 'week').format('YYYY-MM-DD HH:mm:ss');
    await runQuery(`UPDATE users SET banDate="${dateWeekAgo}", banReason="something" WHERE id=6`);

    await page.goto('/login');

    await login.emailField.fill('player4@gmail.com');
    await login.passwordField.fill(login.password);
    await login.signInButton.click();
    await expect(common.body).toContainText('Matthew Burt');
});

test('Should not allow authentificated tasks for banned user', async ({ page, common, login, overview, proposal }) => {
    await page.goto('/login');
    await login.emailField.fill('player4@gmail.com');
    await login.passwordField.fill(login.password);
    await login.signInButton.click();
    await expect(common.body).toContainText('Matthew Burt');

    await page.goto('/season/2021/spring/men-35');
    await overview.proposeMatchButton.click();
    await proposal.pickSundayNextWeek();
    await proposal.placeField.fill('Bond park');

    // Ban player at this point
    await runQuery(`UPDATE users SET banDate="2099-01-01 00:00:00", banReason="something" WHERE id=6`);

    await proposal.submitProposalButton.click();
    await expect(common.body).toContainText('Forgot password?');
});

test('Should allow authentificated tasks for banned user if banDate is passed', async ({
    page,
    common,
    login,
    overview,
    proposal,
}) => {
    await page.goto('/login');
    await login.emailField.fill('player4@gmail.com');
    await login.passwordField.fill(login.password);
    await login.signInButton.click();
    await expect(common.body).toContainText('Matthew Burt');

    await page.goto('/season/2021/spring/men-35');
    await overview.proposeMatchButton.click();
    await proposal.pickSundayNextWeek();
    await proposal.placeField.fill('Bond park');

    // Ban player at this point
    await runQuery(`UPDATE users SET banDate="2020-01-01 00:00:00", banReason="something" WHERE id=6`);

    await proposal.submitProposalButton.click();
    await expect(common.alert).toContainText('has been added');
});

test('Should show 404 error for non found page', async ({ page, common, login }) => {
    await page.goto('/wrongone');
    await expect(common.body).toContainText('Error 404');
    await expect(common.body).toContainText('Page Not Found');
    await expect(common.body).toContainText('Go home');
});

test('Should use menu links', async ({ page, common, topMenu }) => {
    await page.goto('/');
    await topMenu.getMenuLink('Seasons').click();
    await topMenu.getMenuLink('2021').hover();
    await topMenu.getMenuLink('Spring').hover();
    await topMenu.getMenuLink('Men 3.5').click();

    await expect(common.body).toContainText('Ongoing season');
});

test.describe('Mobile viewport', () => {
    test.use({ viewport: { width: 500, height: 1200 } });

    test('Should use sidebar links', async ({ page, common, sideMenu }) => {
        await page.goto('/');

        await sideMenu.sideMenuToggle.click();
        await sideMenu.getMenuLink('Seasons').click();
        await sideMenu.getMenuLink('2021').click();
        await sideMenu.getMenuLink('Spring').click();
        await sideMenu.getMenuLink('Men 3.5').click();

        await expect(common.body).toContainText('Ongoing season');
    });
});
