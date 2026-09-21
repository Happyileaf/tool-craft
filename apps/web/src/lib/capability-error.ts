import { CapabilityError } from '@tool-craft/core';

/**
 * 将能力执行抛出的错误转换为面向用户的提示文案
 *
 * @param error - executeCapability 抛出的未知错误
 * @returns CapabilityError 时返回「错误码 + 原始信息」，其余错误返回通用失败提示
 */
function getCapabilityErrorMessage(error: unknown): string {
  if (error instanceof CapabilityError) {
    return `[${error.code}] ${error.message}`;
  }
  return '执行失败，请检查输入后重试';
}

export { getCapabilityErrorMessage };
