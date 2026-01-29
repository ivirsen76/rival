import { test, expect } from './base';
import { restoreDb, expectRecordToExist, runQuery } from '@rival/club.backend/src/db/helpers';

test.beforeEach(async ({ page }) => {
    restoreDb();
});

test('Should not see verification if the user has a birthday', async ({ page, common, login, overview }) => {
    await login.loginAsPlayer1();
    await page.goto('/season/2021/spring/men-35');

    await overview.proposeMatchButton.click();
    await expect(common.modal).toContainText('Propose match');
});

test('Should cancel providing the birthday', async ({ page, common, login, overview }) => {
    await runQuery(`UPDATE users SET birthday=NULL WHERE id=1`);

    await login.loginAsPlayer1();
    await page.goto('/season/2021/spring/men-35');

    await overview.proposeMatchButton.click();
    await expect(common.modal).toContainText('Birth Date');

    await common.modal.locator('button').getByText('Cancel').click();
    await expect(common.modal).toBeHidden();

    await new Promise((resolve) => setTimeout(resolve, 1000));

    await overview.clickOtherAction('Schedule match');
    await expect(common.modal).toContainText('Birth Date');
});

test('Should provide the birthday', async ({ page, common, login, overview, user }) => {
    await runQuery(`UPDATE users SET birthday=NULL WHERE id=1`);

    await login.loginAsPlayer1();
    await page.goto('/season/2021/spring/men-35');

    await overview.proposeMatchButton.click();
    await expect(common.modal).toContainText('Birth Date');
    await common.modalSubmitButton.click();
    await expect(common.modal).toContainText('Birth date is required');

    await user.enterBirthday('1/1/1800');
    await common.modalSubmitButton.click();
    await expect(common.modal).toContainText('You cannot be over 100 years old');

    await user.enterBirthday('12/7/76');
    await common.modalSubmitButton.click();

    await expect(common.modal).toContainText('successfully set your birth date');
    await page.locator('button').getByText('Ok').click();
    await expect(common.modal).toBeHidden();

    await expectRecordToExist('users', { id: 1 }, { birthday: '1976-12-07' });

    await overview.proposeMatchButton.click();
    await expect(common.modal.locator('button').getByText('Propose match')).toBeVisible();

    // Reload the page and check again
    await page.goto('/season/2021/spring/men-35');
    await overview.proposeMatchButton.click();
    await expect(common.modal.locator('button').getByText('Propose match')).toBeVisible();
});

test('Should provide the birthday and then verify phone', async ({ page, common, login, overview, user }) => {
    await runQuery(`UPDATE users SET birthday=NULL, isPhoneVerified=0 WHERE id=1`);

    await login.loginAsPlayer1();
    await page.goto('/season/2021/spring/men-35');

    await overview.proposeMatchButton.click();
    await user.enterBirthday('12/7/76');
    await common.modalSubmitButton.click();

    await expect(common.modal).toContainText('successfully set your birth date');
    await page.locator('button').getByText('Ok').click();
    await expect(common.modal).toBeHidden();

    await overview.proposeMatchButton.click();
    await page.locator('button').getByText('Verify phone').click();
    await page.locator('input[name="code"]').fill('111111');
    await expect(common.modal).toContainText('successfully verified your phone');
    await page.locator('button').getByText('Ok').click();
    await expect(common.modal).toBeHidden();

    await expectRecordToExist('users', { id: 1 }, { isPhoneVerified: 1, birthday: '1976-12-07' });

    await overview.proposeMatchButton.click();
    await expect(common.modal.locator('button').getByText('Propose match')).toBeVisible();

    // Reload page and check again
    await page.goto('/season/2021/spring/men-35');
    await overview.proposeMatchButton.click();
    await expect(common.modal.locator('button').getByText('Propose match')).toBeVisible();
});
