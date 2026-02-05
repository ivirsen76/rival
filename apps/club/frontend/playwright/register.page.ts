import dayjs from '@rival/club.backend/src/utils/dayjs';
import { test, expect } from './base';
import {
    restoreDb,
    expectRecordToExist,
    runQuery,
    overrideConfig,
    expectNumRecords,
} from '@rival/club.backend/src/db/helpers';

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

    await expect(login.forgotPasswordLink).toBeVisible();
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

test(`Should register the user and get to the pick level step`, async ({ page, common, login, register }) => {
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
    await register.pickLadderButton.click();
    await expect(common.modal).toBeHidden();

    await expect(common.body).toContainText('Pick one Singles ladder');
});

// Register for the next season
{
    test('We can switch season during registration', async ({ common, register, login }) => {
        const dateInThreeDays = dayjs.tz().add(3, 'day').format('YYYY-MM-DD HH:mm:ss');
        await runQuery(`UPDATE seasons SET endDate="${dateInThreeDays}" WHERE id=1`);

        await login.loginAsPlayer5();
        await register.goto();
        await expect(common.body).toContainText('2022 Spring');
        await register.spring2021.click();

        await register.getLadderCheckbox('Men 4.0').click();
        await expect(common.body).toContainText('2021 Spring (');
        await expect(common.body).not.toContainText('Register for 2021 Spring');
        await register.agreeCheckbox.click();

        await register.changeSeasonLink.click();
        await register.spring2022.click();
        await register.getLadderCheckbox('Men 4.0').click();

        await register.agreeCheckbox.click();
        await register.registerButton.click();

        await expect(common.modal).toContainText(register.registerSuccessMessage);
        await expectRecordToExist('players', { userId: 7, tournamentId: 8 }, { isActive: 1 });
    });

    test('We do not see season picker if it is just one season available', async ({ common, register, login }) => {
        const dateInAMonth = dayjs.tz().add(1, 'month').format('YYYY-MM-DD HH:mm:ss');
        await runQuery(`UPDATE seasons SET endDate="${dateInAMonth}" WHERE id=1`);

        await login.loginAsPlayer5();
        await register.goto();

        await register.getLadderCheckbox('Men 4.0').click();
        await expect(common.body).toContainText('Register for 2021 Spring');

        await register.agreeCheckbox.click();
        await register.registerButton.click();

        await expect(common.modal).toContainText(register.registerSuccessMessage);
        await expectRecordToExist('players', { userId: 7, tournamentId: 3 }, { isActive: 1 });
    });

    test('We can see NTRP guidelines', async ({ page, common, register, login }) => {
        await login.loginAsPlayer5();
        await register.goto();

        await page.getByRole('link', { name: 'NTRP Guidelines' }).click();
        await expect(common.modal).toContainText('This player is just starting to play tennis.');
    });

    test('We can register for the next season', async ({ common, register, login, overview }) => {
        const dateInThreeDays = dayjs.tz().add(3, 'day').format('YYYY-MM-DD HH:mm:ss');
        await runQuery(`UPDATE seasons SET endDate="${dateInThreeDays}" WHERE id=1`);

        await login.loginAsPlayer3();
        await register.goto();
        await register.spring2022.click();

        await expect(common.body).toContainText('Pick one Singles ladder');
        await expect(common.body).toContainText('Guidelines');

        await register.getLadderCheckbox('Men 4.0').click();
        await register.agreeCheckbox.click();
        await register.registerButton.click();

        await expect(common.modal).toContainText('The ladder officially begins');
        await expect(overview.playerList).toContainText('Cristopher Hamiltonbeach');
        await register.goToLadderButton.click();

        await expect(common.modal).toBeHidden();
        await expect(overview.area).toBeVisible();

        // No emails should be sent
        await new Promise((resolve) => setTimeout(resolve, 1000));
        await expectNumRecords('emails', undefined, 0);
    });

    test('We can see separate Singles and Doubles', async ({ common, register, login }) => {
        const dateInThreeDays = dayjs.tz().add(3, 'day').format('YYYY-MM-DD HH:mm:ss');
        await runQuery(`UPDATE seasons SET endDate="${dateInThreeDays}" WHERE id=1`);

        await login.loginAsPlayer3();
        await register.goto();
        await register.spring2022.click();

        await expect(common.body).toContainText('Pick one Singles ladder (or skip for now)');
        await expect(common.body).toContainText('Pick one Doubles ladder (or skip for now)');
        await expect(common.body).toContainText('Guidelines');

        await register.getLadderCheckbox('Men 3.5').click();
        await register.getLadderCheckbox('Men 4.0').click();

        await register.getLadderCheckbox('Men Team Doubles').click();
        await common.modal.locator('label', { hasText: 'Join the Player Pool' }).click();
        await common.modalSubmitButton.click();

        await register.getLadderCheckbox('Men Free Doubles').click();
        await common.modal.locator('label', { hasText: 'Join the Player Pool' }).click();
        await common.modalSubmitButton.click();

        await register.registerButton.click();
        await expect(common.body).toContainText('You cannot pick more than one Singles ladder.');
        await expect(common.body).toContainText('You cannot pick more than one Doubles ladder.');

        await register.getLadderCheckbox('Men 4.0').click();
        await register.getLadderCheckbox('Men Free Doubles').click();
        await register.agreeCheckbox.click();
        await register.registerButton.click();

        await expect(common.modal).toContainText('The ladder officially begins');
        await expectRecordToExist('players', { userId: 5, tournamentId: 7 });
        await expectRecordToExist('players', { userId: 5, tournamentId: 12 });
    });

    test('We can register for the next season by creating a new account', async ({ common, register, overview }) => {
        const dateInThreeDays = dayjs.tz().add(3, 'day').format('YYYY-MM-DD HH:mm:ss');
        await runQuery(`UPDATE seasons SET endDate="${dateInThreeDays}" WHERE id=1`);

        await register.goto();
        await register.emailField.fill('david@rrclub.com');
        await register.passwordField.fill('12345678');
        await register.submitButton.click();

        const emailSent = await expectRecordToExist('emails', { recipientEmail: 'david@rrclub.com' });
        const emailVerificationCode = emailSent.subject.slice(0, 6);

        await register.emailVerificationCodeField.fill(emailVerificationCode);

        await register.pickLadderButton.click();
        await register.spring2022.click();
        await register.getLadderCheckbox('Men 3.5').click();
        await register.agreeCheckbox.click();
        await register.registerButton.click();

        await expect(common.body).toContainText('You are successfully registered!');
        await expect(common.modal).toContainText('The ladder officially begins');
        await expect(overview.playerList).toContainText('David Trust');
        await register.goToLadderButton.click();

        await expect(common.modal).toBeHidden();
        await expect(overview.area).toBeVisible();

        await expectRecordToExist('emails', {
            recipientEmail: 'david@rrclub.com',
            subject: 'Welcome to the Raleigh Rival Tennis Ladder!',
        });
    });
}
