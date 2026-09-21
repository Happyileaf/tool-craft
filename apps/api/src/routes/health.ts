import { createRoute, z } from '@hono/zod-openapi';
import type { OpenAPIHono } from '@hono/zod-openapi';

/**
 * 存活检查路由定义
 * 供平台探活与调用方确认服务可用性，无请求参数与鉴权
 */
export const healthRoute = createRoute({
  method: 'get',
  path: '/v1/health',
  tags: ['系统'],
  summary: '存活检查',
  description: '返回服务当前存活状态，供部署平台健康检查与调用方探活使用',
  responses: {
    200: {
      description: '服务存活',
      content: {
        'application/json': {
          schema: z
            .object({
              /** 固定为 ok 的存活状态标识 */
              status: z.literal('ok'),
            })
            .openapi('HealthResponse'),
        },
      },
    },
  },
});

/**
 * 注册存活检查路由
 *
 * @param app - OpenAPI Hono 应用实例
 * @returns 注册后的应用实例，便于链式调用
 */
export function registerHealthRoute(app: OpenAPIHono): OpenAPIHono {
  return app.openapi(healthRoute, (c) =>
    c.json(
      {
        status: 'ok' as const,
      },
      200,
    ),
  );
}
