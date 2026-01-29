import { type Locator, type Page } from '@playwright/test';
import { Common } from './Common';

export class User {
    readonly page: Page;
    readonly NOT_ENOUGH_MATCHES: string;
    readonly TOO_MANY_MESSAGES: string;
    readonly NOT_THE_SAME_LADDER: string;
    readonly messageButton: Locator;
    readonly messageField: Locator;
    readonly sendButton: Locator;

    readonly firstNameField: Locator;
    readonly lastNameField: Locator;
    readonly emailField: Locator;
    readonly phoneField: Locator;
    readonly passwordField: Locator;
    readonly personalInfoField: Locator;
    readonly showAgeField: Locator;

    constructor(page: Page) {
        const common = new Common(page);

        this.page = page;
        this.NOT_ENOUGH_MATCHES = 'not allowed to send messages until you play at least 10 matches.';
        this.TOO_MANY_MESSAGES = 'You can only send 3 messages per week. Try again on Monday.';
        this.NOT_THE_SAME_LADDER = 'You can only send messages to players on your current ladders.';
        this.messageButton = page.locator('button').getByText('Send message');
        this.messageField = common.modal.locator('textarea[name="message"]');
        this.sendButton = common.modal.locator('button').getByText('Send');

        this.firstNameField = page.locator('input[name="firstName"]');
        this.lastNameField = page.locator('input[name="lastName"]');
        this.emailField = page.locator('input[name="email"]');
        this.phoneField = page.locator('input[name="phone"]');
        this.passwordField = page.locator('input[name="password"]');
        this.personalInfoField = page.locator('textarea[name="personalInfo"]');
        this.showAgeField = page.locator('input[name="showAge"]');
    }

    public async enterBirthday(birthday: string) {
        const [mm, dd, yyyy] = birthday.split('/');
        await this.page.locator('input[name="mm"]').fill(mm);
        await this.page.locator('input[name="dd"]').fill(dd);
        await this.page.locator('input[name="yyyy"]').fill(yyyy);
    }
}
