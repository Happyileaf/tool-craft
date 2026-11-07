/**
 * DMARC（RFC 7489）DNS TXT 记录生成、解析与校验纯函数，零依赖。
 *
 * 记录形如：_dmarc.<domain>  TXT  "v=DMARC1; p=none; rua=mailto:a@b.com; ..."
 * 标签（tag）由 key=value 组成、分号分隔；本模块同时负责未知标签提示与冲突检查。
 */

/** 策略（p= / sp=）取值 */
export type DmarcPolicy = 'none' | 'quarantine' | 'reject';

/** 对齐模式（adkim / aspf）：r 宽松（默认），s 严格 */
export type AlignmentMode = 'r' | 's';

/** 取证报告选项（fo=），可组合，用冒号分隔 */
export type FoFlag = '0' | '1' | 'd' | 's';

/** 报告格式（rf=），RFC 7489 仅定义 afrf，iodef 为常见兼容值 */
export type ReportFormat = 'afrf' | 'iodef';

/** 生成器输入 */
export interface DmarcInput {
  /** 发信域，如 example.com */
  domain: string;
  /** 必填策略 p= */
  policy: DmarcPolicy;
  /** 可选子域策略 sp=；留空表示不输出 */
  subdomainPolicy: '' | DmarcPolicy;
  /** 聚合报告邮箱 rua=（多个用逗号分隔的 mailto: URI） */
  rua: string;
  /** 取证报告邮箱 ruf= */
  ruf: string;
  /** DKIM 对齐模式 adkim= */
  adkim: AlignmentMode;
  /** SPF 对齐模式 aspf= */
  aspf: AlignmentMode;
  /** 取证选项 fo= 标志集合 */
  fo: FoFlag[];
  /** 策略应用百分比 pct=（0–100），null 表示不输出（默认 100） */
  pct: number | null;
  /** 报告格式 rf= */
  rf: ReportFormat;
  /** 聚合报告间隔 ri=（秒，正整数），null 表示不输出 */
  ri: number | null;
}

export interface DmarcResult {
  /** 完整 DNS 名称 _dmarc.<domain> */
  dnsName: string;
  /** 规范化后的 TXT 记录值 */
  recordValue: string;
  /** 按 RFC 1035 拆出的 255 字符分段（含引号） */
  chunks: string[];
  errors: string[];
  warnings: string[];
}

/** 解析后的标签映射（保留原始顺序信息由 orderedTags 承担） */
export interface ParsedDmarc {
  /** 小写标签名 → 原始值（去首尾空白） */
  tags: Map<string, string>;
  /** 按出现顺序排列的标签名 */
  orderedTags: string[];
}

const DOMAIN_REGEX = /^(?=.{1,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i;
const POLICIES: readonly DmarcPolicy[] = ['none', 'quarantine', 'reject'];
const ALIGNMENTS: readonly AlignmentMode[] = ['r', 's'];
const FO_FLAGS: readonly FoFlag[] = ['0', '1', 'd', 's'];
/** RFC 7489 §6.1 定义的正式标签 */
const KNOWN_TAGS = new Set(['v', 'p', 'sp', 'rua', 'ruf', 'adkim', 'aspf', 'fo', 'pct', 'rf', 'ri']);

/** 校验邮箱 URI 列表（mailto: 前缀），返回去空格后的规范化字符串与错误 */
function normalizeMailtoList(raw: string, tag: string, errors: string[]): string {
  const parts = raw
    .split(',')
    .map((each) => each.trim())
    .filter(Boolean);
  for (const uri of parts) {
    if (!/^mailto:[^@\s]+@[^@\s]+\.[^@\s]+$/i.test(uri)) {
      errors.push(`${tag}= 含非法报告地址「${uri}」，应为 mailto:name@domain 形式`);
    }
  }
  return parts.join(',');
}

/**
 * 由结构化输入生成 DMARC TXT 记录。
 *
 * @param input - 策略与报告选项
 * @returns DNS 名称、记录值、255 字节分段与错误 / 警告
 */
export function generateDmarcRecord(input: DmarcInput): DmarcResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const domain = input.domain.trim().toLowerCase();

  if (!domain) {
    errors.push('发信域（domain）不能为空');
  } else if (!DOMAIN_REGEX.test(domain)) {
    errors.push(`发信域「${domain}」不是合法域名`);
  }
  if (!POLICIES.includes(input.policy)) {
    errors.push(`策略 p= 取值非法：${input.policy}`);
  }
  if (input.subdomainPolicy && !POLICIES.includes(input.subdomainPolicy)) {
    errors.push(`子域策略 sp= 取值非法：${input.subdomainPolicy}`);
  }
  if (!ALIGNMENTS.includes(input.adkim) || !ALIGNMENTS.includes(input.aspf)) {
    errors.push('对齐模式 adkim / aspf 只能取 r（宽松）或 s（严格）');
  }
  const invalidFo = input.fo.filter((flag) => !FO_FLAGS.includes(flag));
  if (invalidFo.length > 0) {
    errors.push(`fo= 含非法标志：${invalidFo.join(' ')}（允许 0 / 1 / d / s）`);
  }
  if (input.pct !== null && (!Number.isInteger(input.pct) || input.pct < 0 || input.pct > 100)) {
    errors.push(`pct= 必须是 0–100 的整数，当前为 ${input.pct}`);
  }
  if (input.ri !== null && (!Number.isInteger(input.ri) || input.ri <= 0)) {
    errors.push(`ri= 必须是正整数秒，当前为 ${input.ri}`);
  }

  const rua = input.rua.trim() ? normalizeMailtoList(input.rua, 'rua', errors) : '';
  const ruf = input.ruf.trim() ? normalizeMailtoList(input.ruf, 'ruf', errors) : '';

  // 策略收紧提示
  if (input.policy === 'none') {
    warnings.push('当前 p=none 仅监控不拦截，验证报告正常后建议逐步升级为 quarantine、reject');
  }
  if (input.subdomainPolicy === 'reject' && input.policy !== 'reject') {
    warnings.push('子域策略 sp=reject 比主域策略更严格，确认子域全部完成对齐后再发布');
  }
  if (input.pct !== null && input.pct < 100 && input.policy !== 'none') {
    warnings.push(`pct=${input.pct} 表示策略仅应用于部分流量，灰度完成后建议恢复 100`);
  }

  const tags: string[] = ['v=DMARC1', `p=${input.policy}`];
  if (input.subdomainPolicy) {
    tags.push(`sp=${input.subdomainPolicy}`);
  }
  if (rua) {
    tags.push(`rua=${rua}`);
  }
  if (ruf) {
    tags.push(`ruf=${ruf}`);
  }
  if (input.adkim !== 'r') {
    tags.push(`adkim=${input.adkim}`);
  }
  if (input.aspf !== 'r') {
    tags.push(`aspf=${input.aspf}`);
  }
  if (input.fo.length > 0) {
    tags.push(`fo=${[...new Set(input.fo)].join(':')}`);
  }
  if (input.pct !== null && input.pct !== 100) {
    tags.push(`pct=${input.pct}`);
  }
  if (input.rf !== 'afrf') {
    tags.push(`rf=${input.rf}`);
  }
  if (input.ri !== null) {
    tags.push(`ri=${input.ri}`);
  }
  const recordValue = tags.join('; ');

  if (recordValue.length > 255) {
    warnings.push(
      `记录值长 ${recordValue.length} 字符，超过单段 255 上限，已自动拆分为多个带引号字符串（DNS 发布时需保留分段）`,
    );
  }

  return {
    dnsName: errors.length === 0 && domain ? `_dmarc.${domain}` : '',
    recordValue: errors.length === 0 ? recordValue : '',
    chunks: errors.length === 0 ? splitTxtChunks(recordValue) : [],
    errors,
    warnings,
  };
}

/**
 * 按 RFC 1035 把 TXT 记录切为 255 字符分段，每段用双引号包裹。
 */
export function splitTxtChunks(recordValue: string): string[] {
  const chunks: string[] = [];
  for (let index = 0; index < recordValue.length; index += 255) {
    chunks.push(`"${recordValue.slice(index, index + 255)}"`);
  }
  return chunks;
}

/**
 * 解析现有 DMARC 记录文本（容忍外层引号与多余空白），保留标签顺序。
 *
 * @param raw - 粘贴的 TXT 记录
 * @returns 标签映射与顺序
 * @throws 缺少分号分隔的键值对、空记录等结构性错误时抛错
 */
export function parseDmarcRecord(raw: string): ParsedDmarc {
  const text = raw.trim().replace(/^"|"$/g, '');
  if (!text) {
    throw new Error('记录为空');
  }
  const tags = new Map<string, string>();
  const orderedTags: string[] = [];
  for (const segment of text.split(';')) {
    const piece = segment.trim();
    if (!piece) {
      continue;
    }
    const eq = piece.indexOf('=');
    if (eq <= 0) {
      throw new Error(`片段「${piece}」不是 key=value 形式`);
    }
    const key = piece.slice(0, eq).trim().toLowerCase();
    const value = piece.slice(eq + 1).trim();
    if (!key) {
      throw new Error(`片段「${piece}」缺少标签名`);
    }
    if (tags.has(key)) {
      throw new Error(`标签 ${key}= 重复出现`);
    }
    tags.set(key, value);
    orderedTags.push(key);
  }
  return { tags, orderedTags };
}

export interface ValidationResult {
  errors: string[];
  warnings: string[];
  /** 去空白、标签小写后的规范化记录（仅在无结构性错误时给出） */
  normalized: string | null;
}

/**
 * 校验粘贴的 DMARC 记录：版本、必填策略、枚举值、百分比越界、未知标签与冲突。
 *
 * @param raw - 现有 TXT 记录
 * @returns 错误、警告与规范化输出
 */
export function validateDmarcRecord(raw: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  let parsed: ParsedDmarc;
  try {
    parsed = parseDmarcRecord(raw);
  } catch (caught) {
    return { errors: [caught instanceof Error ? caught.message : '解析失败'], warnings, normalized: null };
  }
  const { tags, orderedTags } = parsed;

  if (tags.get('v') !== 'DMARC1') {
    errors.push('必须包含且仅支持 v=DMARC1 版本标签');
  }
  const policy = tags.get('p');
  if (!policy) {
    errors.push('缺少必填的策略标签 p=（none / quarantine / reject）');
  } else if (!POLICIES.includes(policy as DmarcPolicy)) {
    errors.push(`p= 取值非法「${policy}」，允许 none / quarantine / reject`);
  }

  const sp = tags.get('sp');
  if (sp !== undefined && !POLICIES.includes(sp as DmarcPolicy)) {
    errors.push(`sp= 取值非法「${sp}」，允许 none / quarantine / reject`);
  }
  for (const alignTag of ['adkim', 'aspf'] as const) {
    const value = tags.get(alignTag);
    if (value !== undefined && !ALIGNMENTS.includes(value as AlignmentMode)) {
      errors.push(`${alignTag}= 取值非法「${value}」，允许 r（宽松）/ s（严格）`);
    }
  }
  const fo = tags.get('fo');
  if (fo !== undefined) {
    const flags = fo.split(':').map((each) => each.trim()).filter(Boolean);
    const bad = flags.filter((flag) => !FO_FLAGS.includes(flag as FoFlag));
    if (bad.length > 0) {
      errors.push(`fo= 含非法标志「${bad.join(' ')}」，允许 0 / 1 / d / s（冒号分隔）`);
    }
  }
  const pct = tags.get('pct');
  if (pct !== undefined) {
    const numeric = Number(pct);
    if (!Number.isInteger(numeric) || numeric < 0 || numeric > 100) {
      errors.push(`pct= 越界「${pct}」，必须是 0–100 的整数`);
    }
  }
  const ri = tags.get('ri');
  if (ri !== undefined) {
    const numeric = Number(ri);
    if (!Number.isInteger(numeric) || numeric <= 0) {
      errors.push(`ri= 非法「${ri}」，必须是正整数秒`);
    }
  }
  const rf = tags.get('rf');
  if (rf !== undefined && !['afrf', 'iodef'].includes(rf.toLowerCase())) {
    errors.push(`rf= 取值非法「${rf}」，允许 afrf / iodef`);
  }
  for (const tag of ['rua', 'ruf'] as const) {
    const value = tags.get(tag);
    if (value) {
      for (const uri of value.split(',').map((each) => each.trim()).filter(Boolean)) {
        if (!/^mailto:[^@\s]+@[^@\s]+\.[^@\s]+$/i.test(uri)) {
          errors.push(`${tag}= 含非法报告地址「${uri}」，应为 mailto:name@domain`);
        }
      }
    }
  }

  // 未知标签（非 RFC 7489 正式标签）
  for (const tag of orderedTags) {
    if (!KNOWN_TAGS.has(tag)) {
      warnings.push(`未知标签 ${tag}= 不在 RFC 7489 正式标签集中，接收方可能忽略`);
    }
  }
  // 冲突与策略提示
  if (policy === 'none') {
    warnings.push('p=none 为监控模式，不会拦截仿冒邮件');
  }
  if (sp === 'reject' && policy && policy !== 'reject') {
    warnings.push('sp=reject 比主域 p 策略更严格，请确认子域已全部对齐');
  }
  if (!tags.has('rua')) {
    warnings.push('未配置 rua= 聚合报告邮箱，将无法收到对齐与仿冒统计报告');
  }

  const normalized =
    errors.length === 0
      ? orderedTags.map((tag) => `${tag}=${tags.get(tag)}`).join('; ')
      : null;
  return { errors, warnings, normalized };
}

/** 一组合理的默认输入，便于 UI 初始化 */
export function createDefaultInput(): DmarcInput {
  return {
    domain: 'example.com',
    policy: 'none',
    subdomainPolicy: '',
    rua: 'mailto:dmarc@example.com',
    ruf: '',
    adkim: 'r',
    aspf: 'r',
    fo: [],
    pct: 100,
    rf: 'afrf',
    ri: null,
  };
}
