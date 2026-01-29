import { test, expect } from './base';
import {
    restoreDb,
    expectRecordToExist,
    getRecord,
    getNumRecords,
    runQuery,
    overrideConfig,
} from '@rival/ladder.backend/src/db/helpers';

import dayjs from '@rival/dayjs';

test.beforeEach(async ({ page }) => {
    restoreDb();
});

// Overview
(() => {
    test('Should see links on overview page', async ({ page, common, login, overview }) => {
        await login.loginAsPlayer2();
        await page.goto('/season/2021/spring/men-40-dbls');

        await expect(overview.tournamentNavbarArea).toContainText('Overview');
        await expect(overview.tournamentNavbarArea).toContainText('Matches');
        await expect(overview.tournamentNavbarArea).toContainText('Proposals');
    });
})();

// Proposals
(() => {
    test('Should see contact information of the proposed players', async ({ page, common, login }) => {
        await login.loginAsPlayer9();

        await page.goto('/player/ben-done');
        await expect(common.body).toContainText('player1@gmail.com');
        await expect(common.body).toContainText('123-456-7890');

        await page.goto('/player/gary-mill');
        await expect(common.body).toContainText('p******@*****.com');
        await expect(common.body).toContainText('XXX-XXX-XXXX');
    });

    test('Should see the validation error while creating proposal', async ({ page, common, login, overview }) => {
        await login.loginAsPlayer2();
        await page.goto('/season/2021/spring/men-40-dbls');

        await overview.proposeMatchButton.click();
        await common.modal.locator('button').getByText('Propose match').click();

        await expect(common.modal).toContainText('Location is required');
    });

    test('Should not see the proposal with avoided player', async ({ page, common, login }) => {
        await runQuery(`INSERT INTO userrelations (userId, opponentId, avoid, note) VALUES (2, 5, 1, 'Something')`);

        await login.loginAsPlayer2();
        await page.goto('/season/2021/spring/men-40-dbls');

        await expect(common.body).toContainText('Open Proposals');
        await expect(page.locator('[data-proposal]').getByText('Hamiltonbeach')).toBeHidden();

        await page.locator('a').getByText('Proposals').click();
        await expect(common.body).toContainText('Propose match');
        await expect(page.locator('[data-proposal="51"]')).toBeHidden();
        await expect(page.locator('[data-proposal="52"]')).toBeVisible();
    });

    test('Should see the proposal with avoided player if the user is part of proposal', async ({
        page,
        common,
        login,
    }) => {
        await runQuery(`INSERT INTO userrelations (userId, opponentId, avoid, note) VALUES (1, 5, 1, 'Something')`);

        await login.loginAsPlayer1();
        await page.goto('/season/2021/spring/men-40-dbls');

        await expect(common.body).toContainText('Open Proposals');
        await expect(page.locator('[data-proposal="51"]')).toBeVisible();

        await page.locator('a').getByText('Proposals').click();
        await expect(common.body).toContainText('Propose match');
        await expect(page.locator('[data-proposal="51"]')).toBeVisible();
        await expect(page.locator('[data-proposal="52"]')).toBeVisible();
    });

    test('Should see the message about the night match', async ({ page, common, login, overview, proposal }) => {
        await login.loginAsPlayer2();
        await page.goto('/season/2021/spring/men-40-dbls');

        await overview.proposeMatchButton.click();
        await proposal.dateField.click();
        await proposal.sundayNextWeek.click();
        await page.locator('button').getByText('PM').click();
        await proposal.closeTimePicker();
        await common.modal.locator('button').getByText('Propose match').click();

        await expect(common.confirmation).toContainText('at night.');
        await expect(common.confirmation).toContainText('5:00 AM');
        await common.confirmation.locator('button').getByText('Cancel').click();

        // wait for animation is gone
        await new Promise((resolve) => setTimeout(resolve, 1000));

        await common.modal.locator('button').getByText('Propose match').click();
        await common.confirmation.locator('button').getByText('Yes').click();
        await expect(common.modal).toContainText('Location is required');

        await proposal.placeField.fill('Bond park');
        await common.modal.locator('button').getByText('Propose match').click();
        await expect(common.alert).toContainText('has been added');
    });

    test('Should create a proposal with just one player', async ({ page, common, login, overview, proposal }) => {
        await login.loginAsPlayer2();
        await page.goto('/season/2021/spring/men-40-dbls');

        await overview.proposeMatchButton.click();
        await proposal.pickSundayNextWeek();
        await proposal.placeField.fill('Bond park');

        await expect(common.modal).not.toContainText('multiple ladders');
        await common.modal.locator('button').getByText('Propose match').click();

        await expect(common.alert).toContainText('has been added');

        const row = await expectRecordToExist('matches', { place: 'Bond park' });
        await expect(page.locator(`[data-proposal="${row.id}"]`)).toContainText('Gary M.');
    });

    test('Should create a proposal with two players', async ({ page, common, login, overview, proposal }) => {
        await runQuery(`UPDATE users SET subscribeForProposals=0 WHERE id=9`);

        await login.loginAsPlayer2();
        await page.goto('/season/2021/spring/men-40-dbls');

        await overview.proposeMatchButton.click();
        await proposal.pickSundayNextWeek();
        await proposal.placeField.fill('Bond park');
        await proposal.commentField.fill('Flexible on location');

        await proposal.pickAcceptor2('Doubles Player');
        await common.modal.locator('button').getByText('Propose match').click();
        await expect(common.alert).toContainText('has been added');

        const row = await expectRecordToExist('matches', { place: 'Bond park' });
        await expect(page.locator(`[data-proposal="${row.id}"]`)).toContainText('Gary M.');
        await expect(page.locator(`[data-proposal="${row.id}"]`)).toContainText('Doubles P.');

        await new Promise((resolve) => setTimeout(resolve, 500)); // to save emails in DB
        expect(await getNumRecords('emails')).toBe(1);

        const emailSent = await getRecord('emails');
        expect(emailSent.to).toContain('player1@gmail.com');
        expect(emailSent.to).not.toContain('player3@gmail.com');
        expect(emailSent.to).not.toContain('player9@gmail.com');
        expect(emailSent.subject).toContain('Gary Mill proposed a new match');
        expect(emailSent.subject).toContain('5:00 PM');
        expect(emailSent.html).toContain('Raleigh, Men Doubles, Bond park');
        expect(emailSent.html).toContain('Men Doubles');
        expect(emailSent.html).toContain('5:00 PM');
        expect(emailSent.html).toContain('Gary Mill');
        expect(emailSent.html).toContain('Bond park');
        expect(emailSent.html).toContain('Flexible on location');
        expect(emailSent.html).toContain('Team 1');
        expect(emailSent.html).toContain('Doubles Player');

        const [proposalUrl] = emailSent.html.match(/\/season\/[\w/-]+/);

        await page.goto(proposalUrl);
        await expect(common.body).toContainText('2021 Spring');
        await expect(common.body).toContainText('Men Doubles');
        await expect(common.body).toContainText('Ongoing season');
        await expect(common.body).toContainText('Flexible on location');
    });

    test('Should create a proposal with four players and set up the match immediately', async ({
        page,
        common,
        login,
        overview,
        proposal,
    }) => {
        await login.loginAsPlayer2();
        await page.goto('/season/2021/spring/men-40-dbls');

        await overview.proposeMatchButton.click();
        await proposal.pickSundayNextWeek();
        await proposal.placeField.fill('Bond park');

        {
            await expect(proposal.challenger2Select).not.toContainText('Inactive');
            await proposal.pickChallenger2('Doubles Player');
        }
        {
            await expect(proposal.acceptorSelect).not.toContainText('Inactive');
            await proposal.pickAcceptor('Ben Done');
        }
        {
            await proposal.pickAcceptor2('Cristopher Hamiltonbeach');
        }

        await common.modal.locator('button').getByText('Propose match').click();
        await expect(common.alert).toContainText('has been added');

        await expect(overview.openProposalsArea).not.toContainText('Bond park');

        const row = await expectRecordToExist('matches', { place: 'Bond park' });

        const Match = page.locator(`[data-match="${row.id}"]`);
        await expect(Match).toContainText('Ben D.');
        await expect(Match).toContainText('Cristopher H.');
        await expect(Match).toContainText('Gary M.');

        await new Promise((resolve) => setTimeout(resolve, 500)); // to save emails in DB
        expect(await getNumRecords('emails')).toBe(1);

        const emailSent = await getRecord('emails');
        expect(emailSent.subject).toContain('Your upcoming match on');
        expect(emailSent.html).toContain('Raleigh, Men Doubles, Bond park, Gary M./Doubles P. vs Ben D./Cristopher H.');
        expect(emailSent.html).toContain('Ben D.');
        expect(emailSent.html).toContain('Cristopher H.');
        expect(emailSent.html).toContain('Doubles P.');
        expect(emailSent.html).toContain('Gary M.');
        expect(emailSent.html).toContain('5:00 PM');
    });

    test('Should create a proposal with two players on proposals page', async ({ page, common, login, proposal }) => {
        await login.loginAsPlayer2();
        await page.goto('/season/2021/spring/men-40-dbls/proposals');

        await page.locator('button').getByText('Propose match').click();
        await expect(common.modal).toContainText('Gary M.');
        await proposal.pickSundayNextWeek();
        await proposal.placeField.fill('Bond park');

        await proposal.pickAcceptor2('Doubles Player');

        await common.modal.locator('button').getByText('Propose match').click();

        await expect(common.alert).toContainText('has been added');

        const row = await expectRecordToExist('matches', { place: 'Bond park' });
        await expect(page.locator(`[data-proposal="${row.id}"]`)).toContainText('Gary M.');
        await expect(page.locator(`[data-proposal="${row.id}"]`)).toContainText('Doubles P.');
    });

    test('Should partially accept proposal', async ({ page, common, login }) => {
        await login.loginAsPlayer2();
        await page.goto('/season/2021/spring/men-40-dbls');

        const Proposal = page.locator(`[data-proposal="50"]`);
        await Proposal.locator('button').getByText('Accept').click();
        await expect(common.modal).toContainText('Pick this slot');
        await page.locator('button[data-pick-slot="challenger2Id"]').click();
        await page.locator('[data-free-slot="challenger2Id"]').click();
        await page.locator('button[data-pick-slot="acceptor2Id"]').click();
        await expect(common.modal).toContainText('Gary M.');
        await expect(page.locator('button').getByText('Pick this slot')).toBeHidden();
        await page.locator('button').getByText('Accept proposal').click();
        await expect(common.alert).toContainText('has been accepted');

        await expect(Proposal).toBeVisible();
        await expect(Proposal).toContainText('Gary M.');
        await expect(Proposal).toContainText('Unaccept');
    });

    test('Should partially accept proposal with another player', async ({ page, common, login, proposal }) => {
        await login.loginAsPlayer2();
        await page.goto('/season/2021/spring/men-40-dbls');

        const Proposal = page.locator(`[data-proposal="50"]`);
        await Proposal.locator('button').getByText('Accept').click();
        await page.locator('button[data-pick-slot="challenger2Id"]').click();

        await proposal.acceptAcceptor('Cristopher Hamiltonbeach');

        await page.locator('button').getByText('Accept proposal').click();
        await expect(common.alert).toContainText('has been accepted');

        await expect(Proposal).toBeVisible();
        await expect(Proposal).toContainText('Ben D.');
        await expect(Proposal).toContainText('Gary M.');
        await expect(Proposal).toContainText('Cristopher H.');
        await expect(Proposal).toContainText('Unaccept');
    });

    test('Should see an error about taken slots', async ({ page, common, login }) => {
        await login.loginAsPlayer2();
        await page.goto('/season/2021/spring/men-40-dbls');

        const Proposal = page.locator(`[data-proposal="50"]`);
        await Proposal.locator('button').getByText('Accept').click();
        await page.locator('button[data-pick-slot="challenger2Id"]').click();

        await runQuery(`UPDATE matches SET challenger2Id=14 WHERE id=50`);

        await page.locator('button').getByText('Accept proposal').click();
        await expect(common.alert).toContainText('Open slots are already taken.');
    });

    test('Should fully accept proposal', async ({ page, common, login, overview }) => {
        await login.loginAsPlayer2();
        await page.goto('/season/2021/spring/men-40-dbls');

        const Proposal = page.locator(`[data-proposal="51"]`);
        await Proposal.locator('button').getByText('Accept').click();
        await expect(common.modal).toContainText('Gary M.');
        await page.locator('button').getByText('Accept proposal').click();
        await expect(common.alert).toContainText('has been accepted');

        await expect(Proposal).toBeHidden();
        expect(await overview.upcomingMatchesArea.locator('[data-match]').count()).toBe(2);

        // Check that an email is sent
        await new Promise((resolve) => setTimeout(resolve, 500));
        const emailSent = await getRecord('emails');
        expect(emailSent.subject).toContain('Your upcoming match on');
        expect(emailSent.html).toContain('Raleigh, Men Doubles, Pullen, Ben D./Cristopher H. vs Matthew B./Gary M.');
        expect(emailSent.html).toContain('Ben D.');
        expect(emailSent.html).toContain('Cristopher H.');
        expect(emailSent.html).toContain('Matthew B.');
        expect(emailSent.html).toContain('Gary M.');
        expect(emailSent.html).toContain('Men Doubles');
        expect(emailSent.html).toContain('Pullen');
    });

    test('Should unaccept not fully accepted proposal', async ({ page, common, login }) => {
        await login.loginAsPlayer2();
        await page.goto('/season/2021/spring/men-40-dbls');

        const Proposal = page.locator(`[data-proposal="50"]`);
        await Proposal.locator('button').getByText('Accept').click();
        await page.locator('button[data-pick-slot="acceptor2Id"]').click();
        await page.locator('button').getByText('Accept proposal').click();
        await expect(common.alert).toContainText('has been accepted');

        await Proposal.locator('button').getByText('Unaccept').click();
        await page.locator('input[name="reason"]').fill('I am sick');
        await common.modal.locator('button').getByText('Unaccept proposal').click();
        await expect(common.alert).toContainText('has been unaccepted');

        await expect(Proposal).not.toContainText('Mill');

        // Check that email is not sent
        await new Promise((resolve) => setTimeout(resolve, 500));
        expect(await getNumRecords('emails')).toBe(0);
    });

    test('Should unaccept proposal from upcoming matches', async ({ page, common, login, overview }) => {
        await login.loginAsPlayer2();
        await page.goto('/season/2021/spring/men-40-dbls');

        await overview.upcomingMatchesArea.locator('[data-match-actions="52"]').click();
        await expect(common.tooltip).toContainText('Match details');
        await expect(common.tooltip).toContainText('Kentwood');
        await common.tooltip.locator('button').getByText('Unaccept proposal').click();

        await page.locator('input[name="reason"]').fill('I am sick');
        await common.modal.locator('button').getByText('Unaccept proposal').click();
        await expect(common.alert).toContainText('has been unaccepted');

        await expect(page.locator('[data-match-actions="52"]')).toBeHidden();

        const Proposal = page.locator('[data-proposal="52"]');
        await expect(Proposal).toContainText('Kentwood');
        await expect(Proposal).not.toContainText('Mill');

        // Check that an email is sent
        const emailSent = await expectRecordToExist('emails', {
            recipientEmail: 'player1@gmail.com,player3@gmail.com,player4@gmail.com',
        });
        expect(emailSent.subject).toContain('Gary Mill unaccepted the proposal for');
        expect(emailSent.html).toContain('Raleigh, Men Doubles, Reason: I am sick');
        expect(emailSent.html).toContain('Gary Mill');
        expect(emailSent.html).toContain('I am sick.');
        expect(emailSent.html).toContain('player2@gmail.com');
        expect(emailSent.html).toContain('760-727-3334');
        expect(emailSent.html).toContain('sms:7607273334');
    });

    test('Should delete proposal with only me as a challenger', async ({ page, common, login }) => {
        await login.loginAsPlayer1();
        await page.goto('/season/2021/spring/men-40-dbls');

        const Proposal = page.locator(`[data-proposal="50"]`);
        await Proposal.locator('button').getByText('Delete').click();
        await expect(common.modal).toContainText('Please confirm');
        await common.modal.locator('button').getByText('Delete').click();
        await expect(common.alert).toContainText('has been deleted');
        await expect(Proposal).toBeHidden();

        // Check that we are not sending any messages
        expect(await getNumRecords('emails')).toBe(0);
    });

    test('Should delete partially accepted proposal with me as a challenger', async ({ page, common, login }) => {
        await login.loginAsPlayer1();
        await page.goto('/season/2021/spring/men-40-dbls');

        const Proposal = page.locator(`[data-proposal="51"]`);
        await Proposal.locator('button').getByText('Delete').click();

        await expect(common.modal).toContainText(
            'Cristopher Hamiltonbeach and Matthew Burt already accepted your proposal.'
        );
        await page.locator('input[name="reason"]').fill('I am sick');
        await common.modal.locator('button').getByText('Delete proposal').click();
        await expect(common.alert).toContainText('has been deleted');
    });

    test('Should delete proposal from upcoming matches', async ({ page, common, login }) => {
        await login.loginAsPlayer1();
        await page.goto('/season/2021/spring/men-40-dbls');

        await page.locator('[data-match-actions="52"]').first().click();
        await expect(common.tooltip).toContainText('Match details');
        await expect(common.tooltip).toContainText('Kentwood');
        await common.tooltip.locator('button').getByText('Delete proposal').click();

        await expect(common.modal).toContainText(
            'Cristopher Hamiltonbeach, Matthew Burt, and Gary Mill already accepted your proposal.'
        );
        await page.locator('input[name="reason"]').fill('I am sick');
        await common.modal.locator('button').getByText('Delete proposal').click();
        await expect(common.alert).toContainText('has been deleted');

        await expect(page.locator('[data-match-actions="52"]')).toBeHidden();

        // Check that an email is sent
        const emailSent = await expectRecordToExist('emails', {
            recipientEmail: 'player2@gmail.com,player3@gmail.com,player4@gmail.com',
        });
        expect(emailSent.subject).toContain('Ben Done deleted the proposal for');
        expect(emailSent.html).toContain('Raleigh, Men Doubles, Reason: I am sick');
        expect(emailSent.html).toContain('Ben Done');
        expect(emailSent.html).toContain('I am sick.');
        expect(emailSent.html).toContain('player1@gmail.com');
        expect(emailSent.html).toContain('123-456-7890');
        expect(emailSent.html).toContain('sms:1234567890');
    });
})();

// Friendly proposals
(() => {
    const dateTwoDaysAgo = dayjs.tz().subtract(2, 'day').format('YYYY-MM-DD HH:mm:ss');

    test('Should create friendly proposal', async ({ page, common, login, proposal, overview }) => {
        await runQuery(`UPDATE seasons SET endDate="${dateTwoDaysAgo}" WHERE id=1`);

        await login.loginAsPlayer1();
        await page.goto('/season/2021/spring/men-40-dbls');
        await overview.proposeFriendlyMatchButton.click();
        await proposal.pickSundayNextWeek();
        await proposal.placeField.fill('Bond park');

        await proposal.pickAcceptor2('Doubles Player');

        await common.modal.locator('button').getByText('Propose match').click();
        await expect(common.alert).toContainText('has been added');

        await new Promise((resolve) => setTimeout(resolve, 500)); // to save emails in DB
        expect(await getNumRecords('emails')).toBe(1);

        const emailSent = await getRecord('emails');
        expect(emailSent.recipientEmail).toContain('player2@gmail.com');
        expect(emailSent.subject).toContain('Ben Done proposed a new friendly match');
        expect(emailSent.subject).toContain('5:00 PM');
        expect(emailSent.html).toContain('friendly match');
        expect(emailSent.html).toContain('Raleigh, Men Doubles, Bond park');
        expect(emailSent.html).toContain('Men Doubles');
        expect(emailSent.html).toContain('5:00 PM');
        expect(emailSent.html).toContain('Ben Done');
        expect(emailSent.html).toContain('Bond park');
        expect(emailSent.html).toContain('Team 1');
        expect(emailSent.html).toContain('Doubles Player');

        const row = await expectRecordToExist('matches', { place: 'Bond park' });
        const Proposal = page.locator(`[data-proposal="${row.id}"]`);
        await expect(Proposal).toContainText('Ben D.');
        await expect(Proposal).toContainText('Doubles P.');
        await expect(Proposal).toContainText('5:00 PM');
        await expect(Proposal).toContainText('Delete');
        await expect(Proposal).not.toContainText('Accept');

        // Delete my proposal
        await Proposal.locator('button').getByText('Delete').click();
        await expect(common.modal).toContainText('Doubles Player already accepted your proposal.');
        await page.locator('input[name="reason"]').fill('I am sick');
        await common.modal.locator('button').getByText('Delete').click();
        await expect(common.alert).toContainText('has been deleted');
        await expect(Proposal).toBeHidden();
    });

    test('Should accept friendly proposal', async ({ page, common, login }) => {
        await runQuery(`UPDATE seasons SET endDate="${dateTwoDaysAgo}" WHERE id=1`);

        await login.loginAsPlayer2();
        await page.goto('/season/2021/spring/men-40-dbls');
        const Proposal = page.locator('[data-proposal="51"]');

        await Proposal.locator('button').getByText('Accept').click();
        await common.modal.locator('button').getByText('Accept').click();
        await expect(common.alert).toContainText('has been accepted');
        await expect(Proposal).toBeHidden();

        // Check that email is sent
        await new Promise((resolve) => setTimeout(resolve, 500));
        const emailSent = await getRecord('emails');
        expect(emailSent.subject).toContain('Your upcoming match');
        expect(emailSent.html).toContain('Four players agreed to play the match in Men Doubles');
        expect(emailSent.html).toContain('Pullen');
    });
})();

// Matches
(() => {
    test('Should report a match', async ({ page, common, login, match, overview }) => {
        await login.loginAsPlayer2();
        await page.goto('/season/2021/spring/men-40-dbls');
        await overview.upcomingMatchesArea.locator('a').getByText('Score').click();

        await match.pickChallengerPoints(3);
        await new Promise((resolve) => setTimeout(resolve, 1000));

        await match.pickChallengerPoints(2);

        await expect(common.modal).toContainText('+24');
        await expect(common.modal).toContainText('+9');
        await common.modal.locator('button').getByText('Report match').click();
        await expect(common.alert).toContainText('has been reported');

        await expect(common.body).toContainText('+24');
        await expect(common.body).toContainText('+9');
        await expectRecordToExist('matches', { id: 52 }, { score: '3-6 2-6' });
    });

    test('Should report a default match', async ({ page, common, login, match, overview }) => {
        await login.loginAsPlayer2();
        await page.goto('/season/2021/spring/men-40-dbls');
        await overview.upcomingMatchesArea.locator('a').getByText('Score').click();

        await match.pickChallengerPoints(3);
        await new Promise((resolve) => setTimeout(resolve, 1000));

        await match.pickChallengerPoints(3);
        await match.pickMatchResult('Player defaulted');

        await expect(common.modal).toContainText('+0');
        await expect(common.modal).toContainText('+20');
        await common.modal.locator('button').getByText('Report match').click();

        await expect(common.body).toContainText('+0');
        await expect(common.body).toContainText('+20');
        await expectRecordToExist(
            'matches',
            { id: 52 },
            {
                score: '0-6 0-6',
                wonByDefault: 1,
                challengerPoints: 0,
                acceptorPoints: 20,
                challenger2Points: 0,
                acceptor2Points: 20,
                challengerEloChange: null,
                acceptorEloChange: null,
                challenger2EloChange: null,
                acceptor2EloChange: null,
            }
        );
    });

    test('Should report a match from scratch', async ({ page, common, login, match, proposal }) => {
        await login.loginAsPlayer2();
        await page.goto('/season/2021/spring/men-40-dbls');

        await page.locator('button').getByText('Report').click();
        await expect(common.modal).toContainText('Mill');

        await expect(proposal.challenger2Select).not.toContainText('Inactive');

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
        await expect(Match).toContainText('Gary M.');
        await expect(Match).toContainText('Cristopher H.');
        await expect(Match).toContainText('Ben D.');
        await expect(Match).toContainText('Matthew B.');

        await expectRecordToExist('matches', { score: '6-1 6-0' });
    });

    test('Should report a match from scratch on matches page', async ({ page, common, login, proposal, match }) => {
        await login.loginAsPlayer2();
        await page.goto('/season/2021/spring/men-40-dbls/matches');

        await page.locator('button').getByText('Report match').click();
        await expect(common.modal).toContainText('Mill');

        await expect(proposal.challenger2Select).not.toContainText('Inactive');

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
        await expect(Match).toContainText('Gary M.');
        await expect(Match).toContainText('Cristopher H.');
        await expect(Match).toContainText('Ben D.');
        await expect(Match).toContainText('Matthew B.');

        await expectRecordToExist('matches', { score: '6-1 6-0' });
    });

    test('Should show disabled next button if there is no myself in the match', async ({
        page,
        common,
        login,
        proposal,
    }) => {
        await login.loginAsPlayer2();
        await page.goto('/season/2021/spring/men-40-dbls');

        await page.locator('button').getByText('Report').click();
        await page.locator('[data-remove-player="challengerId"]').click();

        await proposal.pickChallenger('Ben Done');
        await proposal.pickChallenger2('Doubles Player');
        await proposal.pickAcceptor('Cristopher Hamiltonbeach');
        await proposal.pickAcceptor2('Matthew Burt');

        await expect(page.locator('button').getByText('Next')).toBeDisabled();
    });

    test('Should edit a match', async ({ page, common, login, match }) => {
        await login.loginAsPlayer2();
        await page.goto('/season/2021/spring/men-40-dbls');

        await page.locator('[data-match-actions="60"]').click();
        await common.tooltip.locator('button').getByText('Edit').click();

        await match.pickAcceptorPoints(1);
        await new Promise((resolve) => setTimeout(resolve, 1000));
        await common.modal.locator('button').getByText('Report match').click();

        await expect(common.body).toContainText('+26');
        await expect(common.body).toContainText('+8');
        await expectRecordToExist('matches', { id: 60 }, { score: '6-1 7-5' });
    });

    test('Should delete a match', async ({ page, common, login }) => {
        await login.loginAsPlayer2();
        await page.goto('/season/2021/spring/men-40-dbls');

        await page.locator('[data-match-actions="60"]').click();
        await common.tooltip.locator('button').getByText('Delete').click();

        await page.locator('input[name="reason"]').fill('I am sick');
        await common.modal.locator('button').getByText('Delete match').click();

        await expect(common.alert).toContainText('The match has been deleted');
        await expect(common.body).not.toContainText('+21');
        await expect(page.locator('[data-match="60"]')).toBeHidden();

        const emailSent = await expectRecordToExist('emails', { subject: 'Gary Mill Deleted Your Match' });
        expect(emailSent.recipientEmail).toBe('player1@gmail.com,player3@gmail.com,player4@gmail.com');
        expect(emailSent.replyTo).toContain('Gary Mill');
        expect(emailSent.replyTo).toContain('player2@gmail.com');
        expect(emailSent.html).toContain('Gary Mill</a></b> deleted your match for ');
        expect(emailSent.html).toContain('I am sick');
        expect(emailSent.html).toContain('player2@gmail.com');
        expect(emailSent.html).toContain('760-727-3334');
        expect(emailSent.html).toContain('sms:7607273334');
    });
})();

// Final tournament
(() => {
    test('Should change readyForFinal status', async ({ page, common, login }) => {
        const dateOneWeekAgo = dayjs.tz().add(5, 'day').format('YYYY-MM-DD HH:mm:ss');
        await runQuery(`UPDATE seasons SET endDate="${dateOneWeekAgo}" WHERE id=1`);
        await overrideConfig({ minMatchesToPlanTournament: 0 });
        await runQuery(`UPDATE players SET readyForFinal=1 WHERE id=2`);

        await login.loginAsPlayer1();
        await page.goto('/season/2021/spring/men-40-dbls');
        await expect(common.body).toContainText('Are you available to play?');
        await expect(common.body).toContainText('next week');
        await expect(common.body).not.toContainText('The Top 8 players');
        await page.locator('a').getByText('Tournament information').click();
        await expect(common.modal).toContainText('The Top 4 players who sign up');
        await expect(common.modal).not.toContainText('$sunday1');
        await expect(common.modal).toContainText('The match will have three');

        await page.locator('.btn-close').click();
        await new Promise((resolve) => setTimeout(resolve, 500));

        await page.locator('button').getByText('I am going').click();
        await expect(common.body).toContainText('You are registered for the tournament');
        await expect(page.locator('[data-final-available="11"]')).toBeVisible();
        await expect(common.body).toContainText('Tournament information');

        await page.locator('a').getByText('Changed your mind?').click();
        await page.locator('button').getByText('I will skip').click();
        await expect(common.body).toContainText(`You've decided to skip the tournament`);
        await expect(page.locator('[data-final-available="11"]')).toBeHidden();

        await page.locator('a').getByText('Changed your mind?').click();
        await expect(common.body).toContainText('Are you available to play?');
    });
})();
