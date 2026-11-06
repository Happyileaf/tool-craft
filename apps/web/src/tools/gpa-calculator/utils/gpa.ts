/**
 * GPA 平均绩点计算纯函数模块
 *
 * 内置三套绩点口径（标准 4.0、改良 4.3、中国高校百分制对照表），
 * 支持百分制分数与字母等级两种成绩录入，统一按学分加权求平均绩点。
 * 全部为确定性纯函数，便于用固定成绩单向量做单测验收。
 */

/** 成绩录入类型：百分制分数或字母等级 */
export type GradeInputType = 'percent' | 'letter';

/** 支持的 GPA 算法标识 */
export type GpaAlgorithm = 'standard4' | 'modified43' | 'china';

/** 单门课程录入 */
export interface CourseInput {
  /** 课程名称（可选，仅用于展示） */
  name?: string;
  /** 学分，必须为正数 */
  credits: number;
  /** 成绩类型：百分制或字母等级 */
  gradeType: GradeInputType;
  /** 百分制分数（gradeType 为 percent 时使用，范围 0–100） */
  percent?: number;
  /** 字母等级（gradeType 为 letter 时使用，如 A+ / B- / F） */
  letter?: string;
}

/** 单门课程在某算法下的换算明细 */
export interface CoursePoint {
  /** 课程名称（缺省时按序号生成） */
  name: string;
  /** 学分 */
  credits: number;
  /** 原始成绩展示文本 */
  rawGrade: string;
  /** 换算后的绩点 */
  points: number;
  /** 用于算术平均的百分制等效分 */
  equivalentPercent: number;
}

/** 单个算法的计算结果 */
export interface AlgorithmResult {
  /** 算法标识 */
  algorithm: GpaAlgorithm;
  /** 算法展示名称 */
  label: string;
  /** 学分加权平均绩点 Σ(绩点×学分)/Σ学分 */
  weightedGpa: number;
  /** 逐课程换算明细 */
  courses: CoursePoint[];
}

/** 整体计算结果 */
export interface GpaReport {
  /** 总学分 */
  totalCredits: number;
  /** 算术平均分（百分制口径，等级先映射到等效百分再平均） */
  arithmeticAverage: number;
  /** 各算法结果对照 */
  algorithms: AlgorithmResult[];
}

/** 标准 4.0 算法字母等级 → 绩点（常见美国高校分段，含 +/- 微调） */
export const STANDARD_4_LETTER_POINTS: Record<string, number> = {
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
  F: 0.0,
};

/** 改良 4.3 算法字母等级 → 绩点（上限 4.3 口径） */
export const MODIFIED_43_LETTER_POINTS: Record<string, number> = {
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
  F: 0.0,
};

/** 字母等级 → 百分制等效分（取分段中位，用于混录时算术平均） */
export const LETTER_PERCENT_EQUIVALENT: Record<string, number> = {
  'A+': 98,
  A: 95,
  'A-': 92,
  'B+': 88,
  B: 85,
  'B-': 82,
  'C+': 78,
  C: 75,
  'C-': 72,
  'D+': 68,
  D: 65,
  'D-': 62,
  F: 55,
};

/** 算法元数据（展示名称与说明） */
export const ALGORITHM_META: Record<GpaAlgorithm, { label: string; description: string }> = {
  standard4: {
    label: '标准 4.0',
    description: '常见美国高校分段，A 为 4.0 上限，含 +/- 微调',
  },
  modified43: {
    label: '改良 4.3',
    description: 'A+ 可达 4.3 的上限口径，其余等级与标准 4.0 一致',
  },
  china: {
    label: '中国高校百分制对照',
    description: '按百分制分数分段映射绩点（90–100 为 4.0），不接受字母等级',
  },
};

/** 参与计算的全部算法顺序 */
export const ALL_ALGORITHMS: GpaAlgorithm[] = ['standard4', 'modified43', 'china'];

/** 中国高校常见百分制 → 绩点分段表（下界含、上界含，自高分向低分匹配） */
export const CHINA_PERCENT_TABLE: ReadonlyArray<{ min: number; max: number; points: number }> = [
  { min: 90, max: 100, points: 4.0 },
  { min: 85, max: 89, points: 3.7 },
  { min: 82, max: 84, points: 3.3 },
  { min: 78, max: 81, points: 3.0 },
  { min: 75, max: 77, points: 2.7 },
  { min: 72, max: 74, points: 2.3 },
  { min: 68, max: 71, points: 2.0 },
  { min: 64, max: 67, points: 1.5 },
  { min: 60, max: 63, points: 1.0 },
  { min: 0, max: 59, points: 0.0 },
];

/** 数值四舍五入到指定小数位，并消除 -0 */
function round(value: number, digits = 4): number {
  const factor = 10 ** digits;
  const rounded = Math.round((value + Number.EPSILON) * factor) / factor;
  return Object.is(rounded, -0) ? 0 : rounded;
}

/** 规范化字母等级（去空白并转大写） */
export function normalizeLetter(letter: string): string {
  return letter.trim().toUpperCase();
}

/** 校验单门课程录入，不合法时抛出带中文说明的错误 */
function validateCourse(course: CourseInput, index: number): void {
  const label = `第 ${index + 1} 门课`;
  if (!Number.isFinite(course.credits) || course.credits <= 0) {
    throw new Error(`${label}学分必须为正数，当前为 ${String(course.credits)}`);
  }
  if (course.gradeType === 'percent') {
    const score = course.percent;
    if (score === undefined || !Number.isFinite(score)) {
      throw new Error(`${label}缺少有效的百分制成绩`);
    }
    if (score < 0 || score > 100) {
      throw new Error(`${label}百分制成绩必须在 0–100 之间，当前为 ${String(score)}`);
    }
    return;
  }
  const letter = course.letter === undefined ? '' : normalizeLetter(course.letter);
  if (!(letter in STANDARD_4_LETTER_POINTS)) {
    throw new Error(`${label}未知等级「${course.letter ?? ''}」，支持 A+ 至 F 的常见字母等级`);
  }
}

/** 百分制分数 → 标准 4.0 绩点（按常见分段边界） */
export function percentToStandard4Points(percent: number): number {
  if (percent >= 93) return 4.0;
  if (percent >= 90) return 3.7;
  if (percent >= 87) return 3.3;
  if (percent >= 83) return 3.0;
  if (percent >= 80) return 2.7;
  if (percent >= 77) return 2.3;
  if (percent >= 73) return 2.0;
  if (percent >= 70) return 1.7;
  if (percent >= 67) return 1.3;
  if (percent >= 63) return 1.0;
  if (percent >= 60) return 0.7;
  return 0.0;
}

/** 百分制分数 → 改良 4.3 绩点（仅 97+ 为 4.3，其余与标准 4.0 同界） */
export function percentToModified43Points(percent: number): number {
  if (percent >= 97) return 4.3;
  return percentToStandard4Points(percent);
}

/** 百分制分数 → 中国高校对照表绩点 */
export function percentToChinaPoints(percent: number): number {
  const band = CHINA_PERCENT_TABLE.find((item) => percent >= item.min && percent <= item.max);
  if (!band) {
    throw new Error(`百分制成绩必须在 0–100 之间，当前为 ${String(percent)}`);
  }
  return band.points;
}

/** 把任意课程成绩换算为指定算法下的绩点 */
export function coursePoints(course: CourseInput, algorithm: GpaAlgorithm): number {
  if (course.gradeType === 'letter') {
    const letter = normalizeLetter(course.letter ?? '');
    if (algorithm === 'china') {
      // 中国高校表以百分制分段为准：字母等级先转等效百分再查分段表
      const equivalent = LETTER_PERCENT_EQUIVALENT[letter];
      if (equivalent === undefined) {
        throw new Error(`未知等级「${course.letter ?? ''}」，支持 A+ 至 F 的常见字母等级`);
      }
      return percentToChinaPoints(equivalent);
    }
    const table = algorithm === 'standard4' ? STANDARD_4_LETTER_POINTS : MODIFIED_43_LETTER_POINTS;
    const points = table[letter];
    if (points === undefined) {
      throw new Error(`未知等级「${course.letter ?? ''}」，支持 A+ 至 F 的常见字母等级`);
    }
    return points;
  }
  const percent = course.percent ?? NaN;
  if (algorithm === 'standard4') return percentToStandard4Points(percent);
  if (algorithm === 'modified43') return percentToModified43Points(percent);
  return percentToChinaPoints(percent);
}

/** 课程成绩的百分制等效分（百分制原样返回，等级查等效表） */
export function equivalentPercent(course: CourseInput): number {
  if (course.gradeType === 'percent') {
    return course.percent ?? NaN;
  }
  const letter = normalizeLetter(course.letter ?? '');
  const value = LETTER_PERCENT_EQUIVALENT[letter];
  if (value === undefined) {
    throw new Error(`未知等级「${course.letter ?? ''}」，无法换算百分制等效分`);
  }
  return value;
}

/** 课程展示名与原始成绩文本 */
function describeCourse(course: CourseInput, index: number): { name: string; rawGrade: string } {
  const name = course.name?.trim() || `课程 ${index + 1}`;
  const rawGrade =
    course.gradeType === 'percent' ? `${String(course.percent)} 分` : normalizeLetter(course.letter ?? '');
  return { name, rawGrade };
}

/**
 * 计算完整 GPA 报告：总学分、算术平均分与三套算法的加权绩点对照
 *
 * @param courses 课程列表，空列表或全部无效时抛出错误
 * @returns 含各算法逐课程明细的报告
 */
export function calculateGpa(courses: CourseInput[]): GpaReport {
  const validCourses = courses.filter((course) => course !== undefined && course !== null);
  if (validCourses.length === 0) {
    throw new Error('请先添加至少一门课程再计算 GPA');
  }
  validCourses.forEach((course, index) => validateCourse(course, index));

  const totalCredits = validCourses.reduce((sum, course) => sum + course.credits, 0);
  if (totalCredits <= 0) {
    throw new Error('总学分必须为正数，请检查课程学分');
  }

  const percentSum = validCourses.reduce(
    (sum, course) => sum + equivalentPercent(course) * course.credits,
    0,
  );
  const arithmeticAverage = round(percentSum / totalCredits, 2);

  const algorithms = ALL_ALGORITHMS.map((algorithm) => {
    const detailCourses: CoursePoint[] = validCourses.map((course, index) => {
      const { name, rawGrade } = describeCourse(course, index);
      return {
        name,
        credits: course.credits,
        rawGrade,
        points: coursePoints(course, algorithm),
        equivalentPercent: equivalentPercent(course),
      };
    });
    const weightedSum = detailCourses.reduce(
      (sum, item) => sum + item.points * item.credits,
      0,
    );
    return {
      algorithm,
      label: ALGORITHM_META[algorithm].label,
      weightedGpa: round(weightedSum / totalCredits, 4),
      courses: detailCourses,
    };
  });

  return { totalCredits: round(totalCredits, 4), arithmeticAverage, algorithms };
}
