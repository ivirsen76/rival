import { test, expect } from './base';
import { restoreDb, expectRecordToExist } from '@rival/club.backend/src/db/helpers';

test.beforeEach(async ({ page }) => {
    restoreDb();
});

test('Should follow links from home page', async ({ page, common, login }) => {
    await page.goto('/');
    await page.locator('a[data-hero-register-button]').getByText('Register').click();
    await expect(common.body).toContainText('Register');

    await page.goto('/');
    await page.locator('a').getByText('Terms & Conditions').click();
    await expect(page.locator('h2').getByText('Terms & Conditions')).toBeVisible();
    await expect(common.body).toContainText('Season Structure and Participation');

    await page.goto('/');
    await page.locator('a').getByText('Privacy Policy').click();
    await expect(page.locator('h2').getByText('Privacy Policy')).toBeVisible();
    await expect(common.body).toContainText('Data Retention and Security');
});

test('Should log event when clicking on banana', async ({ page, common, login, homepage }) => {
    await login.loginAsPlayer1();
    await page.goto('/');
    await homepage.twBanana.click();
    await expectRecordToExist('logs', { code: 'click-homepage-banana-tw' }, { userId: 1 });
});

test('Should log event when clicking on a ladder banana for guests', async ({ page, common, login, homepage }) => {
    await page.goto('/season/2021/spring/men-35');
    await homepage.twBanana.click();
    await expectRecordToExist('logs', { code: 'click-ladder-banana-tw' }, { userId: 0 });
});
