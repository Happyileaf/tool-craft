import { z } from 'zod';
import type { CapabilityDefinition } from '@tool-craft/core';
import { decodeBase64 } from '../shared/base64';

/**
 * Base64 解码能力：将标准 base64 字符串还原为字节序列后按 UTF-8 解码为文本
 *
 * UTF-8 转换使用 Web 标准 TextDecoder（Node 亦全局可用），中文与 emoji 按多字节安全处理
 */
const base64DecodeCapability: CapabilityDefinition<string, Record<string, never>, string> = {
  id: 'text.base64-decode',
  name: 'Base64 解码',
  description: '将 Base64 字符串解码为文本',
  inputSchema: z.string(),
  paramsSchema: z.object({}),
  outputSchema: z.string(),
  transport: { input: 'json', output: 'json' },
  execute: (input) => new TextDecoder().decode(decodeBase64(input)),
};

export { base64DecodeCapability };
