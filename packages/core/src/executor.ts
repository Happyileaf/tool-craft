import type { CapabilityDefinition } from './types';
import { CapabilityError, CapabilityErrorCodeEnum } from './errors';

/**
 * 统一能力执行器，按 input → params → execute → output 顺序校验并执行
 *
 * @param capability - 能力定义，提供 input/params/output schema 与 execute 函数
 * @param rawInput - 原始输入，未经校验
 * @param rawParams - 原始参数，未经校验
 * @returns 通过 outputSchema 校验的执行结果
 * @throws 当 input/params 校验失败抛 CapabilityError(VALIDATION_ERROR)；当 execute 抛异常或 output 校验失败抛 CapabilityError(EXECUTION_ERROR)
 */
async function executeCapability<TInput, TParams, TOutput>(
  capability: CapabilityDefinition<TInput, TParams, TOutput>,
  rawInput: unknown,
  rawParams: unknown,
): Promise<TOutput> {
  const inputResult = capability.inputSchema.safeParse(rawInput);
  if (!inputResult.success) {
    throw new CapabilityError(
      CapabilityErrorCodeEnum.VALIDATION_ERROR,
      `Input validation failed: ${inputResult.error.message}`,
    );
  }

  const paramsResult = capability.paramsSchema.safeParse(rawParams);
  if (!paramsResult.success) {
    throw new CapabilityError(
      CapabilityErrorCodeEnum.VALIDATION_ERROR,
      `Params validation failed: ${paramsResult.error.message}`,
    );
  }

  let result: unknown;
  try {
    result = await capability.execute(inputResult.data, paramsResult.data);
  } catch (error) {
    throw new CapabilityError(
      CapabilityErrorCodeEnum.EXECUTION_ERROR,
      `Execution failed: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  const outputResult = capability.outputSchema.safeParse(result);
  if (!outputResult.success) {
    throw new CapabilityError(
      CapabilityErrorCodeEnum.EXECUTION_ERROR,
      `Output validation failed: ${outputResult.error.message}`,
    );
  }

  return outputResult.data;
}

export { executeCapability };
