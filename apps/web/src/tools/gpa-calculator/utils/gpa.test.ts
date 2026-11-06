import { describe, expect, it } from 'vitest';
import {
  ALGORITHM_META,
  ALL_ALGORITHMS,
  CHINA_PERCENT_TABLE,
  LETTER_PERCENT_EQUIVALENT,
  MODIFIED_43_LETTER_POINTS,
  STANDARD_4_LETTER_POINTS,
  calculateGpa,
  coursePoints,
  equivalentPercent,
  normalizeLetter,
  percentToChinaPoints,
  percentToModified43Points,
  percentToStandard4Points,
  type CourseInput,
} from './gpa';

describe('normalizeLetter', () => {
  it('去除空白并统一转大写', () => {
    expect(normalizeLetter(' a+ ')).toBe('A+');
    expect(normalizeLetter('b-')).toBe('B-');
  });
});

describe('百分制分段换算', () => {
  it('标准 4.0：90 对应 3.7、93 及以上为 4.0、不及格为 0', () => {
    expect(percentToStandard4Points(93)).toBe(4.0);
    expect(percentToStandard4Points(90)).toBe(3.7);
    expect(percentToStandard4Points(59)).toBe(0.0);
    expect(percentToStandard4Points(60)).toBe(0.7);
  });

  it('改良 4.3：97 及以上为 4.3，93–96 仍为 4.0', () => {
    expect(percentToModified43Points(98)).toBe(4.3);
    expect(percentToModified43Points(95)).toBe(4.0);
    expect(percentToModified43Points(90)).toBe(3.7);
  });

  it('中国高校表：90 分映射 4.0、80 分映射 3.0', () => {
    expect(percentToChinaPoints(90)).toBe(4.0);
    expect(percentToChinaPoints(100)).toBe(4.0);
    expect(percentToChinaPoints(80)).toBe(3.0);
    expect(percentToChinaPoints(59)).toBe(0.0);
  });

  it('中国高校表完整覆盖 0–100 且无分段缺口', () => {
    for (let score = 0; score <= 100; score += 1) {
      const points = percentToChinaPoints(score);
      expect(points).toBeGreaterThanOrEqual(0);
      expect(points).toBeLessThanOrEqual(4.0);
    }
    const covered = CHINA_PERCENT_TABLE.reduce((sum, band) => sum + (band.max - band.min + 1), 0);
    expect(covered).toBe(101);
  });
});

describe('字母等级换算', () => {
  it('标准 4.0：A=4.0、B=3.0、F=0，A+ 不超过 4.0', () => {
    expect(STANDARD_4_LETTER_POINTS.A).toBe(4.0);
    expect(STANDARD_4_LETTER_POINTS['A+']).toBe(4.0);
    expect(STANDARD_4_LETTER_POINTS.B).toBe(3.0);
    expect(STANDARD_4_LETTER_POINTS.F).toBe(0.0);
  });

  it('改良 4.3：A+ 为 4.3，与标准 4.0 产生区分', () => {
    expect(MODIFIED_43_LETTER_POINTS['A+']).toBe(4.3);
    expect(MODIFIED_43_LETTER_POINTS.A).toBe(4.0);
  });

  it('等级等效百分分落在各自分段中位', () => {
    expect(LETTER_PERCENT_EQUIVALENT.A).toBe(95);
    expect(LETTER_PERCENT_EQUIVALENT.B).toBe(85);
  });

  it('中国高校算法：字母等级先转等效百分再查分段表', () => {
    const letterCourse: CourseInput = { credits: 2, gradeType: 'letter', letter: 'A' };
    // A 等效 95 分，落在 90–100 分段 → 4.0
    expect(coursePoints(letterCourse, 'china')).toBe(4.0);
    const bCourse: CourseInput = { credits: 1, gradeType: 'letter', letter: 'B' };
    // B 等效 85 分，落在 85–89 分段 → 3.7
    expect(coursePoints(bCourse, 'china')).toBe(3.7);
  });

  it('未知等级抛出明确错误', () => {
    const bad: CourseInput = { credits: 2, gradeType: 'letter', letter: 'Z' };
    expect(() => coursePoints(bad, 'standard4')).toThrow(/未知等级/);
  });
});

describe('calculateGpa 验收用例', () => {
  it('验收 1：90 分 3 学分 + 80 分 2 学分，中国表加权 GPA = 3.6', () => {
    const courses: CourseInput[] = [
      { name: '高数', credits: 3, gradeType: 'percent', percent: 90 },
      { name: '英语', credits: 2, gradeType: 'percent', percent: 80 },
    ];
    const report = calculateGpa(courses);
    const china = report.algorithms.find((item) => item.algorithm === 'china');
    expect(china?.weightedGpa).toBeCloseTo(3.6, 5);
    expect(report.totalCredits).toBe(5);
  });

  it('验收 2：A 学分 4 + B 学分 1，标准 4.0 加权 GPA = 3.8', () => {
    const courses: CourseInput[] = [
      { name: '物理', credits: 4, gradeType: 'letter', letter: 'A' },
      { name: '化学', credits: 1, gradeType: 'letter', letter: 'B' },
    ];
    const report = calculateGpa(courses);
    const standard = report.algorithms.find((item) => item.algorithm === 'standard4');
    expect(standard?.weightedGpa).toBeCloseTo(3.8, 5);
  });

  it('验收 3：A+ 在标准 4.0 得 4.0、在改良 4.3 得 4.3，两算法结果不同', () => {
    const courses: CourseInput[] = [{ credits: 2, gradeType: 'letter', letter: 'A+' }];
    const report = calculateGpa(courses);
    const standard = report.algorithms.find((item) => item.algorithm === 'standard4');
    const modified = report.algorithms.find((item) => item.algorithm === 'modified43');
    expect(standard?.weightedGpa).toBeCloseTo(4.0, 5);
    expect(modified?.weightedGpa).toBeCloseTo(4.3, 5);
  });

  it('验收 4：正确输出总学分与算术平均分，百分制与等级混录可换算', () => {
    const courses: CourseInput[] = [
      { name: '课程一', credits: 3, gradeType: 'percent', percent: 90 },
      { name: '课程二', credits: 1, gradeType: 'letter', letter: 'B' },
    ];
    const report = calculateGpa(courses);
    expect(report.totalCredits).toBe(4);
    // (90*3 + 85*1) / 4 = 88.75
    expect(report.arithmeticAverage).toBeCloseTo(88.75, 2);
    const standard = report.algorithms.find((item) => item.algorithm === 'standard4');
    // (3.7*3 + 3.0*1) / 4 = 3.525
    expect(standard?.weightedGpa).toBeCloseTo(3.525, 3);
  });

  it('逐课程明细含名称、学分、原始成绩与绩点', () => {
    const report = calculateGpa([
      { credits: 2, gradeType: 'percent', percent: 85 },
      { credits: 1, gradeType: 'letter', letter: 'A-' },
    ]);
    const china = report.algorithms.find((item) => item.algorithm === 'china');
    expect(china?.courses).toHaveLength(2);
    const [first, second] = china?.courses ?? [];
    expect(first!.name).toBe('课程 1');
    expect(first!.rawGrade).toBe('85 分');
    expect(first!.points).toBe(3.7);
    // A- 等效 92 分，落在 90–100 分段 → 4.0
    expect(second!.points).toBe(4.0);
  });

  it('缺省课程名自动按序号命名', () => {
    const report = calculateGpa([{ credits: 1, gradeType: 'percent', percent: 70 }]);
    expect(report.algorithms[0]?.courses[0]?.name).toBe('课程 1');
  });

  it('equivalentPercent：百分制原样返回，等级查等效表', () => {
    expect(equivalentPercent({ credits: 1, gradeType: 'percent', percent: 88 })).toBe(88);
    expect(equivalentPercent({ credits: 1, gradeType: 'letter', letter: 'a' })).toBe(95);
  });
});

describe('calculateGpa 错误处理', () => {
  it('空课程列表提示先添加课程而非返回 NaN', () => {
    expect(() => calculateGpa([])).toThrow(/先添加/);
  });

  it('学分 ≤ 0 抛出明确错误', () => {
    expect(() =>
      calculateGpa([{ credits: 0, gradeType: 'percent', percent: 90 }]),
    ).toThrow(/学分必须为正数/);
    expect(() =>
      calculateGpa([{ credits: -2, gradeType: 'percent', percent: 90 }]),
    ).toThrow(/学分必须为正数/);
  });

  it('成绩越界（>100 或 <0）抛出明确错误', () => {
    expect(() =>
      calculateGpa([{ credits: 1, gradeType: 'percent', percent: 101 }]),
    ).toThrow(/0–100/);
    expect(() =>
      calculateGpa([{ credits: 1, gradeType: 'percent', percent: -1 }]),
    ).toThrow(/0–100/);
  });

  it('未知字母等级抛出明确错误', () => {
    expect(() =>
      calculateGpa([{ credits: 1, gradeType: 'letter', letter: 'P' }]),
    ).toThrow(/未知等级/);
  });

  it('错误信息定位到具体课程序号', () => {
    expect(() =>
      calculateGpa([
        { credits: 2, gradeType: 'percent', percent: 90 },
        { credits: 0, gradeType: 'percent', percent: 80 },
      ]),
    ).toThrow(/第 2 门课/);
  });
});

describe('算法元数据', () => {
  it('三套算法均有展示名称与说明', () => {
    expect(ALL_ALGORITHMS).toEqual(['standard4', 'modified43', 'china']);
    for (const algorithm of ALL_ALGORITHMS) {
      expect(ALGORITHM_META[algorithm].label.length).toBeGreaterThan(0);
      expect(ALGORITHM_META[algorithm].description.length).toBeGreaterThan(0);
    }
  });
});
