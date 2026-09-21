import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { createCapabilityRegistry } from './registry';
import { CapabilityError, CapabilityErrorCodeEnum } from './errors';
import type { CapabilityDefinition } from './types';

/**
 * 构造输入输出直连的 mock capability，用于隔离 registry 单测，不触发真实执行逻辑
 */
function createMockCapability(id: string): CapabilityDefinition {
  return {
    id,
    name: `mock-${id}`,
    description: `mock capability ${id}`,
    inputSchema: z.string(),
    paramsSchema: z.object({}),
    outputSchema: z.string(),
    transport: { input: 'json', output: 'json' },
    execute: (input) => input,
  };
}

describe('createCapabilityRegistry', () => {
  it('register + get：注册后可通过 id 获取能力定义', () => {
    const registry = createCapabilityRegistry();
    const capability = createMockCapability('text.echo');
    registry.register(capability);
    expect(registry.get('text.echo')).toBe(capability);
  });

  it('register 重复 id 抛 CONFLICT 错误', () => {
    const registry = createCapabilityRegistry();
    registry.register(createMockCapability('text.echo'));
    let thrown: unknown;
    try {
      registry.register(createMockCapability('text.echo'));
    } catch (error) {
      thrown = error;
    }
    expect(thrown).toBeInstanceOf(CapabilityError);
    expect((thrown as CapabilityError).code).toBe(CapabilityErrorCodeEnum.CONFLICT);
  });

  it('get 不存在的 id 抛 NOT_FOUND 错误', () => {
    const registry = createCapabilityRegistry();
    let thrown: unknown;
    try {
      registry.get('not.exist');
    } catch (error) {
      thrown = error;
    }
    expect(thrown).toBeInstanceOf(CapabilityError);
    expect((thrown as CapabilityError).code).toBe(CapabilityErrorCodeEnum.NOT_FOUND);
  });

  it('has：已注册返回 true，未注册返回 false', () => {
    const registry = createCapabilityRegistry();
    registry.register(createMockCapability('text.echo'));
    expect(registry.has('text.echo')).toBe(true);
    expect(registry.has('not.exist')).toBe(false);
  });

  it('list：返回所有已注册能力的摘要，含正确的 id/name/description', () => {
    const registry = createCapabilityRegistry();
    registry.register(createMockCapability('text.echo'));
    registry.register(createMockCapability('text.base64-encode'));
    const summaries = registry.list();
    expect(summaries).toHaveLength(2);
    expect(summaries).toEqual(
      expect.arrayContaining([
        { id: 'text.echo', name: 'mock-text.echo', description: 'mock capability text.echo' },
        {
          id: 'text.base64-encode',
          name: 'mock-text.base64-encode',
          description: 'mock capability text.base64-encode',
        },
      ]),
    );
  });
});
