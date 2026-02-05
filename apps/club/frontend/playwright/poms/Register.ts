import { type Locator, type Page } from '@playwright/test';
import { Common } from './Common';

export class Register {
    readonly common: Common;
    readonly page: Page;
    readonly area: Locator;
    readonly spring2021: Locator;
    readonly spring2022: Locator;
    readonly changeSeasonLink: Locator;
    readonly registerButton: Locator;
    readonly goToLadderButton: Locator;
    readonly pickLadderButton: Locator;

    // form locators
    readonly emailField: Locator;
    readonly passwordField: Locator;
    readonly emailVerificationCodeField: Locator;
    readonly agreeCheckbox: Locator;
    readonly submitButton: Locator;

    // messages
    readonly registerSuccessMessage: string;

    constructor(page: Page) {
        this.common = new Common(page);
        this.page = page;
        this.area = page.locator('[data-register-area]');
        this.spring2021 = page.getByRole('button', { name: '2021 Spring' });
        this.spring2022 = page.getByRole('button', { name: '2022 Spring' });
        this.changeSeasonLink = page.locator('[data-step="season"] a').getByText('Change');
        this.registerButton = page.getByRole('button', { name: 'Register' });
        this.goToLadderButton = page.getByRole('button', { name: 'Go to the Ladder' });
        this.pickLadderButton = page.getByRole('button', { name: "Let's pick a ladder to play" });

        this.emailField = page.locator('input[name="email"]');
        this.passwordField = page.locator('input[name="password"]');
        this.emailVerificationCodeField = page.locator('input[name="code"]');
        this.agreeCheckbox = page.locator('input[name="agree"]');
        this.submitButton = page.getByRole('button', { name: 'Submit' });

        this.registerSuccessMessage = 'You are successfully registered!';
    }

    public async goto() {
        await this.page.goto('/register');
    }

    public getLadderCheckbox(name: string) {
        return this.page.locator('label').getByText(name);
    }
}
