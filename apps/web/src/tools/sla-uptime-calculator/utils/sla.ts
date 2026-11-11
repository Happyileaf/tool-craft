/**
 * SLA 可用性与允许停机时间换算纯函数
 *
 * 在服务等级协议（SLA）可用性百分比与允许停机时长之间双向换算。
 * 周期基数：日 86400 秒、周 604800 秒、月按 30 天 = 2592000 秒、年按 365 天 = 31536000 秒。
 * 仅使用四则运算与 Math.log10，零依赖，不触碰 DOM。
 */

/** 一天的秒数 */
export const SECONDS_PER_DAY = 86400;

/** 一周的秒数 */
export const SECONDS_PER_WEEK = 604800;

/** 一个月（按 30 天）的秒数 */
export const SECONDS_PER_MONTH = 2_592_000;

/** 一年（按 365 天）的秒数 */
export const SECONDS_PER_YEAR = 31_536_000;

/** 统计周期标识 */
export type PeriodKey = 'day' | 'week' | 'month' | 'year';

/** 统计周期到基数秒数的映射 */
export const PERIOD_SECONDS: Record<PeriodKey, number> = {
  day: SECONDS_PER_DAY,
  week: SECONDS_PER_WEEK,
  month: SECONDS_PER_MONTH,
  year: SECONDS_PER_YEAR,
};

/** 四周期停机预算结果 */
export interface DowntimeBudget {
  /** 每日允许停机秒数 */
  day: number;
  /** 每周允许停机秒数 */
  week: number;
  /** 每月（30 天）允许停机秒数 */
  month: number;
  /** 每年（365 天）允许停机秒数 */
  year: number;
}

/** 常见 SLA 等级定义 */
export interface SlaLevel {
  /** 可用性百分数，如 99.9 表示 99.9% */
  availability: number;
  /** 对应的「9 的个数」，如 3 表示三个 9 */
  nines: number;
}

/**
 * 常见 SLA 等级表（99.0% – 99.999%），按可用性升序排列
 */
export const SLA_LEVELS: SlaLevel[] = [
  { availability: 99, nines: 2 },
  { availability: 99.5, nines: 2.3010299956639813 },
  { availability: 99.9, nines: 3 },
  { availability: 99.95, nines: 3.3010299956639813 },
  { availability: 99.99, nines: 4 },
  { availability: 99.999, nines: 5 },
];

/**
 * 校验可用性百分数：必须是 0 与 100 之间的有限数值（均不含）
 *
 * @param availabilityPct - 可用性百分数
 * @throws 当数值非有限、小于等于 0 或大于等于 100 时抛出含字段名的错误
 */
function assertAvailability(availabilityPct: number): void {
  if (!Number.isFinite(availabilityPct)) {
    throw new Error(`可用性百分比必须是有限数值，实际为 ${availabilityPct}`);
  }
  if (availabilityPct <= 0 || availabilityPct >= 100) {
    throw new Error(
      `可用性百分比必须满足 0 < 可用性百分比 < 100，实际为 ${availabilityPct}`,
    );
  }
}

/**
 * 去除浮点运算尾差（保留 10 位有效数字），如 31536.000000000004 → 31536
 *
 * @param value - 待规整的有限数值
 * @returns 去除尾差后的数值
 */
function trimFloat(value: number): number {
  return Number(value.toPrecision(10));
}

/**
 * 由可用性百分比计算日 / 周 / 月（30 天）/ 年（365 天）四个周期的允许停机秒数。
 * 停机比例 = 1 − 可用性百分比 / 100。
 *
 * @param availabilityPct - 可用性百分数，如 99.9 表示 99.9%
 * @returns 四个周期各自允许的停机秒数
 * @throws 当可用性百分数不在 (0, 100) 开区间内时抛出错误
 */
export function downtimeBudget(availabilityPct: number): DowntimeBudget {
  assertAvailability(availabilityPct);
  const downtimeRatio = 1 - availabilityPct / 100;
  return {
    day: trimFloat(SECONDS_PER_DAY * downtimeRatio),
    week: trimFloat(SECONDS_PER_WEEK * downtimeRatio),
    month: trimFloat(SECONDS_PER_MONTH * downtimeRatio),
    year: trimFloat(SECONDS_PER_YEAR * downtimeRatio),
  };
}

/**
 * 把秒数自适应换算为「d/h/m/s」组合字符串，不足 1 秒显示毫秒。
 * 例如 90061 → "1d 1h 1m 1s"，31536 → "8h 45m 36s"，0.5 → "500ms"，0 → "0s"。
 *
 * @param seconds - 非负秒数，允许小数
 * @returns 自适应单位组合的时长字符串
 * @throws 当秒数为非有限值或负数时抛出含字段名的错误
 */
export function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds)) {
    throw new Error(`故障时长（秒）必须是有限数值，实际为 ${seconds}`);
  }
  if (seconds < 0) {
    throw new Error(`故障时长（秒）不能为负数，实际为 ${seconds}`);
  }
  if (seconds === 0) {
    return '0s';
  }
  if (seconds < 1) {
    const milliseconds = Math.round(seconds * 1000);
    return `${milliseconds}ms`;
  }
  const totalSeconds = Math.floor(seconds);
  const days = Math.floor(totalSeconds / SECONDS_PER_DAY);
  const hours = Math.floor((totalSeconds % SECONDS_PER_DAY) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const restSeconds = totalSeconds % 60;
  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (restSeconds > 0) parts.push(`${restSeconds}s`);
  return parts.join(' ');
}

/** 实际可用性反算结果 */
export interface ActualAvailabilityResult {
  /** 实际可用性百分数，保留 4 位小数 */
  availability: number;
  /** 「9 的个数」，即 -log10(1 − 可用性/100)；零故障时为 Infinity */
  nines: number;
}

/**
 * 由实际故障时长与统计周期反推可用性百分比与「9 的个数」。
 * 可用性 = (1 − 故障秒数 / 周期秒数) × 100，结果保留 4 位小数；
 * nines = -log10(1 − 可用性/100)，故障为 0 时返回 Infinity。
 *
 * @param downtimeSeconds - 周期内实际故障秒数
 * @param periodSeconds - 统计周期总秒数
 * @returns 可用性百分数（4 位小数）与 nines
 * @throws 当周期非正、故障为负或故障超过周期时抛出含字段名的错误
 */
export function actualAvailability(
  downtimeSeconds: number,
  periodSeconds: number,
): ActualAvailabilityResult {
  if (!Number.isFinite(periodSeconds) || periodSeconds <= 0) {
    throw new Error(`统计周期（秒）必须是正数，实际为 ${periodSeconds}`);
  }
  if (!Number.isFinite(downtimeSeconds) || downtimeSeconds < 0) {
    throw new Error(`故障时长（秒）不能为负数，实际为 ${downtimeSeconds}`);
  }
  if (downtimeSeconds > periodSeconds) {
    throw new Error(
      `故障时长（秒）不能超过统计周期（秒）：${downtimeSeconds} > ${periodSeconds}`,
    );
  }
  const ratio = downtimeSeconds / periodSeconds;
  const availability = Number(((1 - ratio) * 100).toFixed(4));
  if (downtimeSeconds === 0) {
    return { availability: 100, nines: Number.POSITIVE_INFINITY };
  }
  const nines = -Math.log10(ratio);
  return { availability, nines };
}

/**
 * 「n 个 9」转换为可用性百分数，如 3 → 99.9、5 → 99.999。
 *
 * @param nines - 9 的个数
 * @returns 可用性百分数
 * @throws 当 nines 为非有限值或负数时抛出含字段名的错误
 */
export function ninesToPercent(nines: number): number {
  if (!Number.isFinite(nines) || nines < 0) {
    throw new Error(`9 的个数必须是不小于 0 的有限数值，实际为 ${nines}`);
  }
  const percent = (1 - Math.pow(10, -nines)) * 100;
  return Number(percent.toPrecision(12));
}

/**
 * 可用性百分数转换为「9 的个数」，即 -log10(1 − 可用性/100)；
 * 可用性为 100% 时返回 Infinity。
 *
 * @param availabilityPct - 可用性百分数
 * @returns 9 的个数；100% 时为 Infinity
 * @throws 当可用性百分数不在 (0, 100] 区间内时抛出含字段名的错误
 */
export function percentToNines(availabilityPct: number): number {
  if (!Number.isFinite(availabilityPct) || availabilityPct <= 0 || availabilityPct > 100) {
    throw new Error(
      `可用性百分比必须满足 0 < 可用性百分比 ≤ 100，实际为 ${availabilityPct}`,
    );
  }
  if (availabilityPct === 100) {
    return Number.POSITIVE_INFINITY;
  }
  return -Math.log10(1 - availabilityPct / 100);
}

/**
 * 取实际可用性达到的最高常见 SLA 等级；低于最低档（99%）时返回 undefined
 *
 * @param availabilityPct - 实际可用性百分数
 * @returns 达到的最高 SLA 等级，未达任何档位时为 undefined
 */
export function highestSlaLevel(availabilityPct: number): SlaLevel | undefined {
  let matched: SlaLevel | undefined;
  for (const level of SLA_LEVELS) {
    if (availabilityPct + 1e-9 >= level.availability) {
      matched = level;
    }
  }
  return matched;
}
