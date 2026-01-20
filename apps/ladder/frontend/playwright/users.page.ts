import { test, expect } from './base';
import { restoreDb, runQuery, getNumRecords, expectRecordToExist } from './db';
import dayjs from '@rival/ladder.backend/src/utils/dayjs';

test.beforeEach(async ({ page }) => {
    restoreDb();
});

// Disabled users
{
    test('Do not send messages to disabled users', async ({ page, login, common }) => {
        await runQuery('UPDATE users SET deletedAt="2022-10-10 10:10:10" WHERE roles="player"');
        await runQuery(`UPDATE users SET roles="admin,superadmin" WHERE email="admin@gmail.com"`);

        await login.loginAsAdmin();
        await page.goto('/admin/email');
        await page.locator('label').getByText('Men 3.5').click();
        await page.locator('input[name="subject"]').fill('Final');
        await page.locator('textarea[name="body"]').fill('Thank you!');
        await page.locator('button').getByText('Send message').click();

        await common.modal.locator('button').getByText('Yes').click();
        await expect(common.alert).toContainText('Message was successfuly sent to 5 recipients');

        // wait for the message to be saved in DB
        await new Promise(resolve => setTimeout(resolve, 500));
        expect(await getNumRecords('emails')).toBe(0);
    });

    test('Show disabled state for the player page', async ({ page, login, common }) => {
        await runQuery('UPDATE users SET deletedAt="2022-10-10 10:10:10" WHERE id!=2');

        await login.loginAsPlayer2();
        await page.goto('/player/ben-done');
        await expect(common.content).toContainText('The user is deleted');
        await expect(common.content).not.toContainText('Men 3.5');
        await expect(common.content).not.toContainText('Recent Badges');
        await expect(common.content).not.toContainText('Rivalries');
        await expect(common.content).not.toContainText('My Notes About Ben');
        await expect(common.content).not.toContainText('Actions');
    });

    test('Cannot log in as deleted user', async ({ page, login, common }) => {
        await runQuery('UPDATE users SET deletedAt="2022-10-10 10:10:10"');

        await page.goto('/login');
        await page.locator('input[name=email]').fill('player1@gmail.com');
        await page.locator('input[name=password]').fill('wrong');
        await page.locator('button').getByText('Sign in').click();

        await expect(common.body).toContainText('Your email or password is incorrect');
        await page.locator('input[name=password]').fill(login.password);
        await page.locator('button').getByText('Sign in').click();

        await expect(common.body).toContainText('The user with this email is deleted.');
    });

    test('Should log out immediately if the user is deleted', async ({ page, login, common }) => {
        await login.loginAsPlayer1();
        await page.goto('/player/gary-mill');
        await expect(common.body).toContainText('Ben Done');

        await runQuery('UPDATE users SET deletedAt="2022-10-10 10:10:10" WHERE id=1');
        await page.goto('/player/gary-mill');
        await expect(common.body).toContainText('Gary Mill');
        await expect(common.body).not.toContainText('Ben Done');
    });

    test('Should save paw', async ({ page, login, common }) => {
        await login.loginAsPlayer1();
        await page.goto('/player/gary-mill');

        const paw = await expectRecordToExist('fingerprints', { userId: 1 });

        await page.goto('/player/gary-mill');
        await expect(common.body).toContainText('My Notes About Gary');
        await page.waitForTimeout(2000);

        // check that paw is not updated
        await expectRecordToExist('fingerprints', { userId: 1 }, { updatedAt: paw.updatedAt });

        // check that paw is updated if it's been more than 1 week
        const dateTenDaysAgo = dayjs.tz().subtract(8, 'day').format('YYYY-MM-DD HH:mm:ss');
        await runQuery(`UPDATE fingerprints SET updatedAt="${dateTenDaysAgo}" WHERE id=${paw.id}`);

        await page.goto('/player/gary-mill');
        await expect(common.body).toContainText('My Notes About Gary');

        const paw1 = await expectRecordToExist('fingerprints', { userId: 1 });
        expect(paw1.updatedAt).not.toBe(dateTenDaysAgo);
    });

    test('Should update paw just after login', async ({ page, login, common }) => {
        // generate initial paw and identification
        await login.loginAsPlayer1();
        await page.goto('/player/gary-mill');
        const paw = await expectRecordToExist('fingerprints', { userId: 1 });
        const identification = await expectRecordToExist('identifications', { userId: 1 });

        // login again and check paw is updated
        await login.loginAsPlayer1();
        await page.goto('/player/gary-mill');
        await expect(common.body).toContainText('My Notes About Gary');
        await page.waitForTimeout(2000);

        const paw1 = await expectRecordToExist('fingerprints', { userId: 1 });
        expect(paw1.updatedAt).not.toBe(paw.updatedAt);

        const identification1 = await expectRecordToExist('identifications', { userId: 1, code: identification.code });
        expect(identification1.updatedAt).not.toBe(identification.updatedAt);
    });
}
