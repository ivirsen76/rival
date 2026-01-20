import { expect, type Locator, type Page } from '@playwright/test';
import { Common } from './Common';

export class Match {
    readonly page: Page;
    readonly common: Common;
    readonly matchFormatSelect: Locator;
    readonly challengerPointsPicker: Locator;
    readonly acceptorPointsPicker: Locator;
    readonly challengerSelect: Locator;
    readonly acceptorSelect: Locator;
    readonly nextButton: Locator;
    readonly submitMatchButton: Locator;
    readonly scoreButton: Locator;
    readonly tiebreakButton: Locator;
    readonly fullSetButton: Locator;
    readonly editButton: Locator;
    readonly uploadStatsButton: Locator;
    readonly reasonField: Locator;
    readonly FINAL_SCHEDULE_TEXT: string;
    readonly REGULAR_RESCHEDULE_TEXT: string;
    readonly REFUND_MESSAGE: string;

    constructor(page: Page) {
        const common = new Common(page);

        this.page = page;
        this.common = common;
        this.matchFormatSelect = page.locator('select[name=matchFormat]');
        this.challengerSelect = page.locator('select[name=challengerId]');
        this.challengerPointsPicker = page.locator('[data-field="challengerPoints"]').first();
        this.acceptorSelect = page.locator('select[name=acceptorId]');
        this.acceptorPointsPicker = page.locator('[data-field="acceptorPoints"]').first();
        this.nextButton = page.getByRole('button', { name: 'Next' });
        this.submitMatchButton = common.modal.getByRole('button', { name: 'Report match' });
        this.scoreButton = page.getByRole('link', { name: 'Score' });
        this.tiebreakButton = page.getByRole('button', { name: '10-point tiebreak' });
        this.fullSetButton = page.getByRole('button', { name: 'Full set' });
        this.editButton = page.locator('button').getByText('Edit', { exact: true });
        this.reasonField = common.modal.locator('input[name="reason"]');
        this.uploadStatsButton = page.locator('button').getByText('Upload statistics', { exact: true });
        this.FINAL_SCHEDULE_TEXT = 'After you both agree to a date and place';
        this.REGULAR_RESCHEDULE_TEXT = 'must agree to reschedule';
        this.REFUND_MESSAGE = 'All players who paid an entry fee will receive a credit to their accounts.';
    }

    public async pickChallengerOption(name: string) {
        await this.challengerSelect.selectOption(name);
    }

    public async pickChallengerPoints(points: number) {
        await this.challengerPointsPicker.getByRole('button', { name: `${points}` }).click();
    }

    public async isChallengerGameSelected(game: number) {
        const button = this.challengerPointsPicker.getByRole('button', { name: `${game}` });
        const className = await button.getAttribute('class');
        return className?.includes('active');
    }

    public async pickAcceptorOption(name: string) {
        await this.acceptorSelect.selectOption(name);
    }

    public async pickAcceptorPoints(points: number) {
        await this.acceptorPointsPicker.getByRole('button', { name: `${points}` }).click();
    }

    public async isAcceptorGameSelected(game: number) {
        const button = this.acceptorPointsPicker.getByRole('button', { name: `${game}` });
        const className = await button.getAttribute('class');
        return className?.includes('active');
    }

    public async isSetSelected(set: number) {
        const link = this.common.modal.locator('a.nav-link').getByText(`Set ${set}`);
        const className = await link.getAttribute('class');
        return className?.includes('active');
    }

    public getBadgeWithPoints(points: string) {
        return this.common.modal.locator('.badge').getByText(points, { exact: true }).first();
    }

    public async pickMatchResult(result: string) {
        await this.page.locator('[data-html-select="result"]').click();
        await this.page.locator('[data-option]').getByText(result).click();
    }

    public async pickMatchFormat(format: string) {
        await this.matchFormatSelect.selectOption(format);
    }

    public getSetLink(num: number) {
        return this.common.modal.locator('.nav-item a', { hasText: `Set ${num}` });
    }
}
