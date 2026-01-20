import { expect, type Locator, type Page } from '@playwright/test';
import { expectRecordToExist } from '../db';

export class Login {
    readonly page: Page;
    readonly area: Locator;
    readonly emailField: Locator;
    readonly passwordField: Locator;
    readonly signInLink: Locator;
    readonly signInButton: Locator;
    readonly password: string;
    readonly forgotPasswordLink: Locator;
    readonly verifyEmailLink: Locator;
    readonly emailVerificationCodeField: Locator;

    constructor(page: Page) {
        this.page = page;
        this.password = 'rival2021tennis';
        this.area = page.locator('.tl-panel');
        this.emailField = page.locator('input[name="email"]');
        this.passwordField = page.locator('input[name="password"]');
        this.signInLink = this.page.getByRole('menuitem', { name: 'Sign in' }).locator('a');
        this.signInButton = this.area.locator('button').getByText('Sign in');
        this.forgotPasswordLink = page.getByRole('link', { name: 'Forgot password?' });
        this.verifyEmailLink = page.getByRole('link', { name: 'Verify email' });
        this.emailVerificationCodeField = page.locator('input[name="code"]');
    }

    public async goto() {
        await this.page.goto('/login?redirectAfterLogin=/');
    }

    public async loginAs(email: string, password?: string) {
        await this.goto();
        await this.emailField.fill(email);
        await this.passwordField.fill(password || this.password);
        await this.signInButton.click();

        await expect(this.page.locator('[data-logged-user]')).toBeVisible();
    }

    public async loginAsPlayer1() {
        await this.loginAs('player1@gmail.com');
    }

    public async loginAsPlayer2() {
        await this.loginAs('player2@gmail.com');
    }

    public async loginAsPlayer3() {
        await this.loginAs('player3@gmail.com');
    }

    public async loginAsPlayer4() {
        await this.loginAs('player4@gmail.com');
    }

    public async loginAsPlayer5() {
        await this.loginAs('player5@gmail.com');
    }

    public async loginAsPlayer8() {
        await this.loginAs('player8@gmail.com');
    }

    public async loginAsPlayer9() {
        await this.loginAs('player9@gmail.com');
    }

    public async loginAsAdmin() {
        await this.loginAs('admin@gmail.com');
    }

    public async loginAsSuperadmin() {
        await this.loginAs('superadmin@gmail.com');
    }

    public async loginAsManager() {
        await this.loginAs('manager@gmail.com');
    }

    public async loginAsPartner() {
        await this.loginAs('partner@gmail.com');
    }

    public async logout() {
        await this.page.goto('/logout');
        await expect(this.signInLink).toBeVisible();
    }

    public async verifyEmail(email: string) {
        const emailSent = await expectRecordToExist('emails', { recipientEmail: email });
        const emailVerificationCode = emailSent.subject.slice(0, 6);

        await this.emailVerificationCodeField.fill(emailVerificationCode);
    }
}
