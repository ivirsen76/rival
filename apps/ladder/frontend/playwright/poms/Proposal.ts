import { expect, type Locator, type Page } from '@playwright/test';
import { Common } from './Common';

export class Proposal {
    readonly page: Page;
    readonly common: Common;
    readonly submitProposalButton: Locator;
    readonly dateField: Locator;
    readonly sundayNextWeek: Locator;
    readonly placeField: Locator;
    readonly commentField: Locator;
    readonly challengerSelect: Locator;
    readonly challenger2Select: Locator;
    readonly acceptorSelect: Locator;
    readonly acceptor2Select: Locator;
    readonly advancedSettingsLink: Locator;
    readonly playerNumberBadge: Locator;
    readonly ageCompatibleField: Locator;

    constructor(page: Page) {
        const common = new Common(page);

        this.page = page;
        this.common = common;
        this.submitProposalButton = common.modal.getByRole('button', { name: 'Propose match' });
        this.dateField = page.locator('[data-timepicker="playedAt"]');
        this.sundayNextWeek = page.locator('[data-day="2-7"]');
        this.placeField = page.locator('input[name="place"]');
        this.commentField = page.locator('input[name="comment"]');
        this.challengerSelect = common.modal.locator('[data-challengerid]');
        this.challenger2Select = common.modal.locator('[data-challenger2id]');
        this.acceptorSelect = common.modal.locator('[data-acceptorid]');
        this.acceptor2Select = common.modal.locator('[data-acceptor2id]');
        this.advancedSettingsLink = common.modal.locator('a').getByText('Advanced settings');
        this.playerNumberBadge = common.modal.locator('.badge', { hasText: 'Visible' });
        this.ageCompatibleField = common.modal.locator('label').getByText('Age-compatible proposal');
    }

    public async closeTimePicker() {
        await this.dateField.click();
        await expect(this.page.locator('[data-tippy-root]')).toBeHidden();
    }

    public async pickSundayNextWeek() {
        await this.dateField.click();
        await this.sundayNextWeek.click();
        await this.closeTimePicker();
    }

    public async pickChallenger(name: string) {
        await this.challengerSelect.selectOption(name);
    }

    public async pickChallenger2(name: string) {
        await this.challenger2Select.selectOption(name);
    }

    public async pickAcceptor(name: string) {
        await this.acceptorSelect.selectOption(name);
    }

    public async pickAcceptor2(name: string) {
        await this.acceptor2Select.selectOption(name);
    }

    public async acceptAcceptor(name: string) {
        await this.common.modal.locator('[data-select-player="acceptorId"]').selectOption(name);
    }

    public async acceptAcceptor2(name: string) {
        await this.common.modal.locator('[data-select-player="acceptor2Id"]').selectOption(name);
    }
}
