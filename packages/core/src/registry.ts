import type { CapabilityDefinition, CapabilitySummary } from './types';
import { CapabilityError, CapabilityErrorCodeEnum } from './errors';

/**
 * Capability 注册表，提供能力的注册、查询、存在性判断与列举
 */
type CapabilityRegistry = {
  /**
   * 注册一个能力
   *
   * @param capability - 能力定义
   * @throws 当能力 id 已存在时抛出 CapabilityError(CONFLICT)
   */
  register(capability: CapabilityDefinition): void;
  /**
   * 根据 id 获取能力定义
   *
   * @param id - 能力唯一标识
   * @returns 能力定义
   * @throws 当能力 id 不存在时抛出 CapabilityError(NOT_FOUND)
   */
  get(id: string): CapabilityDefinition;
  /**
   * 判断能力是否已注册
   *
   * @param id - 能力唯一标识
   * @returns 已注册返回 true，否则返回 false
   */
  has(id: string): boolean;
  /**
   * 列出所有已注册能力的摘要
   *
   * @returns 能力摘要数组，顺序与注册顺序一致
   */
  list(): CapabilitySummary[];
};

/**
 * 创建 Capability 注册表实例
 *
 * @returns 空的 Capability 注册表
 */
function createCapabilityRegistry(): CapabilityRegistry {
  const registry = new Map<string, CapabilityDefinition>();

  return {
    register(capability) {
      if (registry.has(capability.id)) {
        throw new CapabilityError(
          CapabilityErrorCodeEnum.CONFLICT,
          `Capability already registered: ${capability.id}`,
        );
      }
      registry.set(capability.id, capability);
    },
    get(id) {
      const capability = registry.get(id);
      if (!capability) {
        throw new CapabilityError(
          CapabilityErrorCodeEnum.NOT_FOUND,
          `Capability not found: ${id}`,
        );
      }
      return capability;
    },
    has(id) {
      return registry.has(id);
    },
    list() {
      return Array.from(registry.values()).map((capability) => ({
        id: capability.id,
        name: capability.name,
        description: capability.description,
      }));
    },
  };
}

export { createCapabilityRegistry, type CapabilityRegistry };
