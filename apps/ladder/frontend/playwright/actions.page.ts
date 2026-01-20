import { test, expect } from './base';
import { restoreDb } from './db';
import { encodeBase64 } from '@rival/ladder.backend/src/utils/action';

test.beforeEach(async ({ page }) => {
    restoreDb();
});

test('Should show a payload error', async ({ page, common, login }) => {
    await page.goto('/action/sldfhjlsjflsdkjfl');
    await expect(common.body).toContainText('The link is broken');
});

test('Should show a duration error', async ({ page, common, login }) => {
    const payload = encodeBase64('name=newPassword&userId=123&t=100&d=10&h=f697dc316c4667374956');

    await page.goto(`/action/${payload}`);
    await expect(common.body).toContainText('The link is expired');
});

test('Should show a message about the wrong action', async ({ page, common, login }) => {
    const payload = encodeBase64('name=wrong&userId=1&t=1000000000&d=1000000000&h=4d97d98666d21c0c516a');

    await page.goto(`/action/${payload}`);
    await expect(common.body).toContainText('Action is incorrect');
});

test('Should show a new password form', async ({ page, common, login }) => {
    const payload = encodeBase64('name=newPassword&userId=1&t=1000000000&d=1000000000&h=d1ca331f28d20dd66822');

    await page.goto(`/action/${payload}`);
    await expect(common.body).toContainText('Setup New Password');
});
