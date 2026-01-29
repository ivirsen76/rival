import { test, expect } from './base';
import {
    runQuery,
    restoreDb,
    getRecord,
    getNumRecords,
    expectRecordToExist,
    overrideConfig,
    expectNumRecords,
} from '@rival/ladder.backend/src/db/helpers';
import { imageRegex } from './helpers';
import dayjs from '@rival/dayjs';
import { decrypt } from '@rival/ladder.backend/src/utils/crypt';

test.beforeEach(async () => {
    restoreDb();
});

test('We can see Not Found message for guests', async ({ page, common, login }) => {
    await page.goto('/admin');
    await expect(common.body).toContainText('Page Not Found');
});

test('We can see Not Found message for players', async ({ page, common, login }) => {
    await login.loginAsPlayer1();
    await page.goto('/admin');
    await expect(common.body).toContainText('Page Not Found');
});

test('Should not see additional info for admins', async ({ page, common, login }) => {
    await login.loginAsAdmin();
    await page.goto('/player/ben-done');
    await expect(common.body).toContainText('Ben Done');
    await expect(common.body).not.toContainText('Additional Info');
});

test('Should see additional info for supeadmins', async ({ page, common, login }) => {
    await runQuery(`UPDATE users SET roles="admin,superadmin" WHERE email="admin@gmail.com"`);

    await login.loginAsAdmin();
    await page.goto('/player/ben-done');
    await expect(common.body).toContainText('Additional Info');
    await expect(common.body).toContainText('Registered at');
});

// Matches
(() => {
    test('Admin can change any match result', async ({ page, common, login, match }) => {
        await login.loginAsAdmin();
        await page.goto('/season/2021/spring/men-35/matches');
        await page.locator('button').getByText('Proposed').click();
        await page.locator('a').getByText('Score').click();

        await match.pickChallengerPoints(3);
        await new Promise((resolve) => setTimeout(resolve, 1000));
        await match.pickChallengerPoints(2);

        await expect(common.modal).toContainText('+19');
        await expect(common.modal).toContainText('+9');
        await common.modal.locator('button').getByText('Report match').click();

        await expect(common.alert).toContainText('The match has been reported');
        await expectRecordToExist('matches', { id: 9 }, { score: '3-6 2-6' });
    });

    test('Admin can add match result', async ({ page, common, login, match }) => {
        await login.loginAsAdmin();
        await page.goto('/season/2021/spring/men-35');
        await page.locator('button').getByText('Report match').click();

        await match.pickChallengerOption('Cristopher Hamiltonbeach');
        await match.pickAcceptorOption('Matthew Burt');

        await page.locator('button').getByText('Next').click();

        await match.pickChallengerPoints(0);
        await new Promise((resolve) => setTimeout(resolve, 1000));
        await match.pickChallengerPoints(0);

        await common.modal.locator('button').getByText('Report match').click();

        await expect(common.alert).toContainText('The match has been reported');
        await expectRecordToExist('matches', { score: '0-6 0-6' });

        // Check that an email is sent
        const emailSent = await expectRecordToExist('emails', { subject: 'You Have New Match Results!' });
        expect(emailSent.recipientEmail).toBe('player3@gmail.com,player4@gmail.com');
        expect(emailSent.html).toContain('Bob Robe</b> reported the results of your match on');
        expect(emailSent.html).toContain('Matthew Burt beat Cristopher Hamiltonbeach: 6-0 6-0');
        expect(imageRegex.test(emailSent.html)).toBeTruthy();
    });

    test('Admin can add match result for the doubles ladder', async ({ page, common, login, match, proposal }) => {
        await login.loginAsAdmin();
        await page.goto('/season/2021/spring/men-40-dbls');
        await page.locator('button').getByText('Report match').click();

        await proposal.pickChallenger('Gary Mill');
        await proposal.pickChallenger2('Ben Done');
        await proposal.pickAcceptor('Cristopher Hamiltonbeach');
        await proposal.pickAcceptor2('Matthew Burt');

        await page.locator('button').getByText('Next').click();

        await match.pickAcceptorPoints(1);
        await new Promise((resolve) => setTimeout(resolve, 1000));

        await match.pickAcceptorPoints(0);
        await expect(common.modal).toContainText('+30');

        await common.modal.locator('button').getByText('Report match').click();

        const row = await expectRecordToExist('matches', { challengerPoints: '30' });
        const Match = page.locator(`[data-match="${row.id}"]`);

        await expect(Match).toContainText('Gary');
        await expect(Match).toContainText('Cristopher');
        await expect(Match).toContainText('Ben');
        await expect(Match).toContainText('Matthew');

        await expectRecordToExist('matches', { score: '6-1 6-0' });
    });

    test('Add can add match result even for inactive player', async ({ page, common, login, match }) => {
        await login.loginAsAdmin();
        await page.goto('/season/2021/spring/men-35');
        await page.locator('button').getByText('Report').click();

        await match.pickChallengerOption('Inactive User');
        await match.pickAcceptorOption('Matthew Burt');

        await page.locator('button').getByText('Next').click();

        await match.pickChallengerPoints(0);
        await new Promise((resolve) => setTimeout(resolve, 1000));
        await match.pickChallengerPoints(0);

        await common.modal.locator('button').getByText('Report match').click();

        await expect(common.alert).toContainText('The match has been reported');
        await expectRecordToExist('matches', { score: '0-6 0-6' });
    });

    test('Should report the score for the final tournament', async ({ page, common, login, match, overview }) => {
        const dateTwoDaysAgo = dayjs.tz().subtract(2, 'day').format('YYYY-MM-DD HH:mm:ss');
        await runQuery(`UPDATE players SET readyForFinal=1 WHERE userId!=2`);
        await runQuery(`UPDATE seasons SET endDate="${dateTwoDaysAgo}" WHERE id=1`);
        await overrideConfig({ minMatchesToPlanTournament: 2, minPlayersToRunTournament: 2 });

        await login.loginAsAdmin();
        await page.goto('/season/2021/spring/men-35');

        await overview.finalTournamentArea.locator('a').getByText('Score').click();
        await match.pickChallengerPoints(0);
        await new Promise((resolve) => setTimeout(resolve, 1000));
        await match.pickChallengerPoints(0);
        await common.modal.locator('button').getByText('Report match').click();
        await expectRecordToExist('matches', { finalSpot: 2, score: '0-6 0-6' });

        // Try to edit the final result
        await page.locator('[data-final-spot="2"]').locator('button[data-match-actions]').click();
        await expect(page.locator('button[data-edit-match]')).toBeVisible();
        await expect(page.locator('button[data-clear-match-result]')).toBeVisible();
        await expect(page.locator('button[data-delete-match]')).toBeHidden();
        await overview.finalTournamentArea.locator('button[data-edit-match]').click();
        await match.pickChallengerPoints(3);
        await new Promise((resolve) => setTimeout(resolve, 1000));
        await page.locator('a').getByText('Set 2').click();
        await match.pickChallengerPoints(3);
        await common.modal.locator('button').getByText('Report match').click();

        await expect(common.alert).toContainText('The match has been reported');
        await expectRecordToExist('matches', { finalSpot: 2, score: '3-6 3-6' });
    });

    test.skip('Should cleared the score for the played match', async ({ page, common, login, match }) => {
        const dateTwoDaysAgo = dayjs.tz().subtract(2, 'day').format('YYYY-MM-DD HH:mm:ss');
        await runQuery(`UPDATE players SET readyForFinal=1 WHERE userId!=2`);
        await runQuery(`UPDATE seasons SET endDate="${dateTwoDaysAgo}" WHERE id=1`);
        await overrideConfig({ minMatchesToPlanTournament: 2 });

        await login.loginAsAdmin();
        await page.goto('/season/2021/spring/men-35');

        // report semi-final match
        await page.locator('[data-final-spot="2"]').locator('a').getByText('Score').click();
        await match.pickChallengerPoints(0);
        await new Promise((resolve) => setTimeout(resolve, 1000));
        await match.pickChallengerPoints(0);
        await common.modal.locator('button').getByText('Report match').click();
        await expectRecordToExist('matches', { finalSpot: 2, score: '0-6 0-6' });

        // report final match
        await page.locator('[data-final-spot="1"]').locator('a').getByText('Score').click();
        await match.pickChallengerPoints(1);
        await new Promise((resolve) => setTimeout(resolve, 1000));
        await match.pickChallengerPoints(1);
        await common.modal.locator('button').getByText('Report match').click();
        await expectRecordToExist('matches', { finalSpot: 1, score: '1-6 1-6' });

        await expect(common.body).toContainText('Champion');

        // clear final result
        await page.locator('[data-final-spot="1"]').locator('button[data-match-actions]').click();
        await page.locator('button[data-clear-match-result]').click();
        await expect(common.modal).toContainText('Are you sure?');
        await common.modal.locator('button').getByText('Yes').click();
        await expect(common.alert).toContainText('successfully cleared');

        await expect(common.body).not.toContainText('Champion');

        // clear semi-final result
        await page.locator('[data-final-spot="2"]').locator('button[data-match-actions]').click();
        await page.locator('button[data-clear-match-result]').click();
        await expect(common.modal).toContainText('Are you sure?');
        await common.modal.locator('button').getByText('Yes').click();
        await expect(common.alert).toContainText('successfully cleared');

        await expect(page.locator('[data-final-spot="2"]')).toContainText('Score');
    });

    test('Admin can schedule a match', async ({ page, common, login, match, proposal }) => {
        await login.loginAsAdmin();
        await page.goto('/season/2021/spring/men-35');
        await page.locator('button').getByText('Schedule match').click();

        await match.pickChallengerOption('Ben Done');
        await match.pickAcceptorOption('Matthew Burt');

        await page.locator('button').getByText('Next').click();

        await proposal.pickSundayNextWeek();
        await proposal.placeField.fill('Bond park');
        await common.modalSubmitButton.click();

        await expect(common.alert).toContainText('The match was successfuly scheduled.');

        await expectRecordToExist('matches', { place: 'Bond Park' }, { challengerId: 2, acceptorId: 4 });

        // Check email
        {
            const email = await expectRecordToExist('emails', { subject: 'Your Match Is Scheduled' });
            expect(email.replyTo).toContain('Bob Robe');
            expect(email.replyTo).toContain('admin@gmail.com');
            expect(email.html).toContain('Ben Done</a>');
            expect(email.html).toContain('Matthew Burt</a>');
            expect(email.html).toContain('Sun');
            expect(email.html).toContain('Bond park');
            expect(email.recipientEmail).toBe('player1@gmail.com,player4@gmail.com');
        }
    });
})();

// Managers
(() => {
    test('We can add new manager', async ({ page, common, login }) => {
        await login.loginAsAdmin();
        await page.goto('/admin');
        await page.locator('a').getByText('Managers').click();
        await page.locator('button').getByText('Add manager').click();
        await page.locator('[data-select-player-input]').click();
        await page.locator('input[name="search"]').fill('Matthew');
        await page.locator('[data-user-id="6"]').click();
        await common.modalSubmitButton.click();

        await expect(common.alert).toContainText('got a manager role');
        await expect(common.body).toContainText('Matthew Burt');

        const user = await getRecord('users', { id: '6' });
        expect(user.roles).toContain('player');
        expect(user.roles).toContain('manager');
    });

    test('We can revoke manager role', async ({ page, common, login }) => {
        await login.loginAsAdmin();
        await page.goto('/admin/managers');
        await page.locator('[data-remove-manager-role="3"]').click();
        await expect(common.modal).toContainText('Are you sure?');
        await common.modal.locator('button').getByText('Yes').click();

        await expect(common.body).not.toContainText('Email');
        await expectRecordToExist('users', { id: 3 }, { roles: 'player' });
    });
})();

// Getting player emails
(() => {
    test('Can send email to few recipients', async ({ page, common, login }) => {
        await login.loginAsAdmin();
        await page.goto('/admin/email');
        await expect(common.body).not.toContainText('Subject');
        await expect(common.body).not.toContainText('Content');
        await expect(common.body).not.toContainText('Send message copy');
        await page.locator('label').getByText('Men 3.5').click();
        await page.locator('label').getByText('Men 4.0').first().click();
        await page.locator('button').getByText('Copy emails').click();

        await expect(common.alert).toContainText('7 emails copied to the clipboard');
    });

    test('Send real email to few recipients', async ({ page, common, login }) => {
        await runQuery(`UPDATE users SET roles="admin,superadmin" WHERE email="admin@gmail.com"`);
        await login.loginAsAdmin();
        await page.goto('/admin/email');
        await page.locator('label').getByText('Men 3.5').click();
        await page.locator('textarea[name="additionalRecipients"]').fill('some@gmail.com;another@gmail.com');
        await page.locator('input[name="subject"]').fill('Final');
        await page.locator('textarea[name="body"]').fill('Thank you!');
        await page.locator('button').getByText('Send message').click();

        await expect(common.modal).toContainText('Are you sure?');
        await expect(common.modal).toContainText('7 players');
        await common.modal.locator('button').getByText('Yes').click();
        await expect(common.alert).toContainText('Message was successfuly sent to 7 recipients');

        // wait for the message to be saved in DB
        await new Promise((resolve) => setTimeout(resolve, 500));
        const email = await getRecord('emails', { subject: 'Final' });
        expect(email.subject).toBe('Final');
        expect(email.recipientEmail).toContain('some@gmail.com');
        expect(email.recipientEmail).toContain('another@gmail.com');
        expect(email.recipientEmail.split(',').length).toBe(7);
        expect(email.html).toContain('<p>Thank you!</p>');
    });

    test('Send real email to all', async ({ page, common, login }) => {
        await runQuery(`UPDATE users SET roles="admin,superadmin" WHERE email="admin@gmail.com"`);
        await runQuery(`UPDATE users SET subscribeForNews=1, loggedAt="2025-01-01 00:00:00"`);
        await login.loginAsAdmin();
        await page.goto('/admin/email');
        await expect(common.body).toContainText('All players (8)');
        await page.locator('label').getByText('All players').click();
        await page.locator('textarea[name="additionalRecipients"]').fill('some@gmail.com;another@gmail.com');
        await page.locator('input[name="subject"]').fill('Final');
        await page.locator('textarea[name="body"]').fill('Thank you!');
        await page.locator('button').getByText('Send message').click();

        await expect(common.modal).toContainText('Are you sure?');
        await expect(common.modal).toContainText('10 players');
        await common.modal.locator('button').getByText('Yes').click();
        await expect(common.alert).toContainText('Message was successfuly sent to 10 recipients');

        const email = await expectRecordToExist('emails', { subject: 'Final' });
        expect(email.recipientEmail).toBe(
            'another@gmail.com,player1@gmail.com,player2@gmail.com,player3@gmail.com,player4@gmail.com,player5@gmail.com,player8@gmail.com,player9@gmail.com,playerDuplicated@gmail.com,some@gmail.com'
        );
        expect(email.html).toContain('<p>Thank you!</p>');
    });
})();

// Add players
(() => {
    test('We cannot see admin area for past tournaments', async ({ page, common, login }) => {
        await login.loginAsAdmin();
        await page.goto('/season/2020/fall/men-30');
        await expect(page.locator('.nav-link').getByText('Manage players')).toBeHidden();
    });

    test('Admin can add new players', async ({ page, common, login }) => {
        await runQuery(`UPDATE users SET gender=""`);

        const dateWeekAgo = dayjs.tz().subtract(1, 'week').format('YYYY-MM-DD HH:mm:ss');
        await runQuery(`UPDATE players SET createdAt="${dateWeekAgo}"`);

        await login.loginAsAdmin();
        await page.goto('/season/2021/spring/men-40');
        await page.locator('.nav-link').getByText('Manage players').click();
        await page.locator('button').getByText('Add players').click();
        await page.locator('[data-select-player-input]').click();

        await page.locator('input[name="search"]').fill('Matt');
        await expect(common.modal).toContainText('Matthew Burt');
        await page.keyboard.press('Enter');

        await page.locator('input[name="search"]').fill('playerDuplicated');
        await expect(common.modal).toContainText('Doubles Player');
        await page.keyboard.press('Enter');
        await page.locator('[data-select-player-input]').click();

        await common.modalSubmitButton.click();
        await expect(common.alert).toContainText('2 players were added');
        await expect(common.body).toContainText('Matthew Burt');
        await expect(common.body).toContainText('Doubles Player');

        // check that gender is set
        await expectRecordToExist('users', { email: 'player4@gmail.com' }, { gender: 'male' });
    });

    test('The message is not sent when adding player before the ladder starts', async ({ page, common, login }) => {
        const dateInAnHour = dayjs.tz().add(1, 'hour').format('YYYY-MM-DD HH:mm:ss');
        await runQuery(`UPDATE seasons SET startDate="${dateInAnHour}" WHERE id=1`);
        await overrideConfig({ isRaleigh: 1 });

        await login.loginAsAdmin();
        await page.goto('/season/2021/spring/men-40');
        await page.locator('.nav-link').getByText('Manage players').click();
        await page.locator('button').getByText('Add players').click();
        await page.locator('[data-select-player-input]').click();

        await page.locator('input[name="search"]').fill('Matt');
        await expect(common.modal).toContainText('Matthew Burt');
        await page.keyboard.press('Enter');
        await page.locator('[data-select-player-input]').click();

        await common.modalSubmitButton.click();
        await expect(common.alert).toContainText('1 players were added');

        await new Promise((resolve) => setTimeout(resolve, 1000));
        expect(await getNumRecords('emails')).toBe(0);
    });

    test('Admin can remove players from the tournament', async ({ page, common, login }) => {
        await login.loginAsAdmin();
        await page.goto('/season/2021/spring/men-40');
        await page.locator('.nav-link').getByText('Manage players').click();
        await page.locator('[data-remove-player="4"]').click();
        await expect(common.modal).toContainText('about to remove Bob Robe');
        await common.modal.locator('button').getByText('Yes').click();

        await expect(common.alert).toContainText('Bob Robe removed');
        await expect(page.locator('[data-remove-player="4"]')).toBeHidden();
    });

    test('Admin can make players inactive for the tournament', async ({ page, common, login }) => {
        await runQuery(`UPDATE players SET readyForFinal=1 WHERE id=5`);

        await login.loginAsAdmin();
        await page.goto('/season/2021/spring/men-40');
        await page.locator('.nav-link').getByText('Manage players').click();

        await expect(page.locator('[data-inactive-player="2"]')).toBeHidden();

        await page.locator('[data-remove-player="2"]').click();
        await expect(common.modal).toContainText('about to deactivate Gary Mill');
        await common.modal.locator('button').getByText('Yes').click();

        await expect(common.alert).toContainText('Gary Mill deactivated');
        await expect(page.locator('[data-remove-player="2"]')).toBeHidden();
        await expect(page.locator('[data-inactive-player="2"]')).toBeVisible();

        await page.locator('.nav-link').getByText('Overview').click();
        await expect(page.locator('[data-inactive-user="2"]')).toBeVisible();

        await expectRecordToExist('players', { id: 5 }, { isActive: 0, readyForFinal: 0 });

        // activate player again
        await page.goto('/season/2021/spring/men-40/admin');
        await page.locator('[data-activate-player="2"]').click();
        await expect(common.modal).toContainText('about to activate Gary Mill');
        await common.modal.locator('button').getByText('Yes').click();

        await expect(common.alert).toContainText('Gary Mill activated');
        await expect(page.locator('[data-remove-player="2"]')).toBeVisible();
        await expect(page.locator('[data-inactive-player="2"]')).toBeHidden();

        await expectRecordToExist('players', { id: 5 }, { isActive: 1 });
    });
})();

// Ban players
(() => {
    test('We can ban some player', async ({ page, common, login }) => {
        await login.loginAsAdmin();
        await page.goto('/admin/ban');
        await expect(common.body).toContainText('No users with ban found');
        await page.locator('button').getByText('Ban user').click();

        await page.locator('[data-select-player-input]').click();
        await page.locator('input[name="search"]').fill('Matt');
        await expect(common.modal).toContainText('Matthew Burt');
        await page.keyboard.press('Enter');

        await page.locator('input[name="reason"]').fill('Was rude and selfish');

        page.locator('select[name=duration]').selectOption('Forever');
        await common.modalSubmitButton.click();

        await expect(common.alert).toContainText('successfully banned');
        await expect(page.locator('[data-ban-user-list]')).toContainText('Matthew Burt');
        await expect(page.locator('[data-ban-user-list]')).toContainText('Was rude and selfish');
        await expect(page.locator('[data-ban-user-list]')).toContainText('Forever');

        // check if he has a BAN sign in the ladder
        await page.goto('/season/2021/spring/men-35');
        await expect(page.locator('[data-inactive-user="6"]')).toBeVisible();
    });

    test('We can remove ban from the player', async ({ page, common, login }) => {
        const dateInWeek = dayjs.tz().add(1, 'week').format('YYYY-MM-DD HH:mm:ss');
        await runQuery(`UPDATE users SET banDate="${dateInWeek}", banReason="something" WHERE id=6`);

        await login.loginAsAdmin();
        await page.goto('/admin/ban');
        await page.locator('[data-remove-ban="6"]').click();

        await expect(common.modal).toContainText('about to remove ban from Matthew Burt');
        await common.modal.locator('button').getByText('Yes').click();

        await expect(page.locator('[data-remove-ban="6"]')).toBeHidden();

        const record = await expectRecordToExist('users', { id: 6 });
        await expect(record.banDate).toBeFalsy();
        await expect(record.banReason).toBeFalsy();
    });

    test('We can see ban validation', async ({ page, common, login }) => {
        await login.loginAsAdmin();
        await page.goto('/admin/ban');
        await page.locator('button').getByText('Ban user').click();
        await common.modalSubmitButton.click();
        await expect(common.modal).toContainText('Reason is required');
    });
})();

// Settings
(() => {
    test('We can see settings validation', async ({ page, common, login }) => {
        await login.loginAsAdmin();
        await page.goto('/admin/texts');
        await expect(common.body).toContainText('Sign-up notification');
        await page.locator('input[name="signUpNotification"]').fill('wrong');
        await page.locator('button').getByText('Submit').click();
        await expect(common.body).toContainText('The email list is incorrect');
    });

    test('We can change settings', async ({ page, common, login }) => {
        await login.loginAsAdmin();
        await page.goto('/admin/texts');
        await expect(common.body).toContainText('Sign-up notification');
        await page.locator('input[name="signUpNotification"]').fill('some@gmail.com');
        await page.locator('input[name="changeLevelNotification"]').fill('some@gmail.com; another@gmail.com');
        await page.locator('input[name="newFeedbackNotification"]').fill('more@gmail.com');
        await page.locator('input[name="newComplaintNotification"]').fill('more@gmail.com');
        await page.locator('button').getByText('Submit').click();
        await expect(common.alert).toContainText('Settings updated');

        await expectRecordToExist(
            'settings',
            { id: 1 },
            {
                signUpNotification: 'some@gmail.com',
                changeLevelNotification: 'some@gmail.com; another@gmail.com',
                newFeedbackNotification: 'more@gmail.com',
                newComplaintNotification: 'more@gmail.com',
            }
        );
    });

    test('We do not see newFeedbackNotification for Raleigh', async ({ page, common, login }) => {
        await overrideConfig({ isRaleigh: 1 });

        await login.loginAsAdmin();
        await page.goto('/admin/texts');
        await expect(common.body).toContainText('Sign-up notification');
        await expect(common.body).toContainText('Change level notification');
        await expect(common.body).toContainText('New complaint notification');
        await expect(common.body).not.toContainText('New feedback notification');
    });
})();

// Complaints
(() => {
    test('We can see all complaints', async ({ page, common, login }) => {
        await runQuery(
            `INSERT INTO complaints (userId, opponentId, reason, description) VALUES(1, 2, 'late', 'Too late every time.')`
        );

        await login.loginAsAdmin();
        await page.goto('/admin/complaints');
        await expect(common.body).toContainText('Constantly late');
        await expect(common.body).toContainText('Too late every time.');
        await expect(common.body).toContainText('Ben Done');
        await expect(common.body).toContainText('Gary Mill');
    });
})();

// All players
(() => {
    test('Check interface for admins', async ({ page, common, login }) => {
        await login.loginAsAdmin();
        await page.goto('/admin/players');
        await expect(common.body).toContainText('Matthew Burt');
        await expect(page.locator('[data-disable]')).toBeHidden();
        await expect(page.locator('[data-restore]')).toBeHidden();
    });

    test('Check interface for superadmins', async ({ page, common, login }) => {
        await runQuery(`UPDATE users SET roles="admin,superadmin" WHERE email="admin@gmail.com"`);

        await login.loginAsAdmin();
        await page.goto('/admin/players');
        await expect(common.body).toContainText('Matthew Burt');
        await expect(page.locator('[data-disable]').first()).toBeVisible();
        await expect(page.locator('[data-restore]')).toBeHidden();
    });

    test('We can see validation error during changing password', async ({ page, common, login }) => {
        await login.loginAsAdmin();
        await page.goto('/admin/players');
        await expect(common.body).toContainText('Matthew Burt');
        await page.locator('[data-change-password="6"]').click();
        await common.modalSubmitButton.click();
        await expect(common.modal).toContainText('Password must be at least 8 characters');
    });

    test('We can change any player password', async ({ page, common, login }) => {
        await login.loginAsAdmin();
        await page.goto('/admin/players');
        await expect(common.body).toContainText('Matthew Burt');
        await page.locator('[data-change-password="6"]').click();
        await page.locator('input[name="password"]').fill('12345678');
        await common.modalSubmitButton.click();

        await expect(common.alert).toContainText('Your password has been successfully changed');

        const user = await getRecord('users', { id: 6 });
        expect(decrypt(user.salt)).toBe('12345678');

        await page.goto('/login');
        await page.locator('input[name="email"]').fill('player4@gmail.com');
        await page.locator('input[name="password"]').fill('12345678');
        await page.locator('button').getByText('Sign in').click();

        await expect(common.body).toContainText('Matthew Burt');
    });

    test('We can soft delete user', async ({ page, common, login }) => {
        await runQuery(`UPDATE users SET roles="admin,superadmin" WHERE email="admin@gmail.com"`);

        await login.loginAsAdmin();
        await page.goto('/admin/players');
        await page.locator('[data-disable="6"]').click();

        await expect(common.modal).toContainText('You are about to disable player.');
        await common.modal.locator('button').getByText('Yes').click();

        await expect(common.alert).toContainText('Player has been successfully disabled');

        {
            const user = await expectRecordToExist('users', { id: 6 });
            expect(user.deletedAt).toBeTruthy();
        }

        await new Promise((resolve) => setTimeout(resolve, 1000));
        await page.locator('[data-restore="6"]').click();
        await common.modal.locator('button').getByText('Yes').click();

        await expect(common.alert).toContainText('Player has been successfully restored');
        await expect(page.locator('[data-disable="6"]')).toBeVisible();

        {
            const user = await expectRecordToExist('users', { id: 6 });
            expect(user.deletedAt).toBeFalsy();
        }
    });

    test('Soft deleted user shows just one letter for the last name', async ({ page, common, login }) => {
        await runQuery(`UPDATE users SET roles="admin,superadmin" WHERE email="admin@gmail.com"`);

        await login.loginAsAdmin();
        await page.goto('/admin/players');
        await page.locator('[data-disable="1"]').click();
        await common.modal.locator('button').getByText('Yes').click();
        await expect(common.alert).toContainText('Player has been successfully disabled');

        const urls = [
            '/player/ben-done',
            '/season/2021/spring/men-35',
            '/season/2021/spring/men-35/matches',
            '/season/2021/spring/men-35/proposals',
            '/season/2021/spring/men-35/admin',
        ];

        for (const url of urls) {
            await page.goto(url);
            await expect(common.body).toContainText('Ben D.');
            await expect(common.body).not.toContainText('Ben Done');
        }
    });
})();

// Merge accounts
(() => {
    test('We do not have anybody to merge by default', async ({ page, common, login }) => {
        await login.loginAsAdmin();
        await page.goto('/admin/merge');
        await expect(common.body).toContainText('There is no data found');
    });

    test('Merge users based on name', async ({ page, common, login }) => {
        await runQuery(`UPDATE users SET firstName="Ben", lastName="Done" WHERE id=9`);

        await login.loginAsAdmin();
        await page.goto('/admin/merge');
        await expect(common.body).toContainText('name');
        await expect(common.body).toContainText('Paul Pusher');
        await expect(page.locator('[data-possible-cheater="1"]')).toBeVisible();

        await page.locator('button[data-merge-to="9"]').click();
        await expect(common.modal).toContainText('Ben Done');
        await expect(common.modal).toContainText('Possible Cheater!');
        await expect(common.modal).toContainText('Previous cheating attempts: 0');
        await expect(common.modal.locator('[data-radio-option="warning"]')).toBeChecked();

        await common.modal.locator('button').getByText('Merge').click();
        await expect(common.alert).toContainText('The user has been merged.');
        await expect(common.body).toContainText('There is no data found');

        const mergedUser = await expectRecordToExist('users', { id: 9 }, { cheatingAttempts: 1 });
        expect(mergedUser.information).toContain('Paul Pusher');
        expect(mergedUser.information).toContain('Ben Done');
        expect(mergedUser.information).toContain('player1@gmail.com');
        expect(mergedUser.information).toContain('1234567890');
        expect(mergedUser.information).toContain('2000-01-01');

        const email = await expectRecordToExist('emails', {
            subject: '‼️ Action Required: Duplicate Account Detected',
        });
        expect(email.recipientEmail).toBe('player1@gmail.com,player9@gmail.com');
        expect(email.html).toContain('under the email <b>player9@gmail.com</b>');
        expect(email.html).toContain('permanent ban');
    });

    test('Merge users based on email', async ({ page, common, login }) => {
        const info = JSON.stringify({
            history: { email: [{ value: 'player1@gmail.com', date: '2020-11-11 00:00:00' }] },
        });
        await runQuery(`UPDATE users SET information='${info}' WHERE id=9`);

        await login.loginAsAdmin();
        await page.goto('/admin/merge');
        await expect(common.body).toContainText('email');
        await expect(page.locator('[data-possible-cheater="1"]')).toBeVisible();

        await page.locator('button[data-merge-to="1"]').click();
        await expect(common.modal).toContainText('Ben Done');
        await expect(common.modal).toContainText('Possible Cheater!');
        await expect(common.modal).toContainText('Previous cheating attempts: 0');
        await expect(common.modal.locator('[data-radio-option="warning"]')).toBeChecked();

        await common.modal.locator('button').getByText('Merge').click();
        await expect(common.alert).toContainText('The user has been merged.');
        await expect(common.body).toContainText('There is no data found');

        const mergedUser = await expectRecordToExist('users', { id: 1 }, { cheatingAttempts: 1 });
        expect(mergedUser.information).toContain('Paul Pusher');
        expect(mergedUser.information).toContain('Doubles Player');
        expect(mergedUser.information).toContain('player9@gmail.com');
        expect(mergedUser.information).toContain('player1@gmail.com');
        expect(mergedUser.information).toContain('9203919533');
        expect(mergedUser.information).toContain('2000-01-09');

        const email = await expectRecordToExist('emails', {
            subject: '‼️ Action Required: Duplicate Account Detected',
        });
        expect(email.recipientEmail).toBe('player1@gmail.com,player9@gmail.com');
        expect(email.html).toContain('under the email <b>player1@gmail.com</b>');
        expect(email.html).toContain('permanent ban');
    });

    test('Merge users based on cookie', async ({ page, common, login }) => {
        await login.loginAsPlayer8();
        const fingerprint8 = await expectRecordToExist('fingerprints', { userId: 8 });
        const identification8 = await expectRecordToExist('identifications', { userId: 8 });

        // just to have different updatedAt
        await page.waitForTimeout(1000);

        await login.loginAsPlayer9();
        const fingerprint9 = await expectRecordToExist('fingerprints', { userId: 9 });
        const identification9 = await expectRecordToExist('identifications', { userId: 9 });

        expect(fingerprint8.whole).toBe(fingerprint9.whole);
        expect(fingerprint8.updatedAt).not.toBe(fingerprint9.updatedAt);

        expect(identification8.code).toBe(identification9.code);
        expect(identification8.updatedAt).not.toBe(identification9.updatedAt);

        await login.loginAsAdmin();
        await page.goto('/admin/merge');
        await expect(common.body).toContainText('cookie');

        await page.locator('button[data-merge-to="8"]').click();
        await expect(common.modal).toContainText('Not Played User');
        await expect(common.modal).toContainText('Previous cheating attempts: 0');
        await expect(common.modal).not.toContainText('Possible Cheater');
        await expect(common.modal.locator('[data-radio-option="info"]')).toBeChecked();

        await common.modal.locator('button').getByText('Merge').click();
        await expect(common.alert).toContainText('The user has been merged.');
        await expect(common.body).not.toContainText('player8@gmail.com');

        await expectNumRecords('fingerprints', { userId: 8 }, 1);
        await expectNumRecords('identifications', { userId: 8 }, 1);

        await expectRecordToExist('fingerprints', { userId: 8, updatedAt: fingerprint9.updatedAt });
        await expectRecordToExist('identifications', { userId: 8, updatedAt: identification9.updatedAt });

        const email = await expectRecordToExist('emails', { subject: 'Merging Your Accounts' });
        expect(email.recipientEmail).toBe('player8@gmail.com,player9@gmail.com');
        expect(email.html).toContain('under the email <b>player8@gmail.com</b>');
        expect(email.html).not.toContain('permanent ban');
    });

    test('Merge users based on name and having prev cheating attempts', async ({ page, common, login }) => {
        await runQuery(`UPDATE users SET firstName="Ben", lastName="Done", cheatingAttempts=1 WHERE id=9`);

        await login.loginAsAdmin();
        await page.goto('/admin/merge');

        await page.locator('button[data-merge-to="9"]').click();
        await expect(common.modal).toContainText('Previous cheating attempts: 1');
        await expect(common.modal.locator('[data-radio-option="warning"]')).toBeChecked();

        await common.modal.locator('button').getByText('Merge').click();
        await expect(common.alert).toContainText('The user has been merged.');
        await expect(common.body).toContainText('There is no data found');

        await expectRecordToExist('users', { id: 9 }, { cheatingAttempts: 2 });

        const email = await expectRecordToExist('emails', {
            subject: '‼️ Action Required: Duplicate Account Detected',
        });
        expect(email.recipientEmail).toBe('player1@gmail.com,player9@gmail.com');
        expect(email.html).toContain('under the email <b>player9@gmail.com</b>');
        expect(email.html).toContain('permanent ban');
    });

    test('Increase cheating attempts', async ({ page, common, login }) => {
        await runQuery(`UPDATE users SET firstName="Ben", lastName="Done", cheatingAttempts=1 WHERE id=9`);

        await login.loginAsAdmin();
        await page.goto('/admin/merge');

        await page.locator('button[data-merge-to="1"]').click();
        await expect(common.modal).toContainText('Previous cheating attempts: 1');
        await expect(common.modal.locator('[data-radio-option="warning"]')).toBeChecked();

        await common.modal.locator('button').getByText('Merge').click();
        await expect(common.alert).toContainText('The user has been merged.');
        await expect(common.body).toContainText('There is no data found');

        await expectRecordToExist('users', { id: 1 }, { cheatingAttempts: 2 });

        const email = await expectRecordToExist('emails', {
            subject: '‼️ Action Required: Duplicate Account Detected',
        });
        expect(email.recipientEmail).toBe('player1@gmail.com,player9@gmail.com');
        expect(email.html).toContain('under the email <b>player1@gmail.com</b>');
        expect(email.html).toContain('permanent ban');
    });

    test('Use sum of prev cheating attempts as a new value', async ({ page, common, login }) => {
        await runQuery(`UPDATE users SET cheatingAttempts=1 WHERE id=1`);
        await runQuery(`UPDATE users SET firstName="Ben", lastName="Done", cheatingAttempts=2 WHERE id=9`);

        await login.loginAsAdmin();
        await page.goto('/admin/merge');

        await page.locator('button[data-merge-to="1"]').click();
        await expect(common.modal).toContainText('Previous cheating attempts: 3');
        await expect(common.modal.locator('[data-radio-option="warning"]')).toBeChecked();
        await common.modal.locator('[data-radio-option="nothing"]').click();

        await common.modal.locator('button').getByText('Merge').click();
        await expect(common.alert).toContainText('The user has been merged.');
        await expect(common.body).toContainText('There is no data found');

        await expectRecordToExist('users', { id: 1 }, { cheatingAttempts: 3 });
    });

    test('Can ignore some duplicated users', async ({ page, common, login }) => {
        await runQuery(`UPDATE users SET firstName="Ben", lastName="Done" WHERE id=9`);

        await login.loginAsAdmin();
        await page.goto('/admin/merge');

        await page.locator('button').getByText('Ignore these users').click();
        await expect(common.modal).toContainText('Are you sure?');
        await common.modal.locator('button').getByText('Yes').click();
        await expect(common.body).toContainText('There is no data found');

        await page.locator('a').getByText('Ignored').click();
        await expect(common.body).toContainText('player9@gmail.com');

        await expectRecordToExist('actions', { name: 'ignoreDuplicates' }, { payload: '[1,9]' });
    });

    test('Check that current ladder is disabled', async ({ page, common, login }) => {
        const dateTwoDaysAgo = dayjs.tz().subtract(2, 'day').format('YYYY-MM-DD HH:mm:ss');
        await runQuery(`UPDATE seasons SET endDate="${dateTwoDaysAgo}" WHERE id=1`);
        await runQuery(`UPDATE users SET firstName="Matthew", lastName="Burt" WHERE id=9`);
        await runQuery(`INSERT INTO players SET userId=9, tournamentId=7`);

        await login.loginAsAdmin();
        await page.goto('/admin/merge');

        await expect(common.body.locator('[data-possible-cheater="9"]')).toBeVisible();
        await page.locator('button[data-merge-to="9"]').click();
        await expect(common.modal.locator('[data-radio-option="warning"]')).toBeChecked();

        await common.modal.locator('button').getByText('Merge').click();
        await expect(common.alert).toContainText('The user has been merged.');

        await expectRecordToExist('players', { userId: 9, tournamentId: 7 }, { isActive: 0 });
    });

    test('Do not disable current ladder if chosen', async ({ page, common, login }) => {
        const dateTwoDaysAgo = dayjs.tz().subtract(2, 'day').format('YYYY-MM-DD HH:mm:ss');
        await runQuery(`UPDATE seasons SET endDate="${dateTwoDaysAgo}" WHERE id=1`);
        await runQuery(`UPDATE users SET firstName="Matthew", lastName="Burt" WHERE id=9`);
        await runQuery(`INSERT INTO players SET userId=9, tournamentId=7`);

        await login.loginAsAdmin();
        await page.goto('/admin/merge');

        await expect(common.body.locator('[data-possible-cheater="9"]')).toBeVisible();
        await page.locator('button[data-merge-to="9"]').click();
        await expect(common.modal.locator('[data-radio-option="warning"]')).toBeChecked();
        await common.modal.locator('[data-radio-option="nothing"]').click();

        await common.modal.locator('button').getByText('Merge').click();
        await expect(common.alert).toContainText('The user has been merged.');

        await expectRecordToExist('players', { userId: 9, tournamentId: 7 }, { isActive: 1 });
    });
})();
