import { type Locator, type Page } from '@playwright/test';

export class Referral {
    readonly page: Page;
    readonly shareLinkHeader: string;

    constructor(page: Page) {
        this.page = page;
        this.shareLinkHeader = 'How to Share Your Link';
    }
}
