import { test, expect } from './base';
import { restoreDb, runQuery } from '@rival/club.backend/src/db/helpers';

test.beforeEach(async ({ page }) => {
    restoreDb();
});

test('Captain with full team can see only teammates emails', async ({ page, common, login, overview }) => {
    // captain
    await runQuery('INSERT INTO players SET id=100, userId=8, tournamentId=11');

    // teammates
    await runQuery('INSERT INTO players SET userId=1, tournamentId=11, partnerId=100');
    await runQuery('INSERT INTO players SET userId=7, tournamentId=11, partnerId=100');

    // another captain
    await runQuery('INSERT INTO players SET userId=5, tournamentId=11');

    // pool player
    await runQuery('INSERT INTO players SET userId=6, tournamentId=11, partnerId=999999');

    await login.loginAsPlayer8();

    await page.goto('/player/ben-done');
    await expect(common.body).toContainText('@gmail.com');

    await page.goto('/player/inactive-user');
    await expect(common.body).toContainText('@gmail.com');

    await page.goto('/player/cristopher-hamiltonbeach');
    await expect(common.body).toContainText('XXX-XXX-XXXX');

    await page.goto('/player/matthew-burt');
    await expect(common.body).toContainText('XXX-XXX-XXXX');

    // Check environment
    await page.goto('/season/2021/spring/men-40-dbls-team');
    await expect(overview.openProposalsArea).toBeVisible();
    await expect(overview.playerPoolArea).toBeHidden();
    await expect(common.body).toContainText(overview.rulesReminderText);
    await expect(overview.reportMatchButton).toBeVisible();
    await expect(overview.inviteTeammateArea).toBeHidden();
    await expect(overview.joinPlayerPoolButton).toBeHidden();
});

test('Captain with NOT full team can see teammates and player pool emails', async ({
    page,
    common,
    login,
    overview,
}) => {
    // captain
    await runQuery('INSERT INTO players SET id=100, userId=8, tournamentId=11');

    // teammates
    await runQuery('INSERT INTO players SET userId=1, tournamentId=11, partnerId=100');

    // another captain
    await runQuery('INSERT INTO players SET userId=5, tournamentId=11');

    // pool player
    await runQuery('INSERT INTO players SET userId=6, tournamentId=11, partnerId=999999');

    await login.loginAsPlayer8();

    await page.goto('/player/ben-done');
    await expect(common.body).toContainText('@gmail.com');

    await page.goto('/player/cristopher-hamiltonbeach');
    await expect(common.body).toContainText('XXX-XXX-XXXX');

    await page.goto('/player/matthew-burt');
    await expect(common.body).toContainText('@gmail.com');

    // Check environment
    await page.goto('/season/2021/spring/men-40-dbls-team');
    await expect(overview.openProposalsArea).toBeVisible();
    await expect(overview.playerPoolArea).toBeVisible();
    await expect(common.body).toContainText(overview.rulesReminderText);
    await expect(overview.reportMatchButton).toBeVisible();
    await expect(overview.inviteTeammateArea).toBeVisible();
    await expect(overview.joinPlayerPoolButton).toBeHidden();
});

test('Alone captain can see player pool emails', async ({ page, common, login, overview }) => {
    // captain
    await runQuery('INSERT INTO players SET id=100, userId=8, tournamentId=11');

    // another captain
    await runQuery('INSERT INTO players SET userId=5, tournamentId=11');

    // pool player
    await runQuery('INSERT INTO players SET userId=6, tournamentId=11, partnerId=999999');

    await login.loginAsPlayer8();

    await page.goto('/player/cristopher-hamiltonbeach');
    await expect(common.body).toContainText('XXX-XXX-XXXX');

    await page.goto('/player/matthew-burt');
    await expect(common.body).toContainText('@gmail.com');

    // Check environment
    await page.goto('/season/2021/spring/men-40-dbls-team');
    await expect(overview.openProposalsArea).toBeVisible();
    await expect(overview.playerPoolArea).toBeVisible();
    await expect(common.body).not.toContainText(overview.rulesReminderText);
    await expect(overview.reportMatchButton).toBeHidden();
    await expect(overview.inviteTeammateArea).toBeVisible();
    await expect(overview.joinPlayerPoolButton).toBeVisible();
});

test('Teammate can only see his teammates emails', async ({ page, common, login, overview }) => {
    // captain
    await runQuery('INSERT INTO players SET id=100, userId=1, tournamentId=11');

    // teammates
    await runQuery('INSERT INTO players SET userId=8, tournamentId=11, partnerId=100');
    await runQuery('INSERT INTO players SET userId=7, tournamentId=11, partnerId=100');

    // another captain
    await runQuery('INSERT INTO players SET userId=5, tournamentId=11');

    // pool player
    await runQuery('INSERT INTO players SET userId=6, tournamentId=11, partnerId=999999');

    await login.loginAsPlayer8();

    await page.goto('/player/ben-done');
    await expect(common.body).toContainText('@gmail.com');

    await page.goto('/player/inactive-user');
    await expect(common.body).toContainText('@gmail.com');

    await page.goto('/player/cristopher-hamiltonbeach');
    await expect(common.body).toContainText('XXX-XXX-XXXX');

    await page.goto('/player/matthew-burt');
    await expect(common.body).toContainText('XXX-XXX-XXXX');

    // Check environment
    await page.goto('/season/2021/spring/men-40-dbls-team');
    await expect(overview.openProposalsArea).toBeVisible();
    await expect(overview.playerPoolArea).toBeHidden();
    await expect(common.body).toContainText(overview.rulesReminderText);
    await expect(overview.reportMatchButton).toBeVisible();
    await expect(overview.inviteTeammateArea).toBeHidden();
    await expect(overview.joinPlayerPoolButton).toBeHidden();
});

test('Pool player can see only other pool players emails', async ({ page, common, login, overview }) => {
    // captain
    await runQuery('INSERT INTO players SET id=100, userId=1, tournamentId=11');

    // teammates
    await runQuery('INSERT INTO players SET userId=7, tournamentId=11, partnerId=100');

    // pool player
    await runQuery('INSERT INTO players SET userId=8, tournamentId=11, partnerId=999999');
    await runQuery('INSERT INTO players SET userId=9, tournamentId=11, partnerId=999999');

    await login.loginAsPlayer8();

    await page.goto('/player/ben-done');
    await expect(common.body).toContainText('XXX-XXX-XXXX');

    await page.goto('/player/inactive-user');
    await expect(common.body).toContainText('XXX-XXX-XXXX');

    await page.goto('/player/doubles-player');
    await expect(common.body).toContainText('@gmail.com');

    // Check environment
    await page.goto('/season/2021/spring/men-40-dbls-team');
    await expect(overview.openProposalsArea).toBeVisible();
    await expect(overview.playerPoolArea).toBeVisible();
    await expect(common.body).not.toContainText(overview.rulesReminderText);
    await expect(overview.reportMatchButton).toBeHidden();
    await expect(overview.inviteTeammateArea).toBeHidden();
    await expect(overview.joinPlayerPoolButton).toBeHidden();
});

test('Pool player can see other pool players emails before the season starts', async ({
    page,
    common,
    login,
    overview,
}) => {
    // captain
    await runQuery('INSERT INTO players SET id=100, userId=1, tournamentId=12');

    // teammates
    await runQuery('INSERT INTO players SET userId=7, tournamentId=12, partnerId=100');

    // pool player
    await runQuery('INSERT INTO players SET userId=8, tournamentId=12, partnerId=999999');
    await runQuery('INSERT INTO players SET userId=9, tournamentId=12, partnerId=999999');

    await login.loginAsPlayer8();

    await page.goto('/player/ben-done');
    await expect(common.body).toContainText('XXX-XXX-XXXX');

    await page.goto('/player/inactive-user');
    await expect(common.body).toContainText('XXX-XXX-XXXX');

    await page.goto('/player/doubles-player');
    await expect(common.body).toContainText('@gmail.com');

    // Check environment
    await page.goto('/season/2021/spring/men-40-dbls-team');
    await expect(overview.openProposalsArea).toBeVisible();
    await expect(overview.playerPoolArea).toBeVisible();
    await expect(common.body).not.toContainText(overview.rulesReminderText);
    await expect(overview.reportMatchButton).toBeHidden();
    await expect(overview.inviteTeammateArea).toBeHidden();
    await expect(overview.joinPlayerPoolButton).toBeHidden();
});

test('Guest can see doubles interface', async ({ page, common, login, overview }) => {
    // captain
    await runQuery('INSERT INTO players SET id=100, userId=8, tournamentId=11');

    // teammates
    await runQuery('INSERT INTO players SET userId=1, tournamentId=11, partnerId=100');
    await runQuery('INSERT INTO players SET userId=7, tournamentId=11, partnerId=100');

    // another captain
    await runQuery('INSERT INTO players SET userId=5, tournamentId=11');

    // pool player
    await runQuery('INSERT INTO players SET userId=6, tournamentId=11, partnerId=999999');

    // Check environment
    await page.goto('/season/2021/spring/men-40-dbls-team');
    await expect(overview.openProposalsArea).toBeVisible();
    await expect(overview.playerPoolArea).toBeVisible();
    await expect(common.body).not.toContainText(overview.rulesReminderText);
    await expect(overview.reportMatchButton).toBeHidden();
    await expect(overview.inviteTeammateArea).toBeHidden();
    await expect(overview.joinPlayerPoolButton).toBeHidden();
});

test('Player from different ladder can see doubles interface', async ({ page, common, login, overview }) => {
    // captain
    await runQuery('INSERT INTO players SET id=100, userId=8, tournamentId=11');

    // teammates
    await runQuery('INSERT INTO players SET userId=1, tournamentId=11, partnerId=100');
    await runQuery('INSERT INTO players SET userId=7, tournamentId=11, partnerId=100');

    // another captain
    await runQuery('INSERT INTO players SET userId=5, tournamentId=11');

    // pool player
    await runQuery('INSERT INTO players SET userId=6, tournamentId=11, partnerId=999999');

    await login.loginAsPlayer9();

    // Check environment
    await page.goto('/season/2021/spring/men-40-dbls-team');
    await expect(overview.openProposalsArea).toBeVisible();
    await expect(overview.playerPoolArea).toBeVisible();
    await expect(common.body).not.toContainText(overview.rulesReminderText);
    await expect(overview.reportMatchButton).toBeHidden();
    await expect(overview.inviteTeammateArea).toBeHidden();
    await expect(overview.joinPlayerPoolButton).toBeHidden();
});

test('Alone captain can proper interface for future season', async ({ page, common, login, overview }) => {
    // captain
    await runQuery('INSERT INTO players SET id=100, userId=8, tournamentId=12');

    // another captain
    await runQuery('INSERT INTO players SET userId=5, tournamentId=12');

    // pool player
    await runQuery('INSERT INTO players SET userId=6, tournamentId=12, partnerId=999999');

    await login.loginAsPlayer8();

    // Check environment
    await page.goto('/season/2022/spring/men-40-dbls-team');
    await expect(overview.openProposalsArea).toBeHidden();
    await expect(overview.playerPoolArea).toBeVisible();
    await expect(common.body).not.toContainText(overview.rulesReminderText);
    await expect(overview.reportMatchButton).toBeHidden();
    await expect(overview.inviteTeammateArea).toBeVisible();
    await expect(overview.joinPlayerPoolButton).toBeVisible();
});
