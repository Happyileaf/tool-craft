/**
 * CVSS v3.1 基础向量解析与基础分计算纯函数。
 * 规范：FIRST《CVSS v3.1 Specification》，评分表见 Appendix A，
 * Roundup 取整规则见 Appendix B（与 Python roundup() 等价）。
 */

export type MetricCode = 'AV' | 'AC' | 'PR' | 'UI' | 'S' | 'C' | 'I' | 'A';

/** 八项基础指标的取值（缩写字母） */
export type CvssMetrics = {
  AV: 'N' | 'A' | 'L' | 'P';
  AC: 'L' | 'H';
  PR: 'N' | 'L' | 'H';
  UI: 'N' | 'R';
  S: 'U' | 'C';
  C: 'N' | 'L' | 'H';
  I: 'N' | 'L' | 'H';
  A: 'N' | 'L' | 'H';
};

export interface CvssResult {
  /** 合规向量字符串，CVSS:3.1/... */
  vector: string;
  /** 基础分 0.0–10.0，一位小数 */
  score: number;
  /** 定性等级 */
  severity: 'None' | 'Low' | 'Medium' | 'High' | 'Critical';
  /** ISCBase（CIA 基础影响分，0–1） */
  iscBase: number;
  /** ISC：经作用域调整前的影响分（6.42/7.52 公式后） */
  impact: number;
  exploitability: number;
}

/** 指标顺序（向量字符串中的固定顺序） */
export const METRIC_ORDER: MetricCode[] = ['AV', 'AC', 'PR', 'UI', 'S', 'C', 'I', 'A'];

/** 各指标合法取值 */
export const METRIC_VALUES: Record<MetricCode, string[]> = {
  AV: ['N', 'A', 'L', 'P'],
  AC: ['L', 'H'],
  PR: ['N', 'L', 'H'],
  UI: ['N', 'R'],
  S: ['U', 'C'],
  C: ['N', 'L', 'H'],
  I: ['N', 'L', 'H'],
  A: ['N', 'L', 'H'],
};

/* ---------------- Appendix A 评分表 ---------------- */

const AV_SCORE: Record<string, number> = { N: 0.85, A: 0.62, L: 0.55, P: 0.2 };
const AC_SCORE: Record<string, number> = { L: 0.77, H: 0.44 };
const UI_SCORE: Record<string, number> = { N: 0.85, R: 0.62 };
/** PR：作用域是否改变（Changed）两套权重 */
const PR_SCORES: Record<string, { unchanged: number; changed: number }> = {
  N: { unchanged: 0.85, changed: 0.85 },
  L: { unchanged: 0.62, changed: 0.68 },
  H: { unchanged: 0.27, changed: 0.5 },
};
const CIA_SCORE: Record<string, number> = { N: 0, L: 0.22, H: 0.56 };

/**
 * Appendix B Roundup：将输入向上取整到一位小数。
 * 规范伪代码：roundup = ceil(input × 100000) / 100000，再保留一位小数。
 * 这里按规范整数化实现，规避浮点误差（如 4.02 应为 4.1 而非 4.0）。
 */
export function roundup(input: number): number {
  if (input === 0) return 0;
  const intInput = Math.round(input * 100000);
  return Math.ceil(intInput / 10000) / 10;
}

/** 定性等级（Table 14 Qualitative Severity Rating Scale） */
export function scoreSeverity(score: number): CvssResult['severity'] {
  if (score === 0) return 'None';
  if (score < 4.0) return 'Low';
  if (score < 7.0) return 'Medium';
  if (score < 9.0) return 'High';
  return 'Critical';
}

/** 由八项指标计算基础分 */
export function calculateCvss(metrics: CvssMetrics): CvssResult {
  const scopeChanged = metrics.S === 'C';
  const cScore = CIA_SCORE[metrics.C] ?? 0;
  const iScore = CIA_SCORE[metrics.I] ?? 0;
  const aScore = CIA_SCORE[metrics.A] ?? 0;
  const impactSubScore = 1 - (1 - cScore) * (1 - iScore) * (1 - aScore);

  let impact: number;
  if (scopeChanged) {
    impact = 7.52 * (impactSubScore - 0.029) - 3.25 * (impactSubScore - 0.02) ** 15;
  } else {
    impact = 6.42 * impactSubScore;
  }

  const prEntry = PR_SCORES[metrics.PR] ?? { unchanged: 0.85, changed: 0.85 };
  const pr = scopeChanged ? prEntry.changed : prEntry.unchanged;
  const exploitability =
    8.22 *
    (AV_SCORE[metrics.AV] ?? 0) *
    (AC_SCORE[metrics.AC] ?? 0) *
    pr *
    (UI_SCORE[metrics.UI] ?? 0);

  let base: number;
  if (impact <= 0) {
    base = 0;
  } else if (scopeChanged) {
    base = roundup(Math.min(1.08 * (impact + exploitability), 10));
  } else {
    base = roundup(Math.min(impact + exploitability, 10));
  }

  return {
    vector: buildVector(metrics),
    score: base,
    severity: scoreSeverity(base),
    iscBase: roundup(impactSubScore),
    impact: roundup(impact),
    exploitability: roundup(exploitability),
  };
}

/** 由指标对象生成规范顺序的向量字符串 */
export function buildVector(metrics: CvssMetrics): string {
  const parts = METRIC_ORDER.map((code) => `${code}:${metrics[code]}`);
  return `CVSS:3.1/${parts.join('/')}`;
}

/**
 * 解析 CVSS v3.1 向量字符串。
 * 严格校验：必须以 CVSS:3.1/ 开头；八项基础指标齐全、不重复、取值合法；
 * 顺序不限（规范允许任意顺序）；出现未知指标键时报错。
 */
export function parseVector(vector: string): CvssMetrics {
  const text = vector.trim();
  const prefix = 'CVSS:3.1/';
  if (!text.startsWith(prefix)) {
    throw new Error('向量必须以 CVSS:3.1/ 开头');
  }

  const seen = new Map<MetricCode, string>();
  const segments = text.slice(prefix.length).split('/');
  if (segments.some((seg) => seg === '')) {
    throw new Error('向量中存在空段（多余的斜杠）');
  }

  for (const seg of segments) {
    const sep = seg.indexOf(':');
    if (sep === -1) {
      throw new Error(`格式错误的段：${seg}（应为 键:值）`);
    }
    const key = seg.slice(0, sep);
    const value = seg.slice(sep + 1);
    if (!(METRIC_VALUES as Record<string, string[]>)[key]) {
      throw new Error(`未知或非基础指标：${key}（本工具仅计算基础分八项指标）`);
    }
    const code = key as MetricCode;
    if (seen.has(code)) {
      throw new Error(`指标 ${key} 重复出现`);
    }
    if (!METRIC_VALUES[code].includes(value)) {
      throw new Error(`指标 ${key} 的取值非法：${value}`);
    }
    seen.set(code, value);
  }

  const missing = METRIC_ORDER.filter((code) => !seen.has(code));
  if (missing.length > 0) {
    throw new Error(`缺少基础指标：${missing.join('、')}`);
  }

  return {
    AV: seen.get('AV') as CvssMetrics['AV'],
    AC: seen.get('AC') as CvssMetrics['AC'],
    PR: seen.get('PR') as CvssMetrics['PR'],
    UI: seen.get('UI') as CvssMetrics['UI'],
    S: seen.get('S') as CvssMetrics['S'],
    C: seen.get('C') as CvssMetrics['C'],
    I: seen.get('I') as CvssMetrics['I'],
    A: seen.get('A') as CvssMetrics['A'],
  };
}
