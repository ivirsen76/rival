import { test, expect } from './base';
import { restoreDb, runQuery, getNumRecords } from './db';

test.beforeEach(async ({ page }) => {
    restoreDb();
});

const generateMatches = async () => {
    const [match] = await runQuery('SELECT * FROM matches WHERE challengerId=2 AND score IS NOT NULL LIMIT 0, 1');
    for (let i = 0; i < 10; i++) {
        await runQuery(`INSERT INTO matches (initial, challengerId, acceptorId, winner, score, playedAt)
            VALUES (1, ${match.challengerId}, ${match.acceptorId}, ${match.winner}, "${match.score}", "2020-10-10 10:10:10")`);
    }
    await runQuery('UPDATE matches SET challengerMatches=10, acceptorMatches=10');
};

test("Check that we don't send any messages to rabbits", async ({ page, common, login }) => {
    await generateMatches();
    await runQuery(`UPDATE users SET comeFrom=99, comeFromOther="Rabbit" WHERE id=2`);

    await login.loginAsPlayer1();
    await page.goto('/player/gary-mill');

    await page.getByRole('button', { name: 'Send message' }).click();
    await page.locator('textarea[name="message"]').fill('Hello, Man!');
    await common.modalSubmitButton.click();

    await expect(common.modal).toContainText('Your message has been sent successfully.');

    // Check that email is not sent
    await new Promise(resolve => setTimeout(resolve, 1000));
    expect(await getNumRecords('emails')).toBe(0);
});
