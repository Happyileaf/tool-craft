/**
 * RFC 7239 Forwarded 头编解码工具的静态配置
 */

/** 转发参数键定义，顺序即生成与表单展示顺序 */
export const PARAM_KEYS = [
  { key: 'for', label: 'for（发起节点）' },
  { key: 'by', label: 'by（代理节点）' },
  { key: 'host', label: 'host（原始 Host）' },
  { key: 'proto', label: 'proto（原始协议）' },
] as const;

/** 协议快捷选项 */
export const PROTO_OPTIONS = ['http', 'https'] as const;

/** 空转发元素，用于新增一跳 */
export function createEmptyElement() {
  return { for: '', by: '', host: '', proto: '' };
}
