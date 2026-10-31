/**
 * Unicode 字符检视器常量：内置的不可见 / 特殊字符小码点表、
 * 类别中文描述、控制符可见占位符与示例文本。
 *
 * 码点表刻意保持小而精（约 30 条），不引入任何大型 Unicode 静态数据包；
 * C0 / C1 控制符在 getFlag 中按区间整体判定，不在此表逐个列出。
 */

/** 一条不可见 / 特殊字符记录，start 与 end 相同表示单个码点 */
export interface InvisibleCharEntry {
  /** 起始码点（含） */
  start: number;
  /** 结束码点（含），省略表示与 start 相同的单码点 */
  end?: number;
  /** 中文名与常见缩写，如「零宽空格 ZWSP」 */
  name: string;
  /** 风险说明 */
  reason: string;
}

/**
 * 内置的不可见 / 特殊字符码点表，覆盖常见的隐形排版字符、
 * bidi 控制字符、变体选择符、标签字符与常被当作隐形的填充字符。
 */
export const INVISIBLE_CHARS: readonly InvisibleCharEntry[] = [
  { start: 0x00a0, name: '不换行空格 NBSP', reason: '与普通空格外观一致，可能由网页复制带入' },
  { start: 0x00ad, name: '软连字符 Soft Hyphen', reason: '默认不可见的可选断词连字符' },
  { start: 0x115f, name: '朝鲜文填充字符 Hangul Choseong Filler', reason: '现代文本中几乎不可见的旧式填充字符' },
  { start: 0x180e, name: '蒙古文元音分隔符 Mongolian Vowel Separator', reason: '宽度为零的分隔符（旧版 Unicode 归为 Zs）' },
  { start: 0x200b, name: '零宽空格 ZWSP', reason: '最常见的隐形字符，可截断搜索与匹配' },
  { start: 0x200c, name: '零宽不连字 ZWNJ', reason: '阻止相邻字符连写的不可见控制符' },
  { start: 0x200d, name: '零宽连字 ZWJ', reason: 'emoji 序列中合法，但纯文本中常为意外字符' },
  { start: 0x200e, name: '从左到右标记 LRM', reason: '不可见的双向排版控制符' },
  { start: 0x200f, name: '从右到左标记 RLM', reason: '不可见的双向排版控制符' },
  { start: 0x2028, name: '行分隔符 Line Separator', reason: '看似空行的 Unicode 行分隔符' },
  { start: 0x2029, name: '段分隔符 Paragraph Separator', reason: '看似空行的 Unicode 段分隔符' },
  { start: 0x202a, end: 0x202e, name: '双向排版控制符 LRE/RLE/PDF/LRO/RLO', reason: '可改变后续文本方向的 bidi 控制符（如 RLO 可造成视觉欺骗）' },
  { start: 0x2060, name: '字词连接符 WJ', reason: '不可见的禁止换行连接符' },
  { start: 0x2061, name: '函数应用 Function Application', reason: '不可见的数学排版控制符' },
  { start: 0x2062, name: '不可见乘号 Invisible Times', reason: '不可见的数学排版控制符' },
  { start: 0x2063, name: '不可见分隔符 Invisible Separator', reason: '不可见的数学排版控制符' },
  { start: 0x2064, name: '不可见加号 Invisible Plus', reason: '不可见的数学排版控制符' },
  { start: 0x2066, end: 0x2069, name: 'bidi 隔离控制符 LRI/RLI/FSI/PDI', reason: '不可见的双向隔离排版控制符' },
  { start: 0x3000, name: '表意文字空格 IDEOGRAPHIC SPACE', reason: '空白字符（非 ASCII 空格），宽度为一个全角字符' },
  { start: 0x3164, name: '谚文填充符 Hangul Filler', reason: '常被用作隐形占位的韩文填充字符' },
  { start: 0xfe00, end: 0xfe0f, name: '变体选择符 Variation Selectors VS1–VS16', reason: '不可见，用于改变前一字符的字形变体' },
  { start: 0xfeff, name: 'BOM / 零宽不换行空格 ZWNBSP', reason: '出现在文本中通常是意外的字节序标记' },
  { start: 0xffa0, name: '半角韩文填充符 Halfwidth Hangul Filler', reason: '常被当作隐形字符使用' },
  { start: 0xfff9, end: 0xfffb, name: '行间注解符 IAFS', reason: '不可见的行间注解边界控制符' },
  {
    start: 0xe0000,
    end: 0xe007f,
    name: '语言标签字符 Tags',
    reason: '不可见的标签控制字符，可被用于隐藏文本欺骗',
  },
];

/** General_Category 细分类别到中文描述的映射 */
export const CATEGORY_LABELS: Record<string, string> = {
  L: '字母 Letter',
  M: '附加符号 Mark',
  N: '数字 Number',
  P: '标点 Punctuation',
  S: '符号 Symbol',
  Z: '分隔符 Separator',
  Cc: '控制字符 Control',
  Cf: '格式控制符 Format',
  Cs: '代理项 Surrogate',
  Co: '私用区字符 Private Use',
  Cn: '未分配字符 Unassigned',
  C: '其他 Other',
};

/** C0 控制符（0x00–0x1F）的可见占位符（控制图形符 control picture） */
export const CONTROL_PICTURES: Record<number, string> = {
  0x00: '␀',
  0x01: '␁',
  0x02: '␂',
  0x03: '␃',
  0x04: '␄',
  0x05: '␅',
  0x06: '␆',
  0x07: '␇',
  0x08: '␈',
  0x09: '␉',
  0x0a: '␊',
  0x0b: '␋',
  0x0c: '␌',
  0x0d: '␍',
  0x0e: '␎',
  0x0f: '␏',
  0x10: '␐',
  0x11: '␑',
  0x12: '␒',
  0x13: '␓',
  0x14: '␔',
  0x15: '␕',
  0x16: '␖',
  0x17: '␗',
  0x18: '␘',
  0x19: '␙',
  0x1a: '␚',
  0x1b: '␛',
  0x1c: '␜',
  0x1d: '␝',
  0x1e: '␞',
  0x1f: '␟',
  0x20: '␠',
  0x7f: '␡',
};

/** 表格最多渲染的行数，纯函数不截断，截断只发生在 UI 渲染层 */
export const MAX_TABLE_ROWS = 2000;

/** 示例：零宽字符与 RLO 双向控制符（U+202E 会让后续拉丁字母视觉反向） */
export const SAMPLE_INVISIBLE = 'a\u200bb\u202eHello world!\u200f';

/** 示例：emoji 代理对（含区域指示符国旗序列） */
export const SAMPLE_EMOJI = '😀🇨🇳👨‍👩‍👧';

/** 示例：组合音标，é 的 NFD 形式（e + U+0301）与全角字符 */
export const SAMPLE_COMBINING = 'e\u0301（组合重音） Ａ';
