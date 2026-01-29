import { expect, type Locator, type Page } from '@playwright/test';
import { Common } from './Common';

export class Overview {
    readonly page: Page;
    readonly common: Common;
    readonly playerList: Locator;
    readonly proposeMatchButton: Locator;
    readonly proposeFriendlyMatchButton: Locator;
    readonly proposePracticeButton: Locator;
    readonly reportMatchButton: Locator;
    readonly moveToAnotherLadderButton: Locator;
    readonly quitLadderButton: Locator;
    readonly otherActionsButton: Locator;
    readonly joinPlayerPoolButton: Locator;
    readonly joinThisLadderLink: Locator;
    readonly area: Locator;
    readonly upcomingMatchesArea: Locator;
    readonly finalTournamentArea: Locator;
    readonly finalParticipationArea: Locator;
    readonly matchActionsArea: Locator;
    readonly tournamentNavbarArea: Locator;
    readonly openProposalsArea: Locator;
    readonly openFriendlyProposalsArea: Locator;
    readonly playerPoolArea: Locator;
    readonly inviteTeammateArea: Locator;
    readonly winnerArea: Locator;
    readonly claimAwardArea: Locator;
    readonly todayMatchesArea: Locator;
    readonly finalAvailableMark: Locator;
    readonly streetField: Locator;
    readonly apartmentField: Locator;
    readonly cityField: Locator;
    readonly stateField: Locator;
    readonly zipField: Locator;
    readonly showPlayersToggle: Locator;

    readonly rulesReminderText: string;
    readonly tooHighTlrAtTheSeasonStart: string;
    readonly tooHighInitialTlr: string;

    constructor(page: Page) {
        const common = new Common(page);

        this.page = page;
        this.common = common;
        this.playerList = page.locator('[data-player-list]');
        this.proposeMatchButton = page.getByRole('button', { name: 'Propose match' });
        this.proposeFriendlyMatchButton = page.getByRole('button', { name: 'Propose friendly match' });
        this.proposePracticeButton = page.getByRole('button', { name: 'Propose practice' });
        this.reportMatchButton = page.getByRole('button', { name: 'Report match' });
        this.moveToAnotherLadderButton = page.getByRole('button', { name: 'Move to another ladder' });
        this.quitLadderButton = page.getByRole('button', { name: 'Quit ladder' });
        this.otherActionsButton = page.getByRole('button', { name: 'Other actions' });
        this.joinPlayerPoolButton = page.getByRole('button', { name: 'Join the Player Pool' });
        this.joinThisLadderLink = page.locator('a', { hasText: 'Join this ladder' });
        this.area = page.locator('[data-overview-content]');
        this.upcomingMatchesArea = page.locator('[data-your-upcoming-matches]');
        this.finalTournamentArea = page.locator('[data-final-tournament-area]');
        this.finalParticipationArea = page.locator('[data-final-participation]');
        this.matchActionsArea = page.locator('[data-match-actions-content]');
        this.tournamentNavbarArea = page.locator('[data-tournament-navbar]');
        this.openProposalsArea = page.locator('[data-open-proposals]', { hasText: 'Open Proposals' });
        this.openFriendlyProposalsArea = page.locator('[data-open-proposals]', { hasText: 'Open Friendly Proposals' });
        this.playerPoolArea = page.locator('.card', { hasText: 'Player Pool' });
        this.inviteTeammateArea = page.locator('.card', {
            hasText: 'Share this link with your friends for them to join:',
        });
        this.winnerArea = page.locator('[data-winner-block]');
        this.claimAwardArea = page.locator('[data-claim-award]');
        this.todayMatchesArea = page.locator('[data-today-matches]');
        this.finalAvailableMark = page.locator('[data-final-available]').first();
        this.streetField = page.locator('input[name=locationPrimary]');
        this.apartmentField = page.locator('input[name=locationExtra]');
        this.cityField = page.locator('input[name=regionLocal]');
        this.stateField = page.locator('select[name=sectorCode]');
        this.zipField = page.locator('input[name=regionIndex]');
        this.showPlayersToggle = page.locator('label').getByText('Show players');

        this.rulesReminderText = 'Reminders About Rival Rules';
        this.tooHighTlrAtTheSeasonStart = 'at the beginning of this season disqualifies';
        this.tooHighInitialTlr = 'Your initial TLR of';
    }

    public getInactivePlayer(id: number) {
        return this.page.locator(`[data-inactive-user="${id}"]`);
    }

    public async checkTeam(name: string, players: string[]) {
        await this.playerList.locator('a').getByText(name).click();
        for (let i = 0; i < players.length; i++) {
            const player = players[i];
            await expect(this.common.modal.locator('tbody tr').nth(i)).toContainText(player);
        }
        const rowCount = await this.common.modal.locator('table tbody tr').count();
        expect(rowCount).toBe(players.length);
    }

    public async checkTeamLink(area: Locator, name: string, players: string[]) {
        await area.locator('a').getByText(name).click();
        for (let i = 0; i < players.length; i++) {
            const player = players[i];
            await expect(this.common.tooltip.locator('a').nth(i)).toContainText(player);
        }
        const rowCount = await this.common.tooltip.locator('a').count();
        expect(rowCount).toBe(players.length);
    }

    public async clickOtherAction(label: string, usingDropdown: boolean = true) {
        if (usingDropdown) {
            await this.otherActionsButton.click();
            await this.common.tooltip.locator('button').getByText(label).click();
        } else {
            await this.page.locator('button').getByText(label).click();
        }
    }

    public async pickAddressOption(label: string) {
        await this.page.locator('[data-address-autocomplete-option]', { hasText: label }).click();
    }
}
