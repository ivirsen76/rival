import { type Locator, type Page } from '@playwright/test';

export class Complaint {
    readonly page: Page;
    readonly openButton: Locator;
    readonly avoidCondition: string;
    readonly avoidSuggestionText: string;
    readonly editAvoidedPlayersButton: Locator;
    readonly descriptionField: Locator;

    constructor(page: Page) {
        this.page = page;
        this.openButton = page.getByRole('button', { name: 'Complain' });
        this.avoidCondition = 'Avoided players will no longer be able';
        this.avoidSuggestionText = 'To avoid another player not from this list';
        this.editAvoidedPlayersButton = page.locator('[data-edit-avoided-players]');
        this.descriptionField = page.locator('textarea[name="description"]');
    }

    public getComplaintType(name: string) {
        return this.page.locator('label', { hasText: name });
    }
}
