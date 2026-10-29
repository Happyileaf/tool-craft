/**
 * 文本模式批量提取器内常量
 */

/** 默认勾选的内置模式 key */
export const DEFAULT_SELECTED_KEYS = ['email', 'url', 'ipv4', 'ipv6', 'uuid'];

/** 默认示例文本 */
export const DEFAULT_SAMPLE = `客服邮箱 support@example.com（重复出现 support@example.com）
文档地址 https://example.com/docs?ref=mail，备用 http://docs.example.cn
服务器地址 192.168.1.10 与 2001:db8::1，环回 ::1
请求追踪 UUID：550e8400-e29b-41d4-a716-446655440000
发布于 2026-10-29 09:30，主题色 #1677ff，警告色 #faad14。`;
