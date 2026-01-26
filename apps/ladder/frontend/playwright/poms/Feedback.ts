import { type Locator, type Page } from '@playwright/test';

export class Feedback {
    readonly page: Page;
    readonly openButton: Locator;
    readonly descriptionField: Locator;

    constructor(page: Page) {
        this.page = page;
        this.openButton = page.locator('[data-feedback-button]');
        this.descriptionField = page.locator('textarea[name="description"]');
    }

    public getType(name: string) {
        return this.page.locator('[data-type]').getByText(name);
    }
}
