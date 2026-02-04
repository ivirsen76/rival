import { type Locator, type Page } from '@playwright/test';
import { Common } from './Common';

export class Register {
    readonly common: Common;
    readonly page: Page;
    readonly area: Locator;

    // form locators
    readonly emailField: Locator;
    readonly passwordField: Locator;
    readonly emailVerificationCodeField: Locator;
    readonly submitButton: Locator;

    constructor(page: Page) {
        this.common = new Common(page);
        this.page = page;
        this.area = page.locator('[data-register-area]');

        this.emailField = page.locator('input[name="email"]');
        this.passwordField = page.locator('input[name="password"]');
        this.emailVerificationCodeField = page.locator('input[name="code"]');
        this.submitButton = page.getByRole('button', { name: 'Submit' });
    }

    public async goto() {
        await this.page.goto('/register');
    }
}
