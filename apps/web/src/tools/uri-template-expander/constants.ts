/**
 * RFC 6570 URI Template 展开器静态配置
 */

/** 操作符速查表，用于说明面板 */
export const OPERATOR_REFERENCE = [
  { operator: '{var}', level: 'L1', meaning: '简单替换，保留字符做百分号编码' },
  { operator: '{+var}', level: 'L2', meaning: '保留展开，不编码 / : ? 等保留字符' },
  { operator: '{#var}', level: 'L2', meaning: '片段标识符，前缀 #' },
  { operator: '{.var}', level: 'L3', meaning: '标签/域名分段，前缀 .' },
  { operator: '{/var}', level: 'L3', meaning: '路径分段，前缀 /' },
  { operator: '{;var}', level: 'L3', meaning: '路径参数，形如 ;key=value' },
  { operator: '{?var}', level: 'L3', meaning: '查询串，前缀 ?，多值用 & 连接' },
  { operator: '{&var}', level: 'L3', meaning: '查询续接，前缀 &' },
  { operator: '{var*}', level: 'L4', meaning: 'explode：数组/对象按操作符分隔符展开' },
  { operator: '{var:3}', level: 'L4', meaning: '前缀截断，取标量前 3 个码点' },
] as const;
