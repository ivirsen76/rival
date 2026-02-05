import { test, expect } from './base';
import { restoreDb, expectRecordToExist } from '@rival/club.backend/src/db/helpers';

test.beforeEach(async () => {
    restoreDb();
});

test(`Should see the message that user doesn't belong to any club`, async ({ page, common, login, register }) => {
    await page.goto('/register');
    await register.submitButton.click();
    await expect(common.body).toContainText('Email is required');
    await expect(common.body).toContainText('Password is required');

    await register.emailField.fill('wrongsyntax');
    await register.passwordField.fill('12345678');
    await register.submitButton.click();
    await expect(common.body).toContainText('Wrong email format');

    await register.emailField.fill('missed@gmail.com');
    await register.submitButton.click();

    await register.emailVerificationCodeField.fill('999999');
    await expect(common.modal).toContainText('Confirmation code is wrong');

    const emailSent = await expectRecordToExist('emails', { recipientEmail: 'missed@gmail.com' });
    const emailVerificationCode = emailSent.subject.slice(0, 6);

    await register.emailVerificationCodeField.fill(emailVerificationCode);
    await expect(common.modal).toContainText("The user with the email missed@gmail.com doesn't belong to any club.");
    await common.modal.locator('button').getByText('Close').click();
    await expect(common.modal).toBeHidden();

    await expect(register.emailField).toHaveValue('');
});

test(`Should use another email`, async ({ page, common, login, register }) => {
    await page.goto('/register');
    await register.emailField.fill('missed@gmail.com');
    await register.passwordField.fill('12345678');
    await register.submitButton.click();

    const emailSent = await expectRecordToExist('emails', { recipientEmail: 'missed@gmail.com' });
    const emailVerificationCode = emailSent.subject.slice(0, 6);

    await register.emailVerificationCodeField.fill(emailVerificationCode);
    await expect(common.modal).toContainText("The user with the email missed@gmail.com doesn't belong to any club.");
    await common.modal.locator('button').getByText('Use another email').click();
    await expect(common.modal).toBeHidden();

    await expect(register.emailField).toHaveValue('');
    await register.emailField.fill('anothermissed@gmail.com');
    await register.passwordField.fill('12345678');
    await register.submitButton.click();

    await expect(common.modal).toContainText('Verify your email');
});

test(`Should see the message for existing user and close it`, async ({ page, common, login, register }) => {
    await page.goto('/register');
    await register.emailField.fill('player1@gmail.com');
    await register.passwordField.fill('12345678');
    await register.submitButton.click();

    const emailSent = await expectRecordToExist('emails', { recipientEmail: 'player1@gmail.com' });
    const emailVerificationCode = emailSent.subject.slice(0, 6);

    await register.emailVerificationCodeField.fill(emailVerificationCode);
    await expect(common.modal).toContainText('The user with the email player1@gmail.com already exists in the ladder.');
    await common.modal.locator('button').getByText('Close').click();
    await expect(common.modal).toBeHidden();

    await expect(register.emailField).toHaveValue('');
});

test(`Should see the message for existing user and try to sign in`, async ({ page, common, login, register }) => {
    await page.goto('/register');
    await register.emailField.fill('player1@gmail.com');
    await register.passwordField.fill('12345678');
    await register.submitButton.click();

    const emailSent = await expectRecordToExist('emails', { recipientEmail: 'player1@gmail.com' });
    const emailVerificationCode = emailSent.subject.slice(0, 6);

    await register.emailVerificationCodeField.fill(emailVerificationCode);
    await expect(common.modal).toContainText('The user with the email player1@gmail.com already exists in the ladder.');
    await common.modal.locator('button').getByText('Sign in').click();
    await expect(common.modal).toBeHidden();

    await expect(common.body).toContainText('Forgot password?');
});

test(`Should see the message for existing user and try to recover password`, async ({
    page,
    common,
    login,
    register,
}) => {
    await page.goto('/register');
    await register.emailField.fill('player1@gmail.com');
    await register.passwordField.fill('12345678');
    await register.submitButton.click();

    const emailSent = await expectRecordToExist('emails', { recipientEmail: 'player1@gmail.com' });
    const emailVerificationCode = emailSent.subject.slice(0, 6);

    await register.emailVerificationCodeField.fill(emailVerificationCode);
    await expect(common.modal).toContainText('The user with the email player1@gmail.com already exists in the ladder.');
    await common.modal.locator('a').getByText('Recover Password').click();
    await expect(common.modal).toBeHidden();

    await expect(common.body).toContainText('We will send you an email to reset your password.');
});

test(`Should register the user`, async ({ page, common, login, register }) => {
    await page.goto('/register');
    await register.emailField.fill('david@rrclub.com');
    await register.passwordField.fill('12345678');
    await register.submitButton.click();

    const emailSent = await expectRecordToExist('emails', { recipientEmail: 'david@rrclub.com' });
    const emailVerificationCode = emailSent.subject.slice(0, 6);

    await register.emailVerificationCodeField.fill(emailVerificationCode);
    await expect(common.modal).toContainText('We found you! You are David Trust, the member of Raleigh Racquet Club.');

    const user = await expectRecordToExist(
        'users',
        { email: 'david@rrclub.com' },
        {
            firstName: 'David',
            lastName: 'Trust',
            phone: '1234567890',
            birthday: '1980-10-10',
            slug: 'david-trust',
        }
    );
    await expectRecordToExist('userclubs', { userId: user.id }, { clubId: 1 });

    await expect(page.locator('[data-logged-user]')).toContainText('David Trust');
    await common.modal.locator('button').getByText('Continue').click();
    await expect(common.modal).toBeHidden();

    await expect(common.body).toContainText('Pick one Singles ladder');
});
