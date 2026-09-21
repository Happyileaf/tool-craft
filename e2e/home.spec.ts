import { expect, test } from '@playwright/test';

test.describe('首页', () => {
  test('展示品牌名、开发者分类入口并可进入 JSON Formatter', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { name: 'Tool-Craft', exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: /开发者/ })).toBeVisible();

    const formatterLink = page.getByRole('link', { name: /JSON Formatter/ });
    await expect(formatterLink).toHaveAttribute('href', '/tools/json-formatter');
    await formatterLink.click();

    await expect(page).toHaveURL(/\/tools\/json-formatter$/);
  });
});
