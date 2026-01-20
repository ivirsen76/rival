import { test, expect } from './base';
import { runQuery } from './db';

test.skip('Should generate avatar', async ({ page, common, login }) => {
    const emails = (
        await runQuery('SELECT u.email FROM users AS u, players AS p WHERE p.userId=u.id AND p.tournamentId=243')
    ).map((row: any) => row.email);

    for (const email of emails) {
        await page.goto('/login');
        await login.emailField.fill(email);
        await login.passwordField.fill(login.password);
        await page.locator('button').getByText('Sign in').click();
        await expect(common.body).toContainText('2021 Fall');

        await page.goto('/user/settings');
        await page.locator('button').getByText('avatar').click();
        await page.locator('button').getByText('Generate random').click();
        await page.locator('[data-random-avatar="1"]').click();
        await page.locator('button').getByText('Save').click();
    }
});
