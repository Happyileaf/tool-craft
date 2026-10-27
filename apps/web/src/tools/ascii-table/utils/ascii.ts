/**
 * ASCII（US-ASCII，0–127）静态码表与查表纯函数
 *
 * 数据为公开标准字符集，全部在浏览器本地生成与检索，不依赖任何第三方库。
 */

/** 码位分类：控制字符（0–31）、可打印字符（32–126）、DEL（127） */
export type AsciiCategory = 'control' | 'printable' | 'delete';

/** 单行 ASCII 码表数据 */
export interface AsciiEntry {
  /** 十进制码位 0–127 */
  dec: number;
  /** 两位大写十六进制（不带前缀），如 41 */
  hex: string;
  /** 三位八进制，如 101 */
  oct: string;
  /** 七位二进制，如 1000001 */
  bin: string;
  /** 标准缩写：控制字符为 NUL / CR 等，可打印字符为空串 */
  abbr: string;
  /** 可打印字符本体（32–126）；控制字符与 DEL 为空串 */
  char: string;
  /** 表格中展示的字符：空格显示 ␠，控制字符显示缩写 */
  display: string;
  /** 分类 */
  category: AsciiCategory;
  /** 中文说明 */
  description: string;
}

/** 控制字符（0–31）与空格（32）、DEL（127）的标准缩写与中文说明 */
const NAMED_CODES: Record<number, { abbr: string; description: string }> = {
  0: { abbr: 'NUL', description: '空字符（Null）' },
  1: { abbr: 'SOH', description: '标题开始' },
  2: { abbr: 'STX', description: '正文开始' },
  3: { abbr: 'ETX', description: '正文结束' },
  4: { abbr: 'EOT', description: '传输结束' },
  5: { abbr: 'ENQ', description: '请求' },
  6: { abbr: 'ACK', description: '确认' },
  7: { abbr: 'BEL', description: '响铃' },
  8: { abbr: 'BS', description: '退格' },
  9: { abbr: 'HT', description: '水平制表符（Tab）' },
  10: { abbr: 'LF', description: '换行（Line Feed）' },
  11: { abbr: 'VT', description: '垂直制表符' },
  12: { abbr: 'FF', description: '换页' },
  13: { abbr: 'CR', description: '回车（Carriage Return）' },
  14: { abbr: 'SO', description: '移出' },
  15: { abbr: 'SI', description: '移入' },
  16: { abbr: 'DLE', description: '数据链路转义' },
  17: { abbr: 'DC1', description: '设备控制 1（XON）' },
  18: { abbr: 'DC2', description: '设备控制 2' },
  19: { abbr: 'DC3', description: '设备控制 3（XOFF）' },
  20: { abbr: 'DC4', description: '设备控制 4' },
  21: { abbr: 'NAK', description: '否定确认' },
  22: { abbr: 'SYN', description: '同步空闲' },
  23: { abbr: 'ETB', description: '传输块结束' },
  24: { abbr: 'CAN', description: '取消' },
  25: { abbr: 'EM', description: '介质结束' },
  26: { abbr: 'SUB', description: '替换' },
  27: { abbr: 'ESC', description: '转义（Escape）' },
  28: { abbr: 'FS', description: '文件分隔符' },
  29: { abbr: 'GS', description: '组分隔符' },
  30: { abbr: 'RS', description: '记录分隔符' },
  31: { abbr: 'US', description: '单元分隔符' },
  32: { abbr: 'SP', description: '空格（Space）' },
  127: { abbr: 'DEL', description: '删除（Delete）' },
};

/** 标点符号的中文说明（数字与字母的说明按区间生成） */
const PUNCTUATION_NAMES: Record<number, string> = {
  33: '感叹号 !',
  34: '双引号 "',
  35: '井号 #',
  36: '美元符 $',
  37: '百分号 %',
  38: '和号 &',
  39: '单引号 \'',
  40: '左括号 (',
  41: '右括号 )',
  42: '星号 *',
  43: '加号 +',
  44: '逗号 ,',
  45: '连字符 / 减号 -',
  46: '句号 .',
  47: '斜杠 /',
  58: '冒号 :',
  59: '分号 ;',
  60: '小于号 <',
  61: '等号 =',
  62: '大于号 >',
  63: '问号 ?',
  64: 'At 符 @',
  91: '左方括号 [',
  92: '反斜杠 \\',
  93: '右方括号 ]',
  94: '脱字符 ^',
  95: '下划线 _',
  96: '反引号 `',
  123: '左花括号 {',
  124: '竖线 |',
  125: '右花括号 }',
  126: '波浪号 ~',
};

/** 根据码位生成中文说明 */
function describeCode(code: number): string {
  const named = NAMED_CODES[code];
  if (named) {
    return named.description;
  }
  const punctuation = PUNCTUATION_NAMES[code];
  if (punctuation) {
    return punctuation;
  }
  if (code >= 48 && code <= 57) {
    return `数字 ${String.fromCharCode(code)}`;
  }
  if (code >= 65 && code <= 90) {
    return `大写字母 ${String.fromCharCode(code)}`;
  }
  if (code >= 97 && code <= 122) {
    return `小写字母 ${String.fromCharCode(code)}`;
  }
  return '';
}

/** 根据码位生成单行数据 */
function buildEntry(code: number): AsciiEntry {
  const isDelete = code === 127;
  const isControl = code >= 0 && code <= 31;
  const isPrintable = code >= 32 && code <= 126;
  const named = NAMED_CODES[code];
  const char = isPrintable ? String.fromCharCode(code) : '';

  return {
    dec: code,
    hex: code.toString(16).toUpperCase().padStart(2, '0'),
    oct: code.toString(8).padStart(3, '0'),
    bin: code.toString(2).padStart(7, '0'),
    abbr: named?.abbr ?? '',
    char,
    display: isDelete || isControl ? (named?.abbr ?? '') : code === 32 ? '␠' : char,
    category: isDelete ? 'delete' : isControl ? 'control' : 'printable',
    description: describeCode(code),
  };
}

/** 完整 ASCII 码表，码位 0–127 升序共 128 行 */
export const ASCII_TABLE: AsciiEntry[] = Array.from({ length: 128 }, (_, code) => buildEntry(code));

/**
 * 按十进制码位查表
 *
 * @param code - 十进制码位
 * @returns 对应行；非 0–127 的整数返回 undefined
 */
export function lookupByCode(code: number): AsciiEntry | undefined {
  if (!Number.isInteger(code) || code < 0 || code > 127) {
    return undefined;
  }
  return ASCII_TABLE[code];
}

/**
 * 按单个字符查表（仅接受 US-ASCII 字符）
 *
 * @param input - 任意长度输入，仅当恰好为单个 ASCII 字符时命中
 * @returns 对应行；非单字符或码位超出 127 返回 undefined
 */
export function lookupByChar(input: string): AsciiEntry | undefined {
  if (input.length !== 1) {
    return undefined;
  }
  const code = input.charCodeAt(0);
  return lookupByCode(code);
}

/** 检索命中结果 */
export interface AsciiLookupResult {
  /** 命中的码表行 */
  entry?: AsciiEntry;
  /** 识别出的输入形式 */
  kind?: 'char' | 'dec' | 'hex';
  /** 未命中时的中文原因 */
  error?: string;
}

/**
 * 双向检索：自动识别单字符、十进制（65）、十六进制（0x41 / 41h）输入
 *
 * @param raw - 用户输入原文
 * @returns 命中行与输入形式，或错误说明
 */
export function lookupAscii(raw: string): AsciiLookupResult {
  const input = raw.trim();
  if (!input) {
    return { error: '请输入单个字符，或 0–127 的十进制 / 十六进制码位' };
  }

  if (/^0x[0-9a-fA-F]+$/.test(input) || /^[0-9a-fA-F]+h$/.test(input)) {
    const hexText = input.startsWith('0x') ? input.slice(2) : input.slice(0, -1);
    const code = parseInt(hexText, 16);
    if (code > 127) {
      return { error: `码位 0x${code.toString(16).toUpperCase()} 超出 US-ASCII 范围（0x00–0x7F）` };
    }
    return { entry: lookupByCode(code), kind: 'hex' };
  }

  if (/^\d+$/.test(input)) {
    const code = Number(input);
    if (code > 127) {
      return { error: `码位 ${code} 超出 US-ASCII 范围（0–127）` };
    }
    return { entry: lookupByCode(code), kind: 'dec' };
  }

  if (input.length === 1) {
    const code = input.charCodeAt(0);
    if (code > 127) {
      return { error: `字符「${input}」的码位为 ${code}，超出 US-ASCII 范围（0–127）` };
    }
    return { entry: lookupByChar(input), kind: 'char' };
  }

  return { error: `无法识别「${input}」：请输入单个字符、十进制数（如 65）或十六进制（如 0x41）` };
}

/**
 * 按分类与关键字筛选码表
 *
 * 关键字匹配缩写、说明、展示字符、十进制码位以及 0x 十六进制写法（大小写不敏感）。
 *
 * @param category - 分类筛选，all 表示不限
 * @param keyword - 关键字，空白表示不过滤
 * @returns 筛选后的码表行
 */
export function filterAscii(
  category: 'all' | AsciiCategory,
  keyword: string,
): AsciiEntry[] {
  const word = keyword.trim().toLowerCase();
  return ASCII_TABLE.filter((entry) => {
    if (category !== 'all' && entry.category !== category) {
      return false;
    }
    if (!word) {
      return true;
    }
    return (
      entry.abbr.toLowerCase().includes(word) ||
      entry.description.toLowerCase().includes(word) ||
      entry.display.toLowerCase().includes(word) ||
      entry.char.toLowerCase() === word ||
      String(entry.dec) === word ||
      `0x${entry.hex.toLowerCase()}` === word ||
      entry.hex.toLowerCase() === word
    );
  });
}

/** Ctrl 组合键速查行 */
export interface CtrlCombo {
  /** 组合键名称，如 Ctrl+A */
  combo: string;
  /** 对应码位 1–26 */
  code: number;
}

/**
 * 生成 Ctrl+A…Ctrl+Z 与码位 0x01–0x1A 的对照
 *
 * 按住 Ctrl 时字母键的码位与 0x1F 按位与，等价于大写字母码位减 64。
 */
export function getCtrlCombos(): CtrlCombo[] {
  return Array.from({ length: 26 }, (_, index) => {
    const letter = String.fromCharCode(65 + index);
    return { combo: `Ctrl+${letter}`, code: index + 1 };
  });
}

/** 常用控制键速查（ESC / Tab / LF / CR / 空格 / DEL） */
export function getCommonKeys(): AsciiEntry[] {
  return [27, 9, 10, 13, 32, 127].map((code) => lookupByCode(code) as AsciiEntry);
}

/**
 * 生成单行的复制文本
 *
 * @param entry - 码表行
 * @returns 形如「A | Dec 65 | Hex 0x41 | Oct 101 | Bin 1000001」的文本
 */
export function formatEntryForCopy(entry: AsciiEntry): string {
  const shown = entry.char || entry.abbr;
  return `${shown} | Dec ${entry.dec} | Hex 0x${entry.hex} | Oct ${entry.oct} | Bin ${entry.bin}`;
}
