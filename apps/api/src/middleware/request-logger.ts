import type { MiddlewareHandler } from 'hono';

/**
 * 创建请求日志中间件
 *
 * 为每个请求生成或透传请求 ID，写入上下文与响应头，
 * 并在请求结束后输出单行 JSON 访问日志；全过程不读取请求体。
 *
 * @returns Hono 中间件处理器
 */
export function requestLogger(): MiddlewareHandler {
  return async (c, next) => {
    const startTime = Date.now();
    const requestId = c.req.header('x-request-id') ?? crypto.randomUUID();

    c.set('requestId', requestId);
    c.header('x-request-id', requestId);

    await next();

    const durationMs = Date.now() - startTime;
    console.log(
      JSON.stringify({
        requestId,
        method: c.req.method,
        path: c.req.path,
        status: c.res.status,
        durationMs,
      }),
    );
  };
}
