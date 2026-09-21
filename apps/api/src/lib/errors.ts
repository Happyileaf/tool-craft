import type { ContentfulStatusCode } from 'hono/utils/http-status';

/**
 * 应用级业务错误，携带稳定错误码、HTTP 状态码与可选明细，
 * 供全局错误处理中间件统一转换为结构化错误响应。
 */
export class AppError extends Error {
  /** 稳定的机器可读错误码，客户端依据其进行分支处理 */
  readonly code: string;

  /** 对应的 HTTP 状态码 */
  readonly status: ContentfulStatusCode;

  /** 错误明细列表，如字段级校验失败信息 */
  readonly details: unknown[];

  /**
   * 构造应用错误实例
   *
   * @param code - 稳定的机器可读错误码
   * @param message - 面向调用方的错误描述
   * @param status - 对应的 HTTP 状态码，缺省为 422
   * @param details - 错误明细列表，缺省为空数组
   */
  constructor(
    code: string,
    message: string,
    status: ContentfulStatusCode = 422,
    details: unknown[] = [],
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

/**
 * 创建处理失败类错误
 *
 * @param message - 面向调用方的错误描述
 * @param details - 错误明细列表，如字段级校验失败信息，缺省为空数组
 * @returns 错误码为 PROCESSING_ERROR、状态码为 422 的应用错误实例
 */
export function createProcessingError(message: string, details?: unknown[]): AppError {
  return new AppError('PROCESSING_ERROR', message, 422, details ?? []);
}
