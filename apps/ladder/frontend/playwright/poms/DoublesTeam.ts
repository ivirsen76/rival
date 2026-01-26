import { type Locator, type Page } from '@playwright/test';

export class DoublesTeam {
    readonly page: Page;
    readonly joinTeamButton: Locator;
    readonly goToLadderButton: Locator;
    readonly joinTeamLink: Locator;

    readonly contactInfo: string;

    constructor(page: Page) {
        this.page = page;
        this.joinTeamButton = page.getByRole('button', { name: 'Join the Doubles' });
        this.goToLadderButton = page.getByRole('button', { name: 'Go to the Ladder' });
        this.joinTeamLink = page.locator('a').getByText('Link');

        this.contactInfo = 'going to be the contact for this match.';
    }
}
