/**
 * 预产期与孕周计算纯函数模块。
 * 日期一律按「本地日历日」处理：取 UTC 正午时间戳做整日差运算，
 * 规避夏令时与本地时区偏移导致的跨日误差；模块不触碰 DOM。
 */

/** 标准妊娠天数：末次月经 LMP 到预产期（Naegele 规则） */
export const LMP_GESTATION_DAYS = 280;

/** 排卵/受孕日到预产期的天数 */
export const OVULATION_GESTATION_DAYS = 266;

/** 默认月经周期天数 */
export const DEFAULT_CYCLE_DAYS = 28;

/** 月经周期允许输入范围 */
export const MIN_CYCLE_DAYS = 21;
export const MAX_CYCLE_DAYS = 35;

/** 输入模式 */
export type InputMode = 'lmp' | 'ovulation';

/** 三月期 */
export type Trimester = 1 | 2 | 3;

/** 关键产检节点（以孕周时间窗表达，具体日期遵医嘱） */
export interface CheckupMilestone {
  /** 节点名称 */
  name: string;
  /** 起始孕周（含） */
  startWeek: number;
  /** 结束孕周（含，6 表示该周第 6 天即 N+6） */
  endWeek: number;
  /** 说明 */
  note: string;
}

/** 单次计算的完整结果 */
export interface PregnancyResult {
  /** 推算出的末次月经日期（排卵日模式下反推） */
  lmp: Date;
  /** 预产期 */
  dueDate: Date;
  /** 未做周期修正的基准预产期 */
  baselineDueDate: Date;
  /** 周期修正天数（正为延后，负为提前） */
  cycleAdjustmentDays: number;
  /** 参考日期距 LMP 的整天数 */
  dayOfPregnancy: number;
  /** 当前孕周（0–40） */
  gestationalWeek: number;
  /** 当前周内第几天（0–6） */
  gestationalDay: number;
  /** 三月期编号 */
  trimester: Trimester;
  /** 距预产期天数（负数表示已过预产期） */
  daysUntilDue: number;
  /** 40 周进度百分比，0–100，封顶 100 */
  progressPercent: number;
}

/**
 * 解析 YYYY-MM-DD 字符串为 UTC 正午的 Date，避免本地时区跨日。
 *
 * @param value 日期输入框值
 * @returns UTC 正午 Date；空值抛出错误
 */
export function parseDateInput(value: string): Date {
  if (!value) {
    throw new Error('请选择日期');
  }
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    throw new Error('日期格式应为 YYYY-MM-DD');
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw new Error('无效的日历日期');
  }
  return date;
}

/** 把 Date 格式化为 YYYY-MM-DD（按 UTC 日） */
export function formatDate(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** 两个日期之间的整天数（b − a） */
export function diffDays(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}

/** 在日期上加减整天，返回新 Date */
export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 86_400_000);
}

/**
 * 校验月经周期天数是否在 21–35 天医学常见范围内。
 *
 * @param cycleDays 周期天数
 */
export function validateCycleDays(cycleDays: number): void {
  if (
    !Number.isInteger(cycleDays) ||
    cycleDays < MIN_CYCLE_DAYS ||
    cycleDays > MAX_CYCLE_DAYS
  ) {
    throw new Error(
      `月经周期需为 ${MIN_CYCLE_DAYS}–${MAX_CYCLE_DAYS} 天之间的整数`,
    );
  }
}

/**
 * 由输入模式与基准日期推算 LMP。
 * LMP 模式直接采用输入；排卵日模式反推 14 天（标准周期排卵发生在 LMP 后第 14 天）。
 *
 * @param mode 输入模式
 * @param baseDate 输入的基准日期
 * @returns 末次月经日期
 */
export function deriveLmp(mode: InputMode, baseDate: Date): Date {
  return mode === 'ovulation' ? addDays(baseDate, -14) : new Date(baseDate);
}

/**
 * 计算三月期：1–13⁺⁶ 周为第一孕期，14–27⁺⁶ 周为第二孕期，28 周起为第三孕期。
 *
 * @param gestationalWeek 整数孕周
 * @returns 三月期编号
 */
export function getTrimester(gestationalWeek: number): Trimester {
  if (gestationalWeek <= 13) {
    return 1;
  }
  if (gestationalWeek <= 27) {
    return 2;
  }
  return 3;
}

/**
 * 完整预产期与孕周计算。
 *
 * @param params 输入参数
 * @param params.mode LMP 或排卵日模式
 * @param params.baseDateInput 基准日期字符串 YYYY-MM-DD
 * @param params.referenceDateInput 参考日期字符串 YYYY-MM-DD（默认今天由组件层传入）
 * @param params.cycleDays 月经周期天数，默认 28
 * @returns 完整计算结果
 */
export function calculatePregnancy(params: {
  mode: InputMode;
  baseDateInput: string;
  referenceDateInput: string;
  cycleDays?: number;
}): PregnancyResult {
  const cycleDays = params.cycleDays ?? DEFAULT_CYCLE_DAYS;
  validateCycleDays(cycleDays);

  const baseDate = parseDateInput(params.baseDateInput);
  const referenceDate = parseDateInput(params.referenceDateInput);
  const lmp = deriveLmp(params.mode, baseDate);

  const cycleAdjustmentDays = cycleDays - DEFAULT_CYCLE_DAYS;
  const baselineDueDate = addDays(lmp, LMP_GESTATION_DAYS);
  const dueDate = addDays(baselineDueDate, cycleAdjustmentDays);

  const dayOfPregnancy = diffDays(lmp, referenceDate);
  const gestationalWeek = Math.floor(dayOfPregnancy / 7);
  const gestationalDay = dayOfPregnancy - gestationalWeek * 7;
  const daysUntilDue = diffDays(referenceDate, dueDate);
  const progressPercent = Math.min(
    100,
    Math.max(0, Math.round((dayOfPregnancy / LMP_GESTATION_DAYS) * 100)),
  );

  return {
    lmp,
    dueDate,
    baselineDueDate,
    cycleAdjustmentDays,
    dayOfPregnancy,
    gestationalWeek,
    gestationalDay,
    trimester: getTrimester(gestationalWeek),
    daysUntilDue,
    progressPercent,
  };
}

/** 40 周孕期关键产检节点时间窗（窗口以周为单位，具体安排遵医嘱） */
export const CHECKUP_MILESTONES: CheckupMilestone[] = [
  {
    name: '首次建档与早孕检查',
    startWeek: 6,
    endWeek: 13,
    note: '确认宫内妊娠、基础血尿常规与建档',
  },
  {
    name: 'NT 颈项透明层检查',
    startWeek: 11,
    endWeek: 13,
    note: '11–13⁺⁶ 周，需提前预约',
  },
  {
    name: '早/中孕期唐氏筛查',
    startWeek: 11,
    endWeek: 20,
    note: '早唐与中唐按医院方案选择，或行无创 DNA',
  },
  {
    name: '大排畸系统超声',
    startWeek: 20,
    endWeek: 24,
    note: '胎儿系统结构筛查',
  },
  {
    name: 'OGTT 糖耐量试验',
    startWeek: 24,
    endWeek: 28,
    note: '妊娠期糖尿病筛查',
  },
  {
    name: '胎心监护启动',
    startWeek: 32,
    endWeek: 40,
    note: '32 周起常规产检，36 周后通常每周一次',
  },
];

/**
 * 判断某孕周是否落在产检节点窗口内。
 *
 * @param milestone 产检节点
 * @param week 当前孕周
 * @returns 是否处于窗口
 */
export function isWeekInMilestone(
  milestone: CheckupMilestone,
  week: number,
): boolean {
  return week >= milestone.startWeek && week <= milestone.endWeek;
}
