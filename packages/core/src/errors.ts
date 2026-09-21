/**
 * Capability 错误码枚举
 */
enum CapabilityErrorCodeEnum {
  /** 输入或参数校验失败 */
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  /** 执行过程中发生异常 */
  EXECUTION_ERROR = 'EXECUTION_ERROR',
  /** 未找到指定能力 */
  NOT_FOUND = 'NOT_FOUND',
  /** 能力 ID 冲突（重复注册） */
  CONFLICT = 'CONFLICT',
}

/**
 * Capability 错误，携带机器可读的 code 字段
 */
class CapabilityError extends Error {
  /** 机器可读的错误码 */
  readonly code: CapabilityErrorCodeEnum;
  constructor(code: CapabilityErrorCodeEnum, message: string) {
    super(message);
    this.name = 'CapabilityError';
    this.code = code;
  }
}

export { CapabilityError, CapabilityErrorCodeEnum };
