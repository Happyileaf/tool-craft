import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { executeCapability } from './executor';
import { CapabilityError, CapabilityErrorCodeEnum } from './errors';
import type { CapabilityDefinition } from './types';

/**
 * 断言 fn 抛出指定 code 的 CapabilityError；未抛出或 code 不符均判失败
 */
async function expectCapabilityError(
  fn: () => Promise<unknown>,
  code: CapabilityErrorCodeEnum,
): Promise<void> {
  try {
    await fn();
  } catch (error) {
    expect(error).toBeInstanceOf(CapabilityError);
    expect((error as CapabilityError).code).toBe(code);
    return;
  }
  expect.unreachable('Expected fn to throw a CapabilityError, but it did not throw');
}

describe('executeCapability', () => {
  it('成功执行：input/params 校验通过 → execute 被调用 → output 校验通过 → 返回 output', async () => {
    let executed = false;
    const capability: CapabilityDefinition<string, { sep: string }, string> = {
      id: 'text.join',
      name: 'join',
      description: 'join input with separator',
      inputSchema: z.string(),
      paramsSchema: z.object({ sep: z.string() }),
      outputSchema: z.string(),
      transport: { input: 'json', output: 'json' },
      execute: (input, params) => {
        executed = true;
        return `${input}${params.sep}`;
      },
    };
    const output = await executeCapability(capability, 'hello', { sep: '-' });
    expect(executed).toBe(true);
    expect(output).toBe('hello-');
  });

  it('VALIDATION_ERROR：input 校验失败（schema 为 z.string() 但传 number）', async () => {
    const capability: CapabilityDefinition<string, unknown, string> = {
      id: 'text.echo',
      name: 'echo',
      description: 'echo input back',
      inputSchema: z.string(),
      paramsSchema: z.object({}),
      outputSchema: z.string(),
      transport: { input: 'json', output: 'json' },
      execute: (input) => input,
    };
    await expectCapabilityError(
      () => executeCapability(capability, 123, {}),
      CapabilityErrorCodeEnum.VALIDATION_ERROR,
    );
  });

  it('VALIDATION_ERROR：params 校验失败', async () => {
    const capability: CapabilityDefinition<string, { sep: string }, string> = {
      id: 'text.join',
      name: 'join',
      description: 'join input with separator',
      inputSchema: z.string(),
      paramsSchema: z.object({ sep: z.string() }),
      outputSchema: z.string(),
      transport: { input: 'json', output: 'json' },
      execute: (input, params) => `${input}${params.sep}`,
    };
    await expectCapabilityError(
      () => executeCapability(capability, 'hello', { sep: 123 }),
      CapabilityErrorCodeEnum.VALIDATION_ERROR,
    );
  });

  it('EXECUTION_ERROR：execute 抛异常 → 被包装为 CapabilityError(EXECUTION_ERROR)', async () => {
    const capability: CapabilityDefinition<string, unknown, string> = {
      id: 'text.fail',
      name: 'fail',
      description: 'always throws',
      inputSchema: z.string(),
      paramsSchema: z.object({}),
      outputSchema: z.string(),
      transport: { input: 'json', output: 'json' },
      execute: () => {
        throw new Error('boom');
      },
    };
    await expectCapabilityError(
      () => executeCapability(capability, 'hello', {}),
      CapabilityErrorCodeEnum.EXECUTION_ERROR,
    );
  });

  it('EXECUTION_ERROR：output 校验失败（execute 返回值不符合 outputSchema）', async () => {
    const capability: CapabilityDefinition<string, unknown, unknown> = {
      id: 'text.broken',
      name: 'broken',
      description: 'returns value that violates outputSchema',
      inputSchema: z.string(),
      paramsSchema: z.object({}),
      outputSchema: z.string(),
      transport: { input: 'json', output: 'json' },
      execute: () => 42,
    };
    await expectCapabilityError(
      () => executeCapability(capability, 'hello', {}),
      CapabilityErrorCodeEnum.EXECUTION_ERROR,
    );
  });

  it('EXECUTION_ERROR：execute 返回 rejected Promise，异步异常被 await 捕获并包装', async () => {
    const capability: CapabilityDefinition<string, unknown, string> = {
      id: 'text.async-fail',
      name: 'async-fail',
      description: 'rejects asynchronously',
      inputSchema: z.string(),
      paramsSchema: z.object({}),
      outputSchema: z.string(),
      transport: { input: 'json', output: 'json' },
      execute: async () => {
        throw new Error('async boom');
      },
    };
    await expectCapabilityError(
      () => executeCapability(capability, 'hello', {}),
      CapabilityErrorCodeEnum.EXECUTION_ERROR,
    );
  });
});
