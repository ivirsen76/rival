import { test, expect } from './base';
import { restoreDb, runQuery } from '@rival/ladder.backend/src/db/helpers';
import dayjs from '@rival/dayjs';

test.beforeEach(async ({ page }) => {
    restoreDb();
});

const resetChangelogSeen = async () => {
    await runQuery(`UPDATE users SET changelogSeenAt=NULL WHERE id=1`);
};

const setRecentLoggedAt = async () => {
    const dateOneMonthAgo = dayjs.tz().subtract(1, 'month').format('YYYY-MM-DD HH:mm:ss');
    await runQuery(`UPDATE users SET loggedAt="${dateOneMonthAgo}" WHERE id=1`);
};

test('Can see changelog for the guests', async ({ page, common, changelog, homepage }) => {
    await page.goto('/');
    await homepage.checkVisible();
    await expect(common.modal).toBeHidden();

    await page.goto('/changelog');
    await expect(common.body).toContainText(changelog.existingHeader);
    await expect(changelog.newBadge).toBeHidden();
});

test('Can see changelog for the users', async ({ page, common, login, changelog }) => {
    await resetChangelogSeen();
    await setRecentLoggedAt();

    await login.loginAsPlayer1();
    await page.goto('/changelog');
    await expect(common.body).toContainText(changelog.existingHeader);
    await expect(changelog.newBadge).toBeVisible();
    await expect(common.modal).toBeHidden();

    // Refresh the page
    await page.goto('/changelog');
    await expect(common.body).toContainText(changelog.existingHeader);
    await expect(changelog.newBadge).toBeHidden();
});

test("Cannot see modal with new features if user haven't logged in before", async ({
    page,
    common,
    login,
    changelog,
    homepage,
}) => {
    await resetChangelogSeen();

    await login.loginAsPlayer1();
    await homepage.checkVisible();

    await new Promise((resolve) => setTimeout(resolve, 1000));
    await expect(common.modal).toBeHidden();
});

test("Cannot see modal with new features if user haven't logged in more than 3 months", async ({
    common,
    login,
    homepage,
}) => {
    await resetChangelogSeen();

    const dateFourMonthAgo = dayjs.tz().subtract(4, 'month').format('YYYY-MM-DD HH:mm:ss');
    await runQuery(`UPDATE users SET loggedAt="${dateFourMonthAgo}" WHERE id=1`);

    await login.loginAsPlayer1();
    await homepage.checkVisible();

    await new Promise((resolve) => setTimeout(resolve, 1000));
    await expect(common.modal).toBeHidden();
});

test('Can see modal with new features and dismiss it', async ({ page, common, login, changelog, homepage }) => {
    await resetChangelogSeen();
    await setRecentLoggedAt();

    await login.loginAsPlayer1();
    await page.goto('/');
    await expect(common.modal).toContainText(changelog.updatesText);
    await expect(common.modal).toContainText('more...');
    await changelog.dismissButton.click();
    await expect(common.modal).toBeHidden();

    await page.goto('/');
    await homepage.checkVisible();
    await expect(common.modal).toBeHidden();
});

test('Can see modal with new features and close it', async ({ page, common, login, changelog, homepage }) => {
    await resetChangelogSeen();
    await setRecentLoggedAt();

    await login.loginAsPlayer1();
    await page.goto('/');
    await expect(common.modal).toContainText(changelog.updatesText);
    await common.modalCloseButton.click();
    await expect(common.modal).toBeHidden();

    await page.goto('/');
    await homepage.checkVisible();
    await expect(common.modal).toBeHidden();
});

test('Can see modal with new features and go to changelog', async ({ page, common, login, changelog, homepage }) => {
    await resetChangelogSeen();
    await setRecentLoggedAt();

    await login.loginAsPlayer1();
    await page.goto('/');
    await expect(common.modal).toContainText(changelog.updatesText);
    await changelog.readMoreButton.click();
    await expect(common.modal).toBeHidden();
    await expect(common.body).toContainText("What's New on Rival");

    await page.goto('/');
    await homepage.checkVisible();
    await expect(common.modal).toBeHidden();
});

test('Do not see modal with new features on register page', async ({ page, common, login, changelog, homepage }) => {
    await resetChangelogSeen();
    await setRecentLoggedAt();

    await login.loginAsPlayer1();
    await page.goto('/register');
    await expect(common.body).toContainText('Register for 2021 Spring Season');
    await expect(common.modal).toBeHidden();
});
