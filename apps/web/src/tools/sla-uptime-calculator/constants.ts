/**
 * SLA 可用性与允许停机时间换算器常量
 */
import { PERIOD_SECONDS, type PeriodKey } from './utils/sla';

/** 统计周期选项（周期基数与纯函数层保持一致） */
export interface PeriodOption {
  /** 周期标识 */
  key: PeriodKey;
  /** 中文展示名 */
  label: string;
  /** 周期基数秒数 */
  seconds: number;
}

/** 日 / 周 / 月（30 天）/ 年（365 天）周期选项 */
export const PERIOD_OPTIONS: PeriodOption[] = [
  { key: 'day', label: '每日（86400 秒）', seconds: PERIOD_SECONDS.day },
  { key: 'week', label: '每周（604800 秒）', seconds: PERIOD_SECONDS.week },
  { key: 'month', label: '每月（30 天，2592000 秒）', seconds: PERIOD_SECONDS.month },
  { key: 'year', label: '每年（365 天，31536000 秒）', seconds: PERIOD_SECONDS.year },
];

/** 故障时长输入单位选项 */
export interface DurationUnitOption {
  /** 单位标识 */
  key: 'second' | 'minute' | 'hour';
  /** 单位中文名 */
  label: string;
  /** 换算为秒的倍率 */
  factor: number;
}

/** 故障时长支持的单位：秒 / 分 / 时 */
export const DURATION_UNIT_OPTIONS: DurationUnitOption[] = [
  { key: 'second', label: '秒', factor: 1 },
  { key: 'minute', label: '分钟', factor: 60 },
  { key: 'hour', label: '小时', factor: 3600 },
];

/** SLA 预设档位（含参考性服务积分说明） */
export interface SlaPreset {
  /** 可用性百分数 */
  availability: number;
  /** 档位名称 */
  name: string;
  /** 参考性 service credit 定性档位说明 */
  creditNote: string;
}

/**
 * 常见 SLA 预设档位与参考服务积分区间。
 * 说明文字仅为行业常见合同档位的定性参考，具体以合同条款为准。
 */
export const SLA_PRESETS: SlaPreset[] = [
  { availability: 99, name: '99.0%（2 个 9）', creditNote: '通常无服务积分' },
  { availability: 99.5, name: '99.5%', creditNote: '参考档位：约 5% 服务积分' },
  { availability: 99.9, name: '99.9%（3 个 9）', creditNote: '参考档位：约 10% 服务积分' },
  { availability: 99.95, name: '99.95%', creditNote: '参考档位：约 10% 服务积分' },
  { availability: 99.99, name: '99.99%（4 个 9）', creditNote: '参考档位：约 25% 服务积分' },
  { availability: 99.999, name: '99.999%（5 个 9）', creditNote: '参考档位：更高比例服务积分' },
];

/** 服务积分档位说明的统一免责声明 */
export const CREDIT_DISCLAIMER = '服务积分为常见合同的参考档位，实际以合同条款为准。';

/** 「几个 9」快捷预设 */
export interface NinesPreset {
  /** 9 的个数 */
  nines: number;
  /** 按钮文案 */
  label: string;
}

/** nines 快捷预设：2 – 6 个 9 */
export const NINES_PRESETS: NinesPreset[] = [
  { nines: 2, label: '2 个 9' },
  { nines: 3, label: '3 个 9' },
  { nines: 4, label: '4 个 9' },
  { nines: 5, label: '5 个 9' },
  { nines: 6, label: '6 个 9' },
];

/** 默认可用性目标百分数 */
export const DEFAULT_AVAILABILITY = 99.9;

/** 默认故障时长（按所选单位计） */
export const DEFAULT_DOWNTIME = 31536;

/** 默认统计周期 */
export const DEFAULT_PERIOD: PeriodKey = 'year';

/** 默认故障时长单位 */
export const DEFAULT_DURATION_UNIT: DurationUnitOption['key'] = 'second';
