import { type Locator, type Page } from '@playwright/test';

export class SideMenu {
    readonly page: Page;
    readonly sideMenuToggle: Locator;

    constructor(page: Page) {
        this.page = page;
        this.sideMenuToggle = this.page.locator('#side-menu-toggle');
    }

    public getMenuLink(name: string) {
        return this.page.locator('.side-menu-item').getByText(name);
    }
}
