import { test, expect } from './base';
import { restoreDb, expectRecordToExist, runQuery, expectNumRecords } from '@rival/club.backend/src/db/helpers';

test.beforeEach(async ({ page }) => {
    restoreDb();
});

test('We can see player actions', async ({ page, common, login }) => {
    await login.loginAsSuperadmin();
    await page.goto('/player/ben-done');
    await expect(page.locator('button').getByText('Emails')).toBeVisible();
    await expect(page.locator('button').getByText('Wallet')).toBeVisible();
    await expect(page.locator('button').getByText('Tracking')).toBeVisible();
    await expect(page.locator('button').getByText('Add transaction')).toBeVisible();
});

test('We can add transaction', async ({ page, common, login }) => {
    await login.loginAsSuperadmin();
    await page.goto('/player/ben-done');
    await page.locator('button').getByText('Add transaction').click();

    await page.locator('input[name="description"]').fill('Refund for ladder');
    await page.locator('input[name="amount"]').fill('-20');
    await common.modalSubmitButton.click();

    await expect(common.alert).toContainText('Transaction has been added');
    await expect(common.modal).toBeHidden();

    await expectRecordToExist(
        'payments',
        { userId: 1 },
        { type: 'refund', description: 'Refund for ladder', amount: -2000 }
    );

    await page.locator('button').getByText('Wallet').click();
    await expect(common.modal).toContainText('Refund for ladder');
    await expect(common.modal).toContainText('-$20.00');
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

    // check that fingerprints and identifications are not affected
    await expectNumRecords('fingerprints', { userId: 1 }, 0);
    await expectNumRecords('identifications', { userId: 1 }, 0);
});
