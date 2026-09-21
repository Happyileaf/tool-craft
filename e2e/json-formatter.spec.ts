import { expect, test } from '@playwright/test';

test.describe('JSON Formatter 工具', () => {
  test('合法 JSON 输出缩进结果，非法 JSON 提示错误且保留输入', async ({ page }) => {
    await page.goto('/tools/json-formatter');

    const input = page.locator('#json-input');
    const formatButton = page.getByRole('button', { name: '格式化' });

    await input.fill('{"name":"tool-craft","version":1}');
    await formatButton.click();

    const output = page.locator('pre');
    await expect(output).toBeVisible();
    const formattedText = (await output.textContent()) ?? '';
    expect(formattedText).toContain('"name": "tool-craft"');
    expect(formattedText).toContain('\n  "name"');

    await input.fill('{"a":}');
    await formatButton.click();

    await expect(page.locator('.text-red-600')).toBeVisible();
    await expect(page.locator('.text-red-600')).toContainText('JSON 格式错误');
    await expect(input).toHaveValue('{"a":}');
  });
});
