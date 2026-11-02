import type { CvssMetrics, MetricCode } from './utils/cvss';

export interface MetricOptionMeta {
  value: string;
  zh: string;
  en: string;
}

export interface MetricMeta {
  code: MetricCode;
  zhName: string;
  enName: string;
  options: MetricOptionMeta[];
}

/** 八项基础指标的中英标签与取值说明（措辞依据 FIRST CVSS v3.1 规范） */
export const METRIC_META: MetricMeta[] = [
  {
    code: 'AV',
    zhName: '攻击向量 Attack Vector',
    enName: 'Attack Vector (AV)',
    options: [
      { value: 'N', zh: '网络 Network', en: 'Network (N)' },
      { value: 'A', zh: '邻接 Adjacent', en: 'Adjacent (A)' },
      { value: 'L', zh: '本地 Local', en: 'Local (L)' },
      { value: 'P', zh: '物理 Physical', en: 'Physical (P)' },
    ],
  },
  {
    code: 'AC',
    zhName: '攻击复杂度 Attack Complexity',
    enName: 'Attack Complexity (AC)',
    options: [
      { value: 'L', zh: '低 Low', en: 'Low (L)' },
      { value: 'H', zh: '高 High', en: 'High (H)' },
    ],
  },
  {
    code: 'PR',
    zhName: '权限要求 Privileges Required',
    enName: 'Privileges Required (PR)',
    options: [
      { value: 'N', zh: '无 None', en: 'None (N)' },
      { value: 'L', zh: '低 Low', en: 'Low (L)' },
      { value: 'H', zh: '高 High', en: 'High (H)' },
    ],
  },
  {
    code: 'UI',
    zhName: '用户交互 User Interaction',
    enName: 'User Interaction (UI)',
    options: [
      { value: 'N', zh: '无 None', en: 'None (N)' },
      { value: 'R', zh: '需要 Required', en: 'Required (R)' },
    ],
  },
  {
    code: 'S',
    zhName: '作用域 Scope',
    enName: 'Scope (S)',
    options: [
      { value: 'U', zh: '不变 Unchanged', en: 'Unchanged (U)' },
      { value: 'C', zh: '改变 Changed', en: 'Changed (C)' },
    ],
  },
  {
    code: 'C',
    zhName: '机密性影响 Confidentiality',
    enName: 'Confidentiality (C)',
    options: [
      { value: 'N', zh: '无 None', en: 'None (N)' },
      { value: 'L', zh: '低 Low', en: 'Low (L)' },
      { value: 'H', zh: '高 High', en: 'High (H)' },
    ],
  },
  {
    code: 'I',
    zhName: '完整性影响 Integrity',
    enName: 'Integrity (I)',
    options: [
      { value: 'N', zh: '无 None', en: 'None (N)' },
      { value: 'L', zh: '低 Low', en: 'Low (L)' },
      { value: 'H', zh: '高 High', en: 'High (H)' },
    ],
  },
  {
    code: 'A',
    zhName: '可用性影响 Availability',
    enName: 'Availability (A)',
    options: [
      { value: 'N', zh: '无 None', en: 'None (N)' },
      { value: 'L', zh: '低 Low', en: 'Low (L)' },
      { value: 'H', zh: '高 High', en: 'High (H)' },
    ],
  },
];

export const DEFAULT_METRICS: CvssMetrics = {
  AV: 'N',
  AC: 'L',
  PR: 'N',
  UI: 'N',
  S: 'U',
  C: 'H',
  I: 'H',
  A: 'H',
};

/** 等级对应 antd Tag 配色 */
export const SEVERITY_COLOR: Record<string, string> = {
  None: 'default',
  Low: 'success',
  Medium: 'warning',
  High: 'orange',
  Critical: 'error',
};

export const SEVERITY_ZH: Record<string, string> = {
  None: '无',
  Low: '低危',
  Medium: '中危',
  High: '高危',
  Critical: '严重',
};
