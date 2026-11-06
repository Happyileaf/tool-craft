/**
 * GPA 计算纯函数集合：四套静态换算表（标准 4.0 / 改良 4.3 / WES 分段 /
 * 中国大陆常见百分制对照）+ 学分加权 GPA、算术平均分与总学分汇总。
 * 不做院校自定义权重，全部规则为确定性分段映射。
 */

/** 换算口径标识 */
export type GpaScaleId = 'standard-4.0' | 'modified-4.3' | 'wes' | 'china-100';

/** 成绩输入：百分制数字或等级字符串 */
export type GradeInput = number | string;

/** 单条课程输入 */
export interface CourseInput {
  /** 课程名（可选，仅用于展示） */
  name?: string;
  /** 成绩：0–100 数字，或 A+ / A / A- / B+ ... / F 等级 */
  grade: GradeInput;
  /** 学分，必须为正数 */
  credits: number;
}

/** 单条课程的换算中间结果 */
export interface CourseResult {
  /** 原始输入是否为等级 */
  isLetter: boolean;
  /** 等级归一化后的键（数字成绩为 null） */
  letter: string | null;
  /** 参与百分制算法的分数（数字原样；等级取所在段中位分） */
  percentage: number;
  /** 各口径下的绩点 */
  points: Record<GpaScaleId, number>;
  /** 该行的问题（无问题为 null） */
  error: string | null;
}

/** 单口径汇总 */
export interface ScaleSummary {
  /** 学分加权 GPA：Σ(绩点 × 学分) / Σ 学分 */
  weightedGpa: number;
  /** 该口径下绩点满分 */
  maxPoint: number;
}

/** 整张成绩单汇总 */
export interface TranscriptSummary {
  /** 各口径汇总 */
  scales: Record<GpaScaleId, ScaleSummary>;
  /** 百分制算术平均分（不含学分权重） */
  arithmeticAverage: number;
  /** 总学分 */
  totalCredits: number;
  /** 有效课程数 */
  courseCount: number;
}

/** GPA 计算错误 */
export class GpaError extends Error {}

/** 等级 → 百分制中位段（用于等级参与百分制算法的透明链路） */
const LETTER_TO_PERCENTAGE: Record<string, number> = {
  'A+': 97,
  A: 93,
  'A-': 89,
  'B+': 86,
  B: 83,
  'B-': 79,
  'C+': 76,
  C: 73,
  'C-': 69,
  'D+': 66,
  D: 63,
  'D-': 61,
  F: 40,
};

/** 标准 4.0：等级直映绩点 */
const LETTER_POINTS_STANDARD: Record<string, number> = {
  'A+': 4.0,
  A: 4.0,
  'A-': 3.7,
  'B+': 3.3,
  B: 3.0,
  'B-': 2.7,
  'C+': 2.3,
  C: 2.0,
  'C-': 1.7,
  'D+': 1.3,
  D: 1.0,
  'D-': 0.7,
  F: 0,
};

/** 改良 4.3：A+ 封顶 4.3 */
const LETTER_POINTS_MODIFIED: Record<string, number> = {
  'A+': 4.3,
  A: 4.0,
  'A-': 3.7,
  'B+': 3.3,
  B: 3.0,
  'B-': 2.7,
  'C+': 2.3,
  C: 2.0,
  'C-': 1.7,
  'D+': 1.3,
  D: 1.0,
  'D-': 0.7,
  F: 0,
};

/**
 * 百分制分段表：按从高到低匹配，首段满足 lower ≤ score 的区间生效。
 * 每段含下限（含）、上限（不含，首段除外）与对应绩点。
 */
interface ScoreBand {
  lower: number;
  points: number;
}

/** 标准 4.0 百分制分段（美式常见对照） */
const SCORE_BANDS_STANDARD: ScoreBand[] = [
  { lower: 90, points: 4.0 },
  { lower: 85, points: 3.7 },
  { lower: 82, points: 3.3 },
  { lower: 78, points: 3.0 },
  { lower: 75, points: 2.7 },
  { lower: 72, points: 2.3 },
  { lower: 68, points: 2.0 },
  { lower: 64, points: 1.5 },
  { lower: 60, points: 1.0 },
  { lower: 0, points: 0 },
];

/** 改良 4.3 百分制分段：95+ 给满 4.3，其余在 4.0 体系上平移 */
const SCORE_BANDS_MODIFIED: ScoreBand[] = [
  { lower: 95, points: 4.3 },
  { lower: 90, points: 4.0 },
  { lower: 85, points: 3.7 },
  { lower: 82, points: 3.3 },
  { lower: 78, points: 3.0 },
  { lower: 75, points: 2.7 },
  { lower: 72, points: 2.3 },
  { lower: 68, points: 2.0 },
  { lower: 64, points: 1.5 },
  { lower: 60, points: 1.0 },
  { lower: 0, points: 0 },
];

/** WES 风格粗分段 */
const SCORE_BANDS_WES: ScoreBand[] = [
  { lower: 85, points: 4.0 },
  { lower: 75, points: 3.0 },
  { lower: 60, points: 2.0 },
  { lower: 0, points: 0 },
];

/** 中国大陆高校常见百分制对照 */
const SCORE_BANDS_CHINA: ScoreBand[] = [
  { lower: 90, points: 4.0 },
  { lower: 85, points: 3.7 },
  { lower: 82, points: 3.3 },
  { lower: 78, points: 3.0 },
  { lower: 75, points: 2.7 },
  { lower: 72, points: 2.3 },
  { lower: 68, points: 2.0 },
  { lower: 64, points: 1.5 },
  { lower: 60, points: 1.0 },
  { lower: 0, points: 0 },
];

/** 各口径元数据：满分与展示名 */
export const SCALE_META: Readonly<Record<GpaScaleId, { name: string; maxPoint: number }>> = {
  'standard-4.0': { name: '标准 4.0（美式分段）', maxPoint: 4.0 },
  'modified-4.3': { name: '改良 4.3（A+ = 4.3）', maxPoint: 4.3 },
  wes: { name: 'WES 风格分段', maxPoint: 4.0 },
  'china-100': { name: '中国高校百分制对照', maxPoint: 4.0 },
};

/** 口径展示顺序 */
export const SCALE_ORDER: readonly GpaScaleId[] = [
  'standard-4.0',
  'modified-4.3',
  'wes',
  'china-100',
];

/**
 * 归一化等级字符串（去空格、转大写），无法识别时抛 GpaError。
 *
 * @param grade - 原始等级
 * @returns 标准等级键
 */
export function normalizeLetter(grade: string): string {
  const key = grade.trim().toUpperCase();
  if (!(key in LETTER_TO_PERCENTAGE)) {
    throw new GpaError(`无法识别的等级「${grade}」，支持 A+ ~ F（含 +/-）`);
  }
  return key;
}

/**
 * 按分段表把百分制分数映射为绩点。
 *
 * @param score - 0–100 百分制分数
 * @param bands - 从高到低排列的分段表
 * @returns 绩点
 */
function pointsFromBands(score: number, bands: readonly ScoreBand[]): number {
  const band = bands.find((item) => score >= item.lower);
  return band ? band.points : 0;
}

/**
 * 换算单条课程：校验学分与成绩，输出四口径绩点与中间百分制分数。
 * 不及格（&lt;60 或 F）绩点为 0，但行仍返回以便学分计入分母。
 *
 * @param course - 课程输入
 * @param index - 课程序号（用于错误信息）
 * @returns 该行换算结果（含行级错误）
 */
export function evaluateCourse(course: CourseInput, index: number): CourseResult {
  const rowLabel = `第 ${index + 1} 行`;
  const credits = Number(course.credits);
  if (!Number.isFinite(credits) || credits <= 0) {
    return failedRow(course, `${rowLabel}学分非法：须为大于 0 的数字，实际为「${String(course.credits)}」`);
  }

  if (typeof course.grade === 'number') {
    const score = course.grade;
    if (!Number.isFinite(score) || score < 0 || score > 100) {
      return failedRow(course, `${rowLabel}百分制成绩非法：须在 0–100 之间，实际为「${String(score)}」`);
    }
    return {
      isLetter: false,
      letter: null,
      percentage: score,
      points: {
        'standard-4.0': pointsFromBands(score, SCORE_BANDS_STANDARD),
        'modified-4.3': pointsFromBands(score, SCORE_BANDS_MODIFIED),
        wes: pointsFromBands(score, SCORE_BANDS_WES),
        'china-100': pointsFromBands(score, SCORE_BANDS_CHINA),
      },
      error: null,
    };
  }

  try {
    const letter = normalizeLetter(String(course.grade));
    const percentage = LETTER_TO_PERCENTAGE[letter]!;
    return {
      isLetter: true,
      letter,
      percentage,
      points: {
        'standard-4.0': LETTER_POINTS_STANDARD[letter]!,
        'modified-4.3': LETTER_POINTS_MODIFIED[letter]!,
        // WES 与中国口径不直接收等级：等级先转中位段分数再走百分制分段
        wes: pointsFromBands(percentage, SCORE_BANDS_WES),
        'china-100': pointsFromBands(percentage, SCORE_BANDS_CHINA),
      },
      error: null,
    };
  } catch (error) {
    return failedRow(
      course,
      error instanceof GpaError ? `${rowLabel}${error.message}` : `${rowLabel}成绩无法识别`,
    );
  }
}

/**
 * 构造行级失败结果（绩点全部为 0，错误信息挂载在该行）。
 */
function failedRow(course: CourseInput, error: string): CourseResult {
  const isLetter = typeof course.grade === 'string';
  return {
    isLetter,
    letter: isLetter ? null : null,
    percentage: 0,
    points: {
      'standard-4.0': 0,
      'modified-4.3': 0,
      wes: 0,
      'china-100': 0,
    },
    error,
  };
}

/**
 * 汇总整张成绩单。
 *
 * @param courses - 课程数组
 * @returns 每行明细与四口径汇总
 * @throws 存在任一行级错误，或总学分为 0 / 课程为空时抛出 GpaError
 */
export function calculateTranscript(courses: CourseInput[]): {
  rows: CourseResult[];
  summary: TranscriptSummary;
} {
  if (courses.length === 0) {
    throw new GpaError('请至少添加一门课程');
  }
  const rows = courses.map((course, index) => evaluateCourse(course, index));
  const firstError = rows.find((row) => row.error !== null);
  if (firstError) {
    throw new GpaError(firstError.error ?? '成绩单包含非法行');
  }

  const totalCredits = courses.reduce((sum, course) => sum + Number(course.credits), 0);
  if (totalCredits <= 0) {
    throw new GpaError('总学分为 0，无法计算学分加权 GPA');
  }

  const scales = SCALE_ORDER.reduce(
    (acc, scaleId) => {
      const weightedPoints = rows.reduce(
        (sum, row, rowIndex) => sum + row.points[scaleId] * Number(courses[rowIndex]!.credits),
        0,
      );
      acc[scaleId] = {
        weightedGpa: weightedPoints / totalCredits,
        maxPoint: SCALE_META[scaleId].maxPoint,
      };
      return acc;
    },
    {} as Record<GpaScaleId, ScaleSummary>,
  );

  const arithmeticAverage =
    rows.reduce((sum, row) => sum + row.percentage, 0) / rows.length;

  return {
    rows,
    summary: {
      scales,
      arithmeticAverage,
      totalCredits,
      courseCount: rows.length,
    },
  };
}
