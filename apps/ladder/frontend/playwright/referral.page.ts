import { test, expect } from './base';
import { restoreDb, runQuery } from '@rival/ladder.backend/src/db/helpers';

// Helpers
// const getLocation = ClientFunction(() => window.location.href);

test.beforeEach(async ({ page }) => {
    restoreDb();
});

// Referral page
(() => {
    test('We can see referral page', async ({ page, common, login, referral }) => {
        await login.loginAsPlayer1();
        await page.goto('/user/referral');
        await expect(page.locator('h2').getByText('Referral Program')).toBeVisible();
        await expect(common.body).not.toContainText(referral.shareLinkHeader);
        await expect(common.body).toContainText('$5');
        await expect(common.body).toContainText('$10');
        await expect(common.body).toContainText('$15');
        await expect(common.body).toContainText('ref/asdfg');
        await expect(common.body).toContainText('Gary Mill');
        await expect(common.body).toContainText('Total credit earned: $5');
    });

    // TODO: skip temporarily as there was some facebook issue
    test.skip('We can follow facebook share button', async ({ page, common, login }) => {
        await login.loginAsPlayer1();
        await page.goto('/user/referral');

        const link = await page.locator('.btn').getByText('Share on Facebook').getAttribute('href');

        await page.goto(link);
        await expect(page.locator('.fb_logo')).toContainText('Facebook');
    });

    // TODO: skip temporarily as there was some X issue
    test.skip('We can follow twitter share button', async ({ page, common, login }) => {
        await login.loginAsPlayer1();
        await page.goto('/user/referral');

        const link = await page.locator('.btn').getByText('Share on X').getAttribute('href');

        await page.goto(link);
        await expect(common.body).toContainText('Want to log in first?');
    });

    test('We can log in and see the referral page', async ({ page, common, login }) => {
        await page.goto('/user/referral');

        await expect(page.locator('h3').getByText('Sign in')).toBeVisible();
        const url = await page.evaluate(() => window.location.href);
        expect(url).not.toContain('redirectAfterLogin');

        await login.emailField.fill('player1@gmail.com');
        await login.passwordField.fill(login.password);
        await page.locator('button').getByText('Sign in').click();

        await expect(common.body).toContainText('How to Earn Referral Credit');
    });
})();

// we can see partner referral page
(() => {
    test('We can see partner referral page', async ({ page, common, login, referral }) => {
        await runQuery(`UPDATE users SET refPercent=40, refYears=5, refStartedAt=createdAt WHERE id=1`);
        await runQuery(
            `INSERT INTO payments (userId, type, description, amount) VALUES (2, "payment", "Payment", 33000)`
        );
        await runQuery(
            `INSERT INTO payments (userId, type, description, amount) VALUES (2, 'product', 'Product', -2000)`
        );

        await login.loginAsPlayer1();
        await page.goto('/user/referral');
        await expect(common.body).toContainText('Your Referral Link');
        await expect(page.locator('h2').getByText('Referral Program')).toBeVisible();
        await expect(common.body).toContainText(referral.shareLinkHeader);
        await expect(common.body).toContainText('40%');
        await expect(common.body).toContainText('5 years');
        await expect(common.body).toContainText('ref/asdfg');
        await expect(common.body).toContainText('Gary Mill');
        await expect(common.body).toContainText('$330');
        await expect(common.body).toContainText('$132');

        await page.locator('[data-wallet-id="2"]').click();
        await expect(common.modal).toContainText('Current balance: $310.00');
        await expect(common.modal).toContainText('-$20.00');
        await expect(common.modal).toContainText('$330.00');
    });
})();
