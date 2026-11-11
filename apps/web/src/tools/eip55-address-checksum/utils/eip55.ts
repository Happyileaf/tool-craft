/**
 * EIP-55 混合大小写地址校验和的编码与校验，纯函数、零网络依赖。
 *
 * 规则：把去掉 0x 前缀的小写 hex 地址做 Keccak-256，
 * 对地址中的每个字母，哈希对应位 ≥ 8 时大写、否则小写；数字保持不变。
 */
import { keccak256Hex } from './keccak256';

/** 不带前缀的地址 hex 长度 */
const HEX_ADDRESS_LENGTH = 40;

/** 十六进制字母字符集合（小写） */
const HEX_LETTERS = new Set(['a', 'b', 'c', 'd', 'e', 'f']);

export interface Eip55Validation {
  /** 校验和是否合法 */
  valid: boolean;
  /** 归一化（小写、去前缀）后的 40 位 hex */
  normalized: string;
  /** 依据当前输入重新计算出的 EIP-55 标准地址（带 0x 前缀） */
  expected: string;
  /** 首个不匹配字符的下标（基于 40 位 hex，无字母不匹配时为 -1） */
  firstMismatchIndex: number;
  /** 地址是否包含任何字母（纯数字地址校验和天然通过） */
  hasLetters: boolean;
}

/**
 * 去除输入的空白与可选 0x 前缀，并校验其为 40 位十六进制
 *
 * @param input - 用户输入的地址
 * @returns 小写的 40 位 hex 地址
 */
export function normalizeAddress(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) {
    throw new Error('请输入以太坊地址');
  }
  let hex = trimmed;
  if (hex.startsWith('0x') || hex.startsWith('0X')) {
    hex = hex.slice(2);
  }
  if (hex.length !== HEX_ADDRESS_LENGTH) {
    throw new Error(
      `地址长度非法：去 0x 前缀后应为 ${HEX_ADDRESS_LENGTH} 位 hex，实际为 ${hex.length} 位`,
    );
  }
  if (!/^[0-9a-fA-F]+$/.test(hex)) {
    const badIndex = [...hex].findIndex((char) => !/[0-9a-fA-F]/.test(char));
    throw new Error(`地址含非十六进制字符「${hex[badIndex]}」（位于第 ${badIndex + 1} 位）`);
  }
  return hex.toLowerCase();
}

/**
 * 计算 EIP-55 校验和地址
 *
 * @param input - 任意大小写、可选 0x 前缀的 40 位 hex 地址
 * @returns 带 0x 前缀的混合大小写校验和地址
 */
export function toChecksumAddress(input: string): string {
  const lowerHex = normalizeAddress(input);
  const hash = keccak256Hex(lowerHex);
  let checksum = '0x';
  for (let index = 0; index < lowerHex.length; index += 1) {
    const char = lowerHex[index]!;
    if (HEX_LETTERS.has(char) && Number.parseInt(hash[index]!, 16) >= 8) {
      checksum += char.toUpperCase();
    } else {
      checksum += char;
    }
  }
  return checksum;
}

/**
 * 校验给定地址是否符合 EIP-55 校验和
 *
 * @param input - 待校验地址
 * @returns 结构化校验结论
 */
export function verifyChecksum(input: string): Eip55Validation {
  const normalized = normalizeAddress(input);
  const expected = toChecksumAddress(input);
  const actualBody = input.trim().replace(/^0[xX]/, '');
  const hasLetters = /[a-fA-F]/.test(normalized);
  let firstMismatchIndex = -1;
  for (let index = 0; index < HEX_ADDRESS_LENGTH; index += 1) {
    if (actualBody[index] !== expected.slice(2)[index]) {
      firstMismatchIndex = index;
      break;
    }
  }
  return {
    valid: firstMismatchIndex === -1,
    normalized,
    expected,
    firstMismatchIndex,
    hasLetters,
  };
}

/**
 * 计算地址小写 hex 的 Keccak-256 摘要（供界面展示哈希推导过程）
 *
 * @param input - 地址输入
 * @returns 64 字符小写 hex 摘要
 */
export function addressHash(input: string): string {
  return keccak256Hex(normalizeAddress(input));
}
