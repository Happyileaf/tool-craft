/**
 * 编码输入采用 JSON：
 * - 普通字符串 "abc" 按 UTF-8 编码
 * - ["hex", "0x.."] 按原始字节编码（0x 前缀可省略，位数须为偶数）
 * - 数组即 RLP 列表，可任意嵌套
 */
export const SAMPLE_ENCODE_INPUT = `[
  ["hex", "0x9c69"],
  ["hex", "0x04"],
  ["hex", "0x8504a817c800"],
  ["hex", "0x825208"],
  ["hex", "0x943535353535353535353535353535353535353535"],
  ["hex", "0x0de0b6b3a7640000"],
  "hello",
  []
]`;

/** 解码示例：以太坊官方向量 ["cat","dog"] */
export const SAMPLE_DECODE_HEX = '0xc88363617483646f67';

export const TYPE_LABELS: Record<string, string> = {
  byte: '单字节',
  'short-string': '短字符串',
  'long-string': '长字符串',
  'short-list': '短列表',
  'long-list': '长列表',
};

export const TYPE_COLORS: Record<string, string> = {
  byte: 'default',
  'short-string': 'green',
  'long-string': 'cyan',
  'short-list': 'blue',
  'long-list': 'geekblue',
};
