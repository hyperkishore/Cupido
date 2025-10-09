import { test, expect } from '@playwright/test';

const DEMO_STORAGE_KEY = 'cupido_app_mode';

const primeDemoMode = () => {
  window.localStorage.setItem(DEMO_STORAGE_KEY, 'demo');
};

test.describe('Cupido demo smoke', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(primeDemoMode);
    await page.goto('/');
  });

  test('loads home experience data', async ({ page }) => {
    await expect(page.getByText('Cupido')).toBeVisible();
    await expect(page.getByText('day streak', { exact: false })).toBeVisible();
    await expect(page.getByText('Community feed', { exact: false })).toBeVisible();
  });

  test('navigates between primary tabs', async ({ page }) => {
    await page.getByText('Reflect', { exact: true }).click();
    await expect(page.getByText('Daily Reflection', { exact: false })).toBeVisible();

    await page.getByText('Matches', { exact: true }).click();
    await expect(page.getByText('Unlock Matching', { exact: false })).toBeVisible();

    await page.getByText('Profile', { exact: true }).click();
    await expect(page.getByText('Authenticity Score', { exact: false })).toBeVisible();
  });

  test('community feed renders sample reflections', async ({ page }) => {
    await expect(page.getByText('Community feed', { exact: false })).toBeVisible();
    await expect(page.getByText('Most hearts', { exact: false })).toBeVisible();
    const communityCards = page.locator('text=Share a reflection');
    if ((await communityCards.count()) === 0) {
      await expect(page.locator('text=Anonymous')).toBeVisible();
    }
  });
});
