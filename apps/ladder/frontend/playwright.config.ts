import { defineConfig, devices } from '@playwright/test';
import 'dotenv/config';

export default defineConfig({
    testDir: './playwright',

    /* Run tests in files in parallel */
    fullyParallel: false,

    /* Fail the build on CI if you accidentally left test.only in the source code. */
    forbidOnly: !!process.env.CI,

    /* Retry on CI only */
    retries: process.env.CIWRONG ? 2 : 0,

    /* Opt out of parallel tests on CI. */
    workers: 1,

    /* Reporter to use. See https://playwright.dev/docs/test-reporters */
    reporter: 'list',

    /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
    use: {
        /* Base URL to use in actions like `await page.goto('/')`. */
        baseURL: process.env.TL_TESTCAFE_URL || 'http://localhost:5173',

        /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
        trace: 'on-first-retry',

        actionTimeout: 5 * 1000,
    },

    /* Configure projects for major browsers */
    projects: [
        {
            name: 'chromium',
            testMatch: /.*\.page\.ts/,
            use: {
                ...devices['Desktop Chrome'],
                permissions: ['clipboard-read'],
                ...(process.env.TL_TESTCAFE_URL
                    ? {
                          deviceScaleFactor: undefined,
                          viewport: null,
                          launchOptions: {
                              args: ['--window-size=1920,1080'],
                          },
                      }
                    : {
                          deviceScaleFactor: undefined,
                          viewport: null,
                          launchOptions: {
                              args: [
                                  '--window-position=2560,0',
                                  '--window-size=2560,1415',
                                  '--auto-open-devtools-for-tabs',
                              ],
                          },
                      }),
            },
        },
    ],
});
