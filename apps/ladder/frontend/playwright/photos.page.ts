import { test, expect } from './base';
import {
    restoreDb,
    expectRecordToExist,
    getNumRecords,
    runQuery,
    overrideConfig,
} from '@rival/ladder.backend/src/db/helpers';

const allowAddPhotos = async () => {
    await overrideConfig({ minMatchesToAddPhotos: 1 });
};

// Skip all tests in CI
if (process.env.CI) {
    test.skip(true, 'Skipping all tests on CI');
}

// Run manually on local machine if necessary
test.beforeEach(async ({ page }) => {
    restoreDb();
});

test('We can see rules', async ({ page, common, login }) => {
    await allowAddPhotos();

    const rulesContent = 'Upload any of your own photos related to tennis';

    await login.loginAsPlayer2();
    await page.goto('/user/settings');
    await expect(page.locator('[data-photos]')).toContainText(rulesContent);
    await expect(page.locator('[data-card-tooltip-trigger]')).toBeHidden();

    await page.locator('input[type="file"]').setInputFiles(['./src/playwright/assets/photo.png']);
    await expect.poll(async () => page.locator('[data-photo-id]').count()).toBe(1);
    await common.modalSubmitButton.click();

    await expect(common.body).not.toContainText(rulesContent);
    await page.locator('[data-card-tooltip-trigger]').click();
    await expect(common.body).toContainText(rulesContent);
});

test('We can upload two photos', async ({ page, common, login }) => {
    await allowAddPhotos();

    await login.loginAsPlayer1();
    await page.goto('/user/settings');
    await page
        .locator('input[type="file"]')
        .setInputFiles(['./src/playwright/assets/photo.png', './src/playwright/assets/photo.jpg']);

    await expect(common.body).toContainText('Uploading 2 photos...');

    await expect.poll(async () => page.locator('[data-photo-id]').count()).toBe(3);

    const getUrl = (key: string, width: number) => {
        return `https://rival-tennis-ladder-images-test.s3.us-east-2.amazonaws.com/${key
            .replace('photos/original/', 'photos/final/')
            .replace(/\.[^.]+$/, `-${width}.webp`)}`;
    };

    await common.modalSubmitButton.click();

    const photo1 = await expectRecordToExist(
        'photos',
        { userId: 1, width: 1200, height: 1182 },
        { allowShare: 1, allowComments: 1 }
    );
    for (const width of [400, 800, 1200, 1600, 2400]) {
        expect(photo1[`url${width}`]).toBe(getUrl(photo1.key, width));
    }

    const photo2 = await expectRecordToExist(
        'photos',
        { userId: 1, width: 1000, height: 667 },
        { allowShare: 1, allowComments: 1 }
    );
    for (const width of [400, 800, 1200, 1600, 2400]) {
        expect(photo2[`url${width}`]).toBe(getUrl(photo2.key, width));
    }
});

test('We can check pagination', async ({ page, common, login }) => {
    await overrideConfig({ photosPerPage: 2, minMatchesToAddPhotos: 1 });

    await login.loginAsPlayer1();
    await page.goto('/user/settings');
    await page
        .locator('input[type="file"]')
        .setInputFiles(['./src/playwright/assets/photo.png', './src/playwright/assets/photo.jpg']);

    await expect(common.body).toContainText('Uploading 2 photos...');
    await expect.poll(async () => page.locator('[data-photo-id]').count()).toBe(2);
    await common.modalSubmitButton.click();

    await page.locator('a').getByText('2', { exact: true }).click();
    await expect.poll(async () => page.locator('[data-photo-id]').count()).toBe(1);
});

test('We can upload two photos and one of them is under review', async ({ page, common, login }) => {
    const underReviewText = 'Photos Under Review';

    await allowAddPhotos();

    await login.loginAsPlayer1();
    await page.goto('/user/settings');
    await expect(common.body).toContainText('Tennis Frames');
    await expect(common.body).not.toContainText(underReviewText);
    await page
        .locator('input[type="file"]')
        .setInputFiles(['./src/playwright/assets/photo.png', './src/playwright/assets/naked.webp']);

    await expect(common.body).toContainText('Uploading 2 photos...');

    await expect.poll(async () => page.locator('[data-photo-id]').count()).toBe(3);
    await common.modalSubmitButton.click();

    await expect(common.body).toContainText(underReviewText);

    await page.goto('/player/ben-done');
    await expect.poll(async () => page.locator('[data-photo-id]').count()).toBe(2);
    await expect(common.body).not.toContainText(underReviewText);
});

test('We will get a Tennis Frame badge', async ({ page, common, login }) => {
    await allowAddPhotos();

    await login.loginAsPlayer2();
    await page.goto('/user/settings');
    await expect(common.body).toContainText('Tennis Frames');
    await page.locator('input[type="file"]').setInputFiles(['./src/playwright/assets/photo.png']);

    await expect(common.body).toContainText('Uploading 1 photo...');

    await expect.poll(async () => page.locator('[data-photo-id]').count()).toBe(1);
    await expectRecordToExist('badges', { code: 'frame', userId: 2 });
});

test('We can see comments after reloading', async ({ page, common, login }) => {
    await allowAddPhotos();

    await login.loginAsPlayer1();
    await page.goto('/user/settings');
    await page.locator('input[type="file"]').setInputFiles(['./src/playwright/assets/photo.png']);

    await common.modalSubmitButton.click();
    await expect.poll(async () => page.locator('[data-photo-id]').count()).toBe(2);

    await page.locator(`[data-photo-id="2"]`).click();

    // Delete photo
    await page.locator('[data-action-other]').click();
    await page.locator('button').getByText('Delete photo').click();
    await expect(common.modal).toContainText('You are about to delete the photo');
    await common.modal.locator('button').getByText('Yes').click();
    await expect.poll(async () => page.locator('[data-photo-id]').count()).toBe(1);
    expect(await getNumRecords('photos')).toBe(2);
});

test('Check that comments are hiding and showing automatically', async ({ page, common, login }) => {
    await allowAddPhotos();
    await runQuery(`UPDATE photos SET allowComments=0`);

    await login.loginAsPlayer1();
    await page.goto('/user/settings');
    await page.locator('input[type="file"]').setInputFiles(['./src/playwright/assets/photo.png']);

    await common.modalSubmitButton.click();
    await expect.poll(async () => page.locator('[data-photo-id]').count()).toBe(2);

    const photo = await expectRecordToExist(
        'photos',
        { userId: 1, width: 1200, height: 1182 },
        { allowShare: 1, allowComments: 1 }
    );

    await page.locator(`[data-photo-id="${photo.id}"]`).click();
    await page.locator('[data-action-comments]').click();
    await expect(page.locator(`[data-photo-comments="${photo.id}"]`)).toContainText('No comments here yet');

    await page.locator('[data-action-next]').click();
    await expect(page.locator(`[data-photo-comments="1"]`)).toContainText('Comments are disabled');

    await page.locator('[data-action-prev]').click();
    await expect(page.locator(`[data-photo-comments="${photo.id}"]`)).toContainText('No comments here yet');
});

test('We can upload two photos and change permissions', async ({ page, common, login }) => {
    await allowAddPhotos();

    await login.loginAsPlayer1();
    await page.goto('/user/settings');
    await page
        .locator('input[type="file"]')
        .setInputFiles(['./src/playwright/assets/photo.png', './src/playwright/assets/photo.jpg']);

    await page.locator('input[name="permissions.2.allowShare"]').click();
    await page.locator('input[name="permissions.2.allowComments"]').click();
    await page.locator('textarea[name="permissions.2.title"]').fill('My cool photo');
    await page.locator('input[name="permissions.3.allowShare"]').click();

    await common.modalSubmitButton.click();
    await expect(common.modal).toBeHidden();

    await expectRecordToExist('photos', { id: 2 }, { allowShare: 0, allowComments: 0, title: 'My cool photo' });
    await expectRecordToExist('photos', { id: 3 }, { allowShare: 0, allowComments: 1, title: null });
});

test('We can upload HEIC format', async ({ page, common, login }) => {
    await allowAddPhotos();

    await login.loginAsPlayer1();
    await page.goto('/user/settings');
    await page.locator('input[type="file"]').setInputFiles(['./src/playwright/assets/photo.heic']);

    await common.modalSubmitButton.click();
    await expect.poll(async () => page.locator('[data-photo-id]').count()).toBe(2);
});

test('We can upload naked photo and approve it', async ({ page, common, login }) => {
    await runQuery(`UPDATE settings SET newComplaintNotification="admin@gmail.com" WHERE id=1`);
    await allowAddPhotos();

    await login.loginAsPlayer1();
    await page.goto('/user/settings');
    await page.locator('input[type="file"]').setInputFiles(['./src/playwright/assets/naked.webp']);

    await common.modalSubmitButton.click();
    await expect(common.modal).toBeHidden();

    const photo = await expectRecordToExist('photos', { id: 2 }, { isApproved: 0 });
    expect(photo.moderationInfo).toContain('Female Swimwear or Underwear');
    expect(photo.moderationInfo).toContain('Partially Exposed Female Breast');

    await expect.poll(async () => page.locator('[data-photo-id]').count()).toBe(2);

    // we do not see moderated photo on the player page
    await page.goto('/player/ben-done');
    await expect.poll(async () => page.locator('[data-photo-id]').count()).toBe(1);

    const email = await expectRecordToExist(
        'emails',
        { recipientEmail: 'admin@gmail.com' },
        { subject: 'Photo is not approved' }
    );
    expect(email.html).toContain('Ben Done');
    expect(email.html).toContain('Female Swimwear or Underwear');
    expect(email.html).toContain('Partially Exposed Female Breast');

    const [approvePhotoUrl] = email.html.match(/\/action\/\w+/);

    await page.goto(approvePhotoUrl);
    await expect(common.modal).toContainText('Photo is approved');
    await expectRecordToExist('photos', { id: 2 }, { isApproved: 1 });

    await new Promise((resolve) => setTimeout(resolve, 1000));

    await page.goto(approvePhotoUrl);
    await expect(common.alert).toContainText('Photo is already approved.');

    // check that we can see moderated photo
    await page.goto('/player/ben-done');
    await expect.poll(async () => page.locator('[data-photo-id]').count()).toBe(2);
});

test('We can upload wide photo and see correct width and height', async ({ page, common, login }) => {
    await allowAddPhotos();

    await login.loginAsPlayer1();
    await page.goto('/user/settings');
    await page.locator('input[type="file"]').setInputFiles(['./src/playwright/assets/tooWide.png']);

    await expectRecordToExist('photos', { userId: 1, width: 2400, height: 1600 });
});

test('We can upload vertical photo', async ({ page, common, login }) => {
    await allowAddPhotos();

    await login.loginAsPlayer1();
    await page.goto('/user/settings');
    await page.locator('input[type="file"]').setInputFiles(['./src/playwright/assets/vertical.png']);

    await expectRecordToExist('photos', { userId: 1, width: 800, height: 2400 });
});

test('We can see not enough matches error', async ({ page, common, login }) => {
    await login.loginAsPlayer1();
    await page.goto('/user/settings');
    await expect(common.body).toContainText('You must play at least 10 matches to upload photos.');
});

test('We can see too many photos error', async ({ page, common, login }) => {
    await overrideConfig({ maxPhotosPerDay: 1, minMatchesToAddPhotos: 1 });

    await login.loginAsPlayer1();
    await page.goto('/user/settings');
    await page
        .locator('input[type="file"]')
        .setInputFiles(['./src/playwright/assets/photo.png', './src/playwright/assets/photo.jpg']);

    await expect(common.modal).toContainText('photo.jpg - Not more than 1 photos today');

    await expect.poll(async () => page.locator('[data-photo-id]').count()).toBe(2);
    expect(await getNumRecords('photos')).toBe(2);
});

test('We can see too big size error', async ({ page, common, login }) => {
    await overrideConfig({ maxPhotoSize: 100000, minMatchesToAddPhotos: 1 });

    await login.loginAsPlayer1();
    await page.goto('/user/settings');
    await page
        .locator('input[type="file"]')
        .setInputFiles(['./src/playwright/assets/photo.png', './src/playwright/assets/photo.jpg']);

    await expect(common.modal).toContainText('photo.png - Size is bigger than 98 KB');

    await expect.poll(async () => page.locator('[data-photo-id]').count()).toBe(2);
    expect(await getNumRecords('photos')).toBe(2);
});

test('We can see duplicated error', async ({ page, common, login }) => {
    await allowAddPhotos();

    await login.loginAsPlayer1();
    await page.goto('/user/settings');
    await page.locator('input[type="file"]').setInputFiles(['./src/playwright/assets/photo.png']);
    await expectRecordToExist('photos', { userId: 1, width: 1200, height: 1182 });
    await common.modalSubmitButton.click();
    await expect(common.modal).toBeHidden();

    await page.locator('input[type="file"]').setInputFiles(['./src/playwright/assets/photo.png']);

    await expect(common.modal).toContainText('photo.png - Duplicated photo');
    await expect(common.modal).not.toContainText('uploaded photo');

    await expect.poll(async () => page.locator('[data-photo-id]').count()).toBe(2);
    expect(await getNumRecords('photos')).toBe(2);

    await common.modal.locator('button').getByText('Ok, got it!').click();
    await expect(common.modal).toBeHidden();
});

test('We can see too small image error', async ({ page, common, login }) => {
    await allowAddPhotos();

    await login.loginAsPlayer1();
    await page.goto('/user/settings');
    await page
        .locator('input[type="file"]')
        .setInputFiles(['./src/playwright/assets/photo.png', './src/playwright/assets/wrongSmallSize.png']);
    await expect(common.modal).toContainText('Review 1 uploaded photo');
    await expect(common.modal).toContainText('wrongSmallSize.png - Low quality. Less than 800 pixels.');

    expect(await getNumRecords('photos')).toBe(2);
});

test('We can see wrong aspect ratio image error for wide image', async ({ page, common, login }) => {
    await allowAddPhotos();

    await login.loginAsPlayer1();
    await page.goto('/user/settings');
    await page
        .locator('input[type="file"]')
        .setInputFiles(['./src/playwright/assets/photo.png', './src/playwright/assets/wrongHorizontalAspectRatio.png']);
    await expect(common.modal).toContainText('Review 1 uploaded photo');
    await expect(common.modal).toContainText('wrongHorizontalAspectRatio.png - Aspect ratio is more than 3/1');

    expect(await getNumRecords('photos')).toBe(2);
});

test('We can see wrong aspect ratio image error for tall image', async ({ page, common, login }) => {
    await allowAddPhotos();

    await login.loginAsPlayer1();
    await page.goto('/user/settings');
    await page
        .locator('input[type="file"]')
        .setInputFiles(['./src/playwright/assets/photo.png', './src/playwright/assets/wrongVerticalAspectRatio.png']);
    await expect(common.modal).toContainText('Review 1 uploaded photo');
    await expect(common.modal).toContainText('wrongVerticalAspectRatio.png - Aspect ratio is less than 1/3');

    expect(await getNumRecords('photos')).toBe(2);
});

test('We can see error for wrong format', async ({ page, common, login }) => {
    await allowAddPhotos();

    await login.loginAsPlayer1();
    await page.goto('/user/settings');
    await page
        .locator('input[type="file"]')
        .setInputFiles(['./src/playwright/assets/photo.png', './src/playwright/assets/wrongFormat.jpg']);
    await expect(common.modal).toContainText('Review 1 uploaded photo');
    await expect(common.modal).toContainText('wrongFormat.jpg - Corrupted photo.');

    expect(await getNumRecords('photos')).toBe(2);
});

test('We can see error for wrong extension', async ({ page, common, login }) => {
    await allowAddPhotos();

    await login.loginAsPlayer1();
    await page.goto('/user/settings');
    await page
        .locator('input[type="file"]')
        .setInputFiles(['./src/playwright/assets/photo.png', './src/playwright/assets/wrongExtension.pdf']);
    await expect(common.modal).toContainText('Review 1 uploaded photo');
    await expect(common.modal).toContainText('wrongExtension.pdf - Unsupported file type');

    expect(await getNumRecords('photos')).toBe(2);
});

test('We can gather views', async ({ page, common, login }) => {
    await overrideConfig({ timeToViewPhoto: 2000 });
    await allowAddPhotos();

    // shouldn't add views for the quick glance
    await login.loginAsPlayer2();
    await page.goto('/player/ben-done');
    await page.locator('[data-photo-id="1"]').click();
    await new Promise((resolve) => setTimeout(resolve, 1000));
    await page.locator('[data-action-close]').click();

    await page.goto('/player/ben-done');
    await page.locator('[data-photo-id="1"]').click();
    await new Promise((resolve) => setTimeout(resolve, 3000));
    await expectRecordToExist('views', { photoId: 1 }, { count: 1 });

    await page.goto('/player/ben-done');
    await page.locator('[data-photo-id="1"]').click();
    await new Promise((resolve) => setTimeout(resolve, 3000));
    await expectRecordToExist('views', { photoId: 1 }, { count: 2 });
});

test('We can try to upload all images', async ({ page, common, login }) => {
    await overrideConfig({ maxPhotosPerDay: 20, minMatchesToAddPhotos: 1 });

    await login.loginAsPlayer1();
    await page.goto('/user/settings');
    await page
        .locator('input[type="file"]')
        .setInputFiles([
            './src/playwright/assets/photo.png',
            './src/playwright/assets/photo.jpg',
            './src/playwright/assets/photo.jpeg',
            './src/playwright/assets/photo.avif',
            './src/playwright/assets/photo.webp',
            './src/playwright/assets/tooWide.png',
            './src/playwright/assets/vertical.png',
            './src/playwright/assets/wrongExtension.pdf',
            './src/playwright/assets/wrongFormat.jpg',
            './src/playwright/assets/wrongHorizontalAspectRatio.png',
            './src/playwright/assets/wrongVerticalAspectRatio.png',
            './src/playwright/assets/wrongSmallSize.png',
        ]);
    await expect(common.body).toContainText('Uploading 11 photos...');
    await expect(common.modal).toContainText('Review 7 uploaded photos', { timeout: 10000 });
    await expect(common.modal).toContainText('wrongExtension.pdf - Unsupported file type');
    await expect(common.modal).toContainText('wrongFormat.jpg - Corrupted photo.');
    await expect(common.modal).toContainText('wrongHorizontalAspectRatio.png - Aspect ratio is more than 3/1.');
    await expect(common.modal).toContainText('wrongVerticalAspectRatio.png - Aspect ratio is less than 1/3.');
    await expect(common.modal).toContainText('wrongSmallSize.png - Low quality. Less than 800 pixels.');

    expect(await getNumRecords('photos')).toBe(8);
});

test('We cannot add more comments', async ({ page, common, login }) => {
    await overrideConfig({ maxCommentsPerDay: 2, minMatchesToAddPhotos: 1 });

    await login.loginAsPlayer1();
    await page.goto('/user/settings');
    await page.locator('[data-photo-id="1"]').click();

    // Comments
    await page.locator('[data-action-comments]').click();
    await page.locator('textarea[name="message"]').fill('First comment');
    await page.locator('button[data-send-comment-button]').click();

    await page.locator('textarea[name="message"]').fill('Second comment');
    await page.locator('button[data-send-comment-button]').click();

    await page.locator('textarea[name="message"]').fill('Third comment');
    await page.locator('button[data-send-comment-button]').click();
    await expect(common.alert).toContainText('You have reached the max 2 comments today');

    // Check limit after reloading
    await page.goto('/user/settings');
    await page.locator('[data-photo-id="1"]').click();

    await page.locator('[data-action-comments]').click();
    await page.locator('textarea[name="message"]').fill('Third comment');
    await page.locator('button[data-send-comment-button]').click();
    await expect(common.alert).toContainText('You have reached the max 2 comments today');
});

test('We can set settings on my photo', async ({ page, common, login }) => {
    await allowAddPhotos();

    await login.loginAsPlayer1();
    await page.goto('/user/settings');

    const Info = page.locator('[data-photo-info="1"]');
    const Reaction = page.locator('[data-action-reaction]');
    const Comments = page.locator('[data-photo-comments="1"]');

    await page.locator('[data-photo-id="1"]').click();
    await page.locator('a').getByText('Add description').click();
    await page.locator('input[name="title"]').fill('Corgi puppy');
    await common.modalSubmitButton.click();
    await expect(common.modal).toBeHidden();

    await expect(Info).toContainText('Corgi puppy');
    await expectRecordToExist('photos', { id: 1 }, { title: 'Corgi puppy' });

    // Add reaction
    await expect(Reaction).not.toContainText('1');
    await Reaction.click();
    await expect(Reaction).toContainText('1');
    await Reaction.click();
    await expect(Reaction).not.toContainText('1');

    // Comments
    await Reaction.click();
    await page.locator('[data-action-comments]').click();
    await expect(Comments).toContainText('Ben Done');
    await expect(Comments).toContainText('Corgi puppy');
    await expect(Comments).toContainText('No comments here yet');
    await expect(page.locator('[data-reaction="1f3be"]')).toContainText('1');

    await page.locator('[data-reaction="1f3be"]').click();
    await expect(page.locator('[data-reaction="1f3be"]')).toBeHidden();

    // Add comment
    await page.locator('textarea[name="message"]').fill('First comment');
    await page.locator('button[data-send-comment-button]').click();
    await expect(page.locator('textarea[name="message"]')).toHaveValue('');
    await expect(Comments).not.toContainText('No comments here yet');
    await expect(Comments).toContainText('First comment');
    await expect(Comments).toContainText('just now');

    // Edit comment
    await page.locator('[data-comment-actions="1"]').click();
    await page.locator('button').getByText('Edit comment').click();
    await common.modal.locator('textarea[name="message"]').fill('First updated comment');
    await common.modalSubmitButton.click();
    await expect(common.modal).toBeHidden();
    await expect(Comments).toContainText('First updated comment');

    // Delete comment
    await page.locator('[data-comment-actions="1"]').click();
    await page.locator('button').getByText('Delete comment').click();
    await expect(Comments).not.toContainText('First');
    await expect(Comments).toContainText('No comments here yet');

    // Check alt tag
    await page.goto('/user/settings');
    await expect(page.locator('img[alt="Corgi puppy"]')).toBeVisible();

    // Delete photo
    await page.locator('[data-photo-id="1"]').click();
    await page.locator('[data-action-other]').click();
    await page.locator('button').getByText('Delete photo').click();
    await expect(common.modal).toContainText('You are about to delete the photo');
    await common.modal.locator('button').getByText('Yes').click();
    await expect.poll(async () => page.locator('[data-photo-id]').count()).toBe(0);
    expect(await getNumRecords('photos')).toBe(1);
});

test('Can report about some comment', async ({ page, common, login }) => {
    await allowAddPhotos();
    await runQuery(`UPDATE settings SET newComplaintNotification="admin@gmail.com" WHERE id=1`);

    await login.loginAsPlayer1();
    await page.goto('/user/settings');
    await page.locator('[data-photo-id="1"]').click();

    // Add comment
    await page.locator('[data-action-comments]').click();
    await page.locator('textarea[name="message"]').fill('First comment');
    await page.locator('button[data-send-comment-button]').click();

    await login.loginAsPlayer2();
    await page.goto('/player/ben-done');
    await page.locator('[data-photo-id="1"]').click();
    await page.locator('[data-action-comments]').click();
    await expect(page.locator('[data-photo-comments="1"]')).toContainText('First comment');

    await page.locator('[data-comment-actions="1"]').click();
    await page.locator('button').getByText('Report').click();
    await common.modal.locator('textarea[name="message"]').fill('It is insalting');

    await common.modalSubmitButton.click();

    await expect(common.modal).toContainText('Thank you for bringing this to our attention.');

    await expectRecordToExist('reports', { userId: 2 }, { commentId: 1, message: 'It is insalting' });

    const email = await expectRecordToExist('emails', {
        subject: 'New Report About Comment',
        recipientEmail: 'admin@gmail.com',
    });
    expect(email.html).toContain('Ben Done');
    expect(email.html).toContain('Gary Mill');
    expect(email.html).toContain('First comment');
    expect(email.html).toContain('It is insalting');
});

test('Guests can see the comments', async ({ page, common, login }) => {
    await page.goto('/player/ben-done');
    await page.locator('[data-photo-id="1"]').click();
    await page.locator('[data-action-comments]').click();

    await new Promise((resolve) => setTimeout(resolve, 5000));
    await expect(common.body).toContainText('Ben Done');
});
