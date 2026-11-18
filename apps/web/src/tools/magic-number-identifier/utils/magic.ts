/**
 * 文件魔数识别核心纯函数：Hex 归一化与签名表前缀匹配。
 * 所有逻辑不依赖 DOM / 文件 API，可直接在单测中运行。
 */

/** 单条魔数签名定义 */
export interface MagicSignature {
  /** 类型名称 */
  name: string;
  /** 关联扩展名（不含点，小写） */
  extensions: string[];
  /** MIME 类型，无标准 MIME 时为空字符串 */
  mimeType: string;
  /** 签名在文件中的起始偏移（字节） */
  offset: number;
  /** 签名十六进制（仅含 0-9a-f，内部转字节比较，避免大小写问题） */
  hex: string;
  /** 说明 */
  description: string;
}

/** 签名匹配结果 */
export interface MagicMatch {
  name: string;
  extensions: string[];
  mimeType: string;
  offset: number;
  signatureHex: string;
  description: string;
}

/** 识别结果 */
export interface IdentifyResult {
  matches: MagicMatch[];
  /** 未命中原因（命中时为空字符串） */
  reason: string;
  /** 输入前 16 字节的规范化 hex，用于结果回显 */
  previewHex: string;
}

const HEX_RE = /^[0-9a-f]+$/i;

/**
 * 将任意 Hex dump 文本归一化为纯 hex 字符串：
 * 剥离空格、制表符、换行、回车、冒号、0x 前缀与偏移样式（行首 8 位十六进制 + 冒号）。
 *
 * @param input - 原始 Hex dump
 * @returns 归一化后的小写 hex 字符串
 * @throws 含非十六进制字符或奇数长度时抛出错误
 */
export function normalizeHexDump(input: string): string {
  const lines = input.split(/\r?\n/);
  const cleanedLines = lines.map((line) => {
    // 兼容 xxd 风格偏移："00000000: 8950 4e47 ...." 先去掉行首偏移段
    const offsetMatch = line.match(/^\s*[0-9a-fA-F]{4,16}\s*:\s?(.*)$/);
    return offsetMatch ? offsetMatch[1] : line;
  });
  const cleaned = cleanedLines
    .join('\n')
    .replace(/0x/gi, '')
    .replace(/(?:[|/\\]|\s{2,})[^\n]*$/gm, '') // 去掉每行 ASCII 侧栏（| 引导或两个以上空格后的文本）
    .replace(/[\s:.-]/g, '')
    .trim();

  if (cleaned.length === 0) {
    return '';
  }
  if (!HEX_RE.test(cleaned)) {
    throw new Error('Hex 输入包含非十六进制字符（仅允许 0-9 / A-F 与常见分隔符）');
  }
  if (cleaned.length % 2 !== 0) {
    throw new Error('Hex 长度为奇数，每个字节需由两个十六进制字符表示');
  }
  return cleaned.toLowerCase();
}

/** 纯 hex 字符串转字节数组 */
export function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i += 1) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

/** 字节数组转小写 hex 字符串 */
export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

function signatureBytes(signature: MagicSignature): Uint8Array {
  return hexToBytes(signature.hex);
}

function startsAt(bytes: Uint8Array, signature: MagicSignature): boolean {
  const needle = signatureBytes(signature);
  if (signature.offset + needle.length > bytes.length) {
    return false;
  }
  return needle.every((byte, index) => bytes[signature.offset + index] === byte);
}

/**
 * 按魔数签名表识别字节数组的真实文件类型。
 * 同一签名可对应多个候选类型（如 OLE 复合文档同时匹配 doc/xls/ppt），
 * 结果按「签名长度降序、偏移升序、名称升序」排列，特异性高的签名优先。
 *
 * @param bytes - 文件字节（建议至少前 64 字节）
 * @param signatures - 签名表
 * @returns 识别结果
 */
export function identifyFile(bytes: Uint8Array, signatures: MagicSignature[]): IdentifyResult {
  const previewHex = bytesToHex(bytes.slice(0, 16));
  if (bytes.length === 0) {
    return { matches: [], reason: '输入为空，没有可识别的字节', previewHex };
  }

  const matched = signatures.filter((signature) => startsAt(bytes, signature));
  if (matched.length === 0) {
    const minLen = Math.min(...signatures.map((item) => item.offset + signatureBytes(item).length));
    if (bytes.length < minLen) {
      return { matches: [], reason: `数据过短（${bytes.length} 字节），不足任何已知签名的最小长度 ${minLen} 字节`, previewHex };
    }
    return { matches: [], reason: '未命中任何已知魔数签名，可能是未知格式或纯文本文件', previewHex };
  }

  const sorted = [...matched].sort((a, b) => {
    const lengthDiff = b.hex.length - a.hex.length;
    if (lengthDiff !== 0) {
      return lengthDiff;
    }
    // 同长度时偏移更大的签名更具体（如偏移 8 的 WAVE 标识 vs 偏移 0 的 RIFF 头）
    if (a.offset !== b.offset) {
      return b.offset - a.offset;
    }
    return a.name.localeCompare(b.name);
  });

  return {
    matches: sorted.map((signature) => ({
      name: signature.name,
      extensions: signature.extensions,
      mimeType: signature.mimeType,
      offset: signature.offset,
      signatureHex: signature.hex,
      description: signature.description,
    })),
    reason: '',
    previewHex,
  };
}

/** 便捷入口：Hex dump 文本 → 识别结果（含归一化错误抛出） */
export function identifyHexDump(input: string, signatures: MagicSignature[]): IdentifyResult {
  const hex = normalizeHexDump(input);
  if (!hex) {
    return { matches: [], reason: '输入为空，没有可识别的字节', previewHex: '' };
  }
  return identifyFile(hexToBytes(hex), signatures);
}
