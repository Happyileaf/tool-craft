import { OpenAPIHono } from '@hono/zod-openapi';
import { Scalar } from '@scalar/hono-api-reference';
import { VALIDATION_ERROR_CODE } from './constants.js';
import { AppError } from './errors.js';
import { errorHandler } from '../middleware/error-handler.js';
import { requestLogger } from '../middleware/request-logger.js';
import { registerHealthRoute } from '../routes/health.js';
import { registerImageCompressRoute } from '../routes/image-compress.js';

/**
 * zod-openapi 自动校验结果的全局兜底钩子
 *
 * multipart 文档 Schema 使用普通 OpenAPI 对象，不注册自动校验；
 * 其余目标（query、json 等）校验失败时统一抛出 400 校验错误，
 * 响应结构由错误处理中间件收敛。
 *
 * @param result - 自动校验结果
 * @param result.success - 是否校验通过
 */
function handleValidationHook(result: { success: boolean }): void {
  if (!result.success) {
    throw new AppError(VALIDATION_ERROR_CODE, '请求参数校验失败', 400);
  }
}

const app = new OpenAPIHono({
  defaultHook: handleValidationHook,
});

app.use('*', requestLogger());

app.notFound((c) =>
  c.json(
    {
      error: {
        code: 'NOT_FOUND',
        message: 'Not Found',
        details: [],
      },
    },
    404,
  ),
);

app.onError(errorHandler);

registerHealthRoute(app);
registerImageCompressRoute(app);

app.doc('/openapi.json', {
  openapi: '3.0.0',
  info: {
    title: 'Tool-Craft API',
    version: '0.1.1',
  },
});

app.get(
  '/docs',
  Scalar({
    url: '/openapi.json',
  }),
);

export default app;
