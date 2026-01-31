import { type Locator, type Page } from '@playwright/test';
import { Common } from './Common';

export class Register {
    readonly common: Common;
    readonly page: Page;
    readonly area: Locator;

    constructor(page: Page) {
        this.common = new Common(page);
        this.page = page;
        this.area = page.locator('[data-register-area]');
    }

    public async goto() {
        await this.page.goto('/register');
    }
}
