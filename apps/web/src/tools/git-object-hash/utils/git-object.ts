/**
 * Git 底层对象（blob / tree / commit / tag）哈希计算纯函数
 *
 * Git 内容寻址：对象存储值 = hash(`<type> SP <byte-length> NUL <raw-content>`)。
 * tree 的原始内容需要把文本行规范化为二进制条目：
 * `<mode> SP <name> NUL <raw hash bytes>`，并按 Git 规则排序
 * （目录名在比较时隐含尾部 '/'，虽然存储时不带）。
 * 摘要经 Web Crypto 完成 SHA-1 / SHA-256，不触碰 DOM / React。
 */

export type GitObjectType = 'blob' | 'tree' | 'commit' | 'tag';
export type HashFormat = 'sha1' | 'sha256';

export interface GitHashResult {
  /** 小写十六进制对象 ID */
  oid: string | null;
  /** 对象头，如 blob 6 */
  header: string | null;
  /** 参与哈希的总字节数（头 + 内容） */
  totalLength: number;
  error: string | null;
}

export interface TreeEntryInput {
  mode: string;
  name: string;
  /** 子对象哈希（40 位 SHA-1 或 64 位 SHA-256 十六进制） */
  oid: string;
}

export interface TreeBuildResult {
  /** tree 的原始内容字节（不含 tree 头） */
  bytes: Uint8Array;
  /** 规范化后的条目（已排序），供 UI 展示 */
  entries: TreeEntryInput[];
  error: string | null;
}

const SHA1_HEX_LENGTH = 40;
const SHA256_HEX_LENGTH = 64;

function isHex(value: string): boolean {
  return /^[0-9a-fA-F]+$/.test(value);
}

/**
 * 拼接 Git 对象头：`<type> SP <length> NUL`
 */
function buildHeader(type: GitObjectType, contentLength: number): Uint8Array {
  return new TextEncoder().encode(`${type} ${contentLength}\0`);
}

/**
 * 对「头 + 内容」计算 Git 对象 ID
 *
 * @param type - 对象类型
 * @param content - 对象原始内容字节
 * @param format - sha1（默认）或 sha256
 */
export async function hashGitObject(
  type: GitObjectType,
  content: Uint8Array,
  format: HashFormat = 'sha1',
): Promise<GitHashResult> {
  const headerBytes = buildHeader(type, content.length);
  const input = new Uint8Array(headerBytes.length + content.length);
  input.set(headerBytes, 0);
  input.set(content, headerBytes.length);

  const algorithm = format === 'sha256' ? 'SHA-256' : 'SHA-1';
  const digest = new Uint8Array(await crypto.subtle.digest(algorithm, input));
  let oid = '';
  for (const byte of digest) {
    oid += byte.toString(16).padStart(2, '0');
  }

  return {
    oid,
    header: `${type} ${content.length}`,
    totalLength: input.length,
    error: null,
  };
}

/**
 * 计算 blob 对象哈希（等价 git hash-object --stdin，不做任何过滤清洗）
 *
 * @param content - 文件原始内容（按 UTF-8 编码）
 * @param format - 摘要算法
 */
export async function hashBlob(
  content: string,
  format: HashFormat = 'sha1',
): Promise<GitHashResult> {
  return hashGitObject('blob', new TextEncoder().encode(content), format);
}

/**
 * 规范化单个 tree 条目为二进制：`<mode> SP <name> NUL <raw hash bytes>`
 */
function encodeTreeEntry(entry: TreeEntryInput, hashByteLength: number): Uint8Array {
  const head = new TextEncoder().encode(`${entry.mode} ${entry.name}\0`);
  const hashBytes = new Uint8Array(hashByteLength);
  for (let i = 0; i < hashByteLength; i += 1) {
    hashBytes[i] = parseInt(entry.oid.slice(i * 2, i * 2 + 2), 16);
  }
  const out = new Uint8Array(head.length + hashBytes.length);
  out.set(head, 0);
  out.set(hashBytes, head.length);
  return out;
}

/**
 * Git tree 排序键：按名逐字节比较；目录（mode 040000 / 160000）比较时
 * 在名字后隐含一个 '/'（0x2f），但存储的名字本身不带尾斜杠。
 */
function treeSortKey(entry: TreeEntryInput): number[] {
  const isDir = entry.mode === '40000' || entry.mode === '160000';
  const bytes = Array.from(new TextEncoder().encode(entry.name));
  if (isDir) {
    bytes.push(0x2f);
  }
  return bytes;
}

function compareKeys(a: number[], b: number[]): number {
  const length = Math.min(a.length, b.length);
  for (let i = 0; i < length; i += 1) {
    if (a[i] !== b[i]) {
      return a[i]! - b[i]!;
    }
  }
  return a.length - b.length;
}

/**
 * 由文本行（`<mode> SP <name> SP/TAB <oid>`，每行一条）构建 tree 原始内容。
 * 模式规范化：100644 / 100755 / 120000 / 160000 等按 Git 规范去掉前导零
 * （目录统一为 040000）；名字不允许含 NUL 与 '/'。
 *
 * @param linesText - 多行 tree 条目文本
 * @param format - 子对象哈希对应的摘要长度（默认 sha1，20 字节）
 */
export function buildTreeContent(
  linesText: string,
  format: HashFormat = 'sha1',
): TreeBuildResult {
  const expectedHashLength = format === 'sha256' ? SHA256_HEX_LENGTH : SHA1_HEX_LENGTH;
  const hashByteLength = expectedHashLength / 2;
  const entries: TreeEntryInput[] = [];

  const lines = linesText.split('\n');
  for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
    const rawLine = lines[lineIndex]!;
    const line = rawLine.trim();
    if (line === '') {
      continue;
    }

    const parts = line.split(/\s+/);
    if (parts.length !== 3) {
      return {
        bytes: new Uint8Array(0),
        entries: [],
        error: `第 ${lineIndex + 1} 行格式错误：应为「模式 名称 对象哈希」三段（如 100644 hello.txt ce0136…）`,
      };
    }
    const rawMode = parts[0] ?? '';
    const name = parts[1] ?? '';
    const oid = parts[2] ?? '';

    const modeError = normalizeTreeMode(rawMode, lineIndex + 1);
    if (modeError.error) {
      return { bytes: new Uint8Array(0), entries: [], error: modeError.error };
    }
    if (name === '' || name.includes('/') || name.includes('\0')) {
      return {
        bytes: new Uint8Array(0),
        entries: [],
        error: `第 ${lineIndex + 1} 行名称「${name}」非法：tree 条目名不能为空且不能包含 /`,
      };
    }
    if (oid.length !== expectedHashLength || !isHex(oid)) {
      return {
        bytes: new Uint8Array(0),
        entries: [],
        error: `第 ${lineIndex + 1} 行对象哈希长度应为 ${expectedHashLength} 位十六进制（${format}）`,
      };
    }

    entries.push({ mode: modeError.mode!, name, oid: oid.toLowerCase() });
  }

  if (entries.length === 0) {
    return { bytes: new Uint8Array(0), entries: [], error: 'tree 至少需要一个条目' };
  }

  const seen = new Set<string>();
  for (const entry of entries) {
    if (seen.has(entry.name)) {
      return {
        bytes: new Uint8Array(0),
        entries: [],
        error: `存在同名条目「${entry.name}」：Git tree 中名字必须唯一`,
      };
    }
    seen.add(entry.name);
  }

  entries.sort((a, b) => compareKeys(treeSortKey(a), treeSortKey(b)));

  const encoded = entries.map((entry) => encodeTreeEntry(entry, hashByteLength));
  const total = encoded.reduce((sum, chunk) => sum + chunk.length, 0);
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of encoded) {
    bytes.set(chunk, offset);
    offset += chunk.length;
  }

  return { bytes, entries, error: null };
}

/**
 * Git tree 合法模式及其内部存储形式。
 * 注意：目录在对象内部存为 5 位 `40000`，ls-tree 输出的 `040000` 只是展示格式。
 */
const TREE_MODE_MAP: Record<string, string> = {
  '40000': '40000',
  '040000': '40000',
  '100644': '100644',
  '100755': '100755',
  '120000': '120000',
  '160000': '160000',
};

function normalizeTreeMode(
  rawMode: string,
  lineNumber: number,
): { mode: string | null; error: string | null } {
  const normalized = TREE_MODE_MAP[rawMode];
  if (!normalized) {
    return {
      mode: null,
      error: `第 ${lineNumber} 行模式「${rawMode}」不支持：仅支持 100644（普通文件）、100755（可执行文件）、120000（符号链接）、40000/040000（目录）、160000（子模块）`,
    };
  }
  return { mode: normalized, error: null };
}

/**
 * 计算 tree 对象哈希
 *
 * @param linesText - 多行 tree 条目文本
 * @param format - 摘要算法
 */
export async function hashTree(
  linesText: string,
  format: HashFormat = 'sha1',
): Promise<GitHashResult & { entries: TreeEntryInput[] }> {
  const built = buildTreeContent(linesText, format);
  if (built.error) {
    return { oid: null, header: null, totalLength: 0, entries: [], error: built.error };
  }
  const result = await hashGitObject('tree', built.bytes, format);
  return { ...result, entries: built.entries };
}

/**
 * 计算 commit / annotated tag 对象哈希：输入为规范化后的完整原始文本
 * （header 段落 + 空行 + 消息），工具不做字段补全，原样参与哈希。
 *
 * @param type - commit 或 tag
 * @param rawText - 对象原始文本
 * @param format - 摘要算法
 */
export async function hashTextObject(
  type: 'commit' | 'tag',
  rawText: string,
  format: HashFormat = 'sha1',
): Promise<GitHashResult> {
  if (rawText === '') {
    return {
      oid: null,
      header: null,
      totalLength: 0,
      error: type === 'commit' ? 'commit 内容不能为空' : 'tag 内容不能为空',
    };
  }
  return hashGitObject(type, new TextEncoder().encode(rawText), format);
}
