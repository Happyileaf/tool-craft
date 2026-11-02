/**
 * OpenSSH "drunken bishop" randomart 生成纯函数（等价于 `ssh-keygen -lv`）。
 * 算法来源：OpenSSH `key.c` / `misc.c:draw_new()/bishop_walk()`，
 * 17×9 棋盘、字符集 ` .o+=*BOX@%&#/^SE`、起点 (8,4)。
 * 现代 OpenSSH（≥7.2）使用公钥 blob 的 SHA-256 摘要，底框为 [SHA256]；
 * 旧版（<5.1）使用 MD5，底框为 [MD5]，本工具两种摘要均支持。
 */
import { md5Hex } from './md5';

export const BOARD_WIDTH = 17;
export const BOARD_HEIGHT = 9;
const START_X = 8;
const START_Y = 4;
const CHARACTERS = ' .o+=*BOX@%&#/^SE';

/** SSH 公钥解析结果 */
export interface SshKeyInfo {
  /** 算法，如 ssh-rsa / ssh-ed25519 / ecdsa-sha2-nistp256 */
  keyType: string;
  /** 顶框标签中的算法展示名（大写），如 RSA / ED25519 / ECDSA */
  labelType: string;
  /** 位长，如 2048 */
  bits: number;
  /** blob 的小写十六进制摘要 */
  digestHex: string;
  /** 使用的摘要算法 */
  digestAlgo: 'SHA256' | 'MD5';
  /** randomart 图（含边框的完整多行字符串） */
  art: string;
}

/** 读取一个 SSH wire 风格的字符串：4 字节大端长度 + 数据 */
function readSshString(bytes: Uint8Array, offset: number): [Uint8Array, number] {
  if (offset + 4 > bytes.length) {
    throw new Error('公钥 blob 已截断：长度字段不完整');
  }
  const len = new DataView(bytes.buffer, bytes.byteOffset).getUint32(offset, false);
  const start = offset + 4;
  if (start + len > bytes.length) {
    throw new Error('公钥 blob 已截断：字段长度超出数据范围');
  }
  return [bytes.subarray(start, start + len), start + len];
}

/** 大端无符号整数的位长 */
function uintBits(value: Uint8Array): number {
  let firstNonZero = 0;
  while (firstNonZero < value.length && value[firstNonZero] === 0) {
    firstNonZero += 1;
  }
  if (firstNonZero === value.length) {
    return 0;
  }
  const head = value[firstNonZero] ?? 0;
  const headBits = 32 - Math.clz32(head);
  return headBits + (value.length - firstNonZero - 1) * 8;
}

/** 解析公钥 blob，返回算法名、顶框展示名与位长 */
export function parseSshBlob(blob: Uint8Array): {
  keyType: string;
  labelType: string;
  bits: number;
} {
  const decoder = new TextDecoder();
  const [keyTypeBytes, afterType] = readSshString(blob, 0);
  const keyType = decoder.decode(keyTypeBytes);

  if (keyType === 'ssh-rsa' || keyType === 'rsa-sha2-256' || keyType === 'rsa-sha2-512') {
    const [, afterE] = readSshString(blob, afterType);
    const [n] = readSshString(blob, afterE);
    return { keyType, labelType: 'RSA', bits: uintBits(n) };
  }
  if (keyType === 'ssh-dss') {
    return { keyType, labelType: 'DSA', bits: 1024 };
  }
  if (keyType === 'ssh-ed25519') {
    return { keyType, labelType: 'ED25519', bits: 256 };
  }
  if (keyType === 'ssh-ed448') {
    return { keyType, labelType: 'ED448', bits: 448 };
  }
  if (keyType.startsWith('ecdsa-sha2-')) {
    const [curve] = readSshString(blob, afterType);
    const curveName = decoder.decode(curve);
    const m = /nistp(\d+)$/.exec(curveName);
    return { keyType, labelType: 'ECDSA', bits: m ? Number(m[1]) : 0 };
  }
  throw new Error(`不支持的公钥算法：${keyType}`);
}

/**
 * Drunken Bishop 核心：对摘要逐字节、每个字节拆两个 2-bit 步游走棋盘。
 * 摘要长度不限（SHA-256 为 32 字节，旧 MD5 为 16 字节）。
 * 返回 BOARD_HEIGHT 行、每行 BOARD_WIDTH 个字符（不含边框）。
 */
export function bishopWalk(digest: Uint8Array): string[][] {
  const board = Array.from({ length: BOARD_HEIGHT }, () =>
    new Array<number>(BOARD_WIDTH).fill(0),
  );
  let x = START_X;
  let y = START_Y;

  for (const byte of digest) {
    for (let shift = 0; shift < 8; shift += 2) {
      const code = (byte >> shift) & 0x3;
      const dx = (code & 0x1) !== 0 ? 1 : -1;
      const dy = (code & 0x2) !== 0 ? 1 : -1;
      // OpenSSH：先移动，仅把越界的那个轴回贴到边界，另一轴照常移动
      x += dx;
      y += dy;
      if (x < 0) x = 0;
      if (x >= BOARD_WIDTH) x = BOARD_WIDTH - 1;
      if (y < 0) y = 0;
      if (y >= BOARD_HEIGHT) y = BOARD_HEIGHT - 1;
      if (board[y]![x]! < CHARACTERS.length - 2) {
        board[y]![x]! += 1;
      }
    }
  }

  // 起点标记 S（下标 15），终点标记 E（下标 16，覆盖访问计数）
  board[START_Y]![START_X] = CHARACTERS.length - 2;
  board[y]![x] = CHARACTERS.length - 1;

  return board.map((row) => row.map((count) => CHARACTERS[count] ?? '?'));
}

/** 构造 19 字符宽边框（两 '+' 之间夹 17 字符）：标签 [xxx] 以 floor 左居中 */
function border(label?: string): string {
  const borderLen = BOARD_WIDTH; // 两 '+' 之间共 17 个字符，整行 19 字符
  if (!label) {
    return `+${'-'.repeat(borderLen)}+`;
  }
  const inner = `[${label}]`;
  const padLeft = Math.floor((borderLen - inner.length) / 2);
  const padRight = borderLen - inner.length - padLeft;
  return `+${'-'.repeat(padLeft)}${inner}${'-'.repeat(padRight)}+`;
}

/** 加边框并生成与 ssh-keygen -lv 一致的多行文本 */
export function renderArt(
  chars: string[][],
  label: string,
  footerLabel?: string,
): string {
  const header = border(label);
  const footer = footerLabel ? border(footerLabel) : border();

  const body = chars.map((row) => `|${row.join('')}|`);
  return [header, ...body, footer].join('\n');
}

/** 将十六进制串转为字节数组（空格、冒号可作分隔符） */
export function hexToBytes(hex: string): Uint8Array {
  const clean = hex.replace(/[\s:]/g, '');
  if (!/^[0-9a-fA-F]*$/.test(clean) || clean.length === 0) {
    throw new Error('指纹必须是十六进制字符（可选空格或冒号分隔）');
  }
  if (clean.length % 2 !== 0) {
    throw new Error('十六进制长度必须为偶数');
  }
  const bytes = new Uint8Array(clean.length / 2);
  for (let i = 0; i < bytes.length; i += 1) {
    bytes[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

/** 由摘要直接生成 randomart，algo 决定底框标签 */
export function artFromDigest(
  digest: Uint8Array,
  topLabel: string,
  algo: 'SHA256' | 'MD5' = 'SHA256',
): string {
  if (digest.length !== 32 && digest.length !== 16) {
    throw new Error('randomart 摘要必须为 16 字节（MD5）或 32 字节（SHA-256）');
  }
  return renderArt(bishopWalk(digest), topLabel, algo);
}

/** 解析 base64 公钥主体为字节（OpenSSH 公钥通常省略末尾 '=' padding） */
function decodeBlob(base64: string): Uint8Array {
  try {
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    const binary = atob(padded);
    return Uint8Array.from(binary, (ch) => ch.charCodeAt(0));
  } catch {
    throw new Error('公钥主体不是合法的 base64');
  }
}

function buildArt(blob: Uint8Array, digest: Uint8Array, algo: 'SHA256' | 'MD5'): SshKeyInfo {
  const { keyType, labelType, bits } = parseSshBlob(blob);
  const digestHex = Array.from(digest, (byte) =>
    byte.toString(16).padStart(2, '0'),
  ).join('');
  const art = renderArt(bishopWalk(digest), `${labelType} ${bits}`, algo);
  return { keyType, labelType, bits, digestHex, digestAlgo: algo, art };
}

/**
 * 基于 SHA-256 解析 OpenSSH 公钥文本（现代 ssh-keygen -lv 行为，底框 [SHA256]）。
 * 支持单行 authorized_keys 格式、多行拼接 base64、以及纯 base64。
 */
export async function randomartFromPublicKey(
  input: string,
  algo: 'SHA256' | 'MD5' = 'SHA256',
): Promise<SshKeyInfo> {
  const trimmed = input.trim();
  if (trimmed === '') {
    throw new Error('内容不能为空');
  }
  const lines = trimmed
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const KEY_PREFIXES = ['ssh-', 'ecdsa-', 'sk-'];
  const firstLine = lines[0]!;
  const hasKeyPrefix = KEY_PREFIXES.some((p) => firstLine.startsWith(p));

  let base64: string;
  if (!hasKeyPrefix) {
    // 纯 base64（可能折成多行）
    base64 = lines.join('');
  } else {
    const firstParts = firstLine.split(/\s+/);
    if (firstParts.length < 2) {
      throw new Error('不是有效的 OpenSSH 公钥：缺少 base64 主体');
    }
    // 第 1 段为算法名，第 2 段为 base64，其后可能还有注释（忽略）；
    // 后续行（若有）视为折行续写的 base64
    base64 = firstParts[1]!;
    for (const line of lines.slice(1)) {
      base64 += line;
    }
  }

  const blob = decodeBlob(base64);
  // 先解析校验算法，再计算摘要
  parseSshBlob(blob);
  if (algo === 'MD5') {
    return buildArt(blob, hexToBytes(md5Hex(blob)), 'MD5');
  }
  const digest = new Uint8Array(
    await crypto.subtle.digest('SHA-256', blob as BufferSource),
  );
  return buildArt(blob, digest, 'SHA256');
}
