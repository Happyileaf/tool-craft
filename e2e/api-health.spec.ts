import { expect, test } from '@playwright/test';

test.describe('API 服务', () => {
  test('健康检查返回 ok', async ({ request }) => {
    const response = await request.get('http://localhost:3001/v1/health');

    expect(response.status()).toBe(200);
    await expect(response.json()).resolves.toEqual({ status: 'ok' });
  });

  test('接口文档页返回 HTML', async ({ request }) => {
    const response = await request.get('http://localhost:3001/docs');

    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('text/html');
  });
});
