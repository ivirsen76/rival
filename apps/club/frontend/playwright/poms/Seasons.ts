import { type Locator, type Page } from '@playwright/test';

export class Seasons {
    readonly page: Page;
    readonly addSeasonButton: Locator;
    readonly closeSeasonButton: Locator;
    readonly yearField: Locator;
    readonly weeksField: Locator;
    readonly reasonField: Locator;

    constructor(page: Page) {
        this.page = page;
        this.addSeasonButton = page.getByRole('button', { name: 'Add season' });
        this.closeSeasonButton = page.locator('[data-close-season]');
        this.yearField = page.locator('input[name="year"]');
        this.weeksField = page.locator('input[name="weeks"]');
        this.reasonField = page.locator('input[name="reason"]');
    }
}
