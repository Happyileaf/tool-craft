/**
 * 工时时长累加器纯函数模块
 *
 * 以“分钟”为统一单位做多段打卡时间的净工时计算、跨午夜处理、校验与汇总，
 * 不接触 React / DOM，便于在 Vitest（node 环境）下单测。
 */

/** 单段打卡记录（时间均为 HH:mm 字符串，可只填时与分） */
export interface WorkSegment {
  /** 上班时间 HH:mm */
  start: string;
  /** 下班时间 HH:mm */
  end: string;
  /** 该段休息时长（分钟），从在岗时长中扣除 */
  breakMinutes: number;
}

/** 单段计算结果 */
export interface SegmentResult {
  index: number;
  /** 原始记录 */
  segment: WorkSegment;
  /** 是否发生跨午夜（下班早于上班，自动 +1 天） */
  crossedMidnight: boolean;
  /** 在岗总分钟（含休息，未扣除） */
  grossMinutes: number;
  /** 净工时分钟（已扣除休息），异常时为 0 */
  netMinutes: number;
  /** 错误信息；null 表示该段有效 */
  error: string | null;
}

/** 汇总结果 */
export interface WorkSummary {
  /** 有效段的净工时总和（分钟） */
  totalNetMinutes: number;
  /** 所有段休息分钟总和 */
  totalBreakMinutes: number;
  /** 有效段数量 */
  validCount: number;
  /** 日均净工时（分钟），无有效段为 0 */
  averageMinutes: number;
}

const HH_MM = /^(\d{1,2}):(\d{2})$/;

/** 把 HH:mm 解析为当天 0 点起的分钟数；非法返回 null */
export function parseTimeToMinutes(value: string): number | null {
  const match = HH_MM.exec(value.trim());
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) return null;
  return hour * 60 + minute;
}

/** 校验单段，返回错误信息；合法返回 null */
export function validateSegment(segment: WorkSegment): string | null {
  if (!segment.start.trim() || !segment.end.trim()) {
    return '上下班时间均需填写（HH:mm）';
  }
  if (parseTimeToMinutes(segment.start) === null) {
    return '上班时间格式无效，应为 HH:mm';
  }
  if (parseTimeToMinutes(segment.end) === null) {
    return '下班时间格式无效，应为 HH:mm';
  }
  if (!Number.isFinite(segment.breakMinutes) || segment.breakMinutes < 0) {
    return '休息分钟不能为负数';
  }
  return null;
}

/** 计算单段：处理跨午夜与休息扣除，异常段 netMinutes 记 0 */
export function calculateSegment(segment: WorkSegment, index: number): SegmentResult {
  const error = validateSegment(segment);
  if (error) {
    return {
      index,
      segment,
      crossedMidnight: false,
      grossMinutes: 0,
      netMinutes: 0,
      error,
    };
  }

  const startMinutes = parseTimeToMinutes(segment.start) as number;
  let endMinutes = parseTimeToMinutes(segment.end) as number;
  const crossedMidnight = endMinutes <= startMinutes;
  if (crossedMidnight) {
    endMinutes += 24 * 60;
  }

  const grossMinutes = endMinutes - startMinutes;
  // 休息超过在岗时长时净工时归零（不产生负工时）
  const netMinutes = Math.max(0, grossMinutes - segment.breakMinutes);

  return {
    index,
    segment,
    crossedMidnight,
    grossMinutes,
    netMinutes,
    error: null,
  };
}

/** 批量计算所有段 */
export function calculateAll(segments: WorkSegment[]): SegmentResult[] {
  return segments.map((segment, index) => calculateSegment(segment, index));
}

/** 汇总有效段的净工时、总休息与日均 */
export function summarize(results: SegmentResult[]): WorkSummary {
  const valid = results.filter((result) => result.error === null);
  const totalNetMinutes = valid.reduce((sum, result) => sum + result.netMinutes, 0);
  const totalBreakMinutes = valid.reduce(
    (sum, result) => sum + Math.max(0, result.segment.breakMinutes || 0),
    0,
  );
  const validCount = valid.length;
  return {
    totalNetMinutes,
    totalBreakMinutes,
    validCount,
    averageMinutes: validCount ? Math.round(totalNetMinutes / validCount) : 0,
  };
}

/** 按小时费率估算工资（净工时换算为小时，保留两位小数） */
export function estimatePay(totalNetMinutes: number, hourlyRate: number): number {
  if (!Number.isFinite(hourlyRate) || hourlyRate <= 0) return 0;
  return Math.round((totalNetMinutes / 60) * hourlyRate * 100) / 100;
}

/** 把分钟数格式化为 `H小时MM分`；allHours=true 时同时给出小时小数 */
export function formatDuration(minutes: number): string {
  const safe = Math.max(0, Math.round(minutes));
  const hours = Math.floor(safe / 60);
  const remain = safe % 60;
  return `${hours}小时${String(remain).padStart(2, '0')}分`;
}

/** 分钟数转小时小数（保留 2 位） */
export function toHours(minutes: number): number {
  return Math.round((minutes / 60) * 100) / 100;
}
