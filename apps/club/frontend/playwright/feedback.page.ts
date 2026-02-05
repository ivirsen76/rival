import { test, expect } from './base';
import { restoreDb, expectRecordToExist, runQuery } from '@rival/club.backend/src/db/helpers';

test.beforeEach(async ({ page }) => {
    restoreDb();
});

test('We cannot see feedback button for guests', async ({ page, common, feedback, homepage }) => {
    await page.goto('/');
    await homepage.checkVisible();
    await expect(feedback.openButton).toBeHidden();
});

test('We can see different kind of feedbacks', async ({ page, common, login, feedback, homepage }) => {
    await login.loginAsPlayer1();
    await page.goto('/');
    await homepage.checkVisible();
    await feedback.openButton.click();
    await expect(common.modal).toContainText('Report a bug');
    await expect(common.modal).toContainText('Feature request');
    await expect(common.modal).toContainText('General feedback');
});

test('We can see validation error', async ({ page, common, login, feedback }) => {
    await login.loginAsPlayer1();
    await page.goto('/');
    await feedback.openButton.click();
    await feedback.getType('Report a bug').click();
    await common.modalSubmitButton.click();
    await expect(common.modal).toContainText('is required');
});

test('We can report a bug', async ({ page, common, login, feedback, homepage }) => {
    await runQuery(`UPDATE settings SET newFeedbackNotification="ivirsen@gmail.com" WHERE id=1`);

    await login.loginAsPlayer1();
    await page.goto('/');
    await homepage.checkVisible();
    await feedback.openButton.click();
    await feedback.getType('Report a bug').click();
    await feedback.descriptionField.fill('Something is wrong');
    await common.modalSubmitButton.click();

    await expect(common.alert).toContainText('Thank you! We really appreciate your feedback.');
    await expectRecordToExist('feedbacks', { userId: 1 }, { type: 'bug', description: 'Something is wrong' });

    const emailSent = await expectRecordToExist('emails', { recipientEmail: 'ivirsen@gmail.com' });
    expect(emailSent.replyTo).toContain('Ben Done');
    expect(emailSent.replyTo).toContain('player1@gmail.com');
    expect(emailSent.subject).toContain('Feedback - bug');
    expect(emailSent.html).toContain('Something is wrong');
    expect(emailSent.html).toContain('OS and Browser');
});

test('We can ask a question', async ({ page, common, login, feedback, homepage }) => {
    await runQuery(`UPDATE settings SET newFeedbackNotification="ivirsen@gmail.com" WHERE id=1`);

    await login.loginAsPlayer1();
    await page.goto('/');
    await homepage.checkVisible();
    await feedback.openButton.click();
    await feedback.getType('Ask a question').click();
    await feedback.descriptionField.fill('What is up?');
    await common.modalSubmitButton.click();

    await expect(common.alert).toContainText('Thank you! We really appreciate your feedback.');
    await expectRecordToExist('feedbacks', { userId: 1 }, { type: 'question', description: 'What is up?' });

    const emailSent = await expectRecordToExist('emails', { recipientEmail: 'ivirsen@gmail.com' });
    expect(emailSent.replyTo).toContain('Ben Done');
    expect(emailSent.replyTo).toContain('player1@gmail.com');
    expect(emailSent.subject).toContain('Feedback - question');
    expect(emailSent.html).toContain('What is up?');
    expect(emailSent.html).not.toContain('OS and Browser');
});
