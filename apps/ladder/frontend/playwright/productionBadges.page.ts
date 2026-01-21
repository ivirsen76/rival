import { test, expect } from './base';
import { restoreProductionDb } from '@rival/ladder.backend/src/db/helpers';

test.beforeEach(async ({ page }) => {
    restoreProductionDb();
});

const oneTimeBadges = [
    // One-time badges
    { code: 'avatar', content: ['Completed'] },
    { code: 'profile', content: ['Completed'] },
    { code: 'allSeasonPlayer', content: ['Completed', 'Spring: 6', 'Summer: 5', 'Fall: 5', 'Winter: 6'] },
    {
        code: 'takeItToLimit',
        content: ['Completed', 'Larry Nguyen', 'Brian Edlin', 'Fred Schnepel', 'Patrick Maddox', 'Praveen Yadav'],
    },
    { code: 'dedication', content: ['Completed', '6, 2020', '25, 2022', '5 matches'] },
    { code: 'universalPlayer', missing: ['Completed'] },
    { code: 'twoTiebreaks', content: ['Completed', 'Fred Schnepel'] },
    { code: 'twoWinsOneDay', content: ['Completed', 'Billy Reese', 'Clint Abbey'] },
    { code: 'davidGoliath', missing: ['Completed'] },
    { code: 'feedback', missing: ['Completed'] },
    { code: 'doubleBagel', content: ['Completed', 'Adam DeMarco'] },
    { code: 'statistician', missing: ['Completed'] },
    { code: 'revenge', content: ['Completed', 'Bill Dowbiggin', 'Lost 6 matches before'] },
    { code: 'fury', content: ['Completed', 'Benjamin Adelson', '5-7 6-0 7-6'] },
    { code: 'oracle', missing: ['Completed'] },
    { code: 'frame', missing: ['Completed'] },

    // Series badges
    { code: 'seasonsParticipated', content: ['22', '+8', 'Spring: 84', 'Summer: 97', 'Fall: 108', 'Winter: 147'] },
    { code: 'matchesPlayed', content: ['436', '+64', 'Brady Sowers', '6-2 3-6 1-0'] },
    { code: 'matchesWon', content: ['256', '+44', 'Eddie Aiken', '6-1 4-6 1-0'] },
    { code: 'proposalsCreated', content: ['143', '+7', 'Breckenridge', 'Millbrook'] },
    { code: 'proposalsAccepted', content: ['182', '+18', 'Steve Lysenko', 'Brady Sowers'] },
    { code: 'tlrGain', content: ['0.71', '+0.09', '3.56', 'Initial TLR'] },
    { code: 'rivalries', content: ['37', '+13', 'Steve Hammel', 'Raoul Chinang'] },
    { code: 'tiebreaker', content: ['91', '+9', 'Alex Moss', '6-3 6-7 1-0'] },
    { code: 'comebackKid', content: ['55', '+20', 'David Wood', '4-6 6-4 6-2'] },

    // Ladder badges
    { code: 'level3:tournament', content: ['11, 2018', '12, 2018'] },
    { code: 'level3:points', content: ['Completed', '690', '447 points', '2020 Summer'] },
];

test('Should see all badges state', async ({ page, common, login }) => {
    test.setTimeout(60_000);
    await page.goto('/player/igor-eremeev');

    // wait for indexes done
    await new Promise((resolve) => setTimeout(resolve, 10_000));

    await page.goto('/player/igor-eremeev');
    await page.locator('[data-recent-badges]').click();

    for (const badge of oneTimeBadges) {
        await page.locator(`[data-badge="${badge.code}"]`).click();

        const BadgeInfo = page.locator(`[data-badge-info="${badge.code}"]`);
        await expect(BadgeInfo).toBeVisible();

        if (badge.content) {
            for (const text of badge.content) {
                await expect(BadgeInfo).toContainText(text);
            }
        }

        if (badge.missing) {
            for (const text of badge.missing) {
                await expect(BadgeInfo).not.toContainText(text);
            }
        }

        await page.keyboard.press('Escape');
    }
});
