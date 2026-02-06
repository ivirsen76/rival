import { test, expect } from './base';
import {
    restoreDb,
    runQuery,
    getRecord,
    expectRecordToExist,
    expectNumRecords,
    overrideConfig,
} from '@rival/club.backend/src/db/helpers';
import dayjs from '@rival/club.backend/src/utils/dayjs';

test.beforeEach(async ({ page }) => {
    restoreDb();
});

test('Overview', async ({ page, common, login, overview }) => {
    await page.goto('/season/2021/spring/men-35');
    await expect(common.body).toContainText('2021 Spring');
    await expect(common.body).toContainText('Ongoing season');
    await expect(page.locator('a.active').getByText('Overview')).toBeVisible();
    await expect(page.locator('a.active').getByText('Live')).toBeVisible();
    await expect(page.locator('a.active').getByText('Today')).toBeVisible();
    await expect(page.locator('h3').getByText('Players')).toBeVisible();
    await expect(page.locator('h3').getByText('Open Proposals')).toBeVisible();
    await expect(page.locator('h3').getByText('Matches')).toBeVisible();
});

test.skip('Check today, yesterday and tomorrow matches', async ({ page, common, login, overview }) => {
    await page.goto('/season/2021/spring/men-35');
    await expect(common.body).toContainText('+23');

    await page.locator('a[data-tab-link="yesterday"]').click();
    await expect(common.body).toContainText('No matches yesterday.');

    await page.locator('a[data-tab-link="tomorrow"]').click();
    await expect(common.body).toContainText('No matches tomorrow.');
});

test('Check that we do not have yesterday link on the first day of the tournmanent', async ({
    page,
    common,
    login,
}) => {
    const midnight = dayjs.tz().hour(0).minute(0).second(0).format('YYYY-MM-DD HH:mm:ss');
    await runQuery(`UPDATE seasons SET startDate="${midnight}" WHERE id=1`);

    await page.goto('/season/2021/spring/men-35');
    await expect(page.locator('a').getByText('Yesterday')).toBeHidden();
});

test('Can see all levels even without players', async ({ page, common, login, overview }) => {
    await login.loginAsPlayer1();
    await page.goto('/');
    await expect(common.body).toContainText('Men 4.5');
});

test('Do not show inactive user matches', async ({ page, common, login, overview }) => {
    await login.loginAsPlayer1();
    await page.goto('/season/2021/spring/men-35');

    await expect(overview.upcomingMatchesArea).not.toContainText('Inactive');
    await expect(page.locator('[data-open-proposals]')).not.toContainText('Inactive');
    await expect(page.locator('[data-today-matches]')).not.toContainText('Inactive');
});

// Rules reminder
(() => {
    const reminderText = 'Reminders About Rival Rules';

    test('Should see reminder just for my tournament', async ({ page, common, login, overview }) => {
        await login.loginAsPlayer1();
        await page.goto('/season/2021/spring/men-35');
        await expect(common.body).toContainText(reminderText);

        await page.goto('/season/2021/spring/men-40');
        await expect(common.body).not.toContainText(reminderText);
    });

    test('Should dismiss reminder message', async ({ page, common, login, homepage }) => {
        await login.loginAsPlayer1();
        await page.goto('/season/2021/spring/men-35');
        await expect(common.body).toContainText(reminderText);

        await page.locator('button').getByText('Got it!').click();
        await expect(common.body).not.toContainText(reminderText);

        await new Promise((resolve) => setTimeout(resolve, 1000));

        await page.locator('[data-logo]').click();
        await homepage.checkVisible();

        await page.locator('[data-latest-level="men-35"]').click();
        await expect(page.locator('[data-player-list]')).toBeVisible();
        await expect(common.body).not.toContainText(reminderText);

        await page.goto('/season/2021/spring/men-35');
        await expect(page.locator('[data-player-list]')).toBeVisible();
        await expect(common.body).not.toContainText(reminderText);

        await expectRecordToExist('logs', { userId: 1, code: 'learnedTheRules' });
    });

    test('Should not see reminder message if played enough matches', async ({ page, common, login, overview }) => {
        await runQuery('UPDATE matches SET playedAt="2023-12-31 00:00:00" WHERE score IS NOT NULL');
        const [match] = await runQuery('SELECT * FROM matches WHERE challengerId=2 AND score IS NOT NULL LIMIT 0, 1');

        const MATCHES_TO_LEARN = 5;
        for (let i = 0; i < MATCHES_TO_LEARN; i++) {
            await runQuery(`INSERT INTO matches (initial, challengerId, acceptorId, winner, score, playedAt)
                        VALUES (1, ${match.challengerId}, ${match.acceptorId}, ${match.winner}, "${match.score}", "2024-01-05 00:00:00")`);
        }

        await login.loginAsPlayer1();
        await page.goto('/season/2021/spring/men-35');
        await expect(page.locator('[data-player-list]')).toBeVisible();
        await expect(common.body).not.toContainText(reminderText);
    });
})();

test('Should see JoinThisLadder link and redirect to registration form', async ({ page, common, overview, login }) => {
    await page.goto('/season/2021/spring/men-30');
    await expect(common.body).toContainText('Open Proposals');
    await expect(overview.joinThisLadderLink).toBeHidden();

    await login.loginAsPlayer1();
    await page.goto('/season/2021/spring/men-30');
    await overview.joinThisLadderLink.click();

    await expect(common.body).toContainText('Register for 2021 Spring Season');

    await page.evaluate(() => window.history.back());
    await expect(overview.joinThisLadderLink).toBeVisible();
});

test('Inactive user cannot see the actions', async ({ page, common, login, overview }) => {
    await login.loginAsPlayer5();
    await page.goto('/season/2021/spring/men-35');
    await expect(common.body).toContainText('Ongoing season');

    await expect(overview.otherActionsButton).toBeHidden();
});

test('Do not show stats when there are no matches', async ({ page, common, login, overview }) => {
    await page.goto('/season/2020/fall/men-30');
    await expect(common.body).toContainText('Players');
    await expect(common.body).not.toContainText('Most Matches');
    await expect(common.body).not.toContainText('Most Progress');
    await expect(common.body).not.toContainText('Biggest Wins');
});

test('Matches', async ({ page, common, login, overview }) => {
    await page.goto('/season/2021/spring/men-35/matches');
    await expect(page.locator('a.active').getByText('Matches')).toBeVisible();
    await expect(page.locator('h3').getByText('Matches')).toBeVisible();
    await expect(page.locator('h3').getByText('Filter')).toBeVisible();
    await expect(page.locator('h3').getByText('Players')).toBeVisible();
    await expect(page.locator('[data-points-calculation]').first()).toBeVisible();
});

// Proposals
(() => {
    test('Proposals', async ({ page, common, login, overview }) => {
        await page.goto('/season/2021/spring/men-35/proposals');
        await expect(page.locator('a.active').getByText('Proposals')).toBeVisible();
        await expect(page.locator('h3').getByText('Proposals')).toBeVisible();
        await expect(page.locator('h3').getByText('Filter')).toBeVisible();
        await expect(page.locator('h3').getByText('Players')).toBeVisible();
        await expect(page.locator('button').getByText('Propose match')).toBeHidden();
        await expect(page.locator('.badge-secondary')).toContainText('6');
    });

    test('Show available proposals', async ({ page, common, login, overview }) => {
        await page.goto('/season/2021/spring/men-35/proposals');
        await page.locator('button').getByText('Available').click();
        await expect(page.locator('.badge-secondary')).toContainText('3');
    });

    test('Do not include expired into available proposals', async ({ page, common, login, overview }) => {
        const dateTwoDaysAgo = dayjs.tz().subtract(2, 'day').format('YYYY-MM-DD HH:mm:ss');
        await runQuery(`UPDATE matches SET playedAt="${dateTwoDaysAgo}" WHERE initial=1`);

        await page.goto('/season/2021/spring/men-35/proposals');
        await page.locator('button').getByText('Available').click();
        await expect(page.locator('.badge-secondary')).toContainText('0');
    });
})();

test('Should see an error for wrong tournament', async ({ page, common, login, overview }) => {
    await page.goto('/season/2021/wrong/men-35');
    await expect(common.body).toContainText('Page Not Found');
});

test('Do not show actions for not my tournament', async ({ page, common, login, overview }) => {
    await login.loginAsAdmin();
    await page.goto('/season/2021/spring/men-35');
    await expect(common.body).toContainText('Admin actions');
    await expect(overview.proposeMatchButton).toBeHidden();
    await expect(common.body).not.toContainText('Accept');

    await page.locator('a').getByText('Matches').click();
    await expect(common.body).not.toContainText('Report match');

    await page.locator('a').getByText('Proposals').click();
    await expect(page.locator('button').getByText('Accept')).toBeHidden();
    await expect(page.locator('button').getByText('Propose match')).toBeHidden();
});

// Player page
(() => {
    test('Show user page', async ({ page, common, login, overview }) => {
        await login.loginAsPlayer2();
        await page.goto('/player/ben-done');
        await expect(page.locator('h3').getByText('Ben Done')).toBeVisible();
        await expect(common.body).toContainText('No rivalries yet');
        await expect(common.body).toContainText('player1@gmail.com');
        await expect(common.body).toContainText('123-456-7890');
        await expect(common.body).toContainText('TLR not established');
        await expect(common.body).toContainText('2020 Winter - 2022 Spring');

        await page.locator('h3').getByText('Men 3.5').click();
        await page.locator('[data-all-matches-link]').getByText('4 matches').click();
        await expect(common.modal).toContainText('Cristopher Hamiltonbeach');
    });

    test('Show phone number if we played at least once', async ({ page, common, login, overview }) => {
        await runQuery(`UPDATE matches SET playedAt="2022-10-10 10:00:00"`);
        await login.loginAsPlayer2();
        await page.goto('/player/ben-done');
        await expect(common.body).toContainText('player1@gmail.com');
        await expect(common.body).toContainText('123-456-7890');
    });

    test('Show user who did not played yet', async ({ page, common, login, overview }) => {
        await login.loginAsPlayer2();
        await page.goto('/player/not-played-user');
        await expect(common.body).toContainText('No rivalries yet');
        await expect(common.body).toContainText('p******@*****.com');
        await expect(common.body).toContainText('XXX-XXX-XXXX');
    });

    test('Check that player is not found', async ({ page, common, login, overview }) => {
        await page.goto('/player/wrong-one');
        await expect(common.body).toContainText('Page Not Found');
    });

    test('Hide phone and email from guests', async ({ page, common, login, overview }) => {
        await page.goto('/player/ben-done');
        await expect(common.body).toContainText('p******@*****.com');
        await expect(common.body).toContainText('XXX-XXX-XXXX');
    });

    test.skip('Do not allow to propose friendly match for guests', async ({ page, common, login, overview }) => {
        const dateTwoDaysAgo = dayjs.tz().subtract(2, 'day').format('YYYY-MM-DD HH:mm:ss');
        await runQuery(`UPDATE seasons SET endDate="${dateTwoDaysAgo}" WHERE id=1`);

        await page.goto('/season/2021/spring/men-35');
        await expect(overview.openFriendlyProposalsArea).toBeVisible();
        await expect(overview.proposeFriendlyMatchButton).toBeHidden();
    });

    test('Hide phone and email from players from another tournament', async ({ page, common, login, overview }) => {
        await login.loginAsPlayer8();
        await page.goto('/player/ben-done');
        await expect(common.body).toContainText('p******@*****.com');
        await expect(common.body).toContainText('XXX-XXX-XXXX');

        await page.goto('/player/gary-mill');
        await expect(common.body).toContainText('player2@gmail.com');
        await expect(common.body).toContainText('760-727-3334');
    });

    test('Hide phone and email from inactive player', async ({ page, common, login, overview }) => {
        await login.loginAsPlayer5();
        await page.goto('/player/ben-done');
        await expect(common.body).toContainText('p******@*****.com');
        await expect(common.body).toContainText('XXX-XXX-XXXX');
    });

    test('Hide phone and email from not connected player', async ({ page, common, login, overview }) => {
        await login.loginAsPlayer4();
        await page.goto('/player/inactive-user');
        await expect(common.body).toContainText('p******@*****.com');
        await expect(common.body).toContainText('XXX-XXX-XXXX');
    });

    test('Check player page from players by points', async ({ page, common, login, overview }) => {
        await page.goto('/season/2021/spring/men-35');
        await page.locator('[data-player-list]').locator('a').getByText('Ben Done').click();
        await expect(page.locator('h3').getByText('Ben Done')).toBeVisible();
    });

    test('Check player page from players by elo', async ({ page, common, login, overview }) => {
        await page.goto('/season/2021/spring/men-35');
        await page.locator('a.nav-link').getByText('TLR').click();
        await page.locator('[data-players-by-elo]').locator('a').getByText('Ben Done').click();
        await expect(page.locator('h3').getByText('Ben Done')).toBeVisible();
    });

    test('Check player page from proposals', async ({ page, common, login, overview }) => {
        await page.goto('/season/2021/spring/men-35/proposals');
        await page.locator('[data-proposal="9"]').locator('a').getByText('Gary Mill').click();
        await expect(page.locator('h3').getByText('Gary Mill')).toBeVisible();

        await page.goto('/season/2021/spring/men-35/proposals');
        await page.locator('[data-proposal="9"]').locator('a').getByText('Ben Done').click();
        await expect(page.locator('h3').getByText('Ben Done')).toBeVisible();
    });

    test('We can see phone and email after logging in', async ({ page, common, login, overview }) => {
        await page.goto('/player/ben-done');
        await expect(common.body).toContainText('p******@*****.com');

        await page.locator('.header a').getByText('Sign in').click();
        await login.emailField.fill('player1@gmail.com');
        await login.passwordField.fill(login.password);
        await page.locator('button').getByText('Sign in').click();

        await page.locator('[data-player-list]').locator('a').getByText('Ben Done').click();
        await expect(common.body).toContainText('player1@gmail.com');
    });

    test('We can add note for user', async ({ page, common, login, overview }) => {
        await login.loginAsPlayer1();

        await page.goto('/player/gary-mill');
        await expect(common.body).toContainText('My Notes About Gary');
        await page.locator('textarea[name=note]').fill('Nice guy');
        await page.locator('[data-logo]').click();

        // Just to save the note
        await new Promise((resolve) => setTimeout(resolve, 1000));

        await page.goto('/player/gary-mill');
        await expect(page.locator('textarea[name=note]')).toHaveValue('Nice guy');
    });

    test('We can autosave note', async ({ page, common, login, overview }) => {
        await login.loginAsPlayer1();

        await page.goto('/player/gary-mill');
        await expect(common.body).toContainText('My Notes About Gary');
        await page.locator('textarea[name=note]').fill('Nice guy ');

        // Wait for autosave
        await new Promise((resolve) => setTimeout(resolve, 4000));

        await expect(page.locator('textarea[name=note]')).toHaveValue('Nice guy ');

        await page.goto('/player/gary-mill');
        await expect(page.locator('textarea[name=note]')).toHaveValue('Nice guy');
    });

    test('We cannot see phone and email after logging out', async ({ page, common, login, overview }) => {
        await login.loginAsPlayer1();
        await page.goto('/player/ben-done');
        await expect(common.body).toContainText('player1@gmail.com');

        await page.evaluate(() => window.tl.history.push('/logout'));

        await page.locator('a[data-latest-level="men-35"]').click();
        await page.locator('[data-player-list]').locator('a').getByText('Ben Done').click();
        await expect(common.body).toContainText('p******@*****.com');
    });
})();

// Upcoming tournament
(() => {
    test('Show upcoming tournament', async ({ page, common, login, overview }) => {
        const dateOneWeekAgo = dayjs.tz().subtract(1, 'week').format('YYYY-MM-DD HH:mm:ss');
        await runQuery(`UPDATE seasons SET endDate="${dateOneWeekAgo}" WHERE id=1`);

        await login.loginAsPlayer2();
        await page.goto('/');
        await expect(common.body).toContainText('Upcoming 2022 Spring Season');
        await page.locator('[data-upcoming-season-levels]').locator('a').getByText('Men 3.5').click();

        await expect(common.body).toContainText('The season is not started yet');
        await expect(overview.playerList).toBeVisible();
        await expect(overview.proposeMatchButton).toBeHidden();
        await expect(overview.proposeFriendlyMatchButton).toBeHidden();
        await expect(overview.proposePracticeButton).toBeHidden();
        await expect(overview.reportMatchButton).toBeHidden();
        await expect(overview.moveToAnotherLadderButton).toBeVisible();
        await expect(overview.quitLadderButton).toBeVisible();
        await expect(overview.otherActionsButton).toBeHidden();
        await expect(overview.joinPlayerPoolButton).toBeHidden();
        await expect(overview.upcomingMatchesArea).toBeHidden();
        await expect(overview.finalTournamentArea).toBeHidden();
        await expect(overview.finalParticipationArea).toBeHidden();
        await expect(overview.matchActionsArea).toBeHidden();
        await expect(overview.tournamentNavbarArea).toBeVisible();
        await expect(overview.openProposalsArea).toBeHidden();
        await expect(overview.openFriendlyProposalsArea).toBeHidden();
        await expect(overview.playerPoolArea).toBeHidden();
        await expect(overview.inviteTeammateArea).toBeHidden();
        await expect(overview.winnerArea).toBeHidden();
        await expect(overview.claimAwardArea).toBeHidden();
        await expect(overview.todayMatchesArea).toBeHidden();

        await page.locator('a').getByText('Matches').click();
        await expect(common.body).not.toContainText('Report match');

        await page.locator('a').getByText('Proposals').click();
        await expect(common.body).not.toContainText('Propose match');
    });

    test.describe('mobile view', () => {
        test.use({ viewport: { width: 390, height: 844 } });

        test('Show upcoming tournament on mobile', async ({ page, common, login, overview }) => {
            const dateOneWeekAgo = dayjs.tz().subtract(1, 'week').format('YYYY-MM-DD HH:mm:ss');
            await runQuery(`UPDATE seasons SET endDate="${dateOneWeekAgo}" WHERE id=1`);

            await login.loginAsPlayer2();
            await page.goto('/');
            await expect(common.body).toContainText('Upcoming 2022 Spring Season');
            await page.locator('[data-upcoming-season-levels]').locator('a').getByText('Men 3.5').click();

            await expect(common.body).toContainText('The season is not started yet');
            await expect(overview.playerList).toBeVisible();
            await expect(overview.proposeMatchButton).toBeHidden();
            await expect(overview.proposeFriendlyMatchButton).toBeHidden();
            await expect(overview.proposePracticeButton).toBeHidden();
            await expect(overview.reportMatchButton).toBeHidden();
            await expect(overview.moveToAnotherLadderButton).toBeVisible();
            await expect(overview.quitLadderButton).toBeVisible();
            await expect(overview.otherActionsButton).toBeHidden();
            await expect(overview.joinPlayerPoolButton).toBeHidden();
            await expect(overview.upcomingMatchesArea).toBeHidden();
            await expect(overview.finalTournamentArea).toBeHidden();
            await expect(overview.finalParticipationArea).toBeHidden();
            await expect(overview.matchActionsArea).toBeHidden();
            await expect(overview.tournamentNavbarArea).toBeVisible();
            await expect(overview.openProposalsArea).toBeHidden();
            await expect(overview.openFriendlyProposalsArea).toBeHidden();
            await expect(overview.playerPoolArea).toBeHidden();
            await expect(overview.inviteTeammateArea).toBeHidden();
            await expect(overview.winnerArea).toBeHidden();
            await expect(overview.claimAwardArea).toBeHidden();
            await expect(overview.todayMatchesArea).toBeHidden();
        });
    });
})();

// Live tournament
(() => {
    test('Show live tournament', async ({ page, common, login, overview }) => {
        await login.loginAsPlayer2();
        await page.goto('/season/2021/spring/men-35');

        await expect(common.body).toContainText('Ongoing season');
        await expect(overview.playerList).toBeVisible();
        await expect(overview.proposeMatchButton).toBeVisible();
        await expect(overview.proposeFriendlyMatchButton).toBeHidden();
        await expect(overview.proposePracticeButton).toBeHidden();
        await expect(overview.reportMatchButton).toBeVisible();
        await expect(overview.moveToAnotherLadderButton).toBeHidden();
        await expect(overview.quitLadderButton).toBeHidden();
        await expect(overview.otherActionsButton).toBeVisible();
        await expect(overview.joinPlayerPoolButton).toBeHidden();
        await expect(overview.upcomingMatchesArea).toBeVisible();
        await expect(overview.finalTournamentArea).toBeHidden();
        await expect(overview.finalParticipationArea).toBeHidden();
        await expect(overview.matchActionsArea).toBeHidden();
        await expect(overview.tournamentNavbarArea).toBeVisible();
        await expect(overview.openProposalsArea).toBeVisible();
        await expect(overview.openFriendlyProposalsArea).toBeHidden();
        await expect(overview.playerPoolArea).toBeHidden();
        await expect(overview.inviteTeammateArea).toBeHidden();
        await expect(overview.winnerArea).toBeHidden();
        await expect(overview.claimAwardArea).toBeHidden();
        await expect(overview.todayMatchesArea).toBeVisible();
    });

    test.describe('mobile view', () => {
        test.use({ viewport: { width: 390, height: 844 } });

        test('Show live tournament on mobile', async ({ page, common, login, overview }) => {
            await login.loginAsPlayer2();
            await page.goto('/season/2021/spring/men-35');

            await expect(common.body).toContainText('Ongoing season');
            await expect(overview.playerList).toBeVisible();
            await expect(overview.proposeMatchButton).toBeVisible();
            await expect(overview.proposeFriendlyMatchButton).toBeHidden();
            await expect(overview.proposePracticeButton).toBeHidden();
            await expect(overview.reportMatchButton).toBeVisible();
            await expect(overview.moveToAnotherLadderButton).toBeHidden();
            await expect(overview.quitLadderButton).toBeHidden();
            await expect(overview.otherActionsButton).toBeVisible();
            await expect(overview.joinPlayerPoolButton).toBeHidden();
            await expect(overview.upcomingMatchesArea).toBeVisible();
            await expect(overview.finalTournamentArea).toBeHidden();
            await expect(overview.finalParticipationArea).toBeHidden();
            await expect(overview.matchActionsArea).toBeHidden();
            await expect(overview.tournamentNavbarArea).toBeVisible();
            await expect(overview.openProposalsArea).toBeVisible();
            await expect(overview.openFriendlyProposalsArea).toBeHidden();
            await expect(overview.playerPoolArea).toBeHidden();
            await expect(overview.inviteTeammateArea).toBeHidden();
            await expect(overview.winnerArea).toBeHidden();
            await expect(overview.claimAwardArea).toBeHidden();
            await expect(overview.todayMatchesArea).toBeVisible();
        });
    });
})();

// Tournament is over and next tournament hasn't started yet
(() => {
    test('Show tournament which is over', async ({ page, common, login, overview }) => {
        const dateOneWeekAgo = dayjs.tz().subtract(1, 'week').format('YYYY-MM-DD HH:mm:ss');
        await runQuery(`UPDATE seasons SET endDate="${dateOneWeekAgo}" WHERE id=1`);

        await login.loginAsPlayer2();
        await page.goto('/season/2021/spring/men-35');

        await expect(common.body).toContainText('The season has ended');
        await expect(overview.playerList).toBeVisible();
        await expect(overview.proposeMatchButton).toBeHidden();
        await expect(overview.proposeFriendlyMatchButton).toBeVisible();
        await expect(overview.proposePracticeButton).toBeVisible();
        await expect(overview.reportMatchButton).toBeHidden();
        await expect(overview.moveToAnotherLadderButton).toBeHidden();
        await expect(overview.quitLadderButton).toBeHidden();
        await expect(overview.otherActionsButton).toBeHidden();
        await expect(overview.joinPlayerPoolButton).toBeHidden();
        await expect(overview.upcomingMatchesArea).toBeHidden();
        await expect(overview.finalTournamentArea).toBeHidden();
        await expect(overview.finalParticipationArea).toBeHidden();
        await expect(overview.matchActionsArea).toBeHidden();
        await expect(overview.tournamentNavbarArea).toBeVisible();
        await expect(overview.openProposalsArea).toBeHidden();
        await expect(overview.openFriendlyProposalsArea).toBeVisible();
        await expect(overview.playerPoolArea).toBeHidden();
        await expect(overview.inviteTeammateArea).toBeHidden();
        await expect(overview.winnerArea).toBeHidden();
        await expect(overview.claimAwardArea).toBeHidden();
        await expect(overview.todayMatchesArea).toBeHidden();
    });

    test.describe('mobile view', () => {
        test.use({ viewport: { width: 390, height: 844 } });

        test('Show tournament which is over on mobile', async ({ page, common, login, overview }) => {
            const dateOneWeekAgo = dayjs.tz().subtract(1, 'week').format('YYYY-MM-DD HH:mm:ss');
            await runQuery(`UPDATE seasons SET endDate="${dateOneWeekAgo}" WHERE id=1`);

            await login.loginAsPlayer2();
            await page.goto('/season/2021/spring/men-35');

            await expect(common.body).toContainText('The season has ended');
            await expect(overview.playerList).toBeVisible();
            await expect(overview.proposeMatchButton).toBeHidden();
            await expect(overview.proposeFriendlyMatchButton).toBeVisible();
            await expect(overview.proposePracticeButton).toBeVisible();
            await expect(overview.reportMatchButton).toBeHidden();
            await expect(overview.moveToAnotherLadderButton).toBeHidden();
            await expect(overview.quitLadderButton).toBeHidden();
            await expect(overview.otherActionsButton).toBeHidden();
            await expect(overview.joinPlayerPoolButton).toBeHidden();
            await expect(overview.upcomingMatchesArea).toBeHidden();
            await expect(overview.finalTournamentArea).toBeHidden();
            await expect(overview.finalParticipationArea).toBeHidden();
            await expect(overview.matchActionsArea).toBeHidden();
            await expect(overview.tournamentNavbarArea).toBeVisible();
            await expect(overview.openProposalsArea).toBeHidden();
            await expect(overview.openFriendlyProposalsArea).toBeVisible();
            await expect(overview.playerPoolArea).toBeHidden();
            await expect(overview.inviteTeammateArea).toBeHidden();
            await expect(overview.winnerArea).toBeHidden();
            await expect(overview.claimAwardArea).toBeHidden();
            await expect(overview.todayMatchesArea).toBeHidden();
        });
    });
})();

// Tournament is over and next tournament started
(() => {
    test('Show tournament which is over and next tournament already started', async ({
        page,
        common,
        login,
        overview,
    }) => {
        const dateOneMonthAgo = dayjs.tz().subtract(1, 'month').format('YYYY-MM-DD HH:mm:ss');
        const dateOneWeekAgo = dayjs.tz().subtract(1, 'week').format('YYYY-MM-DD HH:mm:ss');
        await runQuery(`UPDATE seasons SET endDate="${dateOneMonthAgo}" WHERE id=1`);
        await runQuery(`UPDATE seasons SET startDate="${dateOneWeekAgo}" WHERE id=5`);

        await login.loginAsPlayer2();
        await page.goto('/season/2021/spring/men-35');

        await expect(common.body).toContainText('The season has ended');
        await expect(overview.playerList).toBeVisible();
        await expect(overview.proposeMatchButton).toBeHidden();
        await expect(overview.proposeFriendlyMatchButton).toBeHidden();
        await expect(overview.proposePracticeButton).toBeHidden();
        await expect(overview.reportMatchButton).toBeHidden();
        await expect(overview.moveToAnotherLadderButton).toBeHidden();
        await expect(overview.quitLadderButton).toBeHidden();
        await expect(overview.otherActionsButton).toBeHidden();
        await expect(overview.joinPlayerPoolButton).toBeHidden();
        await expect(overview.upcomingMatchesArea).toBeHidden();
        await expect(overview.finalTournamentArea).toBeHidden();
        await expect(overview.finalParticipationArea).toBeHidden();
        await expect(overview.matchActionsArea).toBeHidden();
        await expect(overview.tournamentNavbarArea).toBeVisible();
        await expect(overview.openProposalsArea).toBeHidden();
        await expect(overview.openFriendlyProposalsArea).toBeHidden();
        await expect(overview.playerPoolArea).toBeHidden();
        await expect(overview.inviteTeammateArea).toBeHidden();
        await expect(overview.winnerArea).toBeHidden();
        await expect(overview.claimAwardArea).toBeHidden();
        await expect(overview.todayMatchesArea).toBeHidden();
    });

    test.describe('mobile view', () => {
        test.use({ viewport: { width: 390, height: 844 } });

        test('Show tournament which is over and next tournament already started on mobile', async ({
            page,
            common,
            login,
            overview,
        }) => {
            const dateOneMonthAgo = dayjs.tz().subtract(1, 'month').format('YYYY-MM-DD HH:mm:ss');
            const dateOneWeekAgo = dayjs.tz().subtract(1, 'week').format('YYYY-MM-DD HH:mm:ss');
            await runQuery(`UPDATE seasons SET endDate="${dateOneMonthAgo}" WHERE id=1`);
            await runQuery(`UPDATE seasons SET startDate="${dateOneWeekAgo}" WHERE id=5`);

            await login.loginAsPlayer2();
            await page.goto('/season/2021/spring/men-35');

            await expect(common.body).toContainText('The season has ended');
            await expect(overview.playerList).toBeVisible();
            await expect(overview.proposeMatchButton).toBeHidden();
            await expect(overview.proposeFriendlyMatchButton).toBeHidden();
            await expect(overview.proposePracticeButton).toBeHidden();
            await expect(overview.reportMatchButton).toBeHidden();
            await expect(overview.moveToAnotherLadderButton).toBeHidden();
            await expect(overview.quitLadderButton).toBeHidden();
            await expect(overview.otherActionsButton).toBeHidden();
            await expect(overview.joinPlayerPoolButton).toBeHidden();
            await expect(overview.upcomingMatchesArea).toBeHidden();
            await expect(overview.finalTournamentArea).toBeHidden();
            await expect(overview.finalParticipationArea).toBeHidden();
            await expect(overview.matchActionsArea).toBeHidden();
            await expect(overview.tournamentNavbarArea).toBeVisible();
            await expect(overview.openProposalsArea).toBeHidden();
            await expect(overview.openFriendlyProposalsArea).toBeHidden();
            await expect(overview.playerPoolArea).toBeHidden();
            await expect(overview.inviteTeammateArea).toBeHidden();
            await expect(overview.winnerArea).toBeHidden();
            await expect(overview.claimAwardArea).toBeHidden();
            await expect(overview.todayMatchesArea).toBeHidden();
        });
    });
})();

// Switch tournament
(() => {
    const closeCurrentSeason = async () => {
        const dateTwoDaysAgo = dayjs.tz().subtract(2, 'day').format('YYYY-MM-DD HH:mm:ss');
        await runQuery(`UPDATE seasons SET endDate="${dateTwoDaysAgo}" WHERE id=1`);
    };

    test('Show validation error', async ({ page, common, login, overview }) => {
        await login.loginAsPlayer1();
        await page.goto('/season/2021/spring/men-35');
        await overview.clickOtherAction('Move to another ladder');
        await common.modal.locator('button').getByText('Submit').click();
        await expect(common.modal).toContainText('New ladder is required');
    });

    test('Should not allow to switch for the last two weeks of the season', async ({
        page,
        common,
        login,
        overview,
    }) => {
        const dateInTenDays = dayjs.tz().add(10, 'day').format('YYYY-MM-DD HH:mm:ss');
        await runQuery(`UPDATE seasons SET endDate="${dateInTenDays}" WHERE id=1`);

        await login.loginAsPlayer1();
        await page.goto('/season/2021/spring/men-35');
        await overview.clickOtherAction('Move to another ladder');
        await expect(common.modal).toContainText('You cannot switch ladders during the last two weeks of the season.');
    });

    test('Should not allow to from the free ladder', async ({ page, common, login, overview }) => {
        await runQuery(`UPDATE players SET joinForFree=1 WHERE userId=1`);
        await login.loginAsPlayer1();
        await page.goto('/season/2021/spring/men-35');
        await overview.clickOtherAction('Move to another ladder');
        await expect(common.modal).toContainText('You cannot switch ladders because you joined this ladder for free.');
    });

    test('Should switch ladder during the season', async ({ page, common, login, overview }) => {
        await runQuery(`UPDATE settings SET changeLevelNotification="admin@gmail.com" WHERE id=1`);
        await runQuery(`UPDATE players SET readyForFinal=1 WHERE id=2`);

        await login.loginAsPlayer1();
        await page.goto('/season/2021/spring/men-35');
        await overview.clickOtherAction('Move to another ladder');

        await expect(common.modal).toContainText('If you feel that');
        await expect(common.modal).toContainText('You can only switch once');

        await page.locator('select[name="to"]').selectOption('Men 4.0');
        await common.modal.locator('button').getByText('Submit').click();
        await expect(common.modal).toContainText('You succesfully switched to the Men 4.0 ladder');

        await expectRecordToExist('players', { id: 2 }, { readyForFinal: 0 });

        // Check notification
        await new Promise((resolve) => setTimeout(resolve, 500));
        const notificationSent = await getRecord('emails', { recipientEmail: 'admin@gmail.com' });
        expect(notificationSent.subject).toContain('Ben Done switched level from Men 3.5 to Men 4.0');
        expect(notificationSent.html).toContain('Ben Done');
        expect(notificationSent.html).toContain('Men 3.5');
        expect(notificationSent.html).toContain('Men 4.0');
        expect(notificationSent.html).toContain('player1@gmail.com');
        expect(notificationSent.html).toContain('/player/ben-done');

        await common.modal.locator('button').getByText('Go to Men 4.0 ladder').click();
        await expect(page.locator('[data-player-list]')).toContainText('Ben Done');
        await overview.clickOtherAction('Move to another ladder');
        await expect(common.modal).toContainText('You cannot switch ladder more than one time');

        await page.goto('/season/2021/spring/men-35');
        await expect(page.locator('[data-inactive-user="1"]')).toBeVisible();
        await expect(overview.otherActionsButton).toBeHidden();
    });

    test('We can switch only to the suggested ladders', async ({ page, common, login, overview }) => {
        await overrideConfig({ minMatchesToEstablishTlr: 1, minPlayersForActiveLadder: 1 });

        await login.loginAsPlayer1();
        await page.goto('/season/2021/spring/men-35');
        await overview.clickOtherAction('Move to another ladder');

        await expect(common.modal).toContainText('your TLR is 3.70');
        await expect(common.modal).not.toContainText('If you feel that');

        await expect(page.locator('select[name="to"]')).toContainText('Men 4.0');
        await expect(page.locator('select[name="to"]')).not.toContainText('Men 4.5');

        await page.locator('select[name="to"]').selectOption('Men 4.0');
        await common.modal.locator('button').getByText('Submit').click();
        await expect(common.modal).toContainText('You succesfully switched to the Men 4.0 ladder');

        await common.modal.locator('button').getByText('Go to Men 4.0 ladder').click();
        await expect(common.body).toContainText('Not Played User');
    });

    test('Should switch ladder before the season starts and remove player from the old one', async ({
        page,
        common,
        login,
        overview,
    }) => {
        await closeCurrentSeason();

        await login.loginAsPlayer1();
        await page.goto('/season/2022/spring/men-35');
        await overview.clickOtherAction('Move to another ladder', false);

        await page.locator('select[name="to"]').selectOption('Men 4.0');
        await common.modal.locator('button').getByText('Submit').click();
        await expect(common.modal).toContainText('You succesfully switched to the Men 4.0 ladder');

        await common.modal.locator('button').getByText('Go to Men 4.0 ladder').click();
        await expect(page.locator('[data-player-list]')).toContainText('Ben Done');

        await page.goto('/season/2022/spring/men-35');
        await expect(page.locator('[data-overview-content]')).not.toContainText('Ben Done');
    });

    test('Should switch ladder and remove proposals from the old one', async ({ page, common, login, overview }) => {
        // delete played matches
        await runQuery(`DELETE FROM matches WHERE id=1 OR id=4`);

        await login.loginAsPlayer2();
        await page.goto('/season/2021/spring/men-35');

        await expectNumRecords('matches', { id: 9 }, 1);
        await expectNumRecords('matches', { id: 40 }, 1);
        await overview.clickOtherAction('Move to another ladder');

        await page.locator('select[name="to"]').selectOption('Men 4.5');
        await common.modal.locator('button').getByText('Submit').click();

        await common.modal.locator('button').getByText('Go to Men 4.5 ladder').click();
        await expect(page.locator('[data-player-list]')).toContainText('Gary Mill');

        await page.goto('/season/2021/spring/men-35');
        await expect(page.locator('[data-overview-content]')).not.toContainText('Gary Mill');

        await expectNumRecords('matches', { id: 9 }, 0);
        await expectNumRecords('matches', { id: 40 }, 0);
    });
})();

// Remove player themselves from tournament
(() => {
    test('Should deactivate player for the ladder', async ({ page, common, login, homepage, overview }) => {
        await runQuery(`UPDATE players SET readyForFinal=1 WHERE id=2`);

        await login.loginAsPlayer1();
        await page.goto('/season/2021/spring/men-35');
        await overview.clickOtherAction('Quit ladder');

        await expect(common.modal).toContainText('Are you sure?');
        await common.modal.locator('button').getByText('Yes').click();

        await expect(common.alert).toContainText('You successfully quit the ladder');
        await homepage.checkVisible();

        await expectRecordToExist('players', { id: 2 }, { isActive: 0, readyForFinal: 0 });

        await page.locator('[data-latest-level="men-35"]').click();
        await expect(page.locator('[data-inactive-user="1"]')).toBeVisible();
        await expect(overview.otherActionsButton).toBeHidden();
    });

    test('Should quit ladder and remove all traces', async ({ page, common, login, homepage, overview }) => {
        // delete played matches from test DB
        await runQuery(`DELETE FROM matches WHERE id=1 OR id=4`);

        await login.loginAsPlayer2();
        await page.goto('/season/2021/spring/men-35');

        await expectNumRecords('matches', { id: 9 }, 1);
        await expectNumRecords('matches', { id: 40 }, 1);
        await overview.clickOtherAction('Quit ladder');

        await expect(common.modal).toContainText('Are you sure?');
        await common.modal.locator('button').getByText('Yes').click();

        await expect(common.alert).toContainText('You successfully quit the ladder');
        await homepage.checkVisible();

        await page.goto('/season/2021/spring/men-35');
        await expect(page.locator('[data-overview-content]')).not.toContainText('Gary Mill');

        await expectNumRecords('matches', { id: 9 }, 0);
        await expectNumRecords('matches', { id: 40 }, 0);
    });
})();
