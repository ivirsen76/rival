import { test, expect } from './base';
import { restoreDb } from './db';

test.beforeEach(async ({ page }) => {
    restoreDb();
});

test('We can see email and password for any user', async ({ page, common, login }) => {
    await login.loginAsManager();
    await page.goto('/player/ben-done');
    await expect(common.body).toContainText('player1@gmail.com');
    await expect(common.body).toContainText('123-456-7890');
});

test('We can see admin interface', async ({ page, common, login }) => {
    await login.loginAsManager();
    await page.goto('/admin');
    await expect(page.locator('a.nav-link').getByText('Levels')).toBeVisible();
    await expect(page.locator('a.nav-link').getByText('Seasons')).toBeVisible();
    await expect(page.locator('a.nav-link').getByText('Managers')).toBeHidden();
});
