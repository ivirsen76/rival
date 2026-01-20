import { expect, type Locator, type Page } from '@playwright/test';

export class Common {
    readonly page: Page;
    readonly body: Locator;
    readonly content: Locator;
    readonly modal: Locator;
    readonly modalSubmitButton: Locator;
    readonly modalCloseButton: Locator;
    readonly alert: Locator;
    readonly loader: Locator;
    readonly confirmation: Locator;
    readonly tooltip: Locator;
    readonly logo: Locator;

    constructor(page: Page) {
        this.page = page;
        this.body = page.locator('body');
        this.content = page.locator('#tl-page-body');
        this.modal = page.locator('.modal.show .modal-content').last();
        this.modalSubmitButton = page.locator('.modal.show .modal-content button[type="submit"]').last();
        this.modalCloseButton = page.getByRole('button', { name: 'Close' });
        this.alert = page.locator('#tl-notification-wrapper');
        this.loader = page.locator('[data-loader="show"]');
        this.confirmation = page.locator('.tl-confirmation');
        this.tooltip = page.locator('[data-tippy-root]');
        this.logo = page.locator('[data-logo]');
    }

    public async getClipboardValue(): Promise<string> {
        const value = (await this.page.evaluate('navigator.clipboard.readText()')) as string;
        return value;
    }

    public async reloadPage() {
        await this.page.evaluate(() => window.location.reload());
    }

    public async closeModal() {
        await this.modal.locator('.btn-close').click();
        await expect(this.modal).toBeHidden();
    }
}
