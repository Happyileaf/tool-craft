export const DEFAULT_TEXT = 'AAAAABBBCCCCCCCCCCDEEEEEEEEEEFF';

export const HINT =
  '支持基础字节 RLE（count/byte 成对，255 截断）与 Apple PackBits 两种变体，提供文本/HEX 双向编解码、压缩率统计与膨胀告警。全部计算在浏览器本地完成。';

export type RleVariant = 'basic' | 'packbits';

export type IoMode = 'text' | 'hex';
