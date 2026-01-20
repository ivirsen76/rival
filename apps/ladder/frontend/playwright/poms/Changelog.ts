import { expect, type Locator, type Page } from '@playwright/test';
import { Common } from './Common';

export class Changelog {
    readonly page: Page;
    readonly newBadge: Locator;
    readonly existingHeader: string;
    readonly updatesText: string;
    readonly dismissButton: Locator;
    readonly readMoreButton: Locator;

    constructor(page: Page) {
        this.page = page;
        this.newBadge = page.locator('.badge').getByText('New').first();
        this.existingHeader = 'Default Match Scoring';
        this.updatesText = 'Check out the latest updates';
        this.dismissButton = page.getByRole('button', { name: 'Dismiss' });
        this.readMoreButton = page.getByRole('button', { name: 'Read more' });
    }
}
