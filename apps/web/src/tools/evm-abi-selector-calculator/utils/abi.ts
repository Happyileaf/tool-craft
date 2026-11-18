import { keccak256Hex } from './keccak256';
import { SELECTOR_BYTE_LENGTH, type SignatureKind } from '../constants';

/** 单条签名的计算结果 */
export interface SignatureResult {
  kind: SignatureKind;
  /** 规范化后的 canonical signature，如 transfer(address,uint256) */
  canonicalSignature: string;
  /** 64 字符小写 hex（不含 0x） */
  hashHex: string;
  /** 含 0x 前缀的完整摘要 */
  hash32: string;
  /** 函数 / error 的 4 字节 selector（含 0x），event 为 null */
  selector: string | null;
  /** 事件的 32 字节 Topic0（含 0x），非 event 为 null */
  topic0: string | null;
}

/** ABI 批量解析的单行结果 */
export interface AbiRow extends SignatureResult {
  /** ABI 中的条目类型：function / event / error / receive / fallback / constructor */
  abiType: string;
  /** receive / fallback 等无签名条目的说明 */
  note?: string;
}

const STORAGE_KEYWORDS = new Set(['calldata', 'memory', 'storage']);
const TYPE_TOKEN_RE = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/;

/**
 * 在括号深度 0 上按逗号切分参数列表，tuple 内部逗号不受影响。
 *
 * @param inside - 已去掉最外层括号的参数文本
 * @returns 原始参数字符串数组（可能含空格与参数名，交由 normalizeType 处理）
 */
function splitTopLevel(inside: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let current = '';
  for (const char of inside) {
    if (char === '(') {
      depth += 1;
      current += char;
    } else if (char === ')') {
      depth -= 1;
      current += char;
    } else if (char === ',' && depth === 0) {
      parts.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  if (current.trim() !== '') {
    parts.push(current);
  }
  return parts.map((part) => part.trim()).filter((part) => part !== '');
}

/** 从 text 的起始括号位置截取到与之配对的右括号（含），返回括号片段与剩余文本 */
function extractBalancedParen(text: string, openIndex: number): { tuple: string; rest: string } {
  let depth = 0;
  for (let i = openIndex; i < text.length; i += 1) {
    const char = text[i]!;
    if (char === '(') {
      depth += 1;
    } else if (char === ')') {
      depth -= 1;
      if (depth === 0) {
        return { tuple: text.slice(openIndex, i + 1), rest: text.slice(i + 1) };
      }
    }
  }
  throw new Error(`tuple 括号不匹配：${text}`);
}

/** 提取文本尾部连续的数组后缀 []/[k]（允许后缀前有空格）；无后缀时原样返回 */
function extractArraySuffix(text: string): { base: string; suffix: string } {
  let rest = text.trim();
  const suffixes: string[] = [];
  const unitRe = /\[\d*\]$/;
  while (unitRe.test(rest)) {
    const open = rest.lastIndexOf('[');
    suffixes.unshift(rest.slice(open));
    rest = rest.slice(0, open).trim();
  }
  return { base: rest, suffix: suffixes.join('') };
}

/**
 * 将单个 ABI 参数规范化为类型表达式：剔除参数名、storage 位置关键字，
 * tuple 递归展开为 (t1,t2) 形式，数组后缀保留。
 *
 * @param raw - 单个参数文本，如 "uint256 amount"、"struct Foo (uint256 a, address)[] memory"
 * @returns 规范化类型，如 uint256、(uint256,address)[]
 */
export function normalizeType(raw: string): string {
  const text = raw.trim();
  if (text === '') {
    throw new Error('存在空参数类型');
  }

  // tuple 形式（含 struct Name(...) 前缀写法）：第一个 ( 即顶层 tuple 起点
  const topOpen = text.indexOf('(');
  if (topOpen >= 0) {
    const { tuple, rest } = extractBalancedParen(text, topOpen);
    const children = splitTopLevel(tuple.slice(1, -1));
    const inner = `(${children.map((child) => normalizeType(child)).join(',')})`;
    // 括号之后可能是数组后缀与 storage 关键字/参数名的混合（如 "[] memory points"），提取全部数组单元
    const suffix = (rest.match(/\[\d*\]/g) ?? []).join('');
    return inner + suffix;
  }

  // 平铺形式：剔除 storage 关键字与参数名，只保留类型 token 序列
  const tokens = text.split(/\s+/).filter((token) => token !== '');
  const typeTokens = tokens.filter((token) => !STORAGE_KEYWORDS.has(token));
  if (typeTokens.length === 0) {
    throw new Error(`无法识别参数类型：${raw}`);
  }
  // 参数名可能出现在数组后缀之后（如 "uint256[3][5] grid"），优先取含方括号的 token
  const typeToken = typeTokens.find((token) => token.includes('[')) ?? typeTokens[0]!;
  const { base, suffix } = extractArraySuffix(typeToken);
  const inner = base;
  if (!TYPE_TOKEN_RE.test(inner)) {
    throw new Error(`不合法的类型名：${inner}`);
  }
  return inner + suffix;
}

/**
 * 将任意风格的函数 / 事件 / error 签名规范化为 ABI canonical signature。
 * 规则：去全部空白与参数名、storage 关键字剔除、tuple 递归展开，形如 name(type1,type2)。
 *
 * @param signature - 原始签名，如 "transfer(address from, uint256 amount)"
 * @returns 规范化签名
 */
export function canonicalizeSignature(signature: string): string {
  const compact = signature.trim();
  if (compact === '') {
    throw new Error('签名不能为空');
  }
  const openParen = compact.indexOf('(');
  const closeParen = compact.lastIndexOf(')');
  if (openParen <= 0 || closeParen !== compact.length - 1 || closeParen <= openParen) {
    throw new Error('签名必须形如 name(type1,type2)，且以右括号结尾');
  }

  const namePart = compact.slice(0, openParen).replace(/\s+/g, '');
  if (!TYPE_TOKEN_RE.test(namePart)) {
    throw new Error(`不合法的签名名称：${namePart}`);
  }

  const inside = compact.slice(openParen + 1, closeParen).trim();
  const params = inside === '' ? [] : splitTopLevel(inside);
  const normalizedParams = params.map((param) => normalizeType(param));
  return `${namePart}(${normalizedParams.join(',')})`;
}

/** 计算单条签名的 keccak-256 摘要及 selector / Topic0 */
export function computeSignature(signature: string, kind: SignatureKind): SignatureResult {
  const canonicalSignature = canonicalizeSignature(signature);
  const hashHex = keccak256Hex(canonicalSignature);
  const hash32 = `0x${hashHex}`;
  const selector =
    kind === 'event' ? null : `0x${hashHex.slice(0, SELECTOR_BYTE_LENGTH * 2)}`;
  const topic0 = kind === 'event' ? hash32 : null;
  return { kind, canonicalSignature, hashHex, hash32, selector, topic0 };
}

interface AbiInputItem {
  type?: string;
  components?: AbiInputItem[];
  internalType?: string;
}

interface AbiItem {
  type?: string;
  name?: string;
  inputs?: AbiInputItem[];
}

/** 将 ABI JSON 的单个 input 条目还原为 Solidity 类型文本，再交给 normalizeType */
export function abiInputToTypeText(input: AbiInputItem): string {
  if (input.type === 'tuple' || input.type === 'tuple[]') {
    const children = (input.components ?? []).map((component) => abiInputToTypeText(component));
    const base = `(${children.join(',')})`;
    return input.type === 'tuple[]' ? `${base}[]` : base;
  }
  if (!input.type) {
    throw new Error('ABI input 缺少 type 字段');
  }
  return input.type;
}

/** 将 ABI 条目转为 canonical 签名（function / event / error） */
function canonicalizeAbiItem(item: AbiItem): string {
  const name = item.name ?? '';
  if (name === '' || !TYPE_TOKEN_RE.test(name)) {
    throw new Error('ABI 条目缺少合法 name 字段');
  }
  const params = (item.inputs ?? []).map((input) => normalizeType(abiInputToTypeText(input)));
  return `${name}(${params.join(',')})`;
}

/**
 * 解析 ABI JSON 数组并批量计算 selector / Topic0。
 * constructor / receive / fallback 不产生 selector，单独给说明行。
 *
 * @param rawJson - 粘贴的 ABI JSON 文本
 * @returns 按 ABI 顺序排列的结果行
 */
export function parseAbiJson(rawJson: string): AbiRow[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawJson);
  } catch (error) {
    throw new Error(`ABI JSON 解析失败：${(error as Error).message}`);
  }
  if (!Array.isArray(parsed)) {
    throw new Error('ABI 必须是条目数组（JSON Array）');
  }

  const rows: AbiRow[] = [];
  for (const entry of parsed as AbiItem[]) {
    const abiType = entry.type ?? 'function';
    if (abiType === 'constructor') {
      continue;
    }
    if (abiType === 'receive' || abiType === 'fallback') {
      rows.push({
        abiType,
        kind: 'function',
        canonicalSignature: '',
        hashHex: '',
        hash32: '',
        selector: null,
        topic0: null,
        note:
          abiType === 'receive'
            ? 'receive() 无 selector，空 calldata 触发'
            : 'fallback() 无 selector，无匹配函数时触发',
      });
      continue;
    }
    if (abiType !== 'function' && abiType !== 'event' && abiType !== 'error') {
      continue;
    }
    const kind: SignatureKind = abiType === 'event' ? 'event' : abiType === 'error' ? 'error' : 'function';
    const canonicalSignature = canonicalizeAbiItem(entry);
    const computed = computeSignature(canonicalSignature, kind);
    rows.push({ abiType, ...computed });
  }
  return rows;
}

/** 规范化粘贴的 selector（去空格、转小写、补 0x 前缀），非法返回 null */
export function normalizeSelectorInput(raw: string): string | null {
  const value = raw.trim().toLowerCase();
  if (value === '') {
    return null;
  }
  const hex = value.startsWith('0x') ? value : `0x${value}`;
  if (!/^0x[0-9a-f]{8}$/.test(hex)) {
    return null;
  }
  return hex;
}

/** 在批量结果中按 4 字节 selector 反查签名 */
export function matchSelector(rows: AbiRow[], selectorInput: string): AbiRow | null {
  const normalized = normalizeSelectorInput(selectorInput);
  if (!normalized) {
    return null;
  }
  return rows.find((row) => row.selector === normalized) ?? null;
}
