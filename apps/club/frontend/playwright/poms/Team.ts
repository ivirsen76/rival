import { type Locator, type Page } from '@playwright/test';

export class Team {
    readonly page: Page;
    readonly createTeamButton: Locator;
    readonly invitePlayersButton: Locator;
    readonly updateTeamButton: Locator;
    readonly askToJoinButton: Locator;
    readonly joinAnyTeamButton: Locator;
    readonly disbandTeamButton: Locator;
    readonly leaveTeamButton: Locator;
    readonly nameSelect: Locator;
    readonly player2Select: Locator;
    readonly customNameField: Locator;

    constructor(page: Page) {
        this.page = page;
        this.createTeamButton = page.locator('button').getByText('Create');
        this.invitePlayersButton = page.locator('button[data-invite-players]');
        this.updateTeamButton = page.locator('button[data-update-team]');
        this.askToJoinButton = page.locator('button').getByText('Ask to Join');
        this.joinAnyTeamButton = page.locator('button').getByText('any team');
        this.disbandTeamButton = page.locator('button[data-disband-team]');
        this.leaveTeamButton = page.locator('button').getByText('Leave');
        this.nameSelect = page.locator('select[name=name]');
        this.player2Select = page.locator('select[name=player2]');
        this.customNameField = page.locator('input[name=customName]');
    }
}
