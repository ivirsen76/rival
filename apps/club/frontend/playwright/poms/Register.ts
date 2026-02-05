import { expect, type Locator, type Page } from '@playwright/test';
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
    readonly globalRegisterButton: Locator;
    readonly signInLink: Locator;
    readonly strongReasonLink: Locator;
    readonly reasonField: Locator;
    readonly resendEmailLink: Locator;

    // form locators
    readonly emailField: Locator;
    readonly passwordField: Locator;
    readonly emailVerificationCodeField: Locator;
    readonly agreeCheckbox: Locator;
    readonly submitButton: Locator;

    // messages
    readonly registerSuccessMessage: string;
    readonly tooHighTlrMessage: string;

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
        this.globalRegisterButton = page.locator('#registerButton');
        this.signInLink = this.area.locator('a').getByText('Sign in');
        this.strongReasonLink = page.getByRole('link', { name: 'Have a strong reason' });
        this.reasonField = page.locator('textarea[name="reason"]');
        this.resendEmailLink = page.getByRole('link', { name: 'Resend the email' });

        this.emailField = page.locator('input[name="email"]');
        this.passwordField = page.locator('input[name="password"]');
        this.emailVerificationCodeField = page.locator('input[name="code"]');
        this.agreeCheckbox = page.locator('input[name="agree"]');
        this.submitButton = page.getByRole('button', { name: 'Submit' });

        this.registerSuccessMessage = 'You are successfully registered!';
        this.tooHighTlrMessage = "you won't be able to play in the Final Tournament";
    }

    public async goto() {
        await this.page.goto('/register');
    }

    public getLadderCheckbox(name: string) {
        return this.page.locator('label').getByText(name);
    }

    public async playAnotherLadder(reason: string) {
        await this.strongReasonLink.click();
        await expect(this.common.modal).toContainText("Describe why you'd like to join another ladder");
        await this.reasonField.fill(reason);
        await this.common.modalSubmitButton.click();
    }
}
