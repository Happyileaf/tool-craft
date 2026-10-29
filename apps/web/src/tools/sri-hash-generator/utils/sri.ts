/**
 * SRI（Subresource Integrity，W3C Subresource Integrity 规范）哈希生成与校验纯函数，
 * 摘要计算依赖 Web Crypto（crypto.subtle.digest），不触碰 DOM / React
 */

/** 支持的 SRI 摘要算法（SRI 规范推荐的 SHA-2 家族） */
export type SriAlgorithm = 'sha256' | 'sha384' | 'sha512';

/** 单条 SRI 哈希结果 */
export interface SriHashResult {
  /** 算法标签，如 sha256 */
  algorithm: SriAlgorithm;
  /** 完整 SRI 哈希串，如 sha256-xxxx== */
  value: string;
}

/** SRI 校验结论中的单条元数据匹配结果 */
export interface SriVerifyEntry {
  /** 原始元数据中的算法标签（归一化为小写） */
  algorithm: string;
  /** 是否存在与内容匹配的摘要 */
  matched: boolean;
}

/** SRI 校验结果 */
export interface SriVerifyResult {
  /** 整体是否通过：至少有一条强摘要匹配（SRI 规则） */
  valid: boolean;
  /** 每条解析出的元数据的匹配情况 */
  entries: SriVerifyEntry[];
  /** 解析或计算失败原因（中文），成功为 null */
  error: string | null;
}

/** 合法算法标签 → Web Crypto 算法名 */
const ALGORITHM_MAP: Record<SriAlgorithm, string> = {
  sha256: 'SHA-256',
  sha384: 'SHA-384',
  sha512: 'SHA-512',
};

/**
 * 将字节数组编码为标准 Base64（带填充）
 *
 * @param bytes - 任意字节序列
 * @returns Base64 字符串
 */
export function bytesToBase64(bytes: Uint8Array<ArrayBuffer>): string {
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}

/**
 * 计算单个算法的完整 SRI 哈希串（`<alg>-<base64>`）
 *
 * @param data - 内容字节
 * @param algorithm - SRI 算法标签
 * @returns 形如 sha256-xxxx== 的哈希串
 */
export async function computeSriHash(
  data: Uint8Array<ArrayBuffer>,
  algorithm: SriAlgorithm,
): Promise<string> {
  const digest = await crypto.subtle.digest(ALGORITHM_MAP[algorithm], data);
  return `${algorithm}-${bytesToBase64(new Uint8Array(digest))}`;
}

/**
 * 按一组算法计算 SRI 哈希，多算法时以空格连接，
 * 可直接粘贴到 `<script>` / `<link>` 的 integrity 属性
 *
 * @param data - 内容字节
 * @param algorithms - 算法列表，默认仅 sha256
 * @returns 与算法同序的哈希结果数组
 */
export async function generateSri(
  data: Uint8Array<ArrayBuffer>,
  algorithms: SriAlgorithm[] = ['sha256'],
): Promise<SriHashResult[]> {
  const values = await Promise.all(
    algorithms.map(async (algorithm) => ({
      algorithm,
      value: await computeSriHash(data, algorithm),
    })),
  );
  return values;
}

/**
 * 解析 integrity 元数据字符串：按空白拆分为多条 `alg-digest`，
 * 忽略 `?` 开头的选项（SRI 规范中的 option 语法）
 *
 * @param integrity - integrity 属性原始值
 * @returns 解析出的算法标签与摘要对；格式非法时返回错误信息
 */
export function parseIntegrity(
  integrity: string,
): { entries: { algorithm: string; digest: string }[]; error: string | null } {
  const tokens = integrity.trim().split(/\s+/).filter(Boolean);
  const entries: { algorithm: string; digest: string }[] = [];
  for (const token of tokens) {
    if (token.startsWith('?')) {
      continue;
    }
    const separatorIndex = token.indexOf('-');
    if (separatorIndex <= 0) {
      return {
        entries: [],
        error: `元数据「${token}」格式非法：应为 alg-digest 形式（如 sha256-xxxx）`,
      };
    }
    const algorithm = token.slice(0, separatorIndex).toLowerCase();
    const digest = token.slice(separatorIndex + 1);
    if (!(algorithm in ALGORITHM_MAP)) {
      return {
        entries: [],
        error: `不支持的算法标签「${algorithm}」，仅支持 sha256 / sha384 / sha512`,
      };
    }
    if (!digest) {
      return { entries: [], error: `元数据「${token}」缺少 Base64 摘要` };
    }
    entries.push({ algorithm, digest });
  }
  if (entries.length === 0) {
    return { entries: [], error: '未解析出任何有效的哈希元数据' };
  }
  return { entries, error: null };
}

/**
 * 校验内容是否与给定 integrity 元数据匹配。
 * 遵循 SRI 匹配规则：存在至少一条强摘要相等即通过。
 *
 * @param data - 内容字节
 * @param integrity - 待校验的 integrity 字符串
 * @returns 逐条匹配情况、整体结论与错误信息
 */
export async function verifySri(
  data: Uint8Array<ArrayBuffer>,
  integrity: string,
): Promise<SriVerifyResult> {
  const parsed = parseIntegrity(integrity);
  if (parsed.error) {
    return { valid: false, entries: [], error: parsed.error };
  }

  const entries: SriVerifyEntry[] = [];
  let valid = false;
  for (const entry of parsed.entries) {
    const algorithm = entry.algorithm as SriAlgorithm;
    const actual = await computeSriHash(data, algorithm);
    const matched = actual === `${algorithm}-${entry.digest}`;
    entries.push({ algorithm, matched });
    if (matched) {
      valid = true;
    }
  }
  return { valid, entries, error: null };
}
