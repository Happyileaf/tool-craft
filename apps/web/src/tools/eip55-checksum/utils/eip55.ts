import { keccak256Hex } from './keccak256';

/** 不带 0x 前缀的十六进制地址长度（20 字节） */
const ADDRESS_HEX_LENGTH = 40;

export interface Eip55Result {
  /** 该条输入是否为结构合法的地址 */
  valid: boolean;
  /** 合法时输出 EIP-55 混合大小写校验和地址（带 0x 前缀），非法时为空串 */
  output: string;
  /** 输入本身带 0x 前缀时保留该信息 */
  hasPrefix: boolean;
  /** 校验模式下：地址字母大小写是否与 EIP-55 校验和完全一致 */
  checksumMatched?: boolean;
  /** 非法或校验失败时的中文原因 */
  error?: string;
}

const HEX_RE = /^[0-9a-fA-F]+$/;

/**
 * 去除可选 0x 前缀并做结构校验，返回 40 位小写 hex 主体。
 */
function normalizeAddress(raw: string):
  | { body: string; originalBody: string; hasPrefix: boolean }
  | { error: string } {
  const trimmed = raw.trim();
  if (trimmed === '') {
    return { error: '空地址' };
  }
  const hasPrefix = /^0x/i.test(trimmed);
  const originalBody = hasPrefix ? trimmed.slice(2) : trimmed;
  if (originalBody.length !== ADDRESS_HEX_LENGTH) {
    return { error: `地址主体应为 ${ADDRESS_HEX_LENGTH} 个十六进制字符（20 字节），当前 ${originalBody.length} 个` };
  }
  if (!HEX_RE.test(originalBody)) {
    return { error: '包含非十六进制字符（仅允许 0-9、a-f、A-F）' };
  }
  return { body: originalBody.toLowerCase(), originalBody, hasPrefix };
}

/**
 * 按 EIP-55 规则计算校验和地址：
 * 对小写 hex 主体取 Keccak-256，哈希某字符位 ≥ 8 时对应字母大写，否则小写。
 */
export function toChecksumAddress(raw: string): Eip55Result {
  const normalized = normalizeAddress(raw);
  if ('error' in normalized) {
    return { valid: false, output: '', hasPrefix: false, error: normalized.error };
  }
  const hash = keccak256Hex(normalized.body);
  let checksum = '';
  for (let i = 0; i < normalized.body.length; i += 1) {
    const char = normalized.body[i] ?? '';
    const hashNibble = Number.parseInt(hash[i] ?? '0', 16);
    if (char >= 'a' && char <= 'f' && hashNibble >= 8) {
      checksum += char.toUpperCase();
    } else {
      checksum += char;
    }
  }
  return {
    valid: true,
    output: `0x${checksum}`,
    hasPrefix: normalized.hasPrefix,
  };
}

/**
 * 校验一个地址的 EIP-55 混合大小写是否正确；纯全小写/全大写（无大小写信息）
 * 视为「无校验和」而非错误，单独标记 checksumMatched=false 并提示。
 */
export function verifyChecksum(raw: string): Eip55Result {
  const normalized = normalizeAddress(raw);
  if ('error' in normalized) {
    return { valid: false, output: '', hasPrefix: false, error: normalized.error };
  }
  const trimmed = raw.trim();
  const expected = toChecksumAddress(raw);
  // 原始输入（保留其前缀形式）与期望校验和直接逐字符比较
  const original = normalized.hasPrefix ? trimmed : `0x${trimmed}`;
  const hasLetter = /[a-fA-F]/.test(normalized.originalBody);
  const allSameCase =
    normalized.originalBody === normalized.originalBody.toLowerCase() ||
    normalized.originalBody === normalized.originalBody.toUpperCase();

  if (hasLetter && allSameCase) {
    return {
      valid: true,
      output: expected.output,
      hasPrefix: normalized.hasPrefix,
      checksumMatched: false,
      error: '该地址未携带大小写校验和（全小写/全大写），已为你计算标准 EIP-55 形式',
    };
  }

  const matched = original === expected.output;
  return {
    valid: true,
    output: expected.output,
    hasPrefix: normalized.hasPrefix,
    checksumMatched: matched,
    error: matched ? undefined : '大小写与 EIP-55 校验和不一致，地址可能存在抄写错误',
  };
}

/**
 * 批量处理：每行一个地址，逐行返回结果，空行跳过。
 */
export function processBatch(input: string, mode: 'encode' | 'verify'): Eip55Result[] {
  return input
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line !== '')
    .map((line) => (mode === 'encode' ? toChecksumAddress(line) : verifyChecksum(line)));
}
