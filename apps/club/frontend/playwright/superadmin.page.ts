import { test, expect } from './base';
import { restoreDb, expectRecordToExist, runQuery } from '@rival/club.backend/src/db/helpers';

test.beforeEach(async ({ page }) => {
    restoreDb();
});

test('We can see player actions', async ({ page, common, login }) => {
    await login.loginAsSuperadmin();
    await page.goto('/player/ben-done');
    await expect(page.locator('button').getByText('Emails')).toBeVisible();
    await expect(page.locator('button').getByText('Login as player')).toBeVisible();
});

test('We can login as another player', async ({ page, common, login, homepage }) => {
    await runQuery('UPDATE users SET loggedAt="2025-01-01 11:11:11" WHERE id=1');

    await login.loginAsSuperadmin();
    await page.goto('/player/ben-done');
    await page.locator('button').getByText('Login as player').click();

    await expect(page.locator('[data-logged-user]')).toContainText('Ben Done');
    await expectRecordToExist('users', { id: 1 }, { loggedAt: '2025-01-01 11:11:11' });

    await page.locator('[data-top-menu] a').getByText('Ben Done').click();
    await page.locator('[data-top-menu] a').getByText('Return to Super Admin').click();

    await expect(page.locator('[data-logged-user]')).toContainText('Super Admin');
    await homepage.checkVisible();
});
