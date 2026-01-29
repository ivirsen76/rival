import { test, expect } from './base';
import { restoreDb } from '@rival/ladder.backend/src/db/helpers';

test.beforeEach(async ({ login }) => {
    restoreDb();
    await login.loginAsAdmin();
});

test('Should get to seasons via menu', async ({ page, common, seasons, topMenu }) => {
    await page.goto('/');
    await topMenu.getMenuLink('Admin').click();
    await page.locator('.nav-item a').getByText('Seasons').click();
    await expect(seasons.addSeasonButton).toBeVisible();
});

test('Should see seasons/levels in the right order', async ({ page, common }) => {
    await page.goto('/admin/seasons');

    // Check that sorting is right
    await expect(page.locator('[data-season-list]').first()).toContainText('2021 Spring');
    await expect(common.body).toContainText('Men 3.0, Men 3.5, Men 4.0, Men 4.5');
});

test('Should see validation during adding new season', async ({ page, common, seasons }) => {
    await page.goto('/admin/seasons');
    await seasons.addSeasonButton.click();
    await common.modalSubmitButton.click();
    await expect(common.modal).toContainText('Start date is required.');
});

test('Should have levels preselected', async ({ page, common, seasons }) => {
    await page.goto('/admin/seasons');
    await seasons.addSeasonButton.click();
    await expect(page.getByRole('checkbox', { name: 'Men 3.5' })).toBeChecked();
    await expect(page.getByRole('checkbox', { name: 'Men 4.0' })).toBeChecked();
});

test('Should edit season', async ({ page, common, seasons }) => {
    const Women25 = page.getByRole('checkbox', { name: 'Women 2.5' });

    await page.goto('/admin/seasons');
    await page.getByRole('link', { name: '2022 Spring' }).click();
    await expect(seasons.yearField).toHaveValue('2022');
    await expect(seasons.weeksField).toHaveValue('11');

    await expect(page.getByRole('checkbox', { name: 'Men 3.5' })).toBeChecked();
    await expect(page.getByRole('checkbox', { name: 'Men 4.0' })).toBeChecked();
    await seasons.yearField.fill('2025');
    await expect(Women25).not.toBeChecked();
    await Women25.click();
    await common.modalSubmitButton.click();

    await expect(common.modal).toBeHidden();
    await expect(common.alert).toContainText('Success');
    await expect(common.body).toContainText('Women 2.5');
});

test('Should see validation during closing season', async ({ page, common, seasons }) => {
    await page.goto('/admin/seasons');
    await seasons.closeSeasonButton.click();
    await common.modalSubmitButton.click();
    await expect(common.modal).toContainText('Reason is required');
});

test('Should close season', async ({ page, common, seasons }) => {
    await page.goto('/admin/seasons');
    await seasons.closeSeasonButton.click();
    await seasons.reasonField.fill('Due to pandemic');
    await common.modalSubmitButton.click();
    await expect(common.alert).toContainText('The season has been closed');
    await expect(common.body).not.toContainText('Current');

    // Check tournament pages
    await page.goto('/');
    await expect(page.locator('#latestTournament')).toContainText('Due to pandemic');
    await expect(page.locator('#latestTournament')).not.toContainText('Final tournament');

    await page.goto('/season/2021/spring/men-35');
    await expect(common.body).toContainText('Due to pandemic');
    await expect(common.body).not.toContainText('Final tournament');
});
