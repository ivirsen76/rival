import { test, expect } from './base';
import { restoreDb } from '@rival/club.backend/src/db/helpers';

test.beforeEach(async ({ login }) => {
    restoreDb();
});

test('Should show that there is no user for any club', async ({ page, common, login }) => {
    await page.goto('/city/raleigh/register');
    await page.locator('button').getByText('Register').click();
});
