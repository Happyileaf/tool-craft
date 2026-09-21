import type { ErrorHandler } from 'hono';
import { AppError } from '../lib/errors.js';

/**
 * 全局错误处理中间件
 *
 * 应用错误按其携带的状态码与错误码输出；未知错误统一收敛为 500，
 * 堆栈等内部细节仅写入服务端日志，不进入响应体。
 *
 * @param err - 上游抛出的错误
 * @param c - Hono 请求上下文
 * @returns 外层结构固定为 error 对象的 JSON 响应
 */
export const errorHandler: ErrorHandler = (err, c) => {
  const requestId = c.get('requestId') as string | undefined;

  if (err instanceof AppError) {
    return c.json(
      {
        error: {
          code: err.code,
          message: err.message,
          details: err.details,
        },
      },
      err.status,
    );
  }

  console.error(JSON.stringify({ requestId, name: err.name, message: err.message }));

  return c.json(
    {
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal Server Error',
        details: [],
      },
    },
    500,
  );
};
