import { z } from 'zod';
import type { CapabilityDefinition } from '@tool-craft/core';
import { encodeBase64 } from '../shared/base64';

/**
 * Base64 编码能力：将输入文本经 UTF-8 编码为字节序列后输出标准 base64 字符串
 *
 * UTF-8 转换使用 Web 标准 TextEncoder（Node 亦全局可用），中文与 emoji 按多字节安全处理
 */
const base64EncodeCapability: CapabilityDefinition<string, Record<string, never>, string> = {
  id: 'text.base64-encode',
  name: 'Base64 编码',
  description: '将文本按 UTF-8 编码为 Base64 字符串',
  inputSchema: z.string(),
  paramsSchema: z.object({}),
  outputSchema: z.string(),
  transport: { input: 'json', output: 'json' },
  execute: (input) => encodeBase64(new TextEncoder().encode(input)),
};

export { base64EncodeCapability };
