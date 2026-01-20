import { expect, type Locator, type Page } from '@playwright/test';

export class TopMenu {
    readonly page: Page;
    readonly signInLink: Locator;
    readonly userLink: Locator;
    readonly signOutLink: Locator;

    constructor(page: Page) {
        this.page = page;
        this.signInLink = this.page.getByRole('menuitem', { name: 'Sign in' }).locator('a');
        this.userLink = this.page.locator('[data-logged-user]');
        this.signOutLink = this.page.getByRole('link', { name: 'Sign out' });
    }

    public getMenuLink(name: string) {
        return this.page.locator('[data-top-menu] a').getByText(name);
    }
}
