import { type Page } from '@playwright/test';

export class Wallet {
    readonly page: Page;

    constructor(page: Page) {
        this.page = page;
    }

    public async goto() {
        await this.page.goto('/user/wallet');
    }

    public getOrderSummary(id: number) {
        return this.page.locator(`[data-order-summary="${id}"]`);
    }
}
