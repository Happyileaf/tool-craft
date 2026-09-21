import { z } from 'zod';
import type { CapabilityDefinition } from '@tool-craft/core';

/** URL 编码参数 */
type UrlEncodeParams = {
  /** 编码范围：component 对应 encodeURIComponent（编码全部保留字符），uri 对应 encodeURI（保留 URL 结构字符） */
  scope: 'component' | 'uri';
};

/**
 * URL 编码能力：按 scope 对文本做百分号编码
 *
 * encodeURIComponent / encodeURI 均为跨平台标准 API，browser 与 node 行为一致
 */
const urlEncodeCapability: CapabilityDefinition<string, UrlEncodeParams, string> = {
  id: 'text.url-encode',
  name: 'URL 编码',
  description: '对文本进行 URL 百分号编码，支持 component 与 uri 两种范围',
  inputSchema: z.string(),
  paramsSchema: z.object({
    scope: z.enum(['component', 'uri']).default('component'),
  }),
  outputSchema: z.string(),
  transport: { input: 'json', output: 'json' },
  execute: (input, params) =>
    params.scope === 'uri' ? encodeURI(input) : encodeURIComponent(input),
};

export { urlEncodeCapability, type UrlEncodeParams };
