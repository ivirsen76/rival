import dayjs from '@rival/club.backend/src/utils/dayjs';
import { test, expect } from './base';
import {
    restoreDb,
    expectRecordToExist,
    runQuery,
    overrideConfig,
    expectNumRecords,
} from '@rival/club.backend/src/db/helpers';
import { decrypt } from '@rival/club.backend/src/utils/crypt';

const closeCurrentSeason = async () => {
    const dateTwoDaysAgo = dayjs.tz().subtract(2, 'day').format('YYYY-MM-DD HH:mm:ss');
    await runQuery(`UPDATE seasons SET endDate="${dateTwoDaysAgo}" WHERE id=1`);
};

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

{
    test('We can register till the end of the season', async ({ common, register, login, page }) => {
        const dateInThreeDays = dayjs.tz().add(3, 'day').format('YYYY-MM-DD HH:mm:ss');
        await runQuery(`UPDATE seasons SET endDate="${dateInThreeDays}" WHERE id=1`);
        await page.goto('/');
        await expect(register.globalRegisterButton).toBeVisible();

        await register.goto();
        await expect(common.body).toContainText('Create an Account');
    });

    test('We cannot register if there is no new season', async ({ common, register, page }) => {
        const dateOneWeekAgo = dayjs.tz().subtract(1, 'week').format('YYYY-MM-DD HH:mm:ss');
        const dateOneYearAgo = dayjs.tz().subtract(1, 'year').format('YYYY-MM-DD HH:mm:ss');
        await runQuery(`UPDATE seasons SET endDate="${dateOneWeekAgo}" WHERE id=1`);
        await runQuery(`UPDATE seasons SET startDate="${dateOneYearAgo}", endDate="${dateOneYearAgo}" WHERE id=5`);
        await page.goto('/');
        await expect(register.globalRegisterButton).toBeHidden();

        await register.goto();
        await expect(common.body).toContainText('There is no season to register');
    });

    test('We can register for the ladder where the user is not active', async ({ register, login, overview }) => {
        await login.loginAsPlayer5();
        await register.goto();
        await register.getLadderCheckbox('Men 3.5').click();
        await register.agreeCheckbox.click();
        await register.registerButton.click();

        await register.goToLadderButton.click();
        await expect(overview.playerList).toContainText('Inactive User');
        await expect(overview.getInactivePlayer(7)).toBeHidden();
    });

    test('We can register for the current season', async ({ common, register, login, page }) => {
        // emulate that player5 played in the previous season
        await runQuery('UPDATE players SET userId=7 WHERE id=17');

        await login.loginAsPlayer5();
        await page.goto('/');
        await register.globalRegisterButton.click();

        await expect(common.body).toContainText('2021 Spring');
        await expect(common.body).toContainText('Mar 29');
        await register.getLadderCheckbox('Men 3.5').click();
        await register.agreeCheckbox.click();
        await register.registerButton.click();
        await expect(common.modal).toContainText(register.registerSuccessMessage);
    });

    test('We can see validation during registration', async ({ common, register, login }) => {
        await closeCurrentSeason();

        await register.goto();
        await register.signInLink.click();
        await login.signInButton.click();
        await expect(common.body).toContainText('is incorrect');

        await login.emailField.fill('player1@gmail.com');
        await login.passwordField.fill(login.password);
        await login.signInButton.click();

        await register.agreeCheckbox.click();
        await register.registerButton.click();
        await expect(register.area).toContainText('You have to pick at least one ladder to play');
    });

    test('We can register for not suggested ladder', async ({ common, register, login }) => {
        await closeCurrentSeason();
        await runQuery(`UPDATE settings SET newFeedbackNotification="admin@gmail.com"`);
        await overrideConfig({ minMatchesToEstablishTlr: 1, minPlayersForActiveLadder: 1 });

        await login.loginAsPlayer3();
        await register.goto();
        await expect(register.area).toContainText('your TLR is 3.60');
        await expect(register.area).toContainText('Men 4.0');
        await expect(register.area).not.toContainText('Men 4.5');
        await expect(register.area).not.toContainText('NTRP');

        const reason = 'I got injured'.repeat(50); // long one to cover all cases
        await register.playAnotherLadder(reason);

        await expect(common.modal).toBeHidden();
        await expect(common.body).toContainText('NTRP');

        await register.getLadderCheckbox('Men 4.5').click();
        await register.agreeCheckbox.click();
        await register.registerButton.click();

        await expectRecordToExist('players', { userId: 5, tournamentId: 10 }, { joinReason: reason });

        // Check admin email
        const email = await expectRecordToExist(
            'emails',
            { subject: 'The player joined wrong ladder because of special reason' },
            { recipientEmail: 'admin@gmail.com' }
        );
        expect(email.html).toContain('Cristopher Hamiltonbeach');
        expect(email.html).toContain('3.60');
        expect(email.html).toContain(reason);
        expect(email.html).toContain('Men 4.5');
    });

    test('Soft-banned player cannot regoster for not suggested ladder', async ({ common, register, login }) => {
        await closeCurrentSeason();
        await overrideConfig({ minMatchesToEstablishTlr: 1, minPlayersForActiveLadder: 1 });
        await runQuery(`UPDATE users SET isSoftBan=1 WHERE id=1`);

        await login.loginAsPlayer1();
        await register.goto();
        await expect(register.area).toContainText('your TLR is 3.70');
        await expect(register.strongReasonLink).toBeHidden();
    });

    test('We can see warning about too high TLR', async ({ common, register, login }) => {
        await closeCurrentSeason();
        await overrideConfig({ minMatchesToEstablishTlr: 1, minPlayersForActiveLadder: 1 });
        await runQuery(`UPDATE matches SET challengerElo=550, acceptorElo=550`);

        await login.loginAsPlayer1();
        await register.goto();

        await expect(common.body).toContainText('TLR is 5.50');
        await expect(common.body).not.toContainText(register.tooHighTlrMessage);

        await register.getLadderCheckbox('Men 4.5').click();
        await expect(common.body).toContainText(register.tooHighTlrMessage);

        await register.playAnotherLadder('I got injured');

        // check that we don't see the message for doubles
        await register.getLadderCheckbox('Men Team Doubles').click();
        await common.modal.locator('label', { hasText: 'Join the Player Pool' }).click();
        await common.modal.locator('button').getByText('Submit').click();
        await register.getLadderCheckbox('Men 4.5').click();
        await expect(common.body).not.toContainText(register.tooHighTlrMessage);
    });

    test('We can see suggested ladders for TLR 5.25', async ({ common, register, login }) => {
        await closeCurrentSeason();
        await runQuery(`UPDATE matches SET challengerElo=525, acceptorElo=525 WHERE score IS NOT NULL`);
        await overrideConfig({
            minMatchesToEstablishTlr: 1,
            minPlayersForActiveLadder: 1,
            minMatchesForActiveLadder: 1,
        });

        await login.loginAsPlayer3();
        await register.goto();
        await expect(register.area).toContainText('your TLR is 5.25');
        await expect(register.area).toContainText('Men 3.5');
        await expect(register.area).toContainText('Men 4.0');
        await expect(register.area).toContainText('Men 4.5');
        await expect(register.area).not.toContainText('Men Doubles');
        await expect(register.area).not.toContainText('NTRP');
    });

    test('We can see suggested ladders for TLR 3.75', async ({ common, register, login }) => {
        await closeCurrentSeason();
        await runQuery(`UPDATE matches SET challengerElo=375, acceptorElo=375 WHERE score IS NOT NULL`);
        await overrideConfig({
            minMatchesToEstablishTlr: 1,
            minPlayersForActiveLadder: 1,
            minMatchesForActiveLadder: 1,
        });

        await login.loginAsPlayer3();
        await register.goto();
        await expect(register.area).toContainText('your TLR is 3.75');
        await expect(register.area).toContainText('Men 3.5');
        await expect(register.area).toContainText('Men 4.0');
        await expect(register.area).not.toContainText('Men 4.5');
        await expect(register.area).not.toContainText('Men Doubles');
        await expect(register.area).not.toContainText('NTRP');
    });

    test('We can register for the season by creating a new account', async ({ common, register, login, user }) => {
        await closeCurrentSeason();

        await register.goto();
        await register.emailField.fill('david@rrclub.com');
        await register.passwordField.fill(login.password);
        await register.submitButton.click();

        const emailSent = await expectRecordToExist('emails', { recipientEmail: 'david@rrclub.com' });
        const emailVerificationCode = emailSent.subject.slice(0, 6);

        // try to resend code
        await register.resendEmailLink.click();
        await expect(common.alert).toContainText('another email with the confirmation code');
        await expectRecordToExist('emails', { id: 2 });
        await expectNumRecords('emails', { recipientEmail: 'david@rrclub.com' }, 2);

        await register.emailVerificationCodeField.fill(emailVerificationCode);
        await register.pickLadderButton.click();

        // Check if record exists
        const record = await expectRecordToExist(
            'users',
            { email: 'david@rrclub.com' },
            { firstName: 'David', lastName: 'Trust' }
        );
        expect(record.changelogSeenAt).toBeDefined();
        expect(decrypt(record.salt)).toBe(login.password);

        await register.getLadderCheckbox('Men 3.5').click();
        await register.agreeCheckbox.click();
        await register.registerButton.click();
        await expect(common.modal).toContainText(register.registerSuccessMessage);
    });

    test('We can register for the season for two ladders one by one', async ({
        common,
        register,
        login,
        page,
        overview,
    }) => {
        await closeCurrentSeason();
        await runQuery(`UPDATE levels SET type="doubles" WHERE id=3`);
        await login.loginAsPlayer8();

        await register.goto();
        await register.getLadderCheckbox('Men 3.5').click();
        await register.agreeCheckbox.click();
        await register.registerButton.click();
        await expect(common.modal).toContainText('successfully registered');
        await expect(common.modal).toContainText('The ladder officially begins');
        await expect(overview.playerList).toContainText('Not Played User');
        await register.goToLadderButton.click();

        await expect(common.modal).toBeHidden();
        await expect(overview.area).toBeVisible();

        await page.goto('/season/2022/spring/men-35');
        await expect(overview.playerList).toContainText('Not Played User');
        await expect(common.body).toContainText('Men 3.5');

        await register.goto();
        await expect(register.area).toContainText('already registered');
        await register.getLadderCheckbox('Men 4.0').click();
        await register.agreeCheckbox.click();
        await register.registerButton.click();
        await expect(overview.playerList).toContainText('Not Played User');
        await register.goToLadderButton.click();

        await expect(common.modal).toBeHidden();
        await expect(overview.area).toBeVisible();

        await page.goto('/season/2022/spring/men-40');
        await expect(overview.playerList).toContainText('Not Played User');
        await expect(common.body).toContainText('Men 4.0');

        await register.goto();
        await register.getLadderCheckbox('Men 4.5').click();
        await register.registerButton.click();
        await expect(register.area).toContainText('You cannot pick more than one Singles ladder');
    });

    test('We can register for the season for two ladders at once', async ({
        common,
        register,
        login,
        page,
        overview,
    }) => {
        await closeCurrentSeason();
        await runQuery(`UPDATE levels SET type="doubles" WHERE id=3`);
        await login.loginAsPlayer8();

        await register.goto();
        await register.getLadderCheckbox('Men 3.5').click();
        await register.getLadderCheckbox('Men 4.0').click();
        await register.agreeCheckbox.click();
        await register.registerButton.click();
        await expect(overview.playerList).toContainText('Not Played User');
        await register.goToLadderButton.click();

        await expect(common.modal).toBeHidden();
        await expect(overview.area).toBeVisible();

        await page.goto('/season/2022/spring/men-35');
        await expect(overview.playerList).toContainText('Not Played User');
        await expect(common.body).toContainText('Men 3.5');

        await page.goto('/season/2022/spring/men-40');
        await expect(common.body).toContainText('Men 4.0');
        await expect(overview.playerList).toContainText('Not Played User');
    });

    // TODO: make it work
    test.skip('We can register for the season and player numbers updated', async ({
        common,
        register,
        login,
        page,
        overview,
    }) => {
        const playerCounter = page.locator('[data-latest-level="men-40-dbls"] div[title="Players"]');

        await login.loginAsPlayer8();

        await page.goto('/');
        await expect(playerCounter).toContainText('6');

        await register.globalRegisterButton.click();
        await register.getLadderCheckbox('Men Doubles').click();
        await register.agreeCheckbox.click();
        await register.registerButton.click();
        await expect(common.modal).toContainText('successfully registered');
        await register.goToLadderButton.click();
        await expect(overview.playerList).toContainText('Not Played User');

        await common.logo.click();
        await expect(playerCounter).toContainText('7');
    });

    test('We can redirect to the right ladder after registration', async ({
        common,
        register,
        login,
        page,
        overview,
    }) => {
        await runQuery(`DELETE FROM players WHERE userId=8`);

        await closeCurrentSeason();
        await runQuery(`UPDATE players SET createdAt=NOW() WHERE userId=8`);
        await login.loginAsPlayer8();

        await register.goto();
        await register.getLadderCheckbox('Men 4.0').click();
        await register.agreeCheckbox.click();
        await register.registerButton.click();
        await expect(overview.playerList).toContainText('Not Played User');
        await register.goToLadderButton.click();

        await expect(common.modal).toBeHidden();
        await expect(overview.area).toBeVisible();

        await page.goto('/season/2022/spring/men-40');
        await expect(overview.playerList).toContainText('Not Played User');
        await expect(common.body).toContainText('Men 4.0');

        await new Promise((resolve) => setTimeout(resolve, 500)); // to save emails in DB
        const welcomeEmail = await expectRecordToExist('emails', {
            subject: 'Welcome to the Raleigh Rival Tennis Ladder!',
            recipientEmail: 'player8@gmail.com',
        });
        expect(welcomeEmail.html).toContain('Andrew Cole');
        expect(welcomeEmail.html).toContain('The Ladder Starts Soon');
        expect(welcomeEmail.html).toContain('2022 Spring');
        expect(welcomeEmail.html).toContain('Monday,');
    });

    test('The user cannot register for three ladders', async ({ common, register, login }) => {
        await closeCurrentSeason();
        await login.loginAsPlayer8();

        await register.goto();
        await register.getLadderCheckbox('Men 3.5').click();
        await register.getLadderCheckbox('Men 4.0').click();
        await register.getLadderCheckbox('Men 4.5').click();
        await register.registerButton.click();
        await expect(register.area).toContainText('You cannot pick more than one Singles ladder.');
    });

    test('We can set gender after choosing ladder', async ({ common, register, login, user }) => {
        await register.goto();
        await register.emailField.fill('david@rrclub.com');
        await register.passwordField.fill(login.password);
        await register.submitButton.click();

        const emailSent = await expectRecordToExist('emails', { recipientEmail: 'david@rrclub.com' });
        const emailVerificationCode = emailSent.subject.slice(0, 6);
        await register.emailVerificationCodeField.fill(emailVerificationCode);
        await register.pickLadderButton.click();

        // Check if record exists
        await expectRecordToExist('users', { email: 'david@rrclub.com' }, { gender: '' });

        await register.getLadderCheckbox('Men 3.5').click();
        await register.agreeCheckbox.click();
        await register.registerButton.click();
        await register.goToLadderButton.click();

        // check that gender is set
        await expectRecordToExist('users', { email: 'david@rrclub.com' }, { gender: 'male' });
    });

    test('We do not change gender', async ({ common, register, login }) => {
        await runQuery('UPDATE users SET gender="female" WHERE email="player5@gmail.com"');

        await login.loginAsPlayer5();
        await register.goto();
        await register.getLadderCheckbox('Men 4.5').click();
        await register.agreeCheckbox.click();
        await register.registerButton.click();
        await register.goToLadderButton.click();

        // check that gender is set
        await expectRecordToExist('users', { email: 'player5@gmail.com' }, { gender: 'female' });
    });
}
