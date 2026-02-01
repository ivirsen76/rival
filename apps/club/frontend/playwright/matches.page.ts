import { test, expect } from './base';
import dayjs from '@rival/club.backend/src/utils/dayjs';
import {
    restoreDb,
    expectRecordToExist,
    runQuery,
    getRecord,
    getNumRecords,
    cleanRedisCache,
    overrideConfig,
} from '@rival/club.backend/src/db/helpers';
import { imageRegex } from './helpers';

test.beforeEach(async ({ page, login }) => {
    restoreDb();
    await login.loginAsPlayer1();
});

// On overview page
(() => {
    test('Should add match result with tiebreak', async ({ page, common, login, match }) => {
        await page.goto('/season/2021/spring/men-35');
        await expect(common.body).toContainText('Ben Done3');
        await expect(common.body).toContainText('Gary Mill4');
        await match.scoreButton.click();

        await match.pickChallengerPoints(3);
        await new Promise((resolve) => setTimeout(resolve, 1000));

        await match.pickAcceptorPoints(2);
        await new Promise((resolve) => setTimeout(resolve, 1000));

        await page.getByRole('button', { name: 'Gary Mill' }).click();
        await expect(common.modal).toContainText('+21');
        await expect(common.modal).toContainText('+10');
        await common.modalSubmitButton.click();

        await expect(common.body).toContainText('+21');
        await expect(common.body).toContainText('+10');
        await expectRecordToExist('matches', { id: 9 }, { score: '3-6 6-2 1-0' });

        // Check that an email is sent
        const emailSent = await expectRecordToExist('emails', {
            recipientEmail: 'player2@gmail.com',
            subject: 'You Have New Match Results!',
        });
        expect(emailSent.html).toContain('Gary Mill beat Ben Done: 3-6 6-2 1-0');
        expect(emailSent.html).toContain('<b>Ben Done</b> reported the results of your match on');
        expect(imageRegex.test(emailSent.html)).toBeTruthy();

        // Check Ben rivalry email
        const benRivalryEmail = await expectRecordToExist('emails', {
            recipientEmail: 'player1@gmail.com',
            subject: 'New Rivalry Started!',
        });
        expect(benRivalryEmail.html).toContain('You lead <b>Gary Mill</b> in the head to head <b>2-1</b>');
        expect(benRivalryEmail.html).toContain('You won <b>6-2 6-4</b>');
        expect(benRivalryEmail.html).toContain('You won <b>6-2 6-4</b>');
        expect(benRivalryEmail.html).toContain('You lost <b>6-3 2-6 0-1</b>');
        expect(benRivalryEmail.html).toContain('player/ben-done');
        expect(imageRegex.test(benRivalryEmail.html)).toBeTruthy();

        // Check Gary rivalry email
        const garyRivalryEmail = await expectRecordToExist('emails', {
            recipientEmail: 'player2@gmail.com',
            subject: 'New Rivalry Started!',
        });
        expect(garyRivalryEmail.html).toContain('You are behind <b>Ben Done</b> in the head to head <b>1-2</b>');
        expect(garyRivalryEmail.html).toContain('You lost <b>2-6 4-6</b>');
        expect(garyRivalryEmail.html).toContain('You lost <b>2-6 4-6</b>');
        expect(garyRivalryEmail.html).toContain('You won <b>3-6 6-2 1-0</b>');
        expect(garyRivalryEmail.html).toContain('player/gary-mill');
        expect(imageRegex.test(garyRivalryEmail.html)).toBeTruthy();

        await expectRecordToExist('actions', { name: 'newRivalryStarted1-2' });
    });

    test('Should add match result with full third set', async ({ page, common, login, match }) => {
        await page.goto('/season/2021/spring/men-35');
        await expect(common.body).toContainText('Ben Done3');
        await expect(common.body).toContainText('Gary Mill4');
        await match.scoreButton.click();

        await match.pickChallengerPoints(3);
        await new Promise((resolve) => setTimeout(resolve, 1000));

        await match.pickAcceptorPoints(2);
        await new Promise((resolve) => setTimeout(resolve, 1000));

        await match.fullSetButton.click();
        await match.pickChallengerPoints(1);

        await expect(common.modal).toContainText('+14');
        await expect(common.modal).toContainText('+16');
        await common.modalSubmitButton.click();

        await expect(common.body).toContainText('+14');
        await expect(common.body).toContainText('+16');
        await expectRecordToExist('matches', { id: 9 }, { score: '3-6 6-2 1-6' });

        // Check that an email is sent
        const emailSent = await expectRecordToExist('emails', {
            recipientEmail: 'player2@gmail.com',
            subject: 'You Have New Match Results!',
        });
        expect(emailSent.html).toContain('Ben Done beat Gary Mill: 6-3 2-6 6-1');
        expect(emailSent.html).toContain('<b>Ben Done</b> reported the results of your match on');
        expect(imageRegex.test(emailSent.html)).toBeTruthy();
    });

    test('Should add match result for Fast4 match type', async ({ page, common, login, match }) => {
        await runQuery(`UPDATE matches SET matchFormat=2 WHERE id=9`);
        await overrideConfig({ minMatchesToEstablishTlr: 1 });

        await page.goto('/season/2021/spring/men-35');
        await match.scoreButton.click();
        await expect(match.matchFormatSelect).toHaveValue('2');

        await match.pickChallengerPoints(3);
        await new Promise((resolve) => setTimeout(resolve, 1000));

        await match.pickChallengerPoints(2);
        await expect(common.modal).toContainText('+9');
        await expect(common.modal).toContainText('+15');
        await common.modalSubmitButton.click();
        await expect(common.modal).toBeHidden();

        await expect(common.body).toContainText('+9');
        await expect(common.body).toContainText('+15');
        await expectRecordToExist(
            'matches',
            { id: 9 },
            {
                score: '3-4 2-4',
                matchFormat: 2,
                challengerPoints: 9,
                acceptorPoints: 15,
                challengerMatches: 4,
                acceptorMatches: 5,
                challengerEloChange: 3,
                acceptorEloChange: -2,
            }
        );

        // Check that an email is sent
        const emailSent = await expectRecordToExist('emails', {
            recipientEmail: 'player2@gmail.com',
            subject: 'You Have New Match Results!',
        });
        expect(emailSent.html).toContain('Ben Done beat Gary Mill: 4-3 4-2');
        expect(emailSent.html).toContain('<b>Ben Done</b> reported the results of your match on');
        expect(imageRegex.test(emailSent.html)).toBeTruthy();
    });

    test('Should add match result for Fast4 with tiebreak', async ({ page, common, login, match }) => {
        await runQuery(`UPDATE matches SET matchFormat=2 WHERE id=9`);

        await page.goto('/season/2021/spring/men-35');
        await match.scoreButton.click();

        await match.pickChallengerPoints(3);
        await new Promise((resolve) => setTimeout(resolve, 1000));

        await match.pickAcceptorPoints(1);
        await new Promise((resolve) => setTimeout(resolve, 1000));

        await expect(common.modal).toContainText('Who won the tiebreak?');
        await expect(common.modal).not.toContainText('Full set');
        await expect(common.modal).not.toContainText('10-point tiebreak');
        await page.getByRole('button', { name: 'Gary Mill' }).click();

        await expect(common.modal).toContainText('+22');
        await expect(common.modal).toContainText('+7');
        await common.modalSubmitButton.click();
        await expect(common.modal).toBeHidden();

        await expect(common.body).toContainText('+22');
        await expect(common.body).toContainText('+7');
        await expectRecordToExist(
            'matches',
            { id: 9 },
            { score: '3-4 4-1 1-0', matchFormat: 2, challengerPoints: 22, acceptorPoints: 7 }
        );

        // Check that an email is sent
        const emailSent = await expectRecordToExist('emails', {
            recipientEmail: 'player2@gmail.com',
            subject: 'You Have New Match Results!',
        });
        expect(emailSent.html).toContain('Gary Mill beat Ben Done: 3-4 4-1 1-0');
        expect(emailSent.html).toContain('<b>Ben Done</b> reported the results of your match on');
        expect(imageRegex.test(emailSent.html)).toBeTruthy();
    });

    test('Should add match result for Fast4 with injury reporting', async ({ page, common, login, match }) => {
        await runQuery(`UPDATE matches SET matchFormat=2 WHERE id=9`);

        await page.goto('/season/2021/spring/men-35');
        await match.scoreButton.click();

        await match.pickAcceptorPoints(3);
        await new Promise((resolve) => setTimeout(resolve, 1000));

        await match.pickMatchResult('Player retired');
        await common.modal.locator('button').getByText('Ben Done').click();
        await common.modalSubmitButton.click();

        await match.pickChallengerPoints(2);
        await match.pickAcceptorPoints(1);

        await expect(common.modal).toContainText('+23');
        await expect(common.modal).toContainText('+6');
        await common.modalSubmitButton.click();
        await expect(common.modal).toBeHidden();

        await expect(common.body).toContainText('+23');
        await expect(common.body).toContainText('+6');
        await expectRecordToExist(
            'matches',
            { id: 9 },
            { score: '4-3 2-1', matchFormat: 2, winner: 1, challengerPoints: 23, acceptorPoints: 6 }
        );

        // Check that an email is sent
        const emailSent = await expectRecordToExist('emails', {
            recipientEmail: 'player2@gmail.com',
            subject: 'You Have New Match Results!',
        });
        expect(emailSent.html).toContain('Gary Mill beat Ben Done: 4-3 2-1');
        expect(emailSent.html).toContain('<b>Ben Done</b> reported the results of your match on');
        expect(imageRegex.test(emailSent.html)).toBeTruthy();
    });

    test('Should add match result for Fast4 with injury reporting and third set', async ({ page, common, match }) => {
        await runQuery(`UPDATE matches SET matchFormat=2 WHERE id=9`);

        await page.goto('/season/2021/spring/men-35');
        await match.scoreButton.click();

        await match.pickMatchResult('Player retired');
        await common.modal.locator('button').getByText('Ben Done').click();
        await common.modalSubmitButton.click();

        await match.pickChallengerPoints(4);
        await match.pickAcceptorPoints(1);
        await new Promise((resolve) => setTimeout(resolve, 1000));

        await match.pickChallengerPoints(2);
        await match.pickAcceptorPoints(4);
        await new Promise((resolve) => setTimeout(resolve, 1000));

        await expect(match.getSetLink(3)).toHaveClass(/disabled/);
        await expect(match.getSetLink(2)).toHaveClass(/active/);

        await expect(common.modal).toContainText('+21');
        await expect(common.modal).toContainText('+7');
    });

    test('Should add Fast4 match result from scratch', async ({ page, common, login, match, overview }) => {
        await page.goto('/season/2021/spring/men-35');
        await overview.reportMatchButton.click();
        await match.challengerSelect.selectOption('Matthew Burt');
        await match.nextButton.click();

        await match.matchFormatSelect.selectOption('Fast4');
        await match.pickAcceptorPoints(2);
        await new Promise((resolve) => setTimeout(resolve, 1000));

        await match.pickChallengerPoints(1);
        await new Promise((resolve) => setTimeout(resolve, 1000));

        await page.getByRole('button', { name: 'Ben Done' }).click();
        await expect(common.modal).toContainText('+9');
        await expect(common.modal).toContainText('+19');
        await common.modalSubmitButton.click();
        await expect(common.modal).toBeHidden();

        await expect(common.body).toContainText('+9');
        await expect(common.body).toContainText('+19');
        await expectRecordToExist(
            'matches',
            { score: '4-2 1-4 0-1' },
            {
                matchFormat: 2,
                challengerPoints: 9,
                acceptorPoints: 19,
                challengerMatches: 3,
                acceptorMatches: 5,
                challengerEloChange: -2,
                acceptorEloChange: 1,
            }
        );

        // Check that an email is sent
        const emailSent = await expectRecordToExist('emails', {
            recipientEmail: 'player4@gmail.com',
            subject: 'You Have New Match Results!',
        });
        expect(emailSent.html).toContain('Ben Done beat Matthew Burt: 2-4 4-1 1-0');
        expect(emailSent.html).toContain('<b>Ben Done</b> reported the results of your match on');
        expect(imageRegex.test(emailSent.html)).toBeTruthy();
    });

    test('Should add match result for Full 3rd Set match format', async ({ page, common, login, match }) => {
        await runQuery(`UPDATE matches SET matchFormat=1 WHERE id=9`);
        await overrideConfig({ minMatchesToEstablishTlr: 1 });

        await page.goto('/season/2021/spring/men-35');
        await match.scoreButton.click();
        await expect(match.matchFormatSelect).toHaveValue('0');

        await match.pickChallengerPoints(3);
        await new Promise((resolve) => setTimeout(resolve, 1000));

        await match.pickAcceptorPoints(2);
        await new Promise((resolve) => setTimeout(resolve, 1000));

        await match.pickChallengerPoints(2);
        await expect(common.modal).toContainText('+14');
        await expect(common.modal).toContainText('+15');
        await common.modalSubmitButton.click();
        await expect(common.modal).toBeHidden();

        await expect(common.body).toContainText('+14');
        await expect(common.body).toContainText('+15');
        await expectRecordToExist(
            'matches',
            { id: 9 },
            {
                score: '3-6 6-2 2-6',
                matchFormat: 1,
                challengerPoints: 14,
                acceptorPoints: 15,
                challengerMatches: 4,
                acceptorMatches: 5,
                challengerEloChange: 5,
                acceptorEloChange: -5,
            }
        );
    });

    test('Should manipulate match format settings', async ({ page, common, login, match }) => {
        await page.goto('/season/2021/spring/men-35');
        await match.scoreButton.click();

        await match.pickChallengerPoints(3);
        await new Promise((resolve) => setTimeout(resolve, 1000));

        await match.pickChallengerPoints(4);
        await expect(common.modal).toContainText('+11');
        await expect(common.modal).toContainText('+17');
        await match.pickMatchFormat('Fast4');

        await expect(match.getSetLink(1)).toHaveClass(/active/);
        await expect(match.getSetLink(2)).toHaveClass(/disabled/);
        await expect(match.getSetLink(3)).toHaveClass(/disabled/);

        await match.pickChallengerPoints(3);
        await new Promise((resolve) => setTimeout(resolve, 1000));

        await match.pickChallengerPoints(2);
        await expect(common.modal).toContainText('+9');
        await expect(common.modal).toContainText('+15');
        await match.pickMatchFormat('Full match');

        await expect(match.getSetLink(1)).toHaveClass(/active/);
        await expect(match.getSetLink(2)).toHaveClass(/disabled/);
        await expect(match.getSetLink(3)).toHaveClass(/disabled/);

        // Default match settings will hide Match Format
        await match.pickMatchResult('Player defaulted');
        await expect(common.modal).toContainText('Who won?');
        await expect(match.matchFormatSelect).toHaveAttribute('disabled');

        await match.pickMatchResult('Match completed');
        await match.pickMatchFormat('Fast4');
        await match.pickMatchResult('Player defaulted');
        await expect(common.modal).toContainText('+20');
        await expect(match.matchFormatSelect).toHaveValue('0');
    });

    test('Should check match form', async ({ page, common, login, match }) => {
        await page.goto('/season/2021/spring/men-35');
        await match.scoreButton.click();

        await match.pickChallengerPoints(6);
        await match.pickAcceptorPoints(6);
        await expect(common.body).toContainText('The score is incorrect');

        await match.pickChallengerPoints(1);
        await new Promise((resolve) => setTimeout(resolve, 1000));

        await match.pickChallengerPoints(3);
        await expect(match.getBadgeWithPoints('+8')).toBeVisible();
        await expect(match.getBadgeWithPoints('+20')).toBeVisible();

        await match.pickMatchResult('Player retired');
        await common.modalSubmitButton.click();
        await expect(common.body).toContainText('Retirement score should be incomplete.');

        await match.pickChallengerPoints(7);
        await new Promise((resolve) => setTimeout(resolve, 1000));
        await expect(match.getBadgeWithPoints('+12')).toBeVisible();
        await expect(match.getBadgeWithPoints('+17')).toBeVisible();

        await match.pickChallengerPoints(1);
        await match.pickAcceptorPoints(1);
        await expect(match.getBadgeWithPoints('+13')).toBeVisible();
        await expect(match.getBadgeWithPoints('+21')).toBeVisible();
    });

    test('Should check match form 3', async ({ page, common, login, match }) => {
        await page.goto('/season/2021/spring/men-35');
        await match.scoreButton.click();

        await match.pickChallengerPoints(1);
        await new Promise((resolve) => setTimeout(resolve, 1000));

        await match.pickMatchResult('Player retired');
        await common.modalSubmitButton.click();

        await match.pickMatchResult('Match completed');
        expect(await match.isSetSelected(1)).toBeTruthy();
    });

    test('Should add match result won by default', async ({ page, common, login, match }) => {
        await page.goto('/season/2021/spring/men-35');
        await match.scoreButton.click();

        await match.pickChallengerPoints(3);
        await new Promise((resolve) => setTimeout(resolve, 1000));

        await match.pickChallengerPoints(3);
        await match.pickMatchResult('Player defaulted');

        await expect(match.getBadgeWithPoints('+0')).toBeVisible();
        await expect(match.getBadgeWithPoints('+20')).toBeVisible();
        await common.modalSubmitButton.click();

        await expect(common.body).toContainText('+0');
        await expect(common.body).toContainText('+20');
        await expectRecordToExist(
            'matches',
            { id: 9 },
            { score: '0-6 0-6', wonByDefault: 1, challengerEloChange: 0, acceptorEloChange: 0 }
        );

        // Check that an email is sent
        const emailSent = await expectRecordToExist('emails', {
            recipientEmail: 'player2@gmail.com',
            subject: 'You Have New Match Results!',
        });
        expect(emailSent.html).toContain('Ben Done won by default against Gary Mill');
        expect(imageRegex.test(emailSent.html)).toBeTruthy();
    });

    test('Should add match result won because of the injury', async ({ page, common, login, match }) => {
        await page.goto('/season/2021/spring/men-35');
        await match.scoreButton.click();

        await match.pickAcceptorPoints(3);
        await new Promise((resolve) => setTimeout(resolve, 1000));

        await match.pickMatchResult('Player retired');
        await common.modal.locator('button').getByText('Ben Done').click();
        await common.modalSubmitButton.click();

        await match.pickChallengerPoints(2);
        await match.pickAcceptorPoints(1);
        await common.modalSubmitButton.click();

        await expect(common.modal).toBeHidden();

        await expect(common.body).toContainText('+27');
        await expect(common.body).toContainText('+6');
        await expectRecordToExist(
            'matches',
            { id: 9 },
            {
                score: '6-3 2-1',
                winner: 1,
                wonByDefault: 0,
                wonByInjury: 1,
                challengerPoints: 27,
                acceptorPoints: 6,
                challengerEloChange: 25,
                acceptorEloChange: -24,
            }
        );

        // Check calculation points tooltip
        await page.locator('[data-points-calculation="9"]').hover();
        await expect(common.tooltip).toContainText('6-3 6-1');
        await expect(common.tooltip.locator('.badge').getByText('6', { exact: true })).toBeVisible();
        await expect(common.tooltip.locator('.badge').getByText('27', { exact: true })).toBeVisible();

        // Match actions
        await page.locator('[data-match-actions="9"]').click();
        await expect(match.editButton).toBeVisible();
        await expect(match.uploadStatsButton).toBeHidden();

        await match.editButton.click();
        await expect(common.modal).toContainText('Player retired');
    });

    test('Should reset match score after unchecking "won by default"', async ({ page, common, login, match }) => {
        await page.goto('/season/2021/spring/men-35');
        await match.scoreButton.click();

        await match.pickMatchResult('Player defaulted');
        await expect(common.modal).toContainText('+20');
        await match.pickMatchResult('Match completed');
        await expect(common.modal).not.toContainText('+20');
    });

    test('Should add new match when there are no upcoming matches', async ({
        page,
        common,
        login,
        match,
        overview,
    }) => {
        await page.goto('/season/2021/spring/men-35');
        await overview.reportMatchButton.click();

        await expect(match.challengerSelect).toHaveValue('0');
        await expect(match.acceptorSelect).toHaveValue('0');

        await match.pickChallengerOption('Matthew Burt');
        await match.nextButton.click();

        await match.pickChallengerPoints(6);
        await match.pickAcceptorPoints(1);
        await new Promise((resolve) => setTimeout(resolve, 1000));

        await match.pickChallengerPoints(6);
        await match.pickAcceptorPoints(1);
        await expect(common.modal).toContainText('+24');
        await common.modalSubmitButton.click();

        await expect(common.modal).toBeHidden();
        await expect(common.body).toContainText('+24');
        await expectRecordToExist('matches', { score: '6-1 6-1' });

        // Check that an email is sent
        const emailSent = await expectRecordToExist('emails', {
            recipientEmail: 'player4@gmail.com',
            subject: 'You Have New Match Results!',
        });
        expect(emailSent.html).toContain('Matthew Burt beat Ben Done: 6-1 6-1');
        expect(imageRegex.test(emailSent.html)).toBeTruthy();
    });

    test('Should add new match won by injury with score 0-0', async ({ page, common, login, match, overview }) => {
        await page.goto('/season/2021/spring/men-35');
        await overview.reportMatchButton.click();

        await match.pickAcceptorOption('Matthew Burt');
        await match.nextButton.click();

        await match.pickMatchResult('Player retired');
        await common.modalSubmitButton.click();

        await expect(match.getBadgeWithPoints('+31')).toBeVisible();
        await expect(match.getBadgeWithPoints('+2')).toBeVisible();

        await common.modalSubmitButton.click();

        await expect(common.modal).toBeHidden();

        await expect(common.body).toContainText('+31');
        await expect(common.body).toContainText('+2');

        await expectRecordToExist(
            'matches',
            { score: '0-0' },
            {
                winner: 2,
                wonByDefault: 0,
                wonByInjury: 1,
                challengerPoints: 31,
                acceptorPoints: 2,
                challengerEloChange: 0,
                acceptorEloChange: 0,
            }
        );
    });

    test('Should get tlr partly for match won by injury', async ({ page, common, login, match, overview }) => {
        await page.goto('/season/2021/spring/men-35');
        await overview.reportMatchButton.click();

        await match.pickAcceptorOption('Matthew Burt');

        await match.nextButton.click();

        await match.pickMatchResult('Player retired');
        await common.modalSubmitButton.click();

        await match.pickChallengerPoints(2);
        await match.pickAcceptorPoints(2);

        await common.modalSubmitButton.click();
        await expect(common.modal).toBeHidden();

        await expectRecordToExist(
            'matches',
            { score: '2-2' },
            {
                winner: 2,
                wonByDefault: 0,
                wonByInjury: 1,
                challengerPoints: 29,
                acceptorPoints: 4,
                challengerEloChange: 3,
                acceptorEloChange: -6,
            }
        );
    });

    test('Should add new match taking the player from suggestions', async ({
        page,
        common,
        login,
        match,
        overview,
    }) => {
        await runQuery(`UPDATE matches SET playedAt="${dayjs.tz().format('YYYY-MM-DD HH:mm:ss')}" WHERE id=9`);

        await page.goto('/season/2021/spring/men-35');
        await expect(overview.upcomingMatchesArea).toBeVisible();
        await overview.reportMatchButton.click();

        await common.modal.locator('button').getByText('Gary').click();

        await match.pickChallengerPoints(6);
        await match.pickAcceptorPoints(1);
        await new Promise((resolve) => setTimeout(resolve, 1000));

        await match.pickChallengerPoints(6);
        await match.pickAcceptorPoints(1);
        await expect(common.modal).toContainText('+29');
        await common.modalSubmitButton.click();
        await expect(common.modal).toBeHidden();

        await expect(common.body).toContainText('+29');
        await expectRecordToExist('matches', { score: '6-1 6-1' });
        await expect(overview.upcomingMatchesArea).toBeHidden();
    });

    test('Should add new match taking the another player from suggestions', async ({
        page,
        common,
        login,
        match,
        overview,
    }) => {
        await runQuery(`UPDATE matches SET playedAt="${dayjs.tz().format('YYYY-MM-DD HH:mm:ss')}" WHERE id=9`);

        await page.goto('/season/2021/spring/men-35');
        await overview.reportMatchButton.click();

        await common.modal.locator('button').getByText('Another').click();

        await match.pickChallengerOption('Matthew Burt');

        await match.nextButton.click();

        await match.pickChallengerPoints(6);
        await match.pickAcceptorPoints(1);
        await new Promise((resolve) => setTimeout(resolve, 1000));

        await match.pickChallengerPoints(6);
        await match.pickAcceptorPoints(1);
        await expect(common.modal).toContainText('+24');

        await common.modalSubmitButton.click();
        await expect(common.body).toContainText('+24');
        await expectRecordToExist('matches', { score: '6-1 6-1' });
    });

    test('Should not show inactive user when adding a new match', async ({ page, common, login, match, overview }) => {
        await page.goto('/season/2021/spring/men-35');
        await overview.reportMatchButton.click();

        await expect(match.challengerSelect).not.toContainText('Inactive');
    });

    test('Should show error when adding a match', async ({ page, common, login, match, overview }) => {
        await page.goto('/season/2021/spring/men-35');
        await overview.reportMatchButton.click();

        await match.pickChallengerOption('Matthew Burt');

        await match.nextButton.click();

        await runQuery(`UPDATE players SET tournamentId=8 WHERE id=4`);

        await match.pickChallengerPoints(3);
        await new Promise((resolve) => setTimeout(resolve, 1000));

        await match.pickChallengerPoints(3);
        await new Promise((resolve) => setTimeout(resolve, 1000));

        await common.modalSubmitButton.click();
        await expect(common.alert).toContainText('All players should be from the same tournament.');
    });

    test('Should show duplication warning when adding a match', async ({ page, common, login, match, overview }) => {
        await page.goto('/season/2021/spring/men-35');
        await overview.reportMatchButton.click();

        await match.pickChallengerOption('Gary Mill');
        await match.nextButton.click();

        await match.pickChallengerPoints(3);
        await new Promise((resolve) => setTimeout(resolve, 1000));

        await match.pickChallengerPoints(3);
        await new Promise((resolve) => setTimeout(resolve, 1000));

        await common.modalSubmitButton.click();
        await expect(common.body).toContainText('Duplicated match?');
        await common.modal.locator('button').getByText("Yes, it's another match").click();
        await expect(common.alert).toContainText('The match has been reported');

        await expect(common.body).toContainText('+21');
    });

    test('Should show error when patching a match', async ({ page, common, login, match }) => {
        await page.goto('/season/2021/spring/men-35');
        await match.scoreButton.click();

        await runQuery(`UPDATE players SET userId=4 WHERE userId=1`);

        await match.pickChallengerPoints(3);
        await new Promise((resolve) => setTimeout(resolve, 1000));

        await match.pickChallengerPoints(3);
        await new Promise((resolve) => setTimeout(resolve, 1000));

        await common.modalSubmitButton.click();
        await expect(common.alert).toContainText('You did not play in this match.');
    });

    test('Should show error when the score is incorrect', async ({ page, common, login, match }) => {
        await page.goto('/season/2021/spring/men-35');
        await match.scoreButton.click();

        await match.pickChallengerPoints(7);
        await match.pickAcceptorPoints(7);

        await expect(common.body).toContainText('The score is incorrect');
    });

    test.skip('Should add the stats for the match', async ({ page, common, login, match }) => {
        await runQuery(`UPDATE matches SET stat=NULL WHERE id=1`);

        await page.goto('/season/2021/spring/men-35');
        await expect(page.locator('[data-match-stats="1"]')).toBeHidden();
        await page.locator('[data-match-actions="1"]').click();
        await page.locator('[data-add-stats-match="1"]').click();

        await common.modalSubmitButton.click();
        await expect(common.modal).toContainText('Link is required');

        await page.locator('input[name=link]').fill('https://swing.tennis/matches/wrong');
        await common.modalSubmitButton.click();
        await expect(common.modal).toContainText('Link is wrong');

        await page
            .locator('input[name=link]')
            .fill('https://swing.tennis/matches/073d6533-3f45-408a-baf3-7e3eaada621b');
        await common.modalSubmitButton.click();
        await expect(common.modal).toContainText(
            "The match score (6-2 6-4) doesn't match the score from the link (7-5 6-2)."
        );

        await runQuery(`UPDATE matches SET score="7-5 6-2" WHERE id=1`);
        await common.modalSubmitButton.click();
        await expect(common.modal).toContainText("doesn't match the date from the link (Oct 8, 2022).");

        await runQuery(`UPDATE matches SET playedAt="2022-10-08 16:26:41" WHERE id=1`);
        await common.modalSubmitButton.click();

        await expect(common.modal).toContainText('01:51', { timeout: 15000 });
        await expect(common.modal).toContainText('Winners');
        await expect(common.modal).toContainText('Unforced Errors');
        await expect(common.modal).toContainText('Forced Errors');
        await expect(common.modal.locator('[data-stats-challenger-total-points]')).toContainText('78/140');
        await expect(common.modal.locator('[data-stats-acceptor-total-points]')).toContainText('62/140');

        {
            const record = await expectRecordToExist(
                'matches',
                { id: 1 },
                { swingMatchId: '073d6533-3f45-408a-baf3-7e3eaada621b', statAddedBy: 1 }
            );
            const stat = JSON.parse(record.stat);
            expect(stat.imageUrl).toBeTruthy();
        }

        {
            const email = await expectRecordToExist('emails', { subject: 'You Have New Match Stats!' });
            expect(email.html).toContain('<b>Ben Done</b> uploaded statistics');
            expect(email.recipientEmail).toBe('player2@gmail.com');
        }
    });

    test.skip('Should add the stats with reversed score', async ({ page, common, login, match }) => {
        await runQuery(`UPDATE matches SET score="5-7 2-6", stat=NULL, playedAt="2022-10-08 16:26:41" WHERE id=1`);

        await page.goto('/season/2021/spring/men-35/matches');
        await page.locator('[data-match-actions="1"]').click();
        await page.locator('[data-add-stats-match="1"]').click();

        await common.modal
            .locator('input[name=link]')
            .fill('https://swing.tennis/matches/073d6533-3f45-408a-baf3-7e3eaada621b');
        await common.modalSubmitButton.click();
        await expect(common.modal.locator('[data-stats-challenger-total-points]')).toContainText('62/140');
        await expect(common.modal.locator('[data-stats-acceptor-total-points]')).toContainText('78/140');
    });

    test.skip('Should show error when using 404 links', async ({ page, common, login, match }) => {
        await page.goto('/season/2021/spring/men-35/matches');
        await page.locator('[data-match-actions="1"]').click();
        await page.locator('[data-add-stats-match="1"]').click();

        await common.modal
            .locator('input[name=link]')
            .fill('https://swing.tennis/matches/073d6533-3f45-408a-baf3-7e3eaada621f');
        await common.modalSubmitButton.click();
        await expect(common.modal).toContainText('Something wrong with processing this link');
    });

    test.skip('Should show error when using link without stat', async ({ page, common, login, match }) => {
        await page.goto('/season/2021/spring/men-35/matches');
        await page.locator('[data-match-actions="1"]').click();
        await page.locator('[data-add-stats-match="1"]').click();

        await common.modal
            .locator('input[name=link]')
            .fill('https://swing.tennis/matches/67e283e2-3edc-404f-b0aa-11e216299f60');
        await common.modalSubmitButton.click();
        await expect(common.modal).toContainText('The score from this link is incorrect');
    });

    test('Should schedule the match', async ({ page, common, login, match, overview, proposal }) => {
        await page.goto('/season/2021/spring/men-35');
        await overview.clickOtherAction('Schedule match');

        await match.pickChallengerOption('Matthew Burt');

        await match.nextButton.click();

        await common.modalSubmitButton.click();
        await expect(common.modal).toContainText('Date is required.');
        await expect(common.modal).toContainText('Location is required.');

        await expect(common.modal).not.toContainText(match.FINAL_SCHEDULE_TEXT);
        await expect(common.modal).not.toContainText(match.REGULAR_RESCHEDULE_TEXT);

        await proposal.pickSundayNextWeek();
        await proposal.placeField.fill('Preston park');
        await common.modalSubmitButton.click();

        await expect(common.alert).toContainText('Your match has been scheduled.');
        await expectRecordToExist('matches', { place: 'Preston park' }, { comment: null });

        await expect(overview.upcomingMatchesArea).toContainText('Matthew');
        await expect(overview.upcomingMatchesArea).toContainText('Sun');

        // Check email
        {
            const email = await expectRecordToExist('emails', { subject: 'Your Match Is Scheduled' });
            expect(email.replyTo).toContain('Ben Done');
            expect(email.replyTo).toContain('player1@gmail.com');
            expect(email.html).toContain('Matthew Burt');
            expect(email.html).toContain('Ben Done');
            expect(email.html).toContain('scheduled a match.');
            expect(email.html).toContain('Preston park');
            expect(email.recipientEmail).toBe('player4@gmail.com');
        }
    });

    test('Should not show other upcoming matches', async ({ page, common, login, match, overview, proposal }) => {
        await login.loginAsPlayer3();
        await page.goto('/season/2021/spring/men-35');

        await expect(common.body).toContainText('Reminders About Rival Rules');
        await expect(overview.upcomingMatchesArea).toBeHidden();
    });

    test('Should schedule the match, then remove it from the list', async ({
        page,
        common,
        overview,
        match,
        proposal,
    }) => {
        await page.goto('/season/2021/spring/men-35');
        await overview.clickOtherAction('Schedule match');

        await match.pickChallengerOption('Matthew Burt');

        await match.nextButton.click();

        await proposal.pickSundayNextWeek();
        await proposal.placeField.fill('Preston park');
        await common.modalSubmitButton.click();

        await expect(common.alert).toContainText('Your match has been scheduled.');
        const upcomingMatch = await expectRecordToExist(
            'matches',
            { place: 'Preston park' },
            { initial: 6, comment: null }
        );

        await page.locator(`[data-match-actions="${upcomingMatch.id}"]`).click();
        await expect(common.body).not.toContainText('Unaccept proposal');
        await page.locator('button').getByText('Delete match').click();
        await common.modal.locator('button').getByText('Delete match').click();
        await expect(common.modal).toContainText('The reason is required');

        await page.locator('input[name="reason"]').fill('I am sick');
        await common.modal.locator('button').getByText('Delete match').click();
        await expect(common.alert).toContainText('The match has been deleted');

        await expect(page.locator(`[data-match-actions="${upcomingMatch.id}"]`)).toBeHidden();

        // Check that the message has been sent
        const emailSent = await expectRecordToExist('emails', {
            recipientEmail: 'player4@gmail.com',
            subject: 'Ben Done deleted your scheduled match',
        });
        expect(emailSent.html).toContain('Ben Done');
        expect(emailSent.html).toContain('deleted your scheduled match for ');
        expect(emailSent.html).toContain('I am sick');
        expect(emailSent.html).toContain('5:00 PM');
        expect(emailSent.html).toContain('player1@gmail.com');
        expect(emailSent.html).toContain('123-456-7890');
        expect(emailSent.html).toContain('sms:1234567890');
    });
})();

// Notification about established TLR
(() => {
    const updateMatches = async (score: string, winner = 'challengerId') => {
        await runQuery(`
            UPDATE matches
               SET score="${score}",
                   winner=${winner},
                   playedAt="2010-10-10 10:10:10"
             WHERE score IS NOT NULL`);
    };

    const suitableLevelText = 'on the best ladder for your level';
    const moveText = 'we recommend you move';

    test('Should send notification about established TLR for suitable ladder for new match', async ({
        page,
        common,
        overview,
        match,
    }) => {
        await updateMatches('7-6 7-6', 'challengerId');
        await overrideConfig({ minMatchesToEstablishTlr: 5 });

        await page.goto('/season/2021/spring/men-35/matches');
        await overview.reportMatchButton.click();

        await match.pickChallengerOption('Matthew Burt');

        await match.nextButton.click();

        await match.pickChallengerPoints(7);
        await match.pickAcceptorPoints(6);
        await new Promise((resolve) => setTimeout(resolve, 1000));

        await match.pickChallengerPoints(7);
        await match.pickAcceptorPoints(6);

        await common.modalSubmitButton.click();

        const email = await expectRecordToExist('emails', {
            subject: "You've Established Your TLR!",
            recipientEmail: 'player1@gmail.com',
        });
        expect(email.html).toContain('3.49');
        expect(email.html).toContain('first 5 matches');
        expect(email.html).toContain('Men 3.5');
        expect(email.html).toContain(suitableLevelText);
        expect(email.html).not.toContain(moveText);
    });

    test('Should send notification about established TLR and move up ladder for proposed match', async ({
        page,
        common,
        match,
    }) => {
        await updateMatches('6-0 6-0', 'challengerId');
        await overrideConfig({ minMatchesToEstablishTlr: 5 });

        await page.goto('/season/2021/spring/men-35');
        await match.scoreButton.click();

        await match.pickChallengerPoints(0);
        await new Promise((resolve) => setTimeout(resolve, 1000));

        await match.pickChallengerPoints(0);

        await common.modalSubmitButton.click();

        const email = await expectRecordToExist('emails', {
            subject: "You've Established Your TLR!",
            recipientEmail: 'player1@gmail.com',
        });
        expect(email.html).toContain('4.03');
        expect(email.html).toContain('Men 3.5');
        expect(email.html).toContain('Men 4.0');
        expect(email.html).not.toContain(suitableLevelText);
        expect(email.html).toContain(moveText);
        expect(email.html).toContain('move up');
        expect(email.html).toContain('you will not be eligible for the Men 3.5');

        // Check that we don't send notification twice
        await page.locator('[data-match-actions]').click();
        await page.locator('button').getByText('Edit', { exact: true }).click();
        await common.modal.locator('button').getByText('Report match').click();

        await expect(common.alert).toContainText('has been reported');
        await new Promise((resolve) => setTimeout(resolve, 3000));

        expect(await getNumRecords('emails', { subject: "You've Established Your TLR!" })).toBe(1);
    });

    test('Should send notification about established TLR and move down ladder for proposed match', async ({
        common,
        page,
        match,
    }) => {
        await updateMatches('0-6 0-6', 'acceptorId');
        await overrideConfig({ minMatchesToEstablishTlr: 5 });

        await page.goto('/season/2021/spring/men-35');
        await match.scoreButton.click();

        await match.pickAcceptorPoints(0);
        await new Promise((resolve) => setTimeout(resolve, 1000));

        await match.pickAcceptorPoints(0);

        await common.modalSubmitButton.click();

        const email = await expectRecordToExist('emails', {
            subject: "You've Established Your TLR!",
            recipientEmail: 'player1@gmail.com',
        });
        expect(email.html).toContain('2.97');
        expect(email.html).toContain('Men 3.5');
        expect(email.html).toContain('Men 3.0');
        expect(email.html).not.toContain(suitableLevelText);
        expect(email.html).toContain(moveText);
        expect(email.html).toContain('move down');
    });

    test('Should send notification about established TLR and no suggestions based on gender ladder', async ({
        common,
        page,
        match,
    }) => {
        await updateMatches('0-6 0-6', 'acceptorId');
        await runQuery(`UPDATE levels SET name=CONCAT("Women All ", id) WHERE id!=2`);
        await overrideConfig({ minMatchesToEstablishTlr: 5 });

        await page.goto('/season/2021/spring/men-35');
        await match.scoreButton.click();

        await match.pickAcceptorPoints(0);
        await new Promise((resolve) => setTimeout(resolve, 1000));

        await match.pickAcceptorPoints(0);

        await common.modalSubmitButton.click();

        const email = await expectRecordToExist('emails', {
            subject: "You've Established Your TLR!",
            recipientEmail: 'player1@gmail.com',
        });
        expect(email.html).toContain('2.97');
        expect(email.html).not.toContain('Men 3.5');
        expect(email.html).not.toContain('Men 3.0');
        expect(email.html).not.toContain(suitableLevelText);
        expect(email.html).not.toContain(moveText);
    });
})();

// On matches page
(() => {
    test('Should add new match on matches page', async ({ page, common, login, match, overview }) => {
        await page.goto('/season/2021/spring/men-35/matches');
        await overview.reportMatchButton.click();

        await match.pickChallengerOption('Matthew Burt');

        await match.nextButton.click();

        await match.pickChallengerPoints(6);
        await match.pickAcceptorPoints(1);
        await new Promise((resolve) => setTimeout(resolve, 1000));

        await match.pickChallengerPoints(6);
        await match.pickAcceptorPoints(1);
        await expect(common.modal).toContainText('+24');

        await common.modalSubmitButton.click();
        await expect(common.body).toContainText('+24');
        await expectRecordToExist('matches', { score: '6-1 6-1' });
    });

    test('Should add new match taking the player from suggestions for matches page', async ({
        page,
        common,
        login,
        overview,
        match,
    }) => {
        await runQuery(`UPDATE matches SET playedAt="${dayjs.tz().format('YYYY-MM-DD HH:mm:ss')}" WHERE id=9`);

        await page.goto('/season/2021/spring/men-35/matches');
        await overview.reportMatchButton.click();

        await common.modal.locator('button').getByText('Gary').click();

        await match.pickChallengerPoints(6);
        await match.pickAcceptorPoints(1);
        await new Promise((resolve) => setTimeout(resolve, 1000));

        await match.pickChallengerPoints(6);
        await match.pickAcceptorPoints(1);
        await expect(common.modal).toContainText('+29');

        await common.modalSubmitButton.click();
        await expect(common.body).toContainText('+29');
        await expectRecordToExist('matches', { score: '6-1 6-1' });
    });

    test('Should add new match taking the another player from suggestions for matches page', async ({
        page,
        common,
        overview,
        match,
    }) => {
        await runQuery(`UPDATE matches SET playedAt="${dayjs.tz().format('YYYY-MM-DD HH:mm:ss')}" WHERE id=9`);

        await page.goto('/season/2021/spring/men-35/matches');
        await overview.reportMatchButton.click();

        await common.modal.locator('button').getByText('Another').click();

        await match.pickChallengerOption('Matthew Burt');

        await match.nextButton.click();

        await match.pickChallengerPoints(6);
        await match.pickAcceptorPoints(1);
        await new Promise((resolve) => setTimeout(resolve, 1000));

        await match.pickChallengerPoints(6);
        await match.pickAcceptorPoints(1);
        await expect(common.modal).toContainText('+24');

        await common.modalSubmitButton.click();
        await expect(common.body).toContainText('+24');
        await expectRecordToExist('matches', { score: '6-1 6-1' });
    });

    test('Should edit my match', async ({ page, common, login, match }) => {
        await page.goto('/season/2021/spring/men-35/matches');
        await page.locator('[data-match-actions="1"]').click();
        await page.locator('[data-edit-match="1"]').click();

        await match.pickChallengerPoints(3);
        await new Promise((resolve) => setTimeout(resolve, 1000));
        await common.modal.locator('a').getByText('Set 2').click();

        await match.pickChallengerPoints(4);

        await expect(common.modal).toContainText('+11');
        await expect(common.modal).toContainText('+22');
        await common.modalSubmitButton.click();

        await expect(common.body).toContainText('+11');
        await expect(common.body).toContainText('+22');
        await expectRecordToExist('matches', { id: 1 }, { score: '3-6 4-6' });
    });

    test('Should reschedule my upcoming match', async ({ page, common, login, match, proposal }) => {
        await page.goto('/season/2021/spring/men-35');
        await page.locator('[data-match-actions="9"]').click();
        await expect(common.body).toContainText('Winston');
        await expect(common.body).toContainText('Too late');
        await page.locator('[data-reschedule-match="9"]').click();

        await expect(common.modal).not.toContainText(match.FINAL_SCHEDULE_TEXT);
        await expect(common.modal).toContainText(match.REGULAR_RESCHEDULE_TEXT);

        await proposal.pickSundayNextWeek();
        await proposal.placeField.fill('Preston park');
        await common.modal.locator('button').getByText('Reschedule match').click();

        await expect(common.alert).toContainText('successfuly rescheduled');
        await page.locator('[data-match-actions="9"]').click();
        await expect(common.body).toContainText('Preston park');
        await expect(common.body).not.toContainText('Too late');

        await expectRecordToExist('matches', { id: 9 }, { place: 'Preston park', comment: null });

        const email = await expectRecordToExist('emails', { subject: 'Your Match Was Rescheduled' });
        expect(email.replyTo).toContain('Ben Done');
        expect(email.replyTo).toContain('player1@gmail.com');
        expect(email.html).toContain('Gary Mill</a>');
        expect(email.html).toContain('Ben Done</a>');
        expect(email.html).toContain('rescheduled a match.');
        expect(email.html).toContain('Preston park');
        expect(email.html).toContain('Sun,');
        expect(email.recipientEmail).toBe('player2@gmail.com');
    });

    test('Should get wonByDefault value from my match', async ({ page, common, login, match }) => {
        await runQuery(`UPDATE matches SET wonByDefault=1`);

        await page.goto('/season/2021/spring/men-35/matches');
        await page.locator('[data-match-actions="1"]').click();
        await page.locator('[data-edit-match="1"]').click();
        await expect(common.modal.locator('[data-html-select="result"]')).toContainText('Player defaulted');
    });

    test('Should delete a match', async ({ page, common, match }) => {
        await page.goto('/season/2021/spring/men-35/matches');
        await page.locator('[data-match-actions="1"]').click();
        await page.locator('[data-delete-match="1"]').click();

        await match.reasonField.fill('I am sick');
        await common.modal.locator('button').getByText('Delete match').click();

        await expect(common.alert).toContainText('The match has been deleted.');
        await expect(page.locator('[data-match="1"]')).toBeHidden();

        const email = await expectRecordToExist('emails', { subject: 'Ben Done Deleted Your Match' });
        expect(email.replyTo).toContain('Ben Done');
        expect(email.replyTo).toContain('player1@gmail.com');
        expect(email.recipientEmail).toBe('player2@gmail.com');
        expect(email.html).toContain('Ben Done</a></b> deleted your match');
        expect(email.html).toContain('I am sick');
    });

    test('Should see an error when no reason is provided', async ({ page, common }) => {
        await page.goto('/season/2021/spring/men-35');
        await page.locator('[data-match-actions="9"]').click();
        await page.locator('button').getByText('Unaccept proposal').click();
        await common.modal.locator('button').getByText('Unaccept proposal').click();

        await expect(common.modal).toContainText('is required');
    });

    test('Should unaccept proposal from upcoming matches', async ({ page, common, match }) => {
        await page.goto('/season/2021/spring/men-35');
        await page.locator('[data-match-actions="9"]').click();
        await page.locator('button').getByText('Unaccept proposal').click();
        await match.reasonField.fill('I am sick');
        await common.modal.locator('button').getByText('Unaccept proposal').click();
        await expect(common.alert).toContainText('has been unaccepted');

        await expect(page.locator('[data-match-actions="9"]')).toBeHidden();

        // Check that the message has been sent
        await new Promise((resolve) => setTimeout(resolve, 500));
        const emailSent = await getRecord('emails', { recipientEmail: 'player2@gmail.com' });
        expect(emailSent.subject).toContain('Ben Done unaccepted the proposal for');
        expect(emailSent.html).toContain('Ben Done</a></b> unaccepted the proposal for a match in Men 3.5');
        expect(emailSent.html).toContain('I am sick');
        expect(emailSent.html).toContain('player1@gmail.com');
        expect(emailSent.html).toContain('123-456-7890');
        expect(emailSent.html).toContain('sms:1234567890');
    });

    test('Should delete proposal from upcoming matches', async ({ page, common, login, match }) => {
        await runQuery(`UPDATE matches SET challengerId=2, acceptorId=1 WHERE id=9`);

        await page.goto('/season/2021/spring/men-35');
        await page.locator('[data-match-actions="9"]').click();
        await page.locator('button').getByText('Delete proposal').click();
        await match.reasonField.fill('I am sick');
        await common.modal.locator('button').getByText('Delete proposal').click();
        await expect(common.alert).toContainText('has been deleted');

        await expect(page.locator('[data-match-actions="9"]')).toBeHidden();

        // Check that the message has been sent
        await new Promise((resolve) => setTimeout(resolve, 500));
        const emailSent = await getRecord('emails', { recipientEmail: 'player2@gmail.com' });
        expect(emailSent.subject).toContain('Ben Done deleted the proposal for');
        expect(emailSent.html).toContain('Ben Done</a></b> deleted the proposal for a match in Men 3.5.');
        expect(emailSent.html).toContain('I am sick');
        expect(emailSent.html).toContain('player1@gmail.com');
        expect(emailSent.html).toContain('123-456-7890');
        expect(emailSent.html).toContain('sms:1234567890');
    });
})();

// Final tournament
(() => {
    const semiFinalSubject = "You're in the Semifinals of the Men 3.5 Final Tournament!";
    const finalSubject = 'Your Final Match Awaits for the Men 3.5 Final Tournament!';
    const byeSubject = "You're Receiving a Bye for the Men 3.5 Final Tournament!";

    test('Should not generate final tournament seeds as the tournament is canceled', async ({
        page,
        common,
        login,
    }) => {
        const dateTwoDaysAgo = dayjs.tz().subtract(2, 'day').format('YYYY-MM-DD HH:mm:ss');
        await runQuery(`UPDATE seasons SET endDate="${dateTwoDaysAgo}" WHERE id=1`);

        await page.goto('/season/2021/spring/men-35');
        await expect(page.locator('[data-final-tournament-area]')).toBeHidden();
    });

    test('Should show the message that not enough people signed up for the tournament', async ({
        page,
        common,
        login,
        match,
    }) => {
        const dateTwoDaysAgo = dayjs.tz().subtract(2, 'day').format('YYYY-MM-DD HH:mm:ss');
        await runQuery(`UPDATE seasons SET endDate="${dateTwoDaysAgo}" WHERE id=1`);
        await overrideConfig({ minMatchesToPlanTournament: 2 });

        await page.goto('/season/2021/spring/men-35');
        await expect(common.body).toContainText('No tournament is scheduled for the Men 3.5');
        await expect(common.body).toContainText('at least 4');
    });

    test('Should not show the message about not enough people if we have the final matches', async ({
        page,
        common,
    }) => {
        const dateTwoDaysAgo = dayjs.tz().subtract(2, 'day').format('YYYY-MM-DD HH:mm:ss');
        await runQuery(`UPDATE seasons SET endDate="${dateTwoDaysAgo}" WHERE id=1`);
        await overrideConfig({ minMatchesToPlanTournament: 2 });
        await runQuery(`UPDATE matches SET type="final", finalSpot=1 WHERE id=1`);

        await page.goto('/season/2021/spring/men-35');
        await expect(common.body).not.toContainText('There is no tournament');
    });

    test('Should see the tournament information block', async ({ page, common, login, match }) => {
        const dateTwoDaysAgo = dayjs.tz().subtract(2, 'day').format('YYYY-MM-DD HH:mm:ss');
        await runQuery(`UPDATE players SET readyForFinal=1 WHERE userId!=2`);
        await runQuery(`UPDATE seasons SET endDate="${dateTwoDaysAgo}" WHERE id=1`);
        await overrideConfig({ minMatchesToPlanTournament: 2, minPlayersToRunTournament: 2 });

        await page.goto('/season/2021/spring/men-35');
        await page.locator('a').getByText('Tournament information').click();
        await expect(common.body).toContainText('Tournament seeding will operate');
        await expect(common.body).toContainText('Quarterfinals are between Monday');
        await expect(common.body).not.toContainText('$sunday');
    });

    test('Should see the final tournament opponent contact information', async ({ page, common, overview }) => {
        const dateTwoDaysAgo = dayjs.tz().subtract(2, 'day').format('YYYY-MM-DD HH:mm:ss');
        await runQuery(`UPDATE players SET readyForFinal=1 WHERE userId!=2`);
        await runQuery(`UPDATE seasons SET endDate="${dateTwoDaysAgo}" WHERE id=1`);
        await runQuery(`UPDATE matches SET playedAt="2021-12-12" WHERE challenger2Id IS NOT NULL`);
        await overrideConfig({ minMatchesToPlanTournament: 2, minPlayersToRunTournament: 2 });

        await page.goto('/season/2021/spring/men-35');
        await expect(overview.finalTournamentArea).toContainText('Matthew Burt2');

        await page.locator('a').getByText('Matthew Burt').click();
        await expect(common.body).toContainText('player4@gmail.com');
        await expect(common.body).toContainText('920-391-9530');
    });

    // Brackets generated
    {
        const thanksTitle = 'Thanks for Playing';
        const bracketTitle = 'Rival Bracket Battle!';

        test('Should get final tournament bracket email', async ({ page, common, login, match }) => {
            const dateTwoDaysAgo = dayjs.tz().subtract(2, 'day').format('YYYY-MM-DD HH:mm:ss');
            await runQuery(`UPDATE players SET readyForFinal=1 WHERE userId!=2`);
            await runQuery(`UPDATE seasons SET endDate="${dateTwoDaysAgo}" WHERE id=1`);
            await runQuery(`UPDATE matches SET playedAt="2021-12-12" WHERE challenger2Id IS NOT NULL`);
            await overrideConfig({ minMatchesToPlanTournament: 2, minPlayersToRunTournament: 2 });

            await page.goto('/season/2021/spring/men-35');
            const email = await expectRecordToExist('emails', { subject: 'Tournament Matchups' });

            expect(email.html).toContain('The Top 8 players');
            expect(email.html).toContain(thanksTitle);
            expect(email.html).not.toContain(bracketTitle);
        });

        test('Should get final tournament bracket email and bracket battle information', async ({
            page,
            common,
            login,
        }) => {
            const dateTwoDaysAgo = dayjs.tz().subtract(2, 'day').format('YYYY-MM-DD HH:mm:ss');
            await runQuery(`UPDATE players SET readyForFinal=1 WHERE userId!=2`);
            await runQuery(`UPDATE seasons SET endDate="${dateTwoDaysAgo}" WHERE id=1`);
            await runQuery(`UPDATE matches SET playedAt="2021-12-12" WHERE challenger2Id IS NOT NULL`);
            await overrideConfig({
                minMatchesToPlanTournament: 2,
                minPlayersForPrediction: 2,
                minPlayersToRunTournament: 2,
            });

            await page.goto('/season/2021/spring/men-35');
            const email = await expectRecordToExist('emails', {
                subject: 'Tournament Matchups and Rival Bracket Battle',
            });

            expect(email.html).toContain('The Top 8 players');
            expect(email.html).toContain(thanksTitle);
            expect(email.html).toContain(bracketTitle);
            expect(email.html).toContain('The Oracle');
        });
    }

    test('Should see the final tournament seeds and report the score', async ({ page, common, overview, match }) => {
        const dateTwoDaysAgo = dayjs.tz().subtract(2, 'day').format('YYYY-MM-DD HH:mm:ss');
        await runQuery(`UPDATE players SET readyForFinal=1 WHERE userId!=2`);
        await runQuery(`UPDATE seasons SET endDate="${dateTwoDaysAgo}" WHERE id=1`);
        await runQuery(
            `UPDATE matches SET challengerElo=1700, acceptorElo=1300, challengerMatches=100, acceptorMatches=100`
        );
        await runQuery(`UPDATE matches SET challengerPoints=11, acceptorPoints=22 WHERE id=2`);
        await overrideConfig({ minMatchesToPlanTournament: 2, minPlayersToRunTournament: 2 });

        await page.goto('/season/2021/spring/men-35');
        await expectRecordToExist('emails', {
            recipientEmail: 'player1@gmail.com',
            subject: semiFinalSubject,
        });
        await expectRecordToExist('emails', {
            recipientEmail: 'player3@gmail.com',
            subject: byeSubject,
        });

        const email = await expectRecordToExist('emails', {
            recipientEmail: 'player4@gmail.com',
            subject: semiFinalSubject,
        });
        expect(email.html).toContain('player1@gmail.com');
        expect(email.html).toContain('123-456-7890');
        expect(email.html).toContain('sms:1234567890');

        await expect(overview.finalTournamentArea).toContainText('Done3');
        await expect(overview.finalTournamentArea).not.toContainText('Quarterfinals');
        await expect(overview.finalAvailableMark).toBeVisible();

        await page.locator('[data-final-tournament-area]').locator('a').getByText('Score').click();
        await match.pickAcceptorPoints(3);
        await new Promise((resolve) => setTimeout(resolve, 1000));
        await match.pickAcceptorPoints(2);

        // change createdAt dates
        const dateTwoWeeksAgo = dayjs.tz().subtract(2, 'week').format('YYYY-MM-DD HH:mm:ss');
        await runQuery(`UPDATE matches SET createdAt="${dateTwoWeeksAgo}"`);

        await common.modalSubmitButton.click();
        await expectRecordToExist('matches', { finalSpot: 2, score: '6-3 6-2' });
        await expectRecordToExist('emails', {
            recipientEmail: 'player1@gmail.com',
            subject: finalSubject,
        });
        await expectRecordToExist('emails', {
            recipientEmail: 'player3@gmail.com',
            subject: finalSubject,
        });

        // We don't see location
        await expect(page.locator('[data-final-match-location]')).toBeHidden();

        // Check that an email is sent
        const emailSent = await expectRecordToExist('emails', {
            recipientEmail: 'player4@gmail.com',
            subject: 'You Have New Match Results!',
        });
        expect(emailSent.subject).toBe('You Have New Match Results!');
        expect(emailSent.html).toContain('Ben Done beat Matthew Burt: 6-3 6-2');
        expect(imageRegex.test(emailSent.html)).toBeTruthy();

        await page.locator('[data-final-tournament-area]').locator('a').getByText('Score').click();
        await match.pickAcceptorPoints(3);
        await new Promise((resolve) => setTimeout(resolve, 1000));
        await match.pickAcceptorPoints(2);
        await common.modalSubmitButton.click();
        await expectRecordToExist('matches', { finalSpot: 1, score: '6-3 6-2' });

        await expect(page.locator('h3').getByText('Cristopher Hamiltonbeach')).toBeVisible();

        // Try to edit the final result
        await page.locator('[data-final-spot="1"]').locator('button[data-match-actions]').click();
        await expect(page.locator('button[data-edit-match]')).toBeVisible();
        await expect(page.locator('button[data-delete-match]')).toBeHidden();
        await page.locator('[data-final-tournament-area]').locator('button[data-edit-match]').click();
        await match.pickChallengerPoints(3);
        await new Promise((resolve) => setTimeout(resolve, 1000));
        await page.locator('a').getByText('Set 2').click();
        await match.pickChallengerPoints(3);
        await common.modalSubmitButton.click();
        await expectRecordToExist('matches', { finalSpot: 1, score: '3-6 3-6' });

        await expect(page.locator('h3').getByText('Ben Done')).toBeVisible();

        expect(await getNumRecords('emails', { subject: semiFinalSubject })).toBe(2);
        expect(await getNumRecords('emails', { subject: finalSubject })).toBe(2);
        expect(await getNumRecords('emails', { subject: byeSubject })).toBe(1);

        // Check that we don't update points after the regular season has ended
        await expectRecordToExist('matches', { id: 2 }, { challengerPoints: 11, acceptorPoints: 22 });
    });

    test('Should not be able to report score before bracket battle has started', async ({
        page,
        common,
        login,
        match,
    }) => {
        const date17HoursAgo = dayjs.tz().subtract(17, 'hour').subtract(59, 'minute').format('YYYY-MM-DD HH:mm:ss');
        await runQuery(`UPDATE players SET readyForFinal=1`);
        await runQuery(`UPDATE seasons SET endDate="${date17HoursAgo}" WHERE id=1`);
        await overrideConfig({ minMatchesToPlanTournament: 2, minPlayersForPrediction: 4 });

        await page.goto('/season/2021/spring/men-35');
        await page.locator('[data-final-tournament-area]').locator('a').getByText('Score').click();

        await expect(common.modal).toContainText('Please report your score after 6 PM today.');
    });

    test('Should be able to report score after bracket battle has started', async ({ page, common, login, match }) => {
        const date18HoursAgo = dayjs.tz().subtract(18, 'hour').format('YYYY-MM-DD HH:mm:ss');
        await runQuery(`UPDATE players SET readyForFinal=1`);
        await runQuery(`UPDATE seasons SET endDate="${date18HoursAgo}" WHERE id=1`);
        await overrideConfig({ minMatchesToPlanTournament: 2, minPlayersForPrediction: 4 });

        await page.goto('/season/2021/spring/men-35');
        await page.locator('[data-final-tournament-area]').locator('a').getByText('Score').click();

        await match.pickMatchResult('Player retired');
    });

    test('Should not see prediction contest if there are not enough people', async ({ page, common, login, match }) => {
        const dateTwoHoursAgo = dayjs.tz().subtract(2, 'hour').format('YYYY-MM-DD HH:mm:ss');
        await runQuery(`UPDATE players SET readyForFinal=1`);
        await runQuery(`UPDATE seasons SET endDate="${dateTwoHoursAgo}" WHERE id=1`);
        await overrideConfig({ minMatchesToPlanTournament: 2 });

        await page.goto('/season/2021/spring/men-35');
        await expect(common.body).toContainText('Final Tournament');
        await expect(common.body).not.toContainText('Bracket Battle');
    });

    test('Should see prediction contest standings for guests', async ({ page, common, login, match }) => {
        const dateTwoDaysAgo = dayjs.tz().subtract(2, 'day').format('YYYY-MM-DD HH:mm:ss');

        await login.logout();

        await runQuery(`UPDATE players SET readyForFinal=1`);
        await runQuery(`UPDATE seasons SET endDate="${dateTwoDaysAgo}" WHERE id=1`);
        await overrideConfig({ minMatchesToPlanTournament: 2, minPlayersForPrediction: 4 });

        await page.goto('/season/2021/spring/men-35');
        await expect(common.body).toContainText('Bracket Battle');
        await expect(common.body).toContainText('Sign in');
    });

    test('Should see prediction contest standings', async ({ page, common, login, match }) => {
        const dateTwoDaysAgo = dayjs.tz().subtract(2, 'day').format('YYYY-MM-DD HH:mm:ss');
        await runQuery(`UPDATE players SET readyForFinal=1`);
        await runQuery(`UPDATE seasons SET endDate="${dateTwoDaysAgo}" WHERE id=1`);
        await overrideConfig({ minMatchesToPlanTournament: 2, minPlayersForPrediction: 4 });

        await page.goto('/season/2021/spring/men-35');

        const email = await expectRecordToExist('emails', { subject: 'Tournament Matchups and Rival Bracket Battle' });
        expect(email.html).toContain('Raleigh');
        expect(email.html).toContain('Men 3.5');
        expect(email.html).toContain('Top 8');

        await expect(common.body).toContainText('Bracket Battle');
        await page.locator('button').getByText('Standings').click();

        await expect(common.modal).toContainText('BracketBot');
        await expect(common.modal).toContainText('9');

        await page.locator('button[data-bracket-result="99998"]').click();
        await expect(common.modal).toContainText('Points: 0');
        await expect(common.modal).toContainText('Max Points: 9');
    });

    test('Should see time is out', async ({ page, common, login, match }) => {
        const dateDeadline = dayjs
            .tz()
            .subtract(17, 'hour')
            .subtract(59, 'minute')
            .subtract(55, 'second')
            .format('YYYY-MM-DD HH:mm:ss');
        await runQuery(`UPDATE players SET readyForFinal=1`);
        await runQuery(`UPDATE seasons SET endDate="${dateDeadline}" WHERE id=1`);
        await overrideConfig({ minMatchesToPlanTournament: 2, minPlayersForPrediction: 4 });

        await page.goto('/season/2021/spring/men-35');
        await expect(common.body).toContainText('Make your picks');
        await expect(common.body).toContainText('Time left: 1 s');

        await expect(common.body).toContainText('Standings');
    });

    test('Should set prediction', async ({ page, common, login, match }) => {
        const dateTwoHoursAgo = dayjs.tz().subtract(2, 'hour').format('YYYY-MM-DD HH:mm:ss');
        await runQuery(`UPDATE players SET readyForFinal=1`);
        await runQuery(`UPDATE seasons SET endDate="${dateTwoHoursAgo}" WHERE id=1`);
        await overrideConfig({ minMatchesToPlanTournament: 2, minPlayersForPrediction: 4 });

        await page.goto('/season/2021/spring/men-35');
        await expect(common.body).toContainText('Time left: 15 hours 59 min');

        await page.locator('button').getByText('Make your picks').click();

        await expect(common.modal).toContainText('0 / 3');
        await expect(common.modal).not.toContainText('Submit');
        await page.locator('[data-match-bet="3"]').locator('[data-challenger-bet="3"]').click();
        await new Promise((resolve) => setTimeout(resolve, 500));

        await page.locator('[data-match-bet="2"]').locator('[data-challenger-bet="2"]').click();
        await new Promise((resolve) => setTimeout(resolve, 500));

        await page.locator('[data-match-bet="1"]').locator('[data-challenger-bet="3"]').click();
        await expect(common.modal).toContainText('3 / 3');

        await common.modalSubmitButton.click();
        await expect(common.modal).toBeHidden();

        await expect(common.alert).toContainText('Thank you for participating in the Rival Bracket Battle!');

        await expect(common.body).toContainText('Contest starts in:');
        await expect(common.body).toContainText('15 hours 59 min');

        await page.locator('button').getByText('Your picks').click();
        await expect(common.modal).toContainText('Points: 0');
        await expect(common.modal).toContainText('Max Points: 9');
    });

    test('Should set prediction and get a badge for winner', async ({ page, common, login, match }) => {
        const dateDayAgo = dayjs.tz().subtract(1, 'day').format('YYYY-MM-DD HH:mm:ss');
        const prediction =
            '[{"finalSpot":1,"challengerId":3,"acceptorId":2,"winner":3,"sets":2},{"finalSpot":2,"challengerId":2,"acceptorId":4,"winner":2,"sets":2},{"finalSpot":3,"challengerId":3,"acceptorId":99999}]';

        await runQuery(`UPDATE players SET readyForFinal=1 WHERE userId!=2`);
        await runQuery(`UPDATE seasons SET endDate="${dateDayAgo}" WHERE id=1`);
        await runQuery(`UPDATE players SET prediction='${prediction}' WHERE id=2`);
        await overrideConfig({
            minMatchesToPlanTournament: 2,
            minPlayersForPrediction: 3,
            minPlayersToRunTournament: 2,
        });

        await page.goto('/season/2021/spring/men-35');

        await page.locator('[data-final-tournament-area]').locator('a').getByText('Score').click();
        await match.pickMatchResult('Player defaulted');
        await common.modalSubmitButton.click();
        await expect(common.alert).toContainText('The match has been reported');

        await page.locator('[data-final-tournament-area]').locator('a').getByText('Score').click();
        await match.pickMatchResult('Player defaulted');
        await page.locator('button').getByText('Cristopher Hamiltonbeach').click();

        await common.modalSubmitButton.click();
        await expect(common.alert).toContainText('The match has been reported');

        await expect(common.body).toContainText('Bracket Battle Winner');
        await expect(page.locator('[data-bet-contest]')).toContainText('Ben Done');

        await page.locator('button').getByText('Standings').click();
        await expect(common.modal).toContainText('Points');
        await expect(common.modal).not.toContainText('Max points');

        await expectRecordToExist('tournaments', { id: 2 }, { predictionWinner: 2 });

        // Check that we have credit for winning the bracket battle
        await expectRecordToExist('actions', { name: 'bracketBattleWinner' }, { tableId: 2 });

        await expectRecordToExist('emails', {
            subject: 'New Badge Earned!',
            recipientEmail: 'player1@gmail.com',
            sql: 'html LIKE "%The Oracle%"',
        });

        await page.goto('/player/ben-done');
        await expect(common.body).toContainText('The Oracle');

        await page.locator('[data-recent-badges]').click();
        await page.locator('[data-badge="oracle"]').click();
        await expect(common.modal).toContainText('Completed');
        await expect(common.modal).toContainText('Related Seasons');
        await expect(common.modal).toContainText('2021 Spring - Men 3.5');
    });

    test('Should set prediction and BracketBot will win the contest', async ({ page, common, login, match }) => {
        const dateDayAgo = dayjs.tz().subtract(1, 'day').format('YYYY-MM-DD HH:mm:ss');
        const prediction =
            '[{"finalSpot":1,"challengerId":3,"acceptorId":4,"winner":4,"sets":2},{"finalSpot":2,"challengerId":2,"acceptorId":4,"winner":4,"sets":2},{"finalSpot":3,"challengerId":3,"acceptorId":99999}]';

        await runQuery(`UPDATE players SET readyForFinal=1 WHERE userId!=2`);
        await runQuery(`UPDATE seasons SET endDate="${dateDayAgo}" WHERE id=1`);
        await runQuery(`UPDATE players SET prediction='${prediction}' WHERE id=2`);
        await overrideConfig({
            minMatchesToPlanTournament: 2,
            minPlayersForPrediction: 3,
            minPlayersToRunTournament: 2,
        });

        await page.goto('/season/2021/spring/men-35');

        await page.locator('[data-final-tournament-area]').locator('a').getByText('Score').click();
        await match.pickMatchResult('Player defaulted');
        await common.modalSubmitButton.click();
        await expect(common.alert).toContainText('The match has been reported');

        await page.locator('[data-final-tournament-area]').locator('a').getByText('Score').click();
        await match.pickMatchResult('Player defaulted');
        await page.locator('button').getByText('Cristopher Hamiltonbeach').click();

        await common.modalSubmitButton.click();
        await expect(common.alert).toContainText('The match has been reported');

        await expect(common.body).toContainText('Bracket Battle Winner');
        await expect(page.locator('[data-bet-contest]')).toContainText('BracketBot');

        await expectRecordToExist('tournaments', { id: 2 }, { predictionWinner: 99998 });

        expect(await getNumRecords('actions', { name: 'bracketBattleWinner' })).toBe(0);
    });

    test('Should set prediction and see error message when deadline is here', async ({
        page,
        common,
        login,
        match,
    }) => {
        const dateTwoHoursAgo = dayjs.tz().subtract(18, 'hour').add(5, 'second').format('YYYY-MM-DD HH:mm:ss');
        await runQuery(`UPDATE players SET readyForFinal=1`);
        await runQuery(`UPDATE seasons SET endDate="${dateTwoHoursAgo}" WHERE id=1`);
        await overrideConfig({ minMatchesToPlanTournament: 2, minPlayersForPrediction: 4 });

        await page.goto('/season/2021/spring/men-35');
        await page.locator('button').getByText('Make your picks').click();

        await page.locator('[data-match-bet="3"]').locator('[data-challenger-bet="3"]').click();
        await expect(common.modal).toContainText('BracketBot');
    });

    test('Should not send a bye message', async ({ page, common, login, overview }) => {
        await login.loginAsPlayer3();

        const dateTwoDaysAgo = dayjs.tz().subtract(2, 'day').format('YYYY-MM-DD HH:mm:ss');
        await runQuery(`UPDATE players SET readyForFinal=1`);
        await runQuery(`UPDATE seasons SET endDate="${dateTwoDaysAgo}" WHERE id=1`);
        await runQuery(
            `UPDATE matches SET challengerElo=1700, acceptorElo=1300, challengerMatches=100, acceptorMatches=100`
        );
        await overrideConfig({ minMatchesToPlanTournament: 2 });

        await page.goto('/season/2021/spring/men-35');
        await expect(overview.finalTournamentArea).toContainText('Cristopher H.1');

        const dateOneMinuteAgo = dayjs.tz().subtract(1, 'minute').format('YYYY-MM-DD HH:mm:ss');
        await runQuery(
            `UPDATE matches SET score="6-1 6-1", winner=3, playedAt="${dateOneMinuteAgo}" WHERE finalSpot=3`
        );
        cleanRedisCache();

        await page.goto('/season/2021/spring/men-35');

        await page.locator('[data-final-tournament-area]').locator('button[data-match-actions]').click();
        await page.locator('[data-final-tournament-area]').locator('button[data-edit-match]').click();
        await common.modalSubmitButton.click();
        await expect(common.alert).toContainText('The match has been reported');

        await new Promise((resolve) => setTimeout(resolve, 1000));
        expect(await getNumRecords('emails', { subject: byeSubject })).toBe(0);
    });

    test('Should send the warning that opponent has changed', async ({ page, common, login, match }) => {
        const dateTwoDaysAgo = dayjs.tz().subtract(2, 'day').format('YYYY-MM-DD HH:mm:ss');
        await runQuery(`UPDATE players SET readyForFinal=1 WHERE userId!=2`);
        await runQuery(`UPDATE seasons SET endDate="${dateTwoDaysAgo}" WHERE id=1`);
        await overrideConfig({ minMatchesToPlanTournament: 2, minPlayersToRunTournament: 2 });

        await page.goto('/season/2021/spring/men-35');
        await page.locator('[data-final-tournament-area]').locator('a').getByText('Score').click();
        await match.pickAcceptorPoints(3);
        await new Promise((resolve) => setTimeout(resolve, 1000));
        await match.pickAcceptorPoints(2);
        await common.modalSubmitButton.click();
        await expect(common.alert).toContainText('The match has been reported');

        await expectRecordToExist('emails', {
            recipientEmail: 'player4@gmail.com',
            subject: 'You Have New Match Results!',
        });

        // Try to edit the final result
        await page.locator('[data-final-tournament-area]').locator('button[data-match-actions]').click();
        await page.locator('[data-final-tournament-area]').locator('button[data-edit-match]').click();
        await match.pickChallengerPoints(3);
        await new Promise((resolve) => setTimeout(resolve, 1000));
        await page.locator('a').getByText('Set 2').click();
        await match.pickChallengerPoints(3);

        // delete all emails
        await runQuery(`DELETE FROM emails`);

        await common.modalSubmitButton.click();
        await expect(common.alert).toContainText('The match has been reported');

        const email4 = await expectRecordToExist('emails', {
            recipientEmail: 'player4@gmail.com',
            subject: finalSubject,
        });
        const email3 = await expectRecordToExist('emails', {
            recipientEmail: 'player3@gmail.com',
            subject: finalSubject,
        });

        expect(email4.html).not.toContain('opponent has changed');
        expect(email3.html).toContain('opponent has changed');
    });

    test('Should schedule and reschedule the match', async ({ page, common, proposal, match, overview }) => {
        const RescheduleButton = page
            .locator('[data-match-actions-content]')
            .locator('button')
            .getByText('Reschedule match');

        const dateTwoDaysAgo = dayjs.tz().subtract(2, 'day').format('YYYY-MM-DD HH:mm:ss');
        await runQuery(`UPDATE players SET readyForFinal=1 WHERE userId!=2`);
        await runQuery(`UPDATE seasons SET endDate="${dateTwoDaysAgo}" WHERE id=1`);
        await overrideConfig({ minMatchesToPlanTournament: 2, minPlayersToRunTournament: 2 });

        await page.goto('/season/2021/spring/men-35');

        await expect(common.body).toContainText('Final Tournament');
        await expect(page.locator('[data-final-match-location]')).toBeHidden();

        await page.locator('[data-final-tournament-area]').locator('a').getByText('Schedule').click();
        await expect(common.modal).toContainText(match.FINAL_SCHEDULE_TEXT);
        await expect(common.modal).not.toContainText(match.REGULAR_RESCHEDULE_TEXT);

        await proposal.pickSundayNextWeek();
        await common.modalSubmitButton.click();
        await expect(common.modal).toContainText('Location is required.');

        await proposal.placeField.fill('Bond park');
        await common.modalSubmitButton.click();
        await expect(common.alert).toContainText('The match was successfuly scheduled.');

        await page.locator('[data-final-match-location]').hover();
        await expect(common.body).toContainText('Bond park');

        // Check email
        {
            const email = await expectRecordToExist('emails', { subject: 'Your Match Is Scheduled' });
            expect(email.replyTo).toContain('Ben Done');
            expect(email.replyTo).toContain('player1@gmail.com');
            expect(email.html).toContain('Ben Done</a>');
            expect(email.html).toContain('Matthew Burt</a>');
            expect(email.html).toContain('Sun');
            expect(email.html).toContain('Bond park');
            expect(email.recipientEmail).toBe('player4@gmail.com');
        }

        await expect(page.locator('[data-final-tournament-area]').locator('a').getByText('Schedule')).toBeHidden();

        // Try to reschedule the match
        await page.locator('[data-final-tournament-area]').locator('button[data-match-actions]').click();
        await expect(overview.matchActionsArea).toContainText('Bond park');
        await expect(overview.matchActionsArea).not.toContainText('Proposal');
        await expect(overview.matchActionsArea).not.toContainText('Delete proposal');

        await RescheduleButton.click();
        await expect(common.modal).toContainText(match.FINAL_SCHEDULE_TEXT);
        await expect(common.modal).not.toContainText(match.REGULAR_RESCHEDULE_TEXT);

        await expect(proposal.placeField).toHaveValue('Bond park');
        await proposal.placeField.fill('Lions park');
        await common.modal.locator('button').getByText('Reschedule match').click();
        await expect(common.alert).toContainText('The match was successfuly scheduled.');

        // Check if it's rescheduled
        await page.locator('[data-final-tournament-area]').locator('button[data-match-actions]').click();
        await expect(overview.matchActionsArea).toContainText('Lions park');

        // Check another email
        {
            const email = await expectRecordToExist('emails', { subject: 'Your Match Was Rescheduled' });
            expect(email.replyTo).toContain('Ben Done');
            expect(email.replyTo).toContain('player1@gmail.com');
            expect(email.html).toContain('Ben Done</a>');
            expect(email.html).toContain('Matthew Burt</a>');
            expect(email.html).toContain('Sun');
            expect(email.html).toContain('Lions park');
            expect(email.recipientEmail).toBe('player4@gmail.com');
        }
    });

    test('Should schedule a final match for Raleigh and see the instructions how to reserve a court', async ({
        common,
        page,
        overview,
        proposal,
    }) => {
        const RescheduleButton = overview.matchActionsArea.locator('button').getByText('Reschedule match');

        const dateTwoDaysAgo = dayjs.tz().subtract(2, 'day').format('YYYY-MM-DD HH:mm:ss');
        await runQuery(`UPDATE players SET readyForFinal=1 WHERE userId!=2`);
        await runQuery(`UPDATE seasons SET endDate="${dateTwoDaysAgo}" WHERE id=1`);
        await overrideConfig({ isRaleigh: 1, minMatchesToPlanTournament: 2, minPlayersToRunTournament: 2 });

        await page.goto('/season/2021/spring/men-35');

        await expect(common.body).toContainText('Final Tournament');
        await expect(page.locator('[data-final-match-location]')).toBeHidden();

        await page.locator('[data-final-tournament-area]').locator('a').getByText('Schedule').click();
        await page.locator('button').getByText('We need to reserve a court').click();
        await expect(common.modal).toContainText('If you require a court reservation');

        await page.goto('/season/2021/spring/men-35');
        await page.locator('[data-final-tournament-area]').locator('a').getByText('Schedule').click();
        await page.locator('button').getByText('We have a court to play').click();

        await proposal.pickSundayNextWeek();
        await proposal.placeField.fill('Bond park');
        await common.modalSubmitButton.click();
        await expect(common.alert).toContainText('The match was successfuly scheduled.');

        await page.locator('[data-final-match-location]').hover();
        await expect(common.body).toContainText('Bond park');

        // Try to reschedule the match
        await page.locator('[data-final-tournament-area]').locator('button[data-match-actions]').click();
        await RescheduleButton.click();
        await expect(proposal.placeField).toHaveValue('Bond park');
    });
})();
