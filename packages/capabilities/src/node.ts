import { createCapabilityRegistry, type CapabilityRegistry } from '@tool-craft/core';
import { base64EncodeCapability } from './base64-encode/index';
import { base64DecodeCapability } from './base64-decode/index';
import { urlEncodeCapability } from './url-encode/index';
import { jsonFormatCapability } from './json-format/index';
import { timestampConvertCapability } from './timestamp-convert/index';

/**
 * Node 侧 Capability 注册入口（subpath './node'）
 *
 * 汇集所有能力在 Node 环境的实现：纯计算能力两端共用同一实现，
 * 平台特定能力（如 image.resize）在此注册其 sharp 版本。
 * 新增工具时在此追加一行 register 即可，无需改动 core。
 *
 * @returns 已注册全部 Node 侧能力的注册表
 */
function createNodeRegistry(): CapabilityRegistry {
  const registry = createCapabilityRegistry();
  registry.register(base64EncodeCapability);
  registry.register(base64DecodeCapability);
  registry.register(urlEncodeCapability);
  registry.register(jsonFormatCapability);
  registry.register(timestampConvertCapability);
  return registry;
}

export { createNodeRegistry };
