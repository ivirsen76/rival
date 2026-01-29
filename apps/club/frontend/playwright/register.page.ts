import {
    restoreDb,
    runQuery,
    expectRecordToExist,
    getRecord,
    getNumRecords,
    overrideConfig,
} from '@rival/club.backend/src/db/helpers';
import { test, expect } from './base';
import dayjs from '@rival/club.backend/src/utils/dayjs';
import { decrypt } from '@rival/club.backend/src/utils/crypt';

const closeCurrentSeason = async () => {
    const dateTwoDaysAgo = dayjs.tz().subtract(2, 'day').format('YYYY-MM-DD HH:mm:ss');
    await runQuery(`UPDATE seasons SET endDate="${dateTwoDaysAgo}" WHERE id=1`);
};

test.beforeEach(async ({ page }) => {
    restoreDb();
});

test('We can see validation error during registration', async ({ page, common, register }) => {
    await closeCurrentSeason();

    await page.goto('/');
    await register.globalRegisterButton.click();
    await register.submitPlayerButton.click();
    await expect(common.body).toContainText('Password must be');
});

// Register for the next season
{
    test('We can switch season during registration', async ({ common, register, login }) => {
        const dateInThreeDays = dayjs.tz().add(3, 'day').format('YYYY-MM-DD HH:mm:ss');
        await runQuery(`UPDATE seasons SET endDate="${dateInThreeDays}" WHERE id=1`);
        await overrideConfig({ minMatchesToPay: 0 });

        await login.loginAsPlayer1();
        await register.goto();
        await expect(common.body).toContainText('2022 Spring');
        await register.spring2021.click();

        await register.getLadderCheckbox('Men 4.0').click();
        await expect(common.body).toContainText('2021 Spring (');
        await expect(common.body).not.toContainText('Register for 2021 Spring');
        await register.agreeCheckbox.click();
        await register.goToCheckoutButton.click();

        await register.changeSeasonLink.click();
        await register.spring2022.click();
        await register.getLadderCheckbox('Men 4.0').click();

        await register.agreeCheckbox.click();
        await register.goToCheckoutButton.click();
        await expect(register.totalSum).toContainText('$30.00');
        await expect(common.body).toContainText('early registration');
    });

    test('We do not see season picker if it is just one season available', async ({
        page,
        common,
        register,
        login,
    }) => {
        const dateInAMonth = dayjs.tz().add(1, 'month').format('YYYY-MM-DD HH:mm:ss');
        await runQuery(`UPDATE seasons SET endDate="${dateInAMonth}" WHERE id=1`);
        await overrideConfig({ minMatchesToPay: 0 });

        await login.loginAsPlayer1();
        await register.goto();

        await register.getLadderCheckbox('Men 4.0').click();
        await expect(common.body).toContainText('Register for 2021 Spring');

        await register.agreeCheckbox.click();
        await register.goToCheckoutButton.click();
        await expect(register.totalSum).toContainText('$35.00');
        await expect(register.seasonBlock).toBeHidden();
    });

    test('We can see login form at the beginning', async ({ page, login }) => {
        await page.goto('/register?step=login');
        await expect(login.forgotPasswordLink).toBeVisible();
    });

    test('We can see login form at the beginning and prefill the email', async ({ page, login }) => {
        await page.goto('/register?step=login&email=some@gmail.com');
        await expect(login.forgotPasswordLink).toBeVisible();
        await expect(login.emailField).toHaveValue('some@gmail.com');
    });

    test('We can see NTRP guidelines', async ({ page, common, register, login }) => {
        await login.loginAsPlayer3();
        await register.goto();

        await page.getByRole('link', { name: 'NTRP Guidelines' }).click();
        await expect(common.modal).toContainText('This player is just starting to play tennis.');
    });

    test('We can register for free for the next season', async ({ common, register, login, overview }) => {
        const dateInThreeDays = dayjs.tz().add(3, 'day').format('YYYY-MM-DD HH:mm:ss');
        await runQuery(`UPDATE seasons SET endDate="${dateInThreeDays}" WHERE id=1`);
        await overrideConfig({ minMatchesToPay: 99 });

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
        expect(await getNumRecords('emails')).toBe(0);
    });

    test('We can see separate Singles and Doubles when register for free', async ({
        common,
        register,
        login,
        overview,
    }) => {
        const dateInThreeDays = dayjs.tz().add(3, 'day').format('YYYY-MM-DD HH:mm:ss');
        await runQuery(`UPDATE seasons SET endDate="${dateInThreeDays}" WHERE id=1`);
        await overrideConfig({ minMatchesToPay: 99 });

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

    test('We can register for free as final matches played do not count', async ({
        common,
        register,
        login,
        overview,
    }) => {
        await closeCurrentSeason();
        await overrideConfig({ minMatchesToPay: 4 });
        await runQuery(`UPDATE matches SET type="final" WHERE id=2`);

        await login.loginAsPlayer3();
        await register.goto();
        await expect(common.body).toContainText('because you played fewer than 4 matches before this season');

        await register.getLadderCheckbox('Men 4.0').click();
        await register.agreeCheckbox.click();
        await register.registerButton.click();

        await expect(common.modal).toContainText('The ladder officially begins');
        await expect(overview.playerList).toContainText('Cristopher Hamiltonbeach');
        await register.goToLadderButton.click();

        await expect(common.modal).toBeHidden();
        await expect(overview.area).toBeVisible();
    });

    test('We can register by paying for the next season', async ({ common, register, login, overview }) => {
        if (process.env.CI) {
            return;
        }

        const dateInThreeDays = dayjs.tz().add(3, 'day').format('YYYY-MM-DD HH:mm:ss');
        await runQuery(`UPDATE seasons SET endDate="${dateInThreeDays}" WHERE id=1`);

        await login.loginAsPlayer3();
        await register.goto();
        await register.spring2022.click();

        await register.getLadderCheckbox('Men 4.0').click();
        await register.agreeCheckbox.click();
        await register.goToCheckoutButton.click();

        await register.confirmOrderButton.click();

        await register.stripeCardSection.click();
        await register.stripeCardNumberField.fill('4242 4242 4242 4242');
        await register.stripeCardExpiryField.fill('12/27');
        await register.stripeCardCvcField.fill('123');
        await register.stripeBillingNameField.fill('Name Surname');
        await register.stripeBillingPostalCodeField.fill('27560');
        await register.stripeSubmitButton.click();

        await expect(common.body).toContainText('Payment successful', { timeout: 15000 });
        await expect(common.modal).toContainText('The ladder officially begins');
        await expect(overview.playerList).toContainText('Cristopher Hamiltonbeach');
        await register.goToLadderButton.click();

        await expect(common.modal).toBeHidden();
        await expect(overview.area).toBeVisible();

        // No emails should be sent
        await new Promise((resolve) => setTimeout(resolve, 1000));
        expect(await getNumRecords('emails')).toBe(0);
    });

    test('We can register for two ladders and get a discount', async ({ common, register, login, overview }) => {
        if (process.env.CI) {
            return;
        }

        const dateInThreeDays = dayjs.tz().add(3, 'day').format('YYYY-MM-DD HH:mm:ss');
        await runQuery(`UPDATE seasons SET endDate="${dateInThreeDays}" WHERE id=1`);

        await login.loginAsPlayer3();
        await register.goto();
        await register.spring2022.click();

        await register.getLadderCheckbox('Men 3.5').click();
        await register.getLadderCheckbox('Men 4.0').click();
        await register.agreeCheckbox.click();
        await register.goToCheckoutButton.click();

        await expect(common.body).toContainText('$50.00');

        await register.confirmOrderButton.click();
        await register.submitCardCredentials();

        await expect(common.body).toContainText('Payment successful', { timeout: 15000 });
        await expect(common.modal).toContainText('The ladder officially begins');
        await expect(overview.playerList).toContainText('Cristopher Hamiltonbeach');
        await register.goToLadderButton.click();

        await expect(common.modal).toBeHidden();
        await expect(overview.area).toBeVisible();

        // No emails should be sent
        await new Promise((resolve) => setTimeout(resolve, 1000));
        expect(await getNumRecords('emails')).toBe(0);
    });

    test('We can register for a second ladder and get a discount and pay from wallet', async ({
        common,
        register,
        login,
    }) => {
        if (process.env.CI) {
            return;
        }

        const dateInThreeDays = dayjs.tz().add(3, 'day').format('YYYY-MM-DD HH:mm:ss');
        await runQuery(`UPDATE seasons SET endDate="${dateInThreeDays}" WHERE id=1`);

        await runQuery(
            `INSERT INTO payments (userId, type, description, amount) VALUES (5, 'discount', 'Referral credit', 10000)`
        );

        await login.loginAsPlayer3();
        await register.goto();
        await register.spring2022.click();
        await register.getLadderCheckbox('Men 3.5').click();
        await register.agreeCheckbox.click();
        await register.goToCheckoutButton.click();

        await expect(common.body).toContainText('$30.00');
        await register.confirmOrderButton.click();
        await expect(common.modal).toContainText('The ladder officially begins');

        await register.goto();
        await register.spring2022.click();
        await register.getLadderCheckbox('Men 4.0').click();
        await register.agreeCheckbox.click();
        await register.goToCheckoutButton.click();

        await expect(common.body).toContainText('$20.00');
        await register.confirmOrderButton.click();
        await expect(common.modal).toContainText('The ladder officially begins');

        const [row] = await runQuery('SELECT SUM(amount) AS total FROM payments WHERE userId=5');
        expect(row.total).toBe(5000);
    });

    test('We can register for a free ladder and do not get a second ladder discount', async ({
        common,
        register,
        login,
    }) => {
        await closeCurrentSeason();
        await runQuery(`INSERT INTO tournaments (seasonId, levelId) VALUES (5, 4)`);
        await runQuery(`UPDATE matches SET challengerElo=320, acceptorElo=320 WHERE score IS NOT NULL`);
        await runQuery(`
            INSERT INTO payments (userId, type, description, amount)
                 VALUES (5, 'discount', 'Referral credit', 7500)`);
        await overrideConfig({
            minMatchesToEstablishTlr: 1,
            minPlayersForActiveLadder: 1,
            minMatchesForActiveLadder: 1,
        });

        await login.loginAsPlayer3();
        await register.goto();
        await register.getLadderCheckbox('Men 3.0').click();
        await register.getLadderCheckbox('Men 3.5').click();
        await register.agreeCheckbox.click();
        await register.goToCheckoutButton.click();

        await expect(common.body).toContainText('$30.00');
        await expect(common.body).not.toContainText('additional ladder');
        await register.confirmOrderButton.click();
        await expect(common.modal).toContainText('The ladder officially begins');

        const [row] = await runQuery('SELECT SUM(amount) AS total FROM payments WHERE userId=5');
        expect(row.total).toBe(4500);
    });

    test('We can register by paying from the wallet for the next season', async ({
        common,
        register,
        login,
        overview,
    }) => {
        const dateInThreeDays = dayjs.tz().add(3, 'day').format('YYYY-MM-DD HH:mm:ss');
        await runQuery(`UPDATE seasons SET endDate="${dateInThreeDays}" WHERE id=1`);
        await runQuery(`
            INSERT INTO payments (userId, type, description, amount)
                 VALUES (5, 'discount', 'Referral credit', 9000)`);

        await login.loginAsPlayer3();
        await register.goto();
        await register.spring2022.click();

        await register.getLadderCheckbox('Men 4.0').click();
        await register.agreeCheckbox.click();
        await register.goToCheckoutButton.click();

        await register.confirmOrderButton.click();

        await expect(common.body).toContainText('Order processed successfully');
        await expect(common.modal).toContainText('The ladder officially begins');
        await expect(overview.playerList).toContainText('Cristopher Hamiltonbeach');
        await register.goToLadderButton.click();

        await expect(common.modal).toBeHidden();
        await expect(overview.area).toBeVisible();

        // No emails should be sent
        await new Promise((resolve) => setTimeout(resolve, 1000));
        expect(await getNumRecords('emails')).toBe(0);
    });

    test('We can register for the next season by creating a new account', async ({
        common,
        register,
        login,
        overview,
        user,
    }) => {
        const dateInThreeDays = dayjs.tz().add(3, 'day').format('YYYY-MM-DD HH:mm:ss');
        await runQuery(`UPDATE seasons SET endDate="${dateInThreeDays}" WHERE id=1`);

        await register.goto();
        await register.firstNameField.fill('Peter');
        await register.lastNameField.fill('Allen');
        await register.emailField.fill('peter@gmail.com');
        await register.phoneField.fill('1112223333');
        await register.passwordField.fill(login.password);
        await expect(register.zipField).toBeHidden();
        await register.submitPlayerButton.click();
        await expect(register.area).toContainText('Birth date is required');

        await user.enterBirthday('1/1/1825');
        await register.submitPlayerButton.click();
        await expect(register.area).toContainText('You cannot be over 100 years old');

        await user.enterBirthday('12/7/1976');
        await expect(register.area).toContainText('Dec 7, 1976 - 49 years old');

        await register.submitPlayerButton.click();
        await expect(common.body).toContainText('Verify');

        const createdUser = await expectRecordToExist(
            'users',
            { email: 'peter@gmail.com' },
            { birthday: '1976-12-07' }
        );

        const emailSent = await expectRecordToExist('emails', { recipientEmail: 'peter@gmail.com' });
        const emailVerificationCode = emailSent.subject.slice(0, 6);

        await register.emailVerificationCodeField.fill(emailVerificationCode);
        await expect(common.body).toContainText('successfully registered');

        // expect paw to be saved
        await expectRecordToExist('fingerprints', { userId: createdUser.id });

        await register.pickLadderButton.click();
        await register.spring2022.click();
        await register.getLadderCheckbox('Men 3.5').click();
        await register.agreeCheckbox.click();
        await register.registerButton.click();

        await expect(common.body).toContainText('You are successfully registered!');
        await expect(common.modal).toContainText('The ladder officially begins');
        await expect(overview.playerList).toContainText('Peter Allen');
        await register.goToLadderButton.click();

        await expect(common.modal).toBeHidden();
        await expect(overview.area).toBeVisible();

        await expectRecordToExist('emails', {
            recipientEmail: 'peter@gmail.com',
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

    test('We can register and pay till the end of the season', async ({ common, register, login, page }) => {
        const dateInThreeDays = dayjs.tz().add(3, 'day').format('YYYY-MM-DD HH:mm:ss');
        await runQuery(`UPDATE seasons SET endDate="${dateInThreeDays}" WHERE id=1`);
        await overrideConfig({ minMatchesToPay: 0 });

        await login.loginAsPlayer1();
        await page.goto('/');
        await expect(register.globalRegisterButton).toBeVisible();

        await register.goto();
        await register.spring2021.click();
        await register.getLadderCheckbox('Men 3.0').click();
        await register.goToCheckoutButton.click();
        await expect(common.body).toContainText('You must agree');

        // Check terms and conditions
        await register.termsAndConditionsLink.click();
        await expect(common.modal).toContainText('Fees, Payments, and Refunds');
        await page.getByText('Close').click();

        await register.agreeCheckbox.click();
        await register.goToCheckoutButton.click();
        await expect(register.totalSum).toContainText('$35.00');
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

    test('We can register for the ladder where the user is not active', async ({
        common,
        register,
        login,
        overview,
    }) => {
        await login.loginAsPlayer5();
        await register.goto();
        await register.getLadderCheckbox('Men 3.5').click();
        await register.agreeCheckbox.click();
        await register.registerButton.click();

        await register.goToLadderButton.click();
        await expect(overview.playerList).toContainText('Inactive User');
        await expect(overview.getInactivePlayer(7)).toBeHidden();
    });

    test('We can register and pay for the ladder where the user is not active', async ({
        common,
        register,
        login,
        overview,
    }) => {
        await closeCurrentSeason();
        await runQuery(`UPDATE players SET isActive=0 WHERE id=9`);
        await runQuery(`INSERT INTO payments SET userId=1, type="discount", description="Credit", amount=5300`);

        await login.loginAsPlayer1();
        await register.goto();
        await register.getLadderCheckbox('Men 3.5').click();
        await register.agreeCheckbox.click();
        await register.goToCheckoutButton.click();
        await register.confirmOrderButton.click();

        await expect(common.modal).toContainText('Order processed successfully!');
        await expectRecordToExist('players', { id: 9 }, { isActive: 1 });
    });

    test('We can register for the season already logged in user', async ({ common, register, login, page }) => {
        await closeCurrentSeason();
        await login.loginAsPlayer1();

        await page.goto('/');
        await expect(common.body).toContainText('Upcoming 2022 Spring Season');
        await register.globalRegisterButton.click();

        await expect(common.body).toContainText('Register for 2022 Spring Season');
        await register.getLadderCheckbox('Men 4.0').click();
        await register.agreeCheckbox.click();
        await register.goToCheckoutButton.click();
        await expect(register.totalSum).toContainText('$30.00');
    });

    test('We can register for the current season', async ({ common, register, login, page }) => {
        // emulate that player5 played in the previous season
        await runQuery('UPDATE players SET userId=7 WHERE id=17');
        await overrideConfig({ minMatchesToPay: 0 });

        await login.loginAsPlayer5();
        await page.goto('/');
        await register.globalRegisterButton.click();

        await expect(common.body).toContainText('2021 Spring');
        await expect(common.body).toContainText('Mar 29');
        await register.getLadderCheckbox('Men 3.5').click();
        await register.getLadderCheckbox('Men Doubles').click();
        await register.agreeCheckbox.click();
        await register.goToCheckoutButton.click();
        await expect(register.totalSum).toContainText('$50.00');
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
        await register.goToCheckoutButton.click();
        await expect(register.area).toContainText('You have to pick at least one ladder to play');
    });

    test('We can register for the season using existing account', async ({
        common,
        register,
        login,
        overview,
        page,
        homepage,
        wallet,
    }) => {
        if (process.env.CI) {
            return;
        }

        await closeCurrentSeason();

        await register.goto();
        await register.signInLink.click();
        await register.emailField.fill('player1@gmail.com');
        await register.passwordField.fill(login.password);
        await login.signInButton.click();

        await expect(register.area).toContainText('Prices before the season starts:');
        await expect(register.area).toContainText('$30');
        await expect(register.area).toContainText('$20');
        await register.getLadderCheckbox('Men 4.0').click();
        await register.agreeCheckbox.click();
        await register.goToCheckoutButton.click();

        await expect(register.totalSum).toContainText('$30.00');
        await expect(register.area).toContainText(register.noPaymentInformationMessage);

        await register.confirmOrderButton.click();
        await expect(common.body).toContainText('Payment method');

        const order = await expectRecordToExist('orders', { userId: 1 }, { amount: 3000 });
        expect(JSON.parse(order.payload)).toBeTruthy();
        expect(order.sessionId).toBeTruthy();
        expect(order.processedAt).toBeFalsy();

        await expect(common.body).toContainText('$30.00');
        await register.submitCardCredentials();

        await expect(common.body).toContainText('Payment successful', { timeout: 15000 });
        await expect(overview.playerList).toContainText('Ben Done');
        await register.goToLadderButton.click();

        await expect(common.modal).toBeHidden();
        await expect(overview.area).toBeVisible();

        await page.goto('/');
        await homepage.getUpcomingSeasonLadder('Men 4.0').click();
        await expect(overview.playerList).toContainText('Ben Done');

        await expectRecordToExist('payments', { userId: 1, tournamentId: 8 });

        // Check payment page
        await wallet.goto();
        await expect(common.body).toContainText('Payment');
        await expect(common.body).toContainText('2022 Spring - Men 4.0 Ladder (early registration)');
        await expect(common.body).toContainText('$30.00');
        await wallet.getOrderSummary(1).click();
        await expect(common.modal).toContainText('$30.00');
    });

    test('We can cancel our payment', async ({ common, register, login }) => {
        if (process.env.CI) {
            return;
        }

        await closeCurrentSeason();

        await register.goto();
        await register.signInLink.click();
        await register.emailField.fill('player1@gmail.com');
        await register.passwordField.fill(login.password);
        await login.signInButton.click();

        await register.getLadderCheckbox('Men 4.0').click();
        await register.agreeCheckbox.click();
        await register.goToCheckoutButton.click();

        await expect(register.totalSum).toContainText('$30.00');

        await register.confirmOrderButton.click();
        await expect(common.body).toContainText('Rival Tennis Ladder, LLC');
        await expect(common.body).toContainText('2022 Spring - Men 4.0 Ladder (early registration)');
    });

    test('We can register for the season partially using collected money', async ({
        page,
        common,
        register,
        login,
        overview,
        homepage,
    }) => {
        if (process.env.CI) {
            return;
        }

        await closeCurrentSeason();
        await runQuery(`
            INSERT INTO payments (userId, type, description, amount)
                 VALUES (5, 'discount', 'Referral credit', 2000)`);

        await register.goto();
        await register.signInLink.click();
        await register.emailField.fill('player3@gmail.com');
        await register.passwordField.fill(login.password);
        await login.signInButton.click();

        await register.getLadderCheckbox('Men 3.5').click();
        await register.getLadderCheckbox('Men 4.0').click();
        await register.agreeCheckbox.click();
        await register.goToCheckoutButton.click();

        await expect(register.area).toContainText('Current balance:$20.00');
        await expect(register.area).toContainText('From Wallet');
        await expect(register.totalSum).toContainText('$30.00');
        await register.confirmOrderButton.click();

        await expect(common.body).toContainText(
            '2022 Spring - Men 3.5 Ladder (early registration), 2022 Spring - Men 4.0 Ladder (early registration, additional ladder)'
        );

        await register.submitCardCredentials();

        await expect(common.body).toContainText('Payment successful', { timeout: 15000 });
        await expect(overview.playerList).toContainText('Ben Done');
        await register.goToLadderButton.click();

        await expect(common.modal).toBeHidden();
        await expect(overview.area).toBeVisible();

        await page.goto('/');
        await homepage.getUpcomingSeasonLadder('Men 3.5').click();
        await expect(overview.playerList).toContainText('Cristopher Hamiltonbeach');

        const [row] = await runQuery('SELECT SUM(amount) AS total FROM payments WHERE userId=5');
        expect(row.total).toBe(0);
    });

    test('We can register for the season and start proposing matches immediately', async ({
        common,
        register,
        login,
        overview,
    }) => {
        if (process.env.CI) {
            return;
        }

        // emulate that player9 played in the previous season
        await runQuery('UPDATE matches SET challengerId=19 WHERE id=61');
        await overrideConfig({ minMatchesToPay: 0 });

        await register.goto();
        await register.signInLink.click();
        await register.emailField.fill('player9@gmail.com');
        await register.passwordField.fill(login.password);
        await login.signInButton.click();

        await register.getLadderCheckbox('Men 3.5').click();
        await expect(register.area).toContainText('Prices after the season starts:');
        await expect(register.area).toContainText('$35');
        await expect(register.area).toContainText('$25');
        await register.agreeCheckbox.click();
        await register.goToCheckoutButton.click();

        await expect(register.totalSum).toContainText('$35.00');
        await register.confirmOrderButton.click();

        await register.submitCardCredentials();

        await expect(common.body).toContainText('Payment successful', { timeout: 15000 });
        await register.goToLadderButton.click();
        await expect(overview.playerList).toContainText('Doubles Player');

        await expect(overview.proposeMatchButton).toBeVisible();
    });

    test('We can register for not suggested ladder', async ({ common, register, login }) => {
        await closeCurrentSeason();
        await runQuery(`UPDATE settings SET newFeedbackNotification="admin@gmail.com"`);
        await runQuery(`
            INSERT INTO payments (userId, type, description, amount)
                 VALUES (1, 'discount', 'Referral credit', 10500)`);
        await overrideConfig({ minMatchesToEstablishTlr: 1, minPlayersForActiveLadder: 1 });

        await login.loginAsPlayer1();
        await register.goto();
        await expect(register.area).toContainText('your TLR is 3.70');
        await expect(register.area).toContainText('Men 4.0');
        await expect(register.area).not.toContainText('Men 4.5');
        await expect(register.area).not.toContainText('NTRP');

        const reason = 'I got injured'.repeat(50); // long one to cover all cases
        await register.playAnotherLadder(reason);

        await expect(common.modal).toBeHidden();
        await expect(common.body).toContainText('NTRP');

        await register.getLadderCheckbox('Men 4.5').click();
        await register.agreeCheckbox.click();
        await register.goToCheckoutButton.click();

        await register.confirmOrderButton.click();
        await expect(common.modal).toContainText('Order processed successfully');

        await expectRecordToExist('players', { userId: 1, tournamentId: 10 }, { joinReason: reason });

        // Check admin email
        const email = await expectRecordToExist(
            'emails',
            { subject: 'The player joined wrong ladder because of special reason' },
            { recipientEmail: 'admin@gmail.com' }
        );
        expect(email.html).toContain('Ben Done');
        expect(email.html).toContain('3.70');
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

    test("We can register and don't see $10 credit for free ladder", async ({ common, register, login }) => {
        await closeCurrentSeason();
        await overrideConfig({ minMatchesToEstablishTlr: 1, minPlayersForActiveLadder: 1 });
        await runQuery(`UPDATE matches SET challengerElo=550, acceptorElo=550`);

        await login.loginAsPlayer1();
        await register.goto();

        await register.getLadderCheckbox('Men 4.5').click();
        await expect(common.body).toContainText(register.tooHighTlrMessage);
        await expect(common.body).not.toContainText(register.tooHighTlrDiscountMessage);
    });

    test('We can register and and get $10 credit for non taking tournament', async ({ common, register, login }) => {
        await closeCurrentSeason();
        await overrideConfig({ minMatchesToEstablishTlr: 1, minPlayersForActiveLadder: 1 });
        await runQuery(`UPDATE matches SET challengerElo=550, acceptorElo=550`);

        await login.loginAsPlayer1();
        await register.goto();

        await register.playAnotherLadder('I got injured');

        await register.getLadderCheckbox('Men 4.0').click();
        await expect(common.body).toContainText(register.tooHighTlrMessage);
        await expect(common.body).toContainText(register.tooHighTlrDiscountMessage);

        await register.agreeCheckbox.click();
        await register.goToCheckoutButton.click();

        await expect(common.body).toContainText('$20.00');
        await expect(common.body).toContainText('no tournament');
    });

    test('We can allow to join one ladder for free', async ({ page, common, register, login, homepage, overview }) => {
        await closeCurrentSeason();
        await overrideConfig({
            minMatchesToEstablishTlr: 1,
            minPlayersForActiveLadder: 0,
            minMatchesForActiveLadder: 0,
        });
        await runQuery(`UPDATE tournaments SET isFree=1 WHERE levelId=2`);

        await login.loginAsPlayer3();
        await register.goto();

        await expect(page.locator('[data-free-level="men-35"]')).toBeVisible();
        await register.getLadderCheckbox('Men 3.5').click();
        await register.agreeCheckbox.click();
        await register.goToCheckoutButton.click();

        await expect(common.body).toContainText('$0.00');
        await register.confirmOrderButton.click();
        await expect(overview.playerList).toContainText('Cristopher Hamiltonbeach');
        await register.goToLadderButton.click();

        await expect(common.modal).toBeHidden();
        await expect(overview.area).toBeVisible();
    });

    test('We can register and pay for not suggested ladder', async ({ common, register, login }) => {
        if (process.env.CI) {
            return;
        }

        await closeCurrentSeason();
        await runQuery(`UPDATE settings SET newFeedbackNotification="admin@gmail.com"`);
        await overrideConfig({ minMatchesToEstablishTlr: 1, minPlayersForActiveLadder: 1 });

        await login.loginAsPlayer1();
        await register.goto();

        await register.playAnotherLadder('I got injured');

        await expect(common.body).toContainText('NTRP');

        await register.getLadderCheckbox('Men 4.5').click();
        await register.agreeCheckbox.click();
        await register.goToCheckoutButton.click();

        await register.confirmOrderButton.click();

        await expect(common.body).toContainText('2022 Spring - Men 4.5 Ladder (early registration)');
        await register.submitCardCredentials();

        await expect(common.body).toContainText('Payment successful', { timeout: 15000 });

        await expectRecordToExist('players', { userId: 1, tournamentId: 10 }, { joinReason: 'I got injured' });

        // Check admin email
        const email = await expectRecordToExist(
            'emails',
            { subject: 'The player joined wrong ladder because of special reason' },
            { recipientEmail: 'admin@gmail.com' }
        );
        expect(email.html).toContain('Ben Done');
        expect(email.html).toContain('3.70');
        expect(email.html).toContain('I got injured');
        expect(email.html).toContain('Men 4.5');
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

        await expect(register.getFreeLadderBadge('men-35')).toBeHidden();
        await expect(register.getFreeLadderBadge('men-40')).toBeVisible();
        await expect(register.getFreeLadderBadge('men-45')).toBeVisible();
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

        await expect(register.getFreeLadderBadge('men-35')).toBeHidden();
        await expect(register.getFreeLadderBadge('men-40')).toBeVisible();
    });

    test('We can register for suggested ladder and free as well using wallet money', async ({
        common,
        register,
        login,
    }) => {
        await closeCurrentSeason();
        await runQuery(`UPDATE matches SET challengerElo=370, acceptorElo=370 WHERE score IS NOT NULL`);
        await runQuery(`
            INSERT INTO payments (userId, type, description, amount)
                 VALUES (5, 'discount', 'Referral credit', 3500)`);
        await overrideConfig({
            minMatchesToEstablishTlr: 1,
            minPlayersForActiveLadder: 1,
            minMatchesForActiveLadder: 1,
        });

        await login.loginAsPlayer3();
        await register.goto();

        await register.getLadderCheckbox('Men 3.5').click();
        await register.getLadderCheckbox('Men 4.0').click();
        await register.agreeCheckbox.click();
        await register.goToCheckoutButton.click();

        await expect(register.totalSum).toContainText('$0.00');
        await expect(common.body).toContainText('$35.00');

        await register.confirmOrderButton.click();

        await expect(common.body).toContainText('Order processed successfully');

        const [row] = await runQuery('SELECT SUM(amount) AS total FROM payments WHERE userId=5');
        expect(row.total).toBe(500);

        expect(await getNumRecords('payments')).toBe(2);

        await expectRecordToExist('players', { userId: 5, tournamentId: 7 }, { joinForFree: 0 });
        await expectRecordToExist('players', { userId: 5, tournamentId: 8 }, { joinForFree: 1 });
    });

    test('We can register for free ladder', async ({ page, common, register, login }) => {
        await closeCurrentSeason();
        await runQuery(`UPDATE matches SET challengerElo=370, acceptorElo=370 WHERE score IS NOT NULL`);
        await overrideConfig({
            minMatchesToEstablishTlr: 1,
            minPlayersForActiveLadder: 1,
            minMatchesForActiveLadder: 1,
        });

        await login.loginAsPlayer3();
        await register.goto();

        await expect(page.locator('[data-free-level="men-40"]')).toBeVisible();
        await expect(page.locator('[data-free-level="men-35"]')).toBeHidden();
        await register.getLadderCheckbox('Men 4.0').click();
        await register.agreeCheckbox.click();
        await register.goToCheckoutButton.click();

        await expect(register.totalSum).toContainText('$0.00');
        await register.confirmOrderButton.click();

        await expect(common.body).toContainText('Order processed successfully');

        expect(await getNumRecords('payments')).toBe(0);
        await expectRecordToExist('players', { userId: 5, tournamentId: 8 }, { joinForFree: 1 });
    });

    test('We can register for not suggested ladder for free season', async ({ common, register, login }) => {
        await closeCurrentSeason();
        await runQuery(`UPDATE settings SET newFeedbackNotification="admin@gmail.com"`);
        await runQuery(`UPDATE seasons SET isFree=1`);
        await runQuery(`UPDATE matches SET challengerElo=370, acceptorElo=370 WHERE score IS NOT NULL`);
        await overrideConfig({ minMatchesToEstablishTlr: 1, minPlayersForActiveLadder: 1 });

        await login.loginAsPlayer3();
        await register.goto();
        await expect(register.area).toContainText('your TLR is 3.70');
        await expect(register.area).toContainText('Men 4.0');
        await expect(register.area).not.toContainText('Men 4.5');
        await expect(register.area).not.toContainText('NTRP');

        await register.playAnotherLadder('I got injured');

        await expect(common.modal).toBeHidden();
        await expect(register.area).toContainText('NTRP');

        await register.getLadderCheckbox('Men 4.5').click();
        await register.agreeCheckbox.click();
        await register.registerButton.click();

        await expect(common.modal).toContainText('You are successfully registered');

        await expectRecordToExist('players', { userId: 5, tournamentId: 10 }, { joinReason: 'I got injured' });

        // Check admin email
        const email = await expectRecordToExist(
            'emails',
            { subject: 'The player joined wrong ladder because of special reason' },
            { recipientEmail: 'admin@gmail.com' }
        );
        expect(email.html).toContain('Cristopher Hamiltonbeach');
        expect(email.html).toContain('3.70');
        expect(email.html).toContain('I got injured');
        expect(email.html).toContain('Men 4.5');
    });

    test('We can see all ladders when switching back to ladder step', async ({ page, common, register, login }) => {
        await closeCurrentSeason();
        await runQuery(`UPDATE matches SET challengerElo=370, acceptorElo=370 WHERE score IS NOT NULL`);
        await overrideConfig({
            minMatchesToEstablishTlr: 1,
            minPlayersForActiveLadder: 1,
            minMatchesForActiveLadder: 3,
        });

        await login.loginAsPlayer3();
        await register.goto();
        await expect(page.locator('[data-free-level="men-40"]')).toBeVisible();
        await expect(page.locator('[data-free-level="men-35"]')).toBeHidden();
        await expect(register.area).not.toContainText('Men 4.5');

        await register.playAnotherLadder('I got injured');
        await expect(common.modal).toBeHidden();

        await register.getLadderCheckbox('Men 4.5').click();
        await register.agreeCheckbox.click();
        await register.goToCheckoutButton.click();
        await expect(register.area).toContainText('Order summary');

        await register.changeLadderLink.click();
        await expect(register.area).toContainText('Men 4.5');
    });

    test('We can register for the season for three ladders fully using collected money', async ({
        common,
        register,
        login,
        page,
        overview,
        wallet,
        homepage,
    }) => {
        await closeCurrentSeason();
        await runQuery(`
            INSERT INTO payments (userId, type, description, amount)
                 VALUES (5, 'discount', 'Referral credit', 10500)`);

        await register.goto();
        await register.signInLink.click();
        await register.emailField.fill('player3@gmail.com');
        await register.passwordField.fill(login.password);
        await login.signInButton.click();

        await register.getLadderCheckbox('Men 3.5').click();
        await register.getLadderCheckbox('Men 4.0').click();
        await register.getLadderCheckbox('Men 4.5').click();
        await register.agreeCheckbox.click();
        await register.goToCheckoutButton.click();

        await expect(register.area).toContainText('$70.00');
        await expect(register.area).toContainText('From Wallet');
        await expect(register.area).not.toContainText(register.noPaymentInformationMessage);
        await expect(register.totalSum).toContainText('$0.00');
        await register.confirmOrderButton.click();

        await expect(common.body).toContainText('Order processed successfully');
        await expect(overview.playerList).toContainText('Cristopher Hamiltonbeach');
        await register.goToLadderButton.click();

        await expect(common.modal).toBeHidden();
        await expect(overview.area).toBeVisible();

        const [row] = await runQuery('SELECT SUM(amount) AS total FROM payments WHERE userId=5');
        expect(row.total).toBe(3500);

        await expectRecordToExist(
            'payments',
            {
                type: 'product',
                description: '2022 Spring - Men 3.5 Ladder (early registration)',
                amount: -3000,
            },
            { tournamentId: 7 }
        );
        await expectRecordToExist(
            'payments',
            {
                type: 'product',
                description: '2022 Spring - Men 4.0 Ladder (early registration, additional ladder)',
                amount: -2000,
            },
            { tournamentId: 8 }
        );
        await expectRecordToExist(
            'payments',
            {
                type: 'product',
                description: '2022 Spring - Men 4.5 Ladder (early registration, additional ladder)',
                amount: -2000,
            },
            { tournamentId: 10 }
        );

        await wallet.goto();
        await expect(common.body).toContainText('Current balance: $35.00');
        await expect(common.body).toContainText('-$30.00');
        await expect(common.body).toContainText('-$20.00');
        await expect(common.body).toContainText('$105.00');
        await expect(common.body).toContainText('Men 4.0 Ladder (early registration, additional ladder)');
    });

    test('We clean user info after ordering', async ({ page, common, register, login, overview }) => {
        await closeCurrentSeason();
        await runQuery(`
            INSERT INTO payments (userId, type, description, amount)
                 VALUES (5, 'discount', 'Referral credit', 7000)`);

        await register.goto();
        await register.signInLink.click();
        await register.emailField.fill('player3@gmail.com');
        await register.passwordField.fill(login.password);
        await login.signInButton.click();

        await register.getLadderCheckbox('Men 3.5').click();
        await register.agreeCheckbox.click();
        await register.goToCheckoutButton.click();
        await register.confirmOrderButton.click();

        await expect(common.body).toContainText('Order processed successfully');
        await expect(overview.playerList).toContainText('Cristopher Hamiltonbeach');
        await register.goToLadderButton.click();

        await expect(common.modal).toBeHidden();
        await expect(overview.area).toBeVisible();

        await page.goto('/');
        await register.globalRegisterButton.click();
        await expect(common.body).toContainText("You've already registered");
    });

    test('We can change levels during registration', async ({ common, register, login }) => {
        await closeCurrentSeason();

        await register.goto();
        await register.signInLink.click();
        await register.emailField.fill('player3@gmail.com');
        await register.passwordField.fill(login.password);
        await login.signInButton.click();

        await register.getLadderCheckbox('Men 3.5').click();
        await register.getLadderCheckbox('Men 4.0').click();
        await register.agreeCheckbox.click();
        await register.goToCheckoutButton.click();
        await expect(register.totalSum).toContainText('$50.00');

        await register.changeLadderLink.click();
        await expect(register.getLadderCheckbox('Men 3.5')).toBeChecked();
        await register.getLadderCheckbox('Men 3.5').click();
        await register.agreeCheckbox.click();

        await register.goToCheckoutButton.click();
        await expect(register.totalSum).toContainText('$30.00');
    });

    test('We can register for the season by creating a new account', async ({ common, register, login, user }) => {
        await runQuery(`UPDATE settings SET signUpNotification="admin@gmail.com" WHERE id=1`);
        await closeCurrentSeason();

        await register.goto();
        await register.firstNameField.fill('PETER ');
        await register.lastNameField.fill(' allen');
        await register.emailField.fill('player1@gmail.com');
        await register.phoneField.fill('1234890');
        await register.passwordField.fill(login.password);
        await user.enterBirthday('1/1/2000');

        await register.pickComeFromOption('Other');
        await register.comeFromOtherField.fill('friend');

        await register.submitPlayerButton.click();
        await expect(register.area).toContainText('Phone number should contain exactly 10 digits.');

        await register.phoneField.fill('');
        await register.phoneField.fill('1112223333');
        await register.submitPlayerButton.click();
        await expect(register.area).toContainText('This email is already used by another player.');

        await register.emailField.fill('peter@gmail.com');
        await register.submitPlayerButton.click();
        await expect(common.body).toContainText('Verify');

        // Check if record exists
        const record = await expectRecordToExist(
            'users',
            { email: 'peter@gmail.com' },
            { firstName: 'Peter', lastName: 'Allen', comeFrom: 99, comeFromOther: 'friend', isPhoneVerified: 0 }
        );
        expect(record.changelogSeenAt).toBeDefined();
        expect(decrypt(record.salt)).toBe(login.password);

        await register.resendEmailLink.click();
        await expect(common.alert).toContainText('another email with the confirmation code');
        await expectRecordToExist('emails', { id: 2 });
        expect(await getNumRecords('emails', { recipientEmail: 'peter@gmail.com' })).toBe(2);

        const emailSent = await getRecord('emails', { recipientEmail: 'peter@gmail.com' });
        const emailVerificationCode = emailSent.subject.slice(0, 6);
        expect(emailVerificationCode).toMatch(/^\d{6}$/);
        expect(emailSent.html).toContain(emailVerificationCode);

        await register.emailVerificationCodeField.fill('0' + emailVerificationCode.slice(1));
        await expect(common.body).toContainText('Confirmation code is wrong');

        await register.emailVerificationCodeField.fill(emailVerificationCode);
        await expect(common.body).toContainText('successfully registered');
        await register.pickLadderButton.click();

        await register.getLadderCheckbox('Men 3.5').click();
        await register.registerButton.click();

        const notificationSent = await getRecord('emails', { recipientEmail: 'admin@gmail.com' });
        expect(notificationSent.subject).toContain('Peter Allen signed up to the system');
        expect(notificationSent.html).toContain('Raleigh, Origin: Other (friend)');
        expect(notificationSent.html).toContain('<b>Origin:</b> Other (friend)');
    });

    test('We can register and see duplicated message', async ({ common, register, login, user }) => {
        await runQuery(`UPDATE settings SET signUpNotification="admin@gmail.com" WHERE id=1`);

        await register.goto();
        await register.firstNameField.fill('BEN');
        await register.lastNameField.fill('done');
        await register.emailField.fill('player99@gmail.com');
        await register.phoneField.fill('1112223333');
        await register.passwordField.fill(login.password);
        await user.enterBirthday('1/1/2000');

        await register.submitPlayerButton.click();
        await expect(common.body).toContainText('Verify');

        const emailSent = await getRecord('emails', { recipientEmail: 'player99@gmail.com' });
        const emailVerificationCode = emailSent.subject.slice(0, 6);

        await register.emailVerificationCodeField.fill(emailVerificationCode);
        await expect(common.body).toContainText('successfully registered');

        const notificationSent = await getRecord('emails', { recipientEmail: 'admin@gmail.com' });
        expect(notificationSent.subject).toContain('Ben Done (duplicate) signed up to the system');
        expect(notificationSent.html).toContain('Duplicates');
    });

    test('We can register and see duplicated message because of the history', async ({
        common,
        register,
        login,
        user,
    }) => {
        await runQuery(`UPDATE settings SET signUpNotification="admin@gmail.com" WHERE id=1`);

        await register.goto();
        await register.firstNameField.fill('PAUL');
        await register.lastNameField.fill('pusher');
        await register.emailField.fill('player99@gmail.com');
        await register.phoneField.fill('1112223333');
        await register.passwordField.fill(login.password);
        await user.enterBirthday('1/1/2000');

        await register.submitPlayerButton.click();
        await expect(common.body).toContainText('Verify');

        const emailSent = await getRecord('emails', { recipientEmail: 'player99@gmail.com' });
        const emailVerificationCode = emailSent.subject.slice(0, 6);

        await register.emailVerificationCodeField.fill(emailVerificationCode);
        await expect(common.body).toContainText('successfully registered');

        const notificationSent = await getRecord('emails', { recipientEmail: 'admin@gmail.com' });
        expect(notificationSent.subject).toContain('Paul Pusher (duplicate) signed up to the system');
        expect(notificationSent.html).toContain('Duplicates');
    });

    test('We can register and pick the court', async ({ common, register, login, user }) => {
        await register.goto();
        await register.firstNameField.fill('PETER ');
        await register.lastNameField.fill(' allen');
        await register.emailField.fill('peter@gmail.com');
        await register.phoneField.fill('9191234567');
        await register.passwordField.fill(login.password);
        await user.enterBirthday('1/1/2000');

        await register.pickComeFromOption('Flyer from a court');

        await expect(common.body).toContainText('What location?');
        await register.comeFromOtherField.fill('Pullen park');
        await register.submitPlayerButton.click();
        await expect(common.body).toContainText('Verify');

        // Check if record exists
        await expectRecordToExist(
            'users',
            { email: 'peter@gmail.com' },
            { firstName: 'Peter', lastName: 'Allen', comeFrom: 3, comeFromOther: 'Pullen park' }
        );
    });

    test('We can register for the season by creating a new account and with authorization failing', async ({
        common,
        register,
        login,
        page,
        user,
    }) => {
        await closeCurrentSeason();

        await register.goto();
        await register.firstNameField.fill('Peter');
        await register.lastNameField.fill('Allen');
        await register.emailField.fill('peter@gmail.com');
        await register.phoneField.fill('9191234567');
        await register.passwordField.fill(login.password);
        await user.enterBirthday('1/1/2000');

        await register.submitPlayerButton.click();
        await expect(common.body).toContainText('Verify');

        const emailSent = await getRecord('emails', { recipientEmail: 'peter@gmail.com' });
        const emailVerificationCode = emailSent.subject.slice(0, 6);

        // mess with passwords
        await runQuery(`UPDATE users SET password="wrong"`);

        await register.emailVerificationCodeField.fill(emailVerificationCode);
        await expect(common.body).toContainText('successfully registered');
        await page.getByRole('button', { name: "Let's sign in now" }).click();

        await register.emailField.fill('peter@gmail.com');
        await register.passwordField.fill(login.password);
        await expect(login.forgotPasswordLink).toBeVisible();
    });

    test("We can register for two ladders if it's a new user", async ({ common, register, login, user }) => {
        const freeFirstSeasonMessage = 'Play your first season for FREE';

        await register.goto();
        await register.firstNameField.fill('Peter');
        await register.lastNameField.fill('Allen');
        await register.emailField.fill('peter@gmail.com');
        await register.phoneField.fill('9191234567');
        await register.passwordField.fill(login.password);
        await user.enterBirthday('1/1/2000');

        await register.submitPlayerButton.click();
        await expect(common.body).toContainText('Verify');

        // Check if record exists
        await expectRecordToExist('users', { email: 'peter@gmail.com' });
        const emailSent = await getRecord('emails', { recipientEmail: 'peter@gmail.com' });
        const emailVerificationCode = emailSent.subject.slice(0, 6);

        await register.emailVerificationCodeField.fill(emailVerificationCode);
        await expect(common.body).toContainText('successfully registered');
        await register.pickLadderButton.click();

        await expect(common.body).toContainText(freeFirstSeasonMessage);
        await expect(common.body).toContainText('Pick one Singles ladder');
        await register.getLadderCheckbox('Men 3.5').click();
        await register.getLadderCheckbox('Men 4.0').click();
        await register.getLadderCheckbox('Men 4.5').click();
        await register.agreeCheckbox.click();
        await register.registerButton.click();
        await expect(register.area).toContainText('You cannot pick more than one Singles ladder');

        await register.getLadderCheckbox('Men 4.5').click();
        await register.getLadderCheckbox('Men 4.0').click();
        await register.registerButton.click();
        await expect(common.modal).toContainText('successfully registered');
        await expect(common.body).not.toContainText("You've already registered");

        // Register for another ladder
        await register.goto();
        await expect(common.body).toContainText(freeFirstSeasonMessage);
        await register.getLadderCheckbox('Men 4.0').click();
        await register.registerButton.click();
        await expect(register.area).toContainText('You cannot pick more than one Singles ladder');

        await register.getLadderCheckbox('Men 4.0').click();
        await register.getLadderCheckbox('Men Team Doubles').click();
        await common.modal.locator('label', { hasText: 'Join the Player Pool' }).click();
        await common.modalSubmitButton.click();
        await register.agreeCheckbox.click();
        await register.registerButton.click();
        await expect(common.modal).toContainText('successfully registered');

        // Check that we cannot pick another ladder
        await register.goto();
        await expect(common.body).toContainText(freeFirstSeasonMessage);
        await register.getLadderCheckbox('Men 4.5').click();
        await register.registerButton.click();
        await expect(register.area).toContainText('You cannot pick more than one Singles ladder');
    });

    test('We can register for two ladders if the player has not played enough matches before', async ({
        common,
        register,
        login,
    }) => {
        // emulate that player9 played in the previous season
        await runQuery('UPDATE matches SET challengerId=19 WHERE id=61');

        const noMatchesPlayedMessage =
            'You can join this season for FREE because you played fewer than 3 matches before this season.';

        await login.loginAsPlayer9();
        await register.goto();
        await expect(common.body).toContainText(noMatchesPlayedMessage);
        await expect(common.body).toContainText('Pick one Singles ladder');
        await register.getLadderCheckbox('Men 3.5').click();
        await register.agreeCheckbox.click();
        await register.registerButton.click();
        await expect(common.modal).toContainText('successfully registered');
    });

    test('We can see the price message for player who already played matches before', async ({
        common,
        register,
        login,
    }) => {
        await overrideConfig({ minMatchesToPay: 0 });

        await login.loginAsPlayer1();
        await register.goto();
        await expect(common.body).toContainText('Choose ladders to play');
        await expect(common.body).toContainText('Prices after the season starts');
        await expect(register.goToCheckoutButton).toBeVisible();
    });

    test('We can register for the season in a free mode for two ladders one by one', async ({
        common,
        register,
        login,
        page,
        overview,
    }) => {
        await closeCurrentSeason();
        await runQuery(`UPDATE seasons SET isFree=1`);
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

    test('We can register for the season in a free mode for two ladders at once', async ({
        common,
        register,
        login,
        page,
        overview,
        homepage,
    }) => {
        await closeCurrentSeason();
        await runQuery(`UPDATE seasons SET isFree=1`);
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

    test('We can register for the season and player numbers updated', async ({
        common,
        register,
        login,
        page,
        overview,
        homepage,
    }) => {
        const playerCounter = page.locator('[data-latest-level="men-40-dbls"] div[title="Players"]');

        await runQuery(`UPDATE seasons SET isFree=1`);
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
        homepage,
    }) => {
        await runQuery(`DELETE FROM players WHERE userId=8`);

        await closeCurrentSeason();
        await runQuery(`UPDATE seasons SET isFree=1`);
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
        const welcomeEmail = await getRecord('emails', {
            subject: 'Welcome to the Raleigh Rival Tennis Ladder!',
            recipientEmail: 'player8@gmail.com',
        });
        expect(welcomeEmail.html).toContain('Andrew Cole');
        expect(welcomeEmail.html).toContain('The Ladder Starts Soon');
        expect(welcomeEmail.html).toContain('2022 Spring');
        expect(welcomeEmail.html).toContain('Monday,');
    });

    test('The user cannot register for three ladders in a free mode', async ({ common, register, login }) => {
        await closeCurrentSeason();
        await runQuery(`UPDATE seasons SET isFree=1`);
        await login.loginAsPlayer8();

        await register.goto();
        await register.getLadderCheckbox('Men 3.5').click();
        await register.getLadderCheckbox('Men 4.0').click();
        await register.getLadderCheckbox('Men 4.5').click();
        await register.registerButton.click();
        await expect(register.area).toContainText('You cannot pick more than one Singles ladder.');
    });

    test('We can register and find the referral player manually', async ({ common, register, login, user }) => {
        await register.goto();
        await register.firstNameField.fill('Peter');
        await register.lastNameField.fill('Allen');
        await register.emailField.fill('peter@gmail.com');
        await register.phoneField.fill('9191234567');
        await register.passwordField.fill(login.password);
        await user.enterBirthday('1/1/2000');

        await register.pickComeFromOption('Referral from a friend');

        await expect(common.body).toContainText('Start typing');
        await expect(register.friendSpinner).toBeHidden();
        await register.friendField.fill('wrong');

        await expect(register.friendSpinner).toBeVisible();
        await expect(common.body).toContainText('Friend not found');
        await expect(register.friendSpinner).toBeHidden();

        await register.friendField.fill('eeeee');

        await expect(register.friendSpinner).toBeVisible();
        await expect(common.body).toContainText('Found!');
        await expect(register.friendSpinner).toBeHidden();

        await expect(register.friendField).toHaveValue('Matthew Burt');

        await register.submitPlayerButton.click();

        // Check if record exists
        await expectRecordToExist(
            'users',
            { email: 'peter@gmail.com' },
            {
                firstName: 'Peter',
                lastName: 'Allen',
                comeFrom: 99,
                comeFromOther: 'Referral from Matthew Burt',
                referrerUserId: 6,
            }
        );
    });

    test('We can register and do not try to find a friend', async ({ common, register, login, user }) => {
        await register.goto();
        await register.firstNameField.fill('Peter');
        await register.lastNameField.fill('Allen');
        await register.emailField.fill('peter@gmail.com');
        await register.phoneField.fill('9191234567');
        await register.passwordField.fill(login.password);
        await user.enterBirthday('1/1/2000');

        await register.pickComeFromOption('Referral from a friend');
        await register.submitPlayerButton.click();

        // Check if record exists
        await expectRecordToExist(
            'users',
            { email: 'peter@gmail.com' },
            {
                firstName: 'Peter',
                lastName: 'Allen',
                comeFrom: 9,
                comeFromOther: '',
                referrerUserId: 0,
            }
        );
    });

    test('We can register and cannot find a friend', async ({ common, register, login, user }) => {
        await register.goto();
        await register.firstNameField.fill('Peter');
        await register.lastNameField.fill('Allen');
        await register.emailField.fill('peter@gmail.com');
        await register.phoneField.fill('9191234567');
        await register.passwordField.fill(login.password);
        await user.enterBirthday('1/1/2000');

        await register.pickComeFromOption('Referral from a friend');

        await register.friendField.fill('wrong');
        await expect(common.body).toContainText('Friend not found');

        await register.submitPlayerButton.click();

        // Check if record exists
        await expectRecordToExist(
            'users',
            { email: 'peter@gmail.com' },
            {
                firstName: 'Peter',
                lastName: 'Allen',
                comeFrom: 9,
                comeFromOther: '',
                referrerUserId: 0,
            }
        );
    });

    test('We can register, found the friend and then change the comeFrom source', async ({
        common,
        register,
        login,
        user,
    }) => {
        await register.goto();
        await register.firstNameField.fill('Peter');
        await register.lastNameField.fill('Allen');
        await register.emailField.fill('peter@gmail.com');
        await register.phoneField.fill('9191234567');
        await register.passwordField.fill(login.password);
        await user.enterBirthday('1/1/2000');

        await register.pickComeFromOption('Referral from a friend');

        await register.friendField.fill('eeeee');
        await expect(common.body).toContainText('Found!');
        await expect(register.friendField).toHaveValue('Matthew Burt');

        await register.pickComeFromOption('Social Media');

        await register.submitPlayerButton.click();

        // Check if record exists
        await expectRecordToExist(
            'users',
            { email: 'peter@gmail.com' },
            {
                firstName: 'Peter',
                lastName: 'Allen',
                comeFrom: 12,
                comeFromOther: '',
                referrerUserId: 0,
            }
        );
    });

    test('We can register by using the referral link', async ({
        common,
        register,
        login,
        page,
        overview,
        match,
        user,
    }) => {
        await page.goto('/ref/asdfg');
        await register.globalRegisterButton.click();
        await register.firstNameField.fill('Peter');
        await register.lastNameField.fill('Allen');
        await register.emailField.fill('peter@gmail.com');
        await register.phoneField.fill('9191234567');
        await register.passwordField.fill(login.password);
        await user.enterBirthday('1/1/2000');

        await expect(register.comeFromSelect).toBeHidden();

        await register.submitPlayerButton.click();
        await expect(common.body).toContainText('Verify');

        // Check if record exists
        const record = await expectRecordToExist(
            'users',
            { email: 'peter@gmail.com' },
            {
                firstName: 'Peter',
                lastName: 'Allen',
                comeFrom: 99,
                comeFromOther: 'Referral from Ben Done',
                referrerUserId: 1,
            }
        );
        expect(record.referralCode).toMatch(/^[a-z0-9]{5}$/);

        const emailSent = await getRecord('emails', { recipientEmail: 'peter@gmail.com' });
        const emailVerificationCode = emailSent.subject.slice(0, 6);
        await register.emailVerificationCodeField.fill(emailVerificationCode);
        await expect(common.body).toContainText('successfully registered');
        await register.pickLadderButton.click();

        // Check email about referral registered
        {
            const email = await expectRecordToExist(
                'emails',
                { subject: 'Your Friend Peter Allen Just Signed Up!' },
                { recipientEmail: 'player1@gmail.com' }
            );
            expect(email.html).toContain('Peter Allen');
            expect(email.html).toContain('<b>$5</b>');
            expect(email.html).toContain('<b>$10</b>');
            expect(email.html).toContain('peter-allen');
        }

        await register.getLadderCheckbox('Men 3.5').click();
        await register.agreeCheckbox.click();
        await register.registerButton.click();
        await register.goToLadderButton.click();

        // Add match and check the referral credit
        await overview.reportMatchButton.click();
        await match.pickChallengerOption('Matthew Burt');

        await match.nextButton.click();

        await match.pickChallengerPoints(3);
        await new Promise((resolve) => setTimeout(resolve, 1000));

        await match.pickChallengerPoints(2);
        await match.submitMatchButton.click();
        await expect(common.alert).toContainText('The match has been reported');

        // Check email about the first referral match and the credit
        {
            const email = await expectRecordToExist(
                'emails',
                { subject: 'You Just Earned $5 in Rival Credit!' },
                { recipientEmail: 'player1@gmail.com' }
            );
            expect(email.html).toContain('Peter Allen');
            expect(email.html).toContain('<b>$5</b>');
        }

        // Check that we have referral credit
        await expectRecordToExist(
            'payments',
            { userId: 1 },
            {
                type: 'discount',
                description: 'Referral credit for Peter Allen (first match)',
                amount: 500,
            }
        );

        // Add another match and check if we are not paying referral credit twice
        await overview.reportMatchButton.click();
        await match.pickChallengerOption('Cristopher Hamiltonbeach');
        await match.nextButton.click();

        await match.pickChallengerPoints(3);
        await new Promise((resolve) => setTimeout(resolve, 1000));

        await match.pickChallengerPoints(2);
        await match.submitMatchButton.click();
        await expect(common.alert).toContainText('The match has been reported');

        await new Promise((resolve) => setTimeout(resolve, 500));
        expect(await getNumRecords('emails', { recipientEmail: 'player1@gmail.com' })).toBe(2);
        expect(await getNumRecords('payments', { userId: 1 })).toBe(1);
    });

    test('We can set gender after choosing ladder', async ({ common, register, login, user }) => {
        await register.goto();
        await register.firstNameField.fill('Peter');
        await register.lastNameField.fill('Allen');
        await register.emailField.fill('peter@gmail.com');
        await register.phoneField.fill('9191234567');
        await register.passwordField.fill(login.password);
        await user.enterBirthday('1/1/2000');

        await register.submitPlayerButton.click();
        await expect(common.body).toContainText('Verify');

        // Check if record exists
        const record = await expectRecordToExist('users', { email: 'peter@gmail.com' }, { gender: '' });

        await register.emailVerificationCodeField.fill(record.verificationCode);
        await expect(common.body).toContainText('successfully registered');
        await register.pickLadderButton.click();

        await register.getLadderCheckbox('Men 3.5').click();
        await register.agreeCheckbox.click();
        await register.registerButton.click();
        await register.goToLadderButton.click();

        // check that gender is set
        await expectRecordToExist('users', { email: 'peter@gmail.com' }, { gender: 'male' });
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

    test('We can register for the season and referrer gets the credit', async ({
        common,
        register,
        login,
        page,
        homepage,
    }) => {
        if (process.env.CI) {
            return;
        }

        // emulate that player8 played in the previous season
        await runQuery('UPDATE players SET userId=8 WHERE id=17');
        await runQuery(`UPDATE users SET referrerUserId=6 WHERE id=8 OR id=9`);
        await overrideConfig({ minMatchesToPay: 0 });

        {
            await register.goto();
            await register.signInLink.click();
            await register.emailField.fill('player9@gmail.com');
            await register.passwordField.fill(login.password);
            await login.signInButton.click();

            await register.getLadderCheckbox('Men 3.5').click();
            await register.agreeCheckbox.click();
            await register.goToCheckoutButton.click();
            await register.confirmOrderButton.click();

            await register.submitCardCredentials();
            await expect(common.modal).toContainText('Payment successful!', { timeout: 15000 });

            await expectRecordToExist(
                'payments',
                { userId: 6 },
                {
                    type: 'discount',
                    description: 'Referral credit for Doubles Player (first payment)',
                    amount: 1000,
                }
            );

            // Check email about the first referral payment and the credit
            const email = await expectRecordToExist(
                'emails',
                { subject: 'You Just Earned $10 in Rival Credit!' },
                { recipientEmail: 'player4@gmail.com' }
            );
            expect(email.html).toContain('Doubles Player');
            expect(email.html).toContain('<b>$10</b>');
        }

        // Check that we have credit for another player
        {
            await page.goto('/logout');
            await homepage.checkVisible();
            await register.goto();
            await register.signInLink.click();
            await register.emailField.fill('player8@gmail.com');
            await register.passwordField.fill(login.password);
            await login.signInButton.click();

            await register.getLadderCheckbox('Men 3.5').click();
            await register.agreeCheckbox.click();
            await register.goToCheckoutButton.click();
            await register.confirmOrderButton.click();

            await register.submitCardCredentials();
            await expect(common.modal).toContainText('Payment successful!', { timeout: 15000 });

            await expectRecordToExist(
                'payments',
                { userId: 6, description: 'Referral credit for Not Played User (first payment)' },
                { type: 'discount', amount: 1000 }
            );

            expect(await getNumRecords('emails', { subject: 'You Just Earned $10 in Rival Credit!' })).toBe(2);
        }
    });

    test("We don't have a referral with wrong format code", async ({ common, register, login, page, user }) => {
        await page.goto('/ref/longcode');
        await register.globalRegisterButton.click();
        await register.firstNameField.fill('Peter');
        await register.lastNameField.fill('Allen');
        await register.emailField.fill('peter@gmail.com');
        await register.phoneField.fill('9191234567');
        await register.passwordField.fill(login.password);
        await user.enterBirthday('1/1/2000');

        await expect(register.comeFromSelect).toBeVisible();

        await register.submitPlayerButton.click();
        await expect(common.body).toContainText('Verify');

        // Check if record exists
        await expectRecordToExist(
            'users',
            { email: 'peter@gmail.com' },
            {
                firstName: 'Peter',
                lastName: 'Allen',
                comeFrom: 0,
                comeFromOther: '',
                referrerUserId: 0,
            }
        );
    });

    test("We don't have a referral with wrong code", async ({ common, register, login, page, user }) => {
        await page.goto('/ref/wrong');
        await register.globalRegisterButton.click();
        await register.firstNameField.fill('Peter');
        await register.lastNameField.fill('Allen');
        await register.emailField.fill('peter@gmail.com');
        await register.phoneField.fill('9191234567');
        await register.passwordField.fill(login.password);
        await user.enterBirthday('1/1/2000');

        await expect(register.comeFromSelect).toBeVisible();
        await expect(register.comeFromSelect).toHaveValue('0');

        await register.submitPlayerButton.click();
        await expect(common.body).toContainText('Verify');

        // Check if record exists
        await expectRecordToExist(
            'users',
            { email: 'peter@gmail.com' },
            {
                firstName: 'Peter',
                lastName: 'Allen',
                comeFrom: 0,
                comeFromOther: '',
                referrerUserId: 0,
            }
        );
    });
}

{
    const sessionId = 'cs_test_a1Xo2fGSedaPXx4FBDPU1qdjHQEizZmiQWu2AnluWv23OevzuBUWdMEklL';
    const addTestOrder = async () => {
        const payload = {
            transactions: [
                { type: 'product', tournamentId: 8, description: 'Men 4.0 Ladder', cost: -3000 },
                { type: 'discount', description: 'Second ladder discount', cost: 1500 },
            ],
        };

        await runQuery(`
            INSERT INTO orders (id, userId, amount, payload, sessionId)
                 VALUES (1, 8, 1500, '${JSON.stringify(payload)}', "${sessionId}")`);
    };

    test('We can process order', async ({ common, register, login, page, overview, homepage }) => {
        await runQuery('DELETE FROM players WHERE userId=8');

        await addTestOrder();
        await login.loginAsPlayer8();

        await page.goto(`/register/success/${sessionId}`);
        await expect(overview.playerList).toContainText('Not Played User');
        await register.goToLadderButton.click();

        await expect(common.modal).toBeHidden();
        await expect(overview.area).toBeVisible();

        await page.goto('/season/2022/spring/men-40');
        await expect(overview.playerList).toContainText('Not Played User');

        await new Promise((resolve) => setTimeout(resolve, 500)); // to save emails in DB
        const welcomeEmail = await getRecord('emails', {
            subject: 'Welcome to the Raleigh Rival Tennis Ladder!',
            recipientEmail: 'player8@gmail.com',
        });
        expect(welcomeEmail.html).toContain('Andrew Cole');
        expect(welcomeEmail.html).toContain('The Ladder Starts Soon');
        expect(welcomeEmail.html).toContain('2022 Spring');
    });
}

{
    const storageKey = 'registerHistory';
    // const getLocalStorageValue = async page<Page> => page.evaluate(() => localStorage.getItem(storageKey));

    // const getLocalStorageValue = ClientFunction(key => {
    //     return localStorage.getItem(key);
    // });

    test('Save browsing history before registration', async ({ common, register, login, page, homepage, user }) => {
        await page.goto('/');

        await page.locator('a.btn').getByText('Scoring').click();
        await expect(page.locator('h1').getByText('Scoring')).toBeVisible();
        await common.logo.click();
        await homepage.getCurrentSeasonLadder('Men 3.5').click();

        // check that history persists in local storage
        await common.reloadPage();

        await register.globalRegisterButton.click();

        expect(await page.evaluate((key) => localStorage.getItem(key), storageKey)).toBeTruthy();

        await register.firstNameField.fill('Peter');
        await register.lastNameField.fill('Allen');
        await register.emailField.fill('peter@gmail.com');
        await register.phoneField.fill('9191234567');
        await register.passwordField.fill(login.password);
        await user.enterBirthday('1/1/2000');

        await register.submitPlayerButton.click();
        await expect(common.body).toContainText('Verify');

        const record = await expectRecordToExist('users', { email: 'peter@gmail.com' });

        expect(record.registerHistory).toContain('"route"');
        expect(record.registerHistory).toContain('"/"');
        expect(record.registerHistory).toContain('"/season/2021/spring/men-35"');
        expect(record.registerHistory).toContain('"/scoring"');
        expect(record.registerHistory).toContain('"/register"');
        expect(record.registerHistory).toContain('"clickFancyRegisterButton"');
    });

    test('Track clicking on Hero register button', async ({ common, page, homepage }) => {
        await page.goto('/');
        await homepage.heroRegisterButton.click();
        await expect(common.body).toContainText('Create an Account');

        const state = await page.evaluate(() => window.tl.store.getState());
        const history = JSON.stringify(state.auth.history);

        expect(history).toContain('"/"');
        expect(history).toContain('"/register"');
        expect(history).toContain('"clickHeroRegisterButton"');
    });

    test('Clear history after logging in', async ({ common, page, login, homepage }) => {
        await page.goto('/');
        await page.locator('a.btn').getByText('Scoring').click();
        await expect(page.locator('h1').getByText('Scoring')).toBeVisible();
        expect(await page.evaluate((key) => localStorage.getItem(key), storageKey)).toBeTruthy();

        await page.locator('[data-top-menu] a').getByText('Sign in').click();
        await login.emailField.fill('player1@gmail.com');
        await login.passwordField.fill(login.password);
        await login.signInButton.click();
        await expect(common.body).toContainText('Ben Done');

        await page.locator('[data-top-menu] a').getByText('Home').click();
        await homepage.checkVisible();

        const state = await page.evaluate(() => window.tl.store.getState());
        expect(state.auth.history).toEqual([]);

        expect(await page.evaluate((key) => localStorage.getItem(key), storageKey)).toBeFalsy();
    });
}
