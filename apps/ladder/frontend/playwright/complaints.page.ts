import { test, expect } from './base';
import { restoreDb, runQuery, getNumRecords, expectRecordToExist } from './db';

test.beforeEach(async ({ page }) => {
    restoreDb();
});

test('Should not see complain button for guests', async ({ page, common, login, complaint }) => {
    await page.goto('/player/ben-done');
    await expect(complaint.openButton).toBeHidden();
});

test('Should not see complain button for me', async ({ page, common, login, complaint }) => {
    await login.loginAsPlayer1();
    await page.goto('/player/ben-done');
    await expect(complaint.openButton).toBeHidden();
});

test('Should complain and see avoiding option', async ({ page, common, login, complaint }) => {
    await runQuery(`UPDATE settings SET newComplaintNotification="admin@gmail.com" WHERE id=1`);
    await runQuery(`INSERT INTO userrelations (userId, opponentId, avoid, avoidedOnce) VALUES(1, 5, 0, 1)`);
    await runQuery(`INSERT INTO userrelations (userId, opponentId, avoid, avoidedOnce) VALUES(1, 6, 0, 0)`);

    await login.loginAsPlayer1();

    // check settings
    await page.goto('/user/settings');
    await expect(common.body).toContainText('Avoided Players');
    await expect(common.body).not.toContainText('Cristopher Hamiltonbeach');
    await expect(common.body).not.toContainText('Gary Mill');
    await expect(common.body).not.toContainText('Matthew Burt');
    await complaint.editAvoidedPlayersButton.click();
    await expect(common.modal).toContainText(complaint.avoidCondition);
    await expect(common.modal).toContainText(complaint.avoidSuggestionText);

    await page.goto('/player/gary-mill');
    await complaint.openButton.click();

    await expect(common.modal).toContainText('Complain about Gary');

    await common.modalSubmitButton.click();
    await expect(common.modal).toContainText('Reason is required');
    await expect(common.modal).toContainText('Description is required');

    await complaint.getComplaintType('Unsportsmanlike conduct').click();
    await complaint.descriptionField.fill('He was rude');
    await page.locator('label').getByText('Avoid playing with Gary').click();
    await common.modalSubmitButton.click();

    await expect(common.alert).toContainText('Your complaint was submitted successfully.');
    await expect(common.modal).toBeHidden();

    await expectRecordToExist(
        'complaints',
        { userId: 1, opponentId: 2 },
        { reason: 'unsportsmanship', description: 'He was rude' }
    );

    // Check that an email is sent
    const emailSent = await expectRecordToExist(
        'emails',
        { recipientEmail: 'admin@gmail.com' },
        { subject: 'New Complaint About Player (Raleigh)' }
    );
    expect(emailSent.to).toContain('admin@gmail.com');
    expect(emailSent.replyTo).toContain('Ben Done');
    expect(emailSent.replyTo).toContain('player1@gmail.com');
    expect(emailSent.html).toContain('Ben Done');
    expect(emailSent.html).toContain('Gary Mill');
    expect(emailSent.html).toContain('Unsportsmanlike conduct');
    expect(emailSent.html).toContain('He was rude');
    expect(emailSent.html).toContain('Yes');

    // check settings again
    await page.goto('/user/settings');
    await expect(common.body).toContainText('Gary Mill');
    await expect(common.body).not.toContainText('Cristopher Hamiltonbeach');
    await complaint.editAvoidedPlayersButton.click();
    await page.locator('label').getByText('Cristopher Hamiltonbeach').click();
    await page.locator('label').getByText('Gary Mill').click();
    await expect(common.modal).not.toContainText('Matthew Burt');
    await common.modalSubmitButton.click();

    await expect(common.modal).toBeHidden();
    await expect(common.body).toContainText('Cristopher Hamiltonbeach');
    await expect(common.body).not.toContainText('Gary Mill');
});

test('Should complain and avoid player', async ({ page, common, login, complaint, topMenu }) => {
    await runQuery(`UPDATE settings SET newComplaintNotification="admin@gmail.com" WHERE id=1`);

    await login.loginAsPlayer1();
    await page.goto('/player/gary-mill');
    await complaint.openButton.click();

    await complaint.getComplaintType('Breaking the rules').click();
    await complaint.descriptionField.fill('He was rude');
    await complaint.getComplaintType('Avoid playing with Gary').click();
    await common.modalSubmitButton.click();

    await expect(common.alert).toContainText('Your complaint was submitted successfully.');

    await expectRecordToExist('userrelations', { userId: 1 }, { opponentId: 2, avoid: 1, avoidedOnce: 1, note: null });

    // Check that an email is sent
    const emailSent = await expectRecordToExist(
        'emails',
        { recipientEmail: 'admin@gmail.com' },
        { subject: 'New Complaint About Player (Raleigh)' }
    );
    expect(emailSent.to).toContain('admin@gmail.com');
    expect(emailSent.replyTo).toContain('Ben Done');
    expect(emailSent.replyTo).toContain('player1@gmail.com');
    expect(emailSent.html).toContain('Breaking the rules');
    expect(emailSent.html).toContain('Yes');

    // Should see avoided player in settings
    await topMenu.userLink.click();
    await topMenu.getMenuLink('Settings').click();
    await expect(common.body).toContainText('Gary Mill');
});

test('Should complain, avoid player, and keep notes', async ({ page, common, login, complaint }) => {
    await runQuery(`INSERT INTO userrelations (userId, opponentId, avoid, note) VALUES (1, 2, 0, 'Something')`);

    await login.loginAsPlayer1();
    await page.goto('/player/gary-mill');
    await complaint.openButton.click();

    await complaint.getComplaintType('Breaking the rules').click();
    await complaint.descriptionField.fill('He was rude');
    await complaint.getComplaintType('Avoid playing with Gary').click();
    await common.modalSubmitButton.click();

    await expect(common.alert).toContainText('Your complaint was submitted successfully.');

    expect(await getNumRecords('userrelations')).toBe(1);
    await expectRecordToExist(
        'userrelations',
        { userId: 1 },
        { opponentId: 2, avoid: 1, avoidedOnce: 1, note: 'Something' }
    );
});

test('Should complain and not avoid player', async ({ page, common, login, complaint }) => {
    await login.loginAsPlayer1();
    await page.goto('/player/gary-mill');
    await complaint.openButton.click();

    await complaint.getComplaintType('Breaking the rules').click();
    await complaint.descriptionField.fill('He was rude');
    await complaint.getComplaintType('Avoid playing with Gary').click();

    await complaint.getComplaintType('Unsportsmanlike conduct').click();
    await complaint.getComplaintType('Avoid playing with Gary').click();
    await common.modalSubmitButton.click();

    await expect(common.alert).toContainText('Your complaint was submitted successfully.');
    expect(await getNumRecords('userrelations')).toBe(0);
});
