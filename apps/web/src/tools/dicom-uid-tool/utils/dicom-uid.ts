/**
 * DICOM UID 生成与校验（零依赖纯函数 + 可注入随机源）
 *
 * 依据 DICOM PS3.5 Chapter 9（Unique Identifiers）与 PS3.7 B.2：
 * - UID 仅由数字 0-9 与句点 . 组成，总长度不超过 64 个字符；
 * - 以句点分隔为若干 component，每个 component 只含数字；
 * - component 首字符必须非零，单字符 component 允许单独的 "0"；
 * - 首个 component 为组织根（Organization Root）的起始编号。
 * 本模块不触碰 DOM 与 React，错误以结果对象返回而非抛出。
 */

/** UID 最大字符数（PS3.5 9.1：含句点在内不超过 64 字符） */
export const DICOM_UID_MAX_LENGTH = 64;

/** DICOM 标准保留的 Well-known UID 前缀（PS3.6/PS3.7） */
export const WELL_KNOWN_UID_PREFIXES: ReadonlyArray<{ prefix: string; name: string }> = [
  { prefix: '1.2.840.10008.1.2', name: 'DICOM 传输语法（Implicit/Explicit VR、压缩语法）' },
  { prefix: '1.2.840.10008.2.6.1', name: 'DICOM 应用上下文名（Application Context）' },
  { prefix: '1.2.840.10008.3.1', name: 'DICOM 服务类（SOP Class，PS3.4）' },
  { prefix: '1.2.840.10008.5.1.4', name: 'DICOM 信息对象类（IOD，PS3.3）' },
  { prefix: '1.2.840.10008.6.1', name: 'DICOM 标准化术语与字典 UID' },
  { prefix: '1.2.840.10008', name: 'DICOM 标准组织根（NEMA / Medical Connections 保留段）' },
];

/** 常用组织根 UID 样例，仅作输入参考，不会用于自动生成 */
export const SAMPLE_ROOTS: ReadonlyArray<{ root: string; note: string }> = [
  { root: '1.2.840.10008', note: 'NEMA 发布的 DICOM 标准根（保留，不建议作为私有根）' },
  { root: '1.2.840.113619', note: 'GE Medical Systems 组织根示例' },
  { root: '1.3.6.1.4.1', note: 'IANA 企业编号分支（private enterprise number）' },
];

export type UidMode = 'random' | 'counter';

export interface UidIssue {
  /** 违规 component 的 1 基序号；0 表示整体级问题（字符集 / 总长度） */
  componentIndex: number;
  /** 违规片段原文 */
  segment: string;
  /** 可直接展示的中文错误说明 */
  message: string;
}

export interface UidValidationResult {
  valid: boolean;
  /** 去除首尾空白后的待校验原文 */
  normalized: string;
  length: number;
  componentCount: number;
  issues: UidIssue[];
  /** 命中的 Well-known UID 说明；未命中为 null */
  wellKnown: { prefix: string; name: string } | null;
}

/** 判断 component 语法：非空数字串，多位数不得以 0 开头，单字符允许 "0" */
function isValidComponent(segment: string): boolean {
  if (segment.length === 0 || !/^\d+$/.test(segment)) {
    return false;
  }
  if (segment.length === 1) {
    return true;
  }
  return segment[0] !== '0';
}

/**
 * 校验单个 DICOM UID，逐段定位违规位置，并识别 Well-known UID。
 *
 * @param raw - 待校验 UID 原文
 * @returns 结构化校验结果
 */
export function validateDicomUid(raw: string): UidValidationResult {
  const normalized = raw.trim();
  const issues: UidIssue[] = [];

  if (normalized.length === 0) {
    return {
      valid: false,
      normalized,
      length: 0,
      componentCount: 0,
      issues: [{ componentIndex: 0, segment: '', message: 'UID 不能为空' }],
      wellKnown: null,
    };
  }

  if (!/^[0-9.]+$/.test(normalized)) {
    const illegal = normalized.match(/[^0-9.]/);
    issues.push({
      componentIndex: 0,
      segment: illegal ? illegal[0] : normalized,
      message: 'UID 只能包含数字 0-9 与句点 .，发现非法字符',
    });
  }

  if (normalized.length > DICOM_UID_MAX_LENGTH) {
    issues.push({
      componentIndex: 0,
      segment: normalized,
      message: `总长度 ${normalized.length} 字符，超过 DICOM 上限 ${DICOM_UID_MAX_LENGTH} 字符`,
    });
  }

  const segments = normalized.split('.');
  segments.forEach((segment, index) => {
    const position = index + 1;
    if (segment.length === 0) {
      issues.push({
        componentIndex: position,
        segment,
        message:
          position === 1
            ? '第 1 段为空：UID 不得以句点开头'
            : position === segments.length
              ? `第 ${position} 段为空：UID 不得以句点结尾`
              : `第 ${position} 段为空：不得出现连续句点`,
      });
      return;
    }
    if (!/^\d+$/.test(segment)) {
      issues.push({
        componentIndex: position,
        segment,
        message: `第 ${position} 段「${segment}」包含非数字字符`,
      });
      return;
    }
    if (segment.length > 1 && segment[0] === '0') {
      issues.push({
        componentIndex: position,
        segment,
        message: `第 ${position} 段「${segment}」以 0 开头：多位数 component 禁止前导零（单字符段允许 "0"）`,
      });
    }
  });

  let wellKnown: UidValidationResult['wellKnown'] = null;
  if (issues.length === 0) {
    const hit = WELL_KNOWN_UID_PREFIXES.find((entry) => normalized === entry.prefix || normalized.startsWith(`${entry.prefix}.`));
    if (hit) {
      wellKnown = { prefix: hit.prefix, name: hit.name };
    }
  }

  return {
    valid: issues.length === 0,
    normalized,
    length: normalized.length,
    componentCount: segments.length,
    issues,
    wellKnown,
  };
}

/** 批量校验：每行一个 UID，跳过空行 */
export function validateDicomUidBatch(raw: string): {
  rows: Array<{ line: number; input: string } & UidValidationResult>;
  total: number;
  okCount: number;
  failCount: number;
} {
  const rows = raw
    .split('\n')
    .map((line, index) => ({ line: index + 1, input: line, result: validateDicomUid(line) }))
    .filter((entry) => entry.input.trim() !== '')
    .map((entry) => ({ line: entry.line, input: entry.result.normalized, ...entry.result }));
  const okCount = rows.filter((row) => row.valid).length;
  return { rows, total: rows.length, okCount, failCount: rows.length - okCount };
}

export interface GenerateOptions {
  /** 组织根 UID，如 1.2.840.10008.x.y */
  root: string;
  /** 生成模式：密码学安全随机数 / 时间戳+计数器 */
  mode: UidMode;
  /** SOP Instance UID 数量（Study / Series 各 1 个） */
  sopCount: number;
  /**
   * 随机数字源：返回 [0, 9] 的整数。默认取 crypto.getRandomValues；
   * counter 模式下忽略此参数。测试可注入确定性函数。
   */
  randomDigit?: () => number;
  /** counter 模式的基准时间戳（毫秒），默认 Date.now() */
  now?: number;
}

export interface GeneratedUidSet {
  studyInstanceUid: string;
  seriesInstanceUid: string;
  sopInstanceUids: string[];
  /** 生成失败时的错误说明；成功为 null */
  error: string | null;
}

const defaultRandomDigit = (): number => {
  const buffer = new Uint8Array(1);
  globalThis.crypto.getRandomValues(buffer);
  return (buffer[0] ?? 0) % 10;
};

/** 生成一个无前导零的数字 component，长度为 length 位 */
function randomComponent(length: number, randomDigit: () => number): string {
  let first = randomDigit();
  while (first === 0) {
    first = randomDigit();
  }
  let component = String(first ?? 0);
  for (let i = 1; i < length; i += 1) {
    component += String(randomDigit());
  }
  return component;
}

/**
 * 基于组织根批量生成 Study / Series / SOP Instance UID。
 * 生成结果在返回前再次走 validateDicomUid 自检，任何超限或语法问题都转为 error。
 */
export function generateDicomUidSet(options: GenerateOptions): GeneratedUidSet {
  const root = options.root.trim();
  const rootCheck = validateDicomUid(root);
  if (!rootCheck.valid) {
    return {
      studyInstanceUid: '',
      seriesInstanceUid: '',
      sopInstanceUids: [],
      error: `组织根 UID 不合法：${rootCheck.issues[0]?.message ?? '未知错误'}`,
    };
  }

  const sopCount = Math.floor(options.sopCount);
  if (!Number.isFinite(sopCount) || sopCount < 1 || sopCount > 100) {
    return {
      studyInstanceUid: '',
      seriesInstanceUid: '',
      sopInstanceUids: [],
      error: 'SOP Instance 数量必须为 1-100 之间的整数',
    };
  }

  const randomDigit = options.randomDigit ?? defaultRandomDigit;
  const now = options.now ?? Date.now();
  const buildSuffix = (counter: number): string => {
    if (options.mode === 'counter') {
      // 时间戳 + 递增计数器：均为无前导零的纯数字 component
      return `${now}.${counter}`;
    }
    // 随机模式：10 位随机 component + 计数器 component，兼顾熵与批量唯一性
    return `${randomComponent(10, randomDigit)}.${counter}`;
  };

  const study = `${root}.${buildSuffix(1)}`;
  const series = `${root}.${buildSuffix(2)}`;
  const sopInstanceUids: string[] = [];
  for (let i = 0; i < sopCount; i += 1) {
    sopInstanceUids.push(`${root}.${buildSuffix(100 + i)}`);
  }

  const all = [study, series, ...sopInstanceUids];
  const oversize = all.find((uid) => uid.length > DICOM_UID_MAX_LENGTH);
  if (oversize) {
    return {
      studyInstanceUid: '',
      seriesInstanceUid: '',
      sopInstanceUids: [],
      error: `组织根过长：生成结果「${oversize}」达 ${oversize.length} 字符，超过 ${DICOM_UID_MAX_LENGTH} 字符上限，请更换更短的组织根`,
    };
  }
  const invalid = all.map((uid) => validateDicomUid(uid)).find((result) => !result.valid);
  if (invalid) {
    return {
      studyInstanceUid: '',
      seriesInstanceUid: '',
      sopInstanceUids: [],
      error: `生成结果自检失败：${invalid.issues[0]?.message ?? 'UID 语法错误'}`,
    };
  }

  return { studyInstanceUid: study, seriesInstanceUid: series, sopInstanceUids, error: null };
}
