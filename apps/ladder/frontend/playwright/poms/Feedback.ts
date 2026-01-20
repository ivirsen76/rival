import { type Locator, type Page } from '@playwright/test';
import { Common } from './Common';

export class Feedback {
    readonly page: Page;
    readonly openButton: Locator;
    readonly descriptionField: Locator;

    constructor(page: Page) {
        const common = new Common(page);

        this.page = page;
        this.openButton = page.locator('[data-feedback-button]');
        this.descriptionField = page.locator('textarea[name="description"]');
    }

    public getType(name: string) {
        return this.page.locator('[data-type]').getByText(name);
    }
}
