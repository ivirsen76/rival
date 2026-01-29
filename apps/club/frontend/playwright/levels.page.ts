import { test, expect } from './base';
import { restoreDb, expectRecordToExist } from '@rival/ladder.backend/src/db/helpers';

test.beforeEach(async ({ page, login }) => {
    restoreDb();
    await login.loginAsAdmin();
});

test('Should get to levels via menu', async ({ page, common, login, topMenu, levels }) => {
    await page.goto('/');
    await topMenu.getMenuLink('Admin').click();
    await page.locator('a').getByText('Levels').click();
    await expect(levels.addLevelButton).toBeVisible();
});

test.describe('Mobile viewport', () => {
    test.use({ viewport: { width: 500, height: 1200 } });

    test('Should use sidebar links', async ({ page, common, sideMenu, levels }) => {
        await page.goto('/');

        await sideMenu.sideMenuToggle.click();
        await sideMenu.getMenuLink('Admin').click();
        await page.locator('a').getByText('Levels').click();
        await expect(levels.addLevelButton).toBeVisible();
    });
});

test('Should see levels', async ({ page, common, login }) => {
    await page.goto('/admin/levels');

    // Check that sorting is right
    await expect(page.locator('[data-level-list]').first()).toContainText('Men 3.0');
});

test('Should see validation during adding new level', async ({ page, common, login, levels }) => {
    await page.goto('/admin/levels');
    await levels.addLevelButton.click();
    await common.modalSubmitButton.click();
    await expect(common.modal).toContainText('required');
});

test('Should add new level', async ({ page, common, levels }) => {
    await page.goto('/admin/levels');
    await levels.addLevelButton.click();
    await levels.nameField.fill('Men New');
    await common.modalSubmitButton.click();
    await expect(common.alert).toContainText('Success');
    await expect(common.body).toContainText('Men New');

    await expectRecordToExist('levels', { name: 'Men New' }, { position: 9, slug: 'men-new' });
});

test('Should add new level for doubles team', async ({ page, common, levels }) => {
    await page.goto('/admin/levels');
    await levels.addLevelButton.click();
    await levels.nameField.fill('Men Doubles 4.0');
    await levels.typeField.selectOption('Doubles Team');
    await common.modalSubmitButton.click();
    await expect(common.alert).toContainText('Success');
    await expect(common.body).toContainText('Men Doubles 4.0');

    await expectRecordToExist(
        'levels',
        { name: 'Men Doubles 4.0' },
        { position: 9, slug: 'men-doubles-40', type: 'doubles-team' }
    );
});

test('Should edit level', async ({ page, common, levels }) => {
    await page.goto('/admin/levels');
    await page.getByRole('link', { name: 'Men 3.0' }).click();
    await expect(levels.nameField).toHaveValue('Men 3.0');
    await levels.nameField.fill('Men New');
    await common.modalSubmitButton.click();
    await expect(common.alert).toContainText('Success');
    await expect(common.body).toContainText('Men New');
});
