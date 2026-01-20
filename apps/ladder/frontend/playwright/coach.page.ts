import { test, expect } from './base';
import { restoreDb, getRecord, runQuery, expectRecordToExist } from './db';

test.beforeEach(async ({ page }) => {
    restoreDb();
});

test('Should not see the coach information', async ({ page, common, login }) => {
    await login.loginAsPlayer1();
    await page.goto('/season/2021/spring/men-35');
    await expect(common.body).not.toContainText('Tennis Coaches');
});

test('Should not see the coach information when the date is expired', async ({ page, common, login }) => {
    await runQuery(`UPDATE coaches SET isActive=1, activeTill="2020-01-01 01:01:01"`);

    await login.loginAsPlayer1();
    await page.goto('/season/2021/spring/men-35');
    await expect(common.body).not.toContainText('Tennis Coaches');
});

test('Should see the coach information', async ({ page, common, login }) => {
    await runQuery(`UPDATE coaches SET isActive=1, activeTill="2030-01-01 01:01:01"`);

    await login.loginAsPlayer1();
    await page.goto('/season/2021/spring/men-35');
    await expect(common.body).toContainText('Tennis Coaches');
});

test('Should see the coach information and request the lesson', async ({ page, common, login }) => {
    await runQuery(`UPDATE coaches SET isActive=1`);

    await login.loginAsPlayer1();
    await page.goto('/season/2021/spring/men-35');
    await expect(common.body).toContainText('Tennis Coaches');
    await expect(common.body).toContainText('Bob Lisson');
    await expect(common.body).toContainText('Cary, Morrisville');
    await expect(common.body).toContainText('$60 per hour');

    await page.locator('button').getByText('View profile').click();

    await expect(common.modal).toContainText('Bob Lisson');
    await expect(common.modal).toContainText('first point');
    await expect(common.modal).toContainText('I am a great coach');
    await expect(common.modal).toContainText('Breckenridge');
    await expect(common.modal).toContainText('2023 Tennis Drive');
    await expect(common.modal).toContainText('Contact Bob');

    await expectRecordToExist('logs', { code: 'browseCoachProfile' }, { userId: 1, tableId: 1 });

    await common.modal.locator('button').getByText('Send request').click();
    await expect(common.modal).toContainText('Message is required');

    await page.locator('textarea[name=message]').fill('I would like to have a lesson.');
    await common.modal.locator('button').getByText('Send request').click();

    await expect(common.modal).toContainText('The request has been sent');
    await page.locator('button').getByText('Ok, got it!').click();
    await expect(common.modal).toBeHidden();

    const emailSent = await getRecord('emails', { recipientEmail: 'bob@gmail.com' });
    expect(emailSent.subject).toContain('Coach lesson request');
    expect(emailSent.replyTo).toContain('Ben Done');
    expect(emailSent.replyTo).toContain('player1@gmail.com');
    expect(emailSent.html).toContain('Hello, Bob!');
    expect(emailSent.html).toContain('Ben Done');
    expect(emailSent.html).toContain('player1@gmail.com');
    expect(emailSent.html).toContain('123-456-7890');
    expect(emailSent.html).toContain('sms:1234567890');
    expect(emailSent.html).toContain('I would like to have a lesson');
    expect(emailSent.html).toContain('/player/ben-done');

    await expectRecordToExist(
        'logs',
        { code: 'requestLesson' },
        { userId: 1, tableId: 1, payload: 'I would like to have a lesson.' }
    );
});
