import { test, expect } from './base';
import { restoreDb, getRecord, expectRecordToExist, runQuery } from './db';
import { getActionLink } from '@rival/ladder.backend/src/utils/action';

test.beforeEach(async ({ page }) => {
    restoreDb();
});

test('We can register as partner', async ({ page, common, login, register }) => {
    const link = await getActionLink({ payload: { name: 'registerPartner', code: 'first', percent: 20, years: 2 } });
    await page.goto(link);

    await expect(common.body).toContainText('Create a Partner Account');

    await register.submitPlayerButton.click();
    await expect(common.body).toContainText('Partner name is required');
    await expect(common.body).toContainText('Email is required');

    await page.locator('input[name="partnerName"]').fill('Duke Institute');
    await register.firstNameField.fill('Peter');
    await register.lastNameField.fill('Allen');
    await register.emailField.fill('peter@gmail.com');
    await register.passwordField.fill(login.password);
    await register.submitPlayerButton.click();

    await expect(common.modal).toContainText('successfuly registered');
    await expect(common.body).toContainText('Your Referral Link');

    const user = await expectRecordToExist(
        'users',
        { email: 'peter@gmail.com' },
        {
            firstName: 'Peter',
            lastName: 'Allen',
            slug: 'peter-allen',
            isVerified: 1,
            roles: 'partner',
            subscribeForNews: 0,
            subscribeForReminders: 0,
            information: JSON.stringify({ partnerName: 'Duke Institute' }),
            refPercent: 20,
            refYears: 2,
        }
    );

    expect(user.changelogSeenAt).toBeTruthy();
    expect(user.referralCode).toBeTruthy();
    expect(user.createdAt).toBe(user.refStartedAt);

    await common.modal.locator('button').getByText('Go to Partner page').click();
    await expect(common.modal).toBeHidden();

    await expect(common.body).toContainText('There are no players yet');
    await expect(common.body).toContainText('20% of all payments for 2 years since registration');

    // check partner page
    await page.goto('/player/peter-allen');
    await expect(common.body).toContainText('No badges achieved yet.');
});

test('Partner can see referral link and players', async ({ page, common, login, referral }) => {
    await runQuery(`UPDATE users SET referrerUserId=12 WHERE id<3`);
    await runQuery(`INSERT INTO payments (userId, type, description, amount) VALUES (1, "payment", "Payment", 33000)`);
    await runQuery(`INSERT INTO payments (userId, type, description, amount) VALUES (1, 'product', 'Product', -2000)`);
    await runQuery(`INSERT INTO payments (userId, type, description, amount) VALUES (2, "payment", "Payment", 4000)`);

    await login.loginAsPartner();
    await page.getByRole('menuitem', { name: 'Partner' }).locator('a').click();

    await expect(page.locator('h2').getByText('Partner')).toBeVisible();
    await expect(common.body).not.toContainText(referral.shareLinkHeader);
    await expect(common.body).toContainText('Your Referral Link');
    await expect(common.body).toContainText('/ref/zxcvb');
    await expect(common.body).toContainText('$330.00');
    await expect(common.body).toContainText('$132.00');
    await expect(common.body).toContainText('$40.00');
    await expect(common.body).toContainText('$16.00');

    await page.locator('[data-wallet-id="1"]').click();
    await expect(common.modal).toContainText('Current balance: $310.00');
    await expect(common.modal).toContainText('-$20.00');
    await expect(common.modal).toContainText('$330.00');
});

test('Register using partner referral', async ({ page, common, login, register, user }) => {
    await page.goto('/ref/zxcvb');
    await register.globalRegisterButton.click();

    await register.goto();
    await expect(register.comeFromSelect).toBeHidden();
    await register.firstNameField.fill('New');
    await register.lastNameField.fill('Guy');
    await register.emailField.fill('new@gmail.com');
    await register.phoneField.fill('9191234567');
    await register.passwordField.fill(login.password);
    await user.enterBirthday('1/1/2000');

    await register.submitPlayerButton.click();
    await expect(common.body).toContainText('Verify');

    const emailSent = await getRecord('emails', { recipientEmail: 'new@gmail.com' });
    const emailVerificationCode = emailSent.subject.slice(0, 6);

    await register.emailVerificationCodeField.fill(emailVerificationCode);
    await expect(common.body).toContainText('successfully registered');

    // Check email about referral registered
    {
        const email = await expectRecordToExist(
            'emails',
            { subject: 'Your Friend New Guy Just Signed Up!' },
            { recipientEmail: 'partner@gmail.com' }
        );
        expect(email.html).toContain('New Guy');
        expect(email.html).not.toContain('Your friend');
        expect(email.html).not.toContain('<b>$5</b>');
        expect(email.html).toContain('<b>40%</b>');
        expect(email.html).toContain('<b>4 years</b>');
    }

    await expectRecordToExist(
        'users',
        { email: 'new@gmail.com' },
        { referrerUserId: 12, comeFrom: 99, comeFromOther: 'Referral from Durham University' }
    );
});

test('Register using partner referral from the list', async ({ page, common, login, register, user }) => {
    await page.goto('/register');
    await register.firstNameField.fill('New');
    await register.lastNameField.fill('Guy');
    await register.emailField.fill('new@gmail.com');
    await register.phoneField.fill('9191234567');
    await register.passwordField.fill(login.password);
    await user.enterBirthday('1/1/2000');
    await register.pickComeFromOption('Durham University');

    await register.submitPlayerButton.click();
    await expect(common.body).toContainText('Verify');

    const emailSent = await getRecord('emails', { recipientEmail: 'new@gmail.com' });
    const emailVerificationCode = emailSent.subject.slice(0, 6);

    await register.emailVerificationCodeField.fill(emailVerificationCode);
    await expect(common.body).toContainText('successfully registered');

    // Check email about referral registered
    {
        const email = await expectRecordToExist(
            'emails',
            { subject: 'Your Friend New Guy Just Signed Up!' },
            { recipientEmail: 'partner@gmail.com' }
        );
        expect(email.html).toContain('New Guy');
        expect(email.html).not.toContain('Your friend');
        expect(email.html).not.toContain('<b>$5</b>');
        expect(email.html).toContain('<b>40%</b>');
        expect(email.html).toContain('<b>4 years</b>');
    }

    await expectRecordToExist(
        'users',
        { email: 'new@gmail.com' },
        { referrerUserId: 12, comeFrom: 99, comeFromOther: 'Referral from Durham University' }
    );
});

test('We can generate partner link and register from it', async ({ page, common, login, register }) => {
    await login.loginAsAdmin();

    await page.goto('/admin/actions');
    await page.getByRole('button', { name: 'Generate partner link' }).click();
    await page.locator('select[name=percent]').selectOption('40%');
    await page.locator('select[name=years]').selectOption('4 years');
    await common.modalSubmitButton.click();

    await expect(common.modal).toContainText('/a/registerPartner/');
    await common.modal.locator('button').getByText('Copy').click();
    const link1 = await common.getClipboardValue();

    // check that link is generated uniq every time
    await page.goto('/admin/actions');
    await page.getByRole('button', { name: 'Generate partner link' }).click();
    await page.locator('select[name=percent]').selectOption('40%');
    await page.locator('select[name=years]').selectOption('4 years');
    await common.modalSubmitButton.click();
    await common.modal.locator('button').getByText('Copy').click();
    const link2 = await common.getClipboardValue();
    expect(link1).not.toBe(link2);

    await page.goto(link1);
    await expect(common.body).toContainText('Create a Partner Account');

    await register.submitPlayerButton.click();
    await expect(common.body).toContainText('Partner name is required');

    await page.locator('input[name="partnerName"]').fill('Duke Institute');
    await register.firstNameField.fill('Peter');
    await register.lastNameField.fill('Allen');
    await register.emailField.fill('peter@gmail.com');
    await register.passwordField.fill(login.password);
    await register.submitPlayerButton.click();

    await expect(common.modal).toContainText('successfuly registered');
    await expect(common.body).toContainText('Your Referral Link');

    await expect(common.body).toContainText('40% of all payments for 4 years since registration');
});
