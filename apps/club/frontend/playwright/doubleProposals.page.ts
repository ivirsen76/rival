import { test, expect } from './base';
import { restoreDb, getNumRecords, runQuery, cleanRedisCache } from '@rival/ladder.backend/src/db/helpers';

test.beforeEach(async ({ page }) => {
    restoreDb();
});

test('Should add double proposal', async ({ page, common, login, overview, proposal }) => {
    await login.loginAsPlayer2();

    // populate cache
    await page.goto('/season/2021/spring/men-40');
    await expect(common.body).toContainText('Ongoing season');

    await page.goto('/season/2021/spring/men-35');
    await overview.proposeMatchButton.click();
    await page.locator('a').getByText('Advanced settings').click();

    await expect(common.modal).toContainText('Create a Proposal');
    await expect(common.modal).not.toContainText('Men 4.0 DBLS');
    await proposal.pickSundayNextWeek();
    await proposal.placeField.fill('Double');
    await expect(proposal.playerNumberBadge).toContainText('3 players');
    await common.modal.locator('label').getByText('Men 4.0').click();
    await expect(proposal.playerNumberBadge).toContainText('5 players');
    await common.modal.locator('button').getByText('Propose match').click();

    await expect(common.alert).toContainText('has been added');

    expect(await getNumRecords('matches', { place: 'Double' })).toBe(2);
    expect(await getNumRecords('emails', { sql: 'replyTo IS NOT NULL' })).toBe(2);

    const Proposal = page.locator('[data-proposal]', { hasText: 'Double' });
    await expect(Proposal).toContainText('5:00 PM');
    await expect(Proposal).toContainText('Delete');

    await page.goto('/season/2021/spring/men-40');
    const Proposal1 = page.locator('[data-proposal]', { hasText: 'Double' });
    await expect(Proposal1).toContainText('5:00 PM');
    await expect(Proposal1).toContainText('Delete');
});

test('Should accept and unaccept double proposal', async ({ page, common, login }) => {
    await login.loginAsPlayer1();
    const Proposal = page.locator('[data-proposal]', { hasText: 'Lake Lynn' });

    // populate cache
    await page.goto('/season/2021/spring/men-40');
    await expect(Proposal).toBeVisible();

    await page.goto('/season/2021/spring/men-35');

    await Proposal.locator('button').getByText('Accept').click();
    await common.modal.locator('button').getByText('Accept').click();
    await expect(common.alert).toContainText('has been accepted');
    await expect(Proposal).toBeHidden();

    await page.goto('/season/2021/spring/men-40');
    await expect(Proposal).toBeHidden();

    // let's unaccept it now
    await page.goto('/season/2021/spring/men-35/proposals');
    await Proposal.locator('button').getByText('Unaccept').click();
    await page.locator('input[name="reason"]').fill('I am sick');
    await common.modal.locator('button').getByText('Unaccept proposal').click();
    await expect(common.alert).toContainText('has been unaccepted');

    await page.goto('/season/2021/spring/men-35');
    await expect(Proposal).toBeVisible();

    await page.goto('/season/2021/spring/men-40');
    await expect(Proposal).toBeVisible();
});

test('Should show that proposal is already accepted', async ({ page, common, login }) => {
    await login.loginAsPlayer1();
    const Proposal = common.content.locator('[data-proposal]', { hasText: 'Lake Lynn' });

    await page.goto('/season/2021/spring/men-35');
    await Proposal.locator('button').getByText('Accept').click();

    // Accept it in another ladder
    await runQuery(`UPDATE matches SET acceptorId=10, acceptedAt="2024-10-10 00:00:00" WHERE id=41`);
    await runQuery(`UPDATE matches SET isActive=0 WHERE id=40`);
    cleanRedisCache();

    await common.modal.locator('button').getByText('Accept').click();
    await expect(common.alert).toContainText('The proposal is already accepted.');
    await expect(Proposal).toBeHidden();
});

test('Should delete a double proposal', async ({ page, common, login }) => {
    await login.loginAsPlayer2();
    const Proposal = page.locator('[data-proposal]', { hasText: 'Lake Lynn' });

    // populate cache
    await page.goto('/season/2021/spring/men-40');
    await expect(Proposal).toBeVisible();

    await page.goto('/season/2021/spring/men-35');

    await Proposal.locator('button').getByText('Delete').click();
    await common.modal.locator('button').getByText('Delete').click();
    await expect(common.alert).toContainText('has been deleted');
    await expect(Proposal).toBeHidden();

    await page.goto('/season/2021/spring/men-40');
    await expect(Proposal).toBeHidden();
});
