import { expect, type Locator, type Page } from '@playwright/test';

export class Homepage {
    readonly page: Page;
    readonly heroRegisterButton: Locator;
    readonly twBanana: Locator;

    constructor(page: Page) {
        this.page = page;
        this.heroRegisterButton = page.locator('a[data-hero-register-button]');
        this.twBanana = page.locator('a[data-banana-partner="tw"]');
    }

    public getCurrentSeasonLadder(name: string) {
        return this.page.locator('a[data-latest-level]').getByText(name);
    }

    public getUpcomingSeasonLadder(name: string) {
        return this.page.locator('[data-upcoming-season-levels] a').getByText(name);
    }

    public async checkVisible() {
        await expect(this.page.locator('#rival-hero-section h1')).toContainText('for Local Clubs');
    }
}
