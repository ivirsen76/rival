import { type Locator, type Page } from '@playwright/test';
import { Common } from './Common';

const MIN_HOUR = 6;
const HOUR_HEIGHT = 24;

export class Form {
    readonly page: Page;
    readonly schedulePicker: Locator;

    constructor(page: Page) {
        const common = new Common(page);

        this.page = page;
        this.schedulePicker = page.locator('[data-schedule-picker]');
    }

    public async selectSchedulePeriod(dayIndex: number, from: number, to: number) {
        const box = await this.schedulePicker.boundingBox();

        if (!box) {
            throw new Error('Element is not visible');
        }

        const DAY_WIDTH = box.width / 7;

        const startX = box.x + DAY_WIDTH * (dayIndex + 0.5);
        const startY = box.y + HOUR_HEIGHT * (from - MIN_HOUR);
        const endX = startX;
        const endY = startY + (to - from) * HOUR_HEIGHT;

        await this.page.mouse.move(startX, startY);
        await this.page.mouse.down();
        await this.page.mouse.move(endX, endY, { steps: 15 });
        await this.page.mouse.up();
    }
}
