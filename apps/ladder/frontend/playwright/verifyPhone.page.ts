import { test, expect } from './base';
import { restoreDb, expectRecordToExist, runQuery } from './db';

test.beforeEach(async ({ page }) => {
    restoreDb();
});

test('Should not see verification if the user did not play any matches', async ({ page, common, login, overview }) => {
    await runQuery(`DELETE FROM matches WHERE score IS NOT NULL`);
    await runQuery(`UPDATE users SET isPhoneVerified=0 WHERE id=1`);

    await login.loginAsPlayer1();
    await page.goto('/season/2021/spring/men-35');

    await overview.proposeMatchButton.click();
    await expect(common.modal).toContainText('Propose match');
});

test('Should cancel verification', async ({ page, common, login, overview }) => {
    await runQuery(`UPDATE users SET isPhoneVerified=0 WHERE id=1`);

    await login.loginAsPlayer1();
    await page.goto('/season/2021/spring/men-35');

    await overview.proposeMatchButton.click();
    await expect(common.modal).toContainText('Verify phone');
    await expect(common.modal).toContainText('123-456-7890');

    await common.modal.locator('button').getByText('Cancel').click();
    await expect(common.modal).toBeHidden();

    await new Promise((resolve) => setTimeout(resolve, 1000));

    await overview.clickOtherAction('Schedule match');
    await expect(common.modal).toContainText('Verify phone');
    await expect(common.modal).toContainText('123-456-7890');
});

test('Should verify phone', async ({ page, common, login, overview }) => {
    await runQuery(`UPDATE users SET isPhoneVerified=0 WHERE id=1`);

    await login.loginAsPlayer1();
    await page.goto('/season/2021/spring/men-35');

    await overview.proposeMatchButton.click();
    await page.locator('button').getByText('Verify phone').click();

    await expect(common.modal).toContainText('Verify Phone Number');
    await expect(common.modal).toContainText('123-456-7890');
    await expect(common.modal).toContainText('Resend code in 29s');

    await page.locator('input[name="code"]').fill('222222');
    await expect(common.modal).toContainText('Verifying');
    await expect(common.modal).toContainText('Confirmation code is wrong');

    await page.locator('input[name="code"]').fill('111111');
    await expect(common.modal).toContainText('Verifying');

    await expect(common.modal).toContainText('successfully verified your phone');
    await page.locator('button').getByText('Ok').click();
    await expect(common.modal).toBeHidden();

    await expectRecordToExist('users', { id: 1 }, { isPhoneVerified: 1 });

    await overview.proposeMatchButton.click();
    await expect(common.modal.locator('button').getByText('Propose match')).toBeVisible();

    // Reload page and check again
    await page.goto('/season/2021/spring/men-35');
    await overview.proposeMatchButton.click();
    await expect(common.modal.locator('button').getByText('Propose match')).toBeVisible();
});

test('Should verify phone if one letter in firstName or lastName', async ({ page, common, login, overview }) => {
    await runQuery(`UPDATE users SET firstName="A", isPhoneVerified=0 WHERE id=8`);

    await login.loginAsPlayer8();
    await page.goto('/season/2021/spring/men-40');

    await overview.proposeMatchButton.click();
    await expect(common.modal).toContainText('Verify Phone Number');
});

test('Should check that we need verify phone in all cases', async ({ page, common, login, overview }) => {
    await runQuery(`UPDATE users SET isPhoneVerified=0 WHERE id=1`);

    const checkVerifyModal = async () => {
        await expect(common.modal).toContainText('Verify phone');
        await common.modal.locator('button').getByText('Cancel').click();
        await new Promise((resolve) => setTimeout(resolve, 1000));
    };

    await login.loginAsPlayer1();
    await page.goto('/season/2021/spring/men-35');

    await overview.proposeMatchButton.click();
    await checkVerifyModal();

    await overview.clickOtherAction('Schedule match');
    await checkVerifyModal();

    await page.locator('button').getByText('Report').click();
    await checkVerifyModal();

    await page.locator('[data-open-proposals]').locator('button').getByText('Accept').first().click();
    await checkVerifyModal();

    // Matches
    await page.locator('a').getByText('Matches').click();

    await page.locator('button').getByText('Report match').click();
    await checkVerifyModal();

    // Proposals
    await page.locator('a').getByText('Proposals').click();

    await page.locator('button').getByText('Propose match').click();
    await checkVerifyModal();

    await page.locator('button').getByText('Accept', { exact: true }).first().click();
    await checkVerifyModal();
});
