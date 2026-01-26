import { type Locator, type Page } from '@playwright/test';
import { Common } from './Common';

export class Levels {
    readonly page: Page;
    readonly common: Common;
    readonly addLevelButton: Locator;
    readonly nameField: Locator;
    readonly typeField: Locator;

    constructor(page: Page) {
        this.common = new Common(page);

        this.page = page;
        this.addLevelButton = page.getByRole('button', { name: 'Add level' });
        this.nameField = page.locator('input[name="name"]');
        this.typeField = this.common.modal.getByRole('combobox');
    }
}
