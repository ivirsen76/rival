import { test, expect } from './base';
import { restoreDb, getRecord } from './db';

import { decrypt } from '@rival/ladder.backend/src/utils/crypt';

test.beforeEach(async ({ page }) => {
    restoreDb();
});

test('Should show a validation error', async ({ page, common, login }) => {
    await page.goto('/login');
    await page.locator('a').getByText('Forgot password').click();
    await page.locator('input[name=email]').fill('notemail');
    await page.locator('button').getByText('Send Email').click();
    await expect(common.body).toContainText('Email is incorrect.');
});

test('Should show an error with missing email', async ({ page, common, login }) => {
    await page.goto('/login');
    await page.locator('a').getByText('Forgot password').click();
    await page.locator('input[name=email]').fill('wrong@gmail.com');
    await page.locator('button').getByText('Send Email').click();
    await expect(common.body).toContainText('There is no user with this email.');
});

test('Should reset password', async ({ page, common, login, topMenu }) => {
    await page.goto('/login');
    await page.locator('a').getByText('Forgot password').click();
    await page.locator('input[name=email]').fill('player1@gmail.com');
    await page.locator('button').getByText('Send Email').click();

    await expect(common.modal).toContainText("We've just sent");

    const emailSent = await getRecord('emails', { recipientEmail: 'player1@gmail.com' });
    const [newPasswordUrl] = emailSent.html.match(/\/action\/\w+/);

    // Login just to see that it will be logged out
    await page.goto('/login');
    await login.emailField.fill('player1@gmail.com');
    await login.passwordField.fill(login.password);
    await page.locator('button').getByText('Sign in').click();
    await expect(common.body).toContainText('Ben Done');

    await page.goto(newPasswordUrl);
    await expect(common.body).toContainText('Setup New Password');
    await expect(login.signInLink).toBeVisible();

    await page.locator('input[name=password]').fill('12345678');
    await page.locator('button').getByText('Submit').click();

    await expect(common.modal).toContainText('The password was successfully changed');
    await page.locator('button').getByText('Go to login').click();

    const user = await getRecord('users', { email: 'player1@gmail.com' });
    expect(decrypt(user.salt)).toBe('12345678');

    await login.emailField.fill('player1@gmail.com');
    await login.passwordField.fill('12345678');
    await page.locator('button').getByText('Sign in').click();
    await expect(topMenu.userLink).toBeVisible();
});
