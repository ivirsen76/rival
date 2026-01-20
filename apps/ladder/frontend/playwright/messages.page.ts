import { test, expect } from './base';
import { restoreDb, runQuery, expectRecordToExist } from './db';

test.beforeEach(async ({ page }) => {
    restoreDb();
});

const generateMatches = async (challengerId?: number, acceptorId?: number) => {
    const [match] = await runQuery('SELECT * FROM matches WHERE challengerId=2 AND score IS NOT NULL LIMIT 0, 1');
    for (let i = 0; i < 10; i++) {
        await runQuery(`INSERT INTO matches (initial, challengerId, acceptorId, winner, score, playedAt)
            VALUES (1, ${challengerId || match.challengerId}, ${acceptorId || match.acceptorId}, ${match.winner}, "${
                match.score
            }", "2020-10-10 10:10:10")`);
    }
    await runQuery('UPDATE matches SET challengerMatches=10, acceptorMatches=10');
};

test('Should not see Message button for himself', async ({ page, common, login, user }) => {
    await login.loginAsPlayer1();
    await page.goto('/player/ben-done');
    await expect(common.body).toContainText('Edit my profile');
    await expect(user.messageButton).toBeHidden();
});

test('Should not allow to send a message if player played not enough matches', async ({
    page,
    common,
    login,
    user,
}) => {
    await login.loginAsPlayer1();
    await page.goto('/player/gary-mill');
    await user.messageButton.click();

    await expect(common.modal).toContainText(user.NOT_ENOUGH_MATCHES);
});

test('Should not allow to send a message if player already sent 3 messages this week', async ({
    page,
    common,
    login,
    user,
}) => {
    await generateMatches();

    // generate messages
    for (let i = 0; i < 3; i++) {
        await runQuery(`INSERT INTO messages (senderId, recipientId, message) VALUES (1, 3, "Content")`);
    }

    await login.loginAsPlayer1();
    await page.goto('/player/gary-mill');
    await user.messageButton.click();

    await expect(common.modal).toContainText(user.TOO_MANY_MESSAGES);
});

test('Should not allow to send a message if player is not playing to the same ladder with recipient', async ({
    common,
    login,
    page,
    user,
}) => {
    await generateMatches(4, 1);

    await login.loginAsPlayer4();
    await page.goto('/player/not-played-user');
    await user.messageButton.click();

    await expect(common.modal).toContainText(user.NOT_THE_SAME_LADDER);
});

test('Should send a message', async ({ page, common, login, user }) => {
    await generateMatches();

    // generate 2 messages. Just allow one more.
    for (let i = 0; i < 2; i++) {
        await runQuery(`INSERT INTO messages (senderId, recipientId, message) VALUES (1, 3, "Content")`);
    }

    await login.loginAsPlayer1();
    await page.goto('/player/gary-mill');
    await user.messageButton.click();

    await user.sendButton.click();
    await expect(common.modal).toContainText('Message is required.');

    await user.messageField.fill('Hello, Man!');
    await user.sendButton.click();

    await expect(common.modal).toContainText('Your message has been sent successfully.');
    await page.locator('button').getByText('Ok, got it!').click();

    await expect(common.modal).toBeHidden();
    await expectRecordToExist('messages', { senderId: 1, recipientId: 2 }, { message: 'Hello, Man!' });

    const emailSent = await expectRecordToExist('emails', {
        recipientEmail: 'player2@gmail.com',
        subject: 'Ben Done Sent You a Message!',
    });
    expect(emailSent.html).toContain('<b>Ben Done</b></a> sent you a message:');
    expect(emailSent.html).toContain('Hello, Man!');
    expect(emailSent.html).toContain('player1@gmail.com');
    expect(emailSent.html).toContain('123-456-7890');
    expect(emailSent.html).toContain('player/ben-done');

    await user.messageButton.click();
    await expect(common.modal).toContainText(user.TOO_MANY_MESSAGES);
});
