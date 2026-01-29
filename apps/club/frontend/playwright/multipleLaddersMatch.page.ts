import { test, expect } from './base';
import { Common } from './poms/Common';
import {
    restoreDb,
    expectRecordToExist,
    runQuery,
    getNumRecords,
    overrideConfig,
} from '@rival/club.backend/src/db/helpers';

test.beforeEach(async ({ page }) => {
    restoreDb();
});

// Selectors
// const ChallengerSelect = page.locator('select[name=challengerId]');
// const ChallengerPoints = page.locator('[data-field="challengerPoints"]');

const checkTwoLadderReportMessage = async (common: Common) => {
    await expect(common.modal).toContainText('The match has been reported.');
    await expect(common.modal).toContainText('Since you and Gary Mill play in the Men 3.5 and Men 4.0 ladders');
    await common.modal.locator('button').getByText('Ok, got it!').click();
};

test('Should add match result and it should be reported in two ladders', async ({ page, common, login, match }) => {
    await runQuery(`INSERT INTO players (userId, tournamentId) VALUES (1, 3)`);

    await login.loginAsPlayer1();

    // populate cache
    await page.goto('/season/2021/spring/men-40');
    await expect(common.body).toContainText('Ongoing season');

    await page.goto('/season/2021/spring/men-35');

    await page.locator('a').getByText('Score').click();

    await match.pickChallengerPoints(3);
    await new Promise((resolve) => setTimeout(resolve, 1000));

    await match.pickChallengerPoints(2);
    await new Promise((resolve) => setTimeout(resolve, 1000));

    await expect(common.modal).toContainText('+19');
    await expect(common.modal).toContainText('+9');
    await common.modal.locator('button').getByText('Report match').click();

    await checkTwoLadderReportMessage(common);

    await expect(common.body).toContainText('+19');
    await expect(common.body).toContainText('+9');
    const firstMatch = await expectRecordToExist('matches', { id: 9 }, { score: '3-6 2-6' });
    const anotherMatch = await expectRecordToExist('matches', { sameAs: 9 }, { score: '3-6 2-6' });

    await expect(anotherMatch.winner).toBe(anotherMatch.acceptorId);
    await expect(firstMatch.playedAt).toBe(anotherMatch.playedAt);
    await expect(firstMatch.createdAt).toBe(anotherMatch.createdAt);
    await expect(firstMatch.challengerElo).toBe(anotherMatch.challengerElo);
    await expect(firstMatch.acceptorElo).toBe(anotherMatch.acceptorElo);
    await expect(firstMatch.challengerEloChange).toBe(anotherMatch.challengerEloChange);
    await expect(firstMatch.acceptorEloChange).toBe(anotherMatch.acceptorEloChange);
    await expect(firstMatch.challengerMatches).toBe(anotherMatch.challengerMatches);
    await expect(firstMatch.acceptorMatches).toBe(anotherMatch.acceptorMatches);
    await expect(firstMatch.challengerRd).toBe(anotherMatch.challengerRd);
    await expect(firstMatch.acceptorRd).toBe(anotherMatch.acceptorRd);

    // Check that an email is sent
    const emailSent = await expectRecordToExist('emails', {
        recipientEmail: 'player2@gmail.com',
        subject: 'You Have New Match Results!',
    });
    expect(emailSent.html).toContain('Since you and Ben Done play in the Men 3.5 and Men 4.0 ladders');

    await page.goto('/season/2021/spring/men-40');
    await expect(page.locator(`[data-match="${anotherMatch.id}"]`)).toBeVisible();
    await expect(common.body).toContainText('+24');
    await expect(common.body).toContainText('+9');

    // delete match
    await page.locator(`[data-match-actions="${anotherMatch.id}"]`).click();
    await page.locator(`[data-delete-match="${anotherMatch.id}"]`).click();

    await match.reasonField.fill('I am sick');
    await common.modal.locator('button').getByText('Delete match').click();

    await expect(common.alert).toContainText('The match has been deleted.');
    await expect(page.locator(`[data-match="${anotherMatch.id}"]`)).toBeHidden();

    await page.goto('/season/2021/spring/men-35');
    await expect(common.body).toContainText('Ongoing season');
    await expect(page.locator(`[data-match="9"]`)).toBeHidden();

    expect(await getNumRecords('matches', { id: 9 })).toBe(0);
    expect(await getNumRecords('matches', { sameAs: 9 })).toBe(0);
});

test('Should edit multi-ladder match', async ({ page, common, login, match }) => {
    await runQuery(`INSERT INTO players (userId, tournamentId) VALUES (1, 3)`);

    await login.loginAsPlayer1();

    await page.goto('/season/2021/spring/men-35');

    await page.locator('a').getByText('Score').click();

    await match.pickChallengerPoints(5);
    await new Promise((resolve) => setTimeout(resolve, 1000));

    await match.pickChallengerPoints(5);
    await new Promise((resolve) => setTimeout(resolve, 1000));

    await expect(common.modal).toContainText('+14');
    await expect(common.modal).toContainText('+16');
    await common.modal.locator('button').getByText('Report match').click();

    await checkTwoLadderReportMessage(common);

    const originalMatch = await expectRecordToExist('matches', { id: 9 }, { score: '5-7 5-7' });
    await expectRecordToExist('matches', { sameAs: 9 }, { score: '5-7 5-7' });

    // Edit match
    await page.locator(`[data-match-actions="9"]`).click();
    await page.locator(`[data-edit-match="9"]`).click();

    await match.pickChallengerPoints(0);
    await new Promise((resolve) => setTimeout(resolve, 1000));

    await match.pickChallengerPoints(0);
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // delete all emails just to see another one later
    await runQuery(`DELETE FROM emails`);

    await common.modal.locator('button').getByText('Report match').click();
    await expect(common.alert).toContainText('The match has been reported.');

    // Check that an email is sent
    const emailSent = await expectRecordToExist('emails', {
        recipientEmail: 'player2@gmail.com',
        subject: 'You Have New Match Results!',
    });
    expect(emailSent.html).toContain('Since you and Ben Done play in the Men 3.5 and Men 4.0 ladders');

    expect(await getNumRecords('matches', { sameAs: 9 })).toBe(1);

    const firstMatch = await expectRecordToExist('matches', { id: 9 }, { score: '0-6 0-6' });
    const anotherMatch = await expectRecordToExist('matches', { sameAs: 9 }, { score: '0-6 0-6' });

    await expect(originalMatch.challengerElo).not.toBe(firstMatch.challengerElo);
    await expect(originalMatch.acceptorElo).not.toBe(firstMatch.acceptorElo);

    await expect(anotherMatch.winner).toBe(anotherMatch.acceptorId);
    await expect(firstMatch.playedAt).toBe(anotherMatch.playedAt);
    await expect(firstMatch.createdAt).toBe(anotherMatch.createdAt);
    await expect(firstMatch.challengerElo).toBe(anotherMatch.challengerElo);
    await expect(firstMatch.acceptorElo).toBe(anotherMatch.acceptorElo);
    await expect(firstMatch.challengerEloChange).toBe(anotherMatch.challengerEloChange);
    await expect(firstMatch.acceptorEloChange).toBe(anotherMatch.acceptorEloChange);
    await expect(firstMatch.challengerMatches).toBe(anotherMatch.challengerMatches);
    await expect(firstMatch.acceptorMatches).toBe(anotherMatch.acceptorMatches);
    await expect(firstMatch.challengerRd).toBe(anotherMatch.challengerRd);
    await expect(firstMatch.acceptorRd).toBe(anotherMatch.acceptorRd);
});

test('Should edit multi-ladder match in another ladder', async ({ page, common, login, match }) => {
    await runQuery(`INSERT INTO players (userId, tournamentId) VALUES (1, 3)`);

    await login.loginAsPlayer1();

    await page.goto('/season/2021/spring/men-35');

    await page.locator('a').getByText('Score').click();

    await match.pickChallengerPoints(5);
    await new Promise((resolve) => setTimeout(resolve, 1000));

    await match.pickChallengerPoints(5);
    await new Promise((resolve) => setTimeout(resolve, 1000));

    await common.modal.locator('button').getByText('Report match').click();
    await checkTwoLadderReportMessage(common);

    const originalMatch = await expectRecordToExist('matches', { id: 9 }, { score: '5-7 5-7' });
    const originalAnotherMatch = await expectRecordToExist('matches', { sameAs: 9 }, { score: '5-7 5-7' });

    // Edit match
    await page.goto('/season/2021/spring/men-40');
    await page.locator(`[data-match-actions="${originalAnotherMatch.id}"]`).click();
    await page.locator(`[data-edit-match="${originalAnotherMatch.id}"]`).click();

    await match.pickChallengerPoints(0);
    await new Promise((resolve) => setTimeout(resolve, 1000));

    await match.pickChallengerPoints(0);
    await new Promise((resolve) => setTimeout(resolve, 1000));

    await common.modal.locator('button').getByText('Report match').click();
    await expect(common.alert).toContainText('The match has been reported.');

    expect(await getNumRecords('matches', { sameAs: 9 })).toBe(0);
    expect(await getNumRecords('matches', { sameAs: originalAnotherMatch.id })).toBe(1);

    const firstMatch = await expectRecordToExist('matches', { id: originalAnotherMatch.id }, { score: '0-6 0-6' });
    const anotherMatch = await expectRecordToExist(
        'matches',
        { sameAs: originalAnotherMatch.id },
        { score: '0-6 0-6' }
    );

    await expect(originalMatch.challengerElo).not.toBe(firstMatch.challengerElo);
    await expect(originalMatch.acceptorElo).not.toBe(firstMatch.acceptorElo);

    await expect(anotherMatch.winner).toBe(anotherMatch.acceptorId);
    await expect(firstMatch.playedAt).toBe(anotherMatch.playedAt);
    await expect(firstMatch.createdAt).toBe(anotherMatch.createdAt);
    await expect(firstMatch.challengerElo).toBe(anotherMatch.challengerElo);
    await expect(firstMatch.acceptorElo).toBe(anotherMatch.acceptorElo);
    await expect(firstMatch.challengerEloChange).toBe(anotherMatch.challengerEloChange);
    await expect(firstMatch.acceptorEloChange).toBe(anotherMatch.acceptorEloChange);
    await expect(firstMatch.challengerMatches).toBe(anotherMatch.challengerMatches);
    await expect(firstMatch.acceptorMatches).toBe(anotherMatch.acceptorMatches);
    await expect(firstMatch.challengerRd).toBe(anotherMatch.challengerRd);
    await expect(firstMatch.acceptorRd).toBe(anotherMatch.acceptorRd);
});

test('Should delete multi-ladder match in another ladder', async ({ page, common, login, match }) => {
    await runQuery(`INSERT INTO players (userId, tournamentId) VALUES (1, 3)`);

    await login.loginAsPlayer1();

    await page.goto('/season/2021/spring/men-35');

    await page.locator('a').getByText('Score').click();

    await match.pickChallengerPoints(5);
    await new Promise((resolve) => setTimeout(resolve, 1000));

    await match.pickChallengerPoints(5);
    await new Promise((resolve) => setTimeout(resolve, 1000));

    await common.modal.locator('button').getByText('Report match').click();
    await checkTwoLadderReportMessage(common);

    const anotherMatch = await expectRecordToExist('matches', { sameAs: 9 }, { score: '5-7 5-7' });

    // Delete match
    await page.goto('/season/2021/spring/men-40');
    await page.locator(`[data-match-actions="${anotherMatch.id}"]`).click();
    await page.locator(`[data-delete-match="${anotherMatch.id}"]`).click();

    await match.reasonField.fill('I am sick');
    await common.modal.locator('button').getByText('Delete match').click();

    await expect(common.alert).toContainText('The match has been deleted.');

    expect(await getNumRecords('matches', { id: anotherMatch.id })).toBe(0);
    expect(await getNumRecords('matches', { id: 9 })).toBe(0);
});

test('Should add match result and remove initial match', async ({ page, common, login, match }) => {
    await runQuery(`INSERT INTO players (userId, tournamentId) VALUES (1, 3)`);

    await login.loginAsPlayer1();

    // populate cache
    await page.goto('/season/2021/spring/men-40');
    await expect(common.body).toContainText('Ongoing season');

    await page.goto('/season/2021/spring/men-35');

    await page.locator('a').getByText('Score').click();

    await match.pickChallengerPoints(3);
    await new Promise((resolve) => setTimeout(resolve, 1000));

    await match.pickChallengerPoints(2);
    await new Promise((resolve) => setTimeout(resolve, 1000));

    await expect(common.modal).toContainText('+19');
    await expect(common.modal).toContainText('+9');
    await common.modal.locator('button').getByText('Report match').click();

    await checkTwoLadderReportMessage(common);

    await expect(common.body).toContainText('+19');
    await expect(common.body).toContainText('+9');
    await expectRecordToExist('matches', { id: 9 }, { score: '3-6 2-6' });
    const anotherMatch = await expectRecordToExist('matches', { sameAs: 9 }, { score: '3-6 2-6' });

    await page.goto('/season/2021/spring/men-40');
    await expect(page.locator(`[data-match="${anotherMatch.id}"]`)).toBeVisible();

    await page.goto('/season/2021/spring/men-35');
    await page.locator(`[data-match-actions="9"]`).click();
    await page.locator(`[data-delete-match="9"]`).click();

    await match.reasonField.fill('I am sick');
    await common.modal.locator('button').getByText('Delete match').click();

    await expect(common.alert).toContainText('The match has been deleted.');
    await expect(page.locator(`[data-match="9"]`)).toBeHidden();

    await page.goto('/season/2021/spring/men-40');
    await expect(common.body).toContainText('Ongoing season');
    await expect(page.locator(`[data-match="${anotherMatch.id}"]`)).toBeHidden();
});

test('Add match result from scratch', async ({ page, common, login, match }) => {
    await runQuery(`INSERT INTO players (userId, tournamentId) VALUES (1, 3)`);

    await login.loginAsPlayer1();

    // populate cache
    await page.goto('/season/2021/spring/men-40');
    await expect(common.body).toContainText('Ongoing season');

    await page.goto('/season/2021/spring/men-35');
    await page.locator('button').getByText('Report').click();

    await match.challengerSelect.selectOption('Gary Mill');
    await page.locator('button').getByText('Next').click();

    await match.pickChallengerPoints(3);
    await new Promise((resolve) => setTimeout(resolve, 1000));

    await match.pickChallengerPoints(2);
    await new Promise((resolve) => setTimeout(resolve, 1000));

    await expect(common.modal).toContainText('+19');
    await expect(common.modal).toContainText('+9');
    await common.modal.locator('button').getByText('Report match').click();

    await common.modal.locator('button').getByText("Yes, it's another match").click();

    await checkTwoLadderReportMessage(common);

    await expect(common.body).toContainText('+19');
    await expect(common.body).toContainText('+9');
    const firstMatch = await expectRecordToExist('matches', { challengerId: 1, acceptorId: 2, score: '3-6 2-6' });
    const anotherMatch = await expectRecordToExist('matches', { sameAs: firstMatch.id }, { score: '3-6 2-6' });

    await expect(anotherMatch.winner).toBe(anotherMatch.acceptorId);
    await expect(firstMatch.playedAt).toBe(anotherMatch.playedAt);
    await expect(firstMatch.createdAt).toBe(anotherMatch.createdAt);
    await expect(firstMatch.challengerElo).toBe(anotherMatch.challengerElo);
    await expect(firstMatch.acceptorElo).toBe(anotherMatch.acceptorElo);
    await expect(firstMatch.challengerEloChange).toBe(anotherMatch.challengerEloChange);
    await expect(firstMatch.acceptorEloChange).toBe(anotherMatch.acceptorEloChange);
    await expect(firstMatch.challengerMatches).toBe(anotherMatch.challengerMatches);
    await expect(firstMatch.acceptorMatches).toBe(anotherMatch.acceptorMatches);
    await expect(firstMatch.challengerRd).toBe(anotherMatch.challengerRd);
    await expect(firstMatch.acceptorRd).toBe(anotherMatch.acceptorRd);
});

test('Should not duplicate stats', async ({ page, common, login, match, overview }) => {
    await overrideConfig({ minMatchesToEstablishTlr: 6 });
    await runQuery(`INSERT INTO players (userId, tournamentId) VALUES (1, 3)`);

    await login.loginAsPlayer1();

    await page.goto('/season/2021/spring/men-35');
    await page.locator('a').getByText('Score').click();

    await match.pickChallengerPoints(3);
    await new Promise((resolve) => setTimeout(resolve, 1000));

    await match.pickChallengerPoints(2);
    await new Promise((resolve) => setTimeout(resolve, 1000));

    await common.modal.locator('button').getByText('Report match').click();
    await checkTwoLadderReportMessage(common);

    await overview.playerList.locator('a').getByText('Ben Done').click();

    await expect(common.body).toContainText('Men 3.5 (4 matches)');
    await expect(common.body).toContainText('Men 4.0 (1 match)');
    await expect(common.body).toContainText('5 - 1');
    await expect(common.body).toContainText('6 matches');
    await expect(common.body).toContainText('TLR not established');

    await expect(page.locator('.card', { hasText: 'Rivalries' })).toContainText('3 - 0');
    await page.locator('a').getByText('Gary Mill').click();
    await expect(common.modal).toContainText('3-0');

    await common.modal.locator('.btn-close').click();
    await page.locator('[data-recent-badges]').click();
    await page.locator('[data-badge="matchesPlayed"]').click();
    await expect(page.locator('[data-badge-info="matchesPlayed"]')).toContainText('6matches played');
    await expect(page.locator('[data-badge-info="matchesPlayed"]')).toContainText('+19');
});
