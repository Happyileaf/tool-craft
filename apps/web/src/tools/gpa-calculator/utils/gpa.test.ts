import { describe, expect, it } from 'vitest';
import {
  GpaError,
  SCALE_ORDER,
  calculateTranscript,
  evaluateCourse,
  normalizeLetter,
  type CourseInput,
} from './gpa';

describe('normalizeLetter', () => {
  it('大小写与空格归一化', () => {
    expect(normalizeLetter(' a+ ')).toBe('A+');
    expect(normalizeLetter('b')).toBe('B');
    expect(normalizeLetter('F')).toBe('F');
  });

  it('未知等级报错', () => {
    expect(() => normalizeLetter('Z')).toThrowError(GpaError);
    expect(() => normalizeLetter('A++')).toThrow('无法识别');
  });
});

describe('evaluateCourse - 百分制分段', () => {
  it('90/80/70 在标准 4.0 口径分别为 4.0 / 3.0 / 2.0', () => {
    expect(evaluateCourse({ grade: 90, credits: 3 }, 0).points['standard-4.0']).toBe(4.0);
    expect(evaluateCourse({ grade: 80, credits: 2 }, 1).points['standard-4.0']).toBe(3.0);
    expect(evaluateCourse({ grade: 70, credits: 1 }, 2).points['standard-4.0']).toBe(2.0);
  });

  it('WES 粗分段：85+ 为 4.0、75+ 为 3.0、60+ 为 2.0', () => {
    expect(evaluateCourse({ grade: 90, credits: 1 }, 0).points.wes).toBe(4.0);
    expect(evaluateCourse({ grade: 84, credits: 1 }, 0).points.wes).toBe(3.0);
    expect(evaluateCourse({ grade: 75, credits: 1 }, 0).points.wes).toBe(3.0);
    expect(evaluateCourse({ grade: 60, credits: 1 }, 0).points.wes).toBe(2.0);
    expect(evaluateCourse({ grade: 59, credits: 1 }, 0).points.wes).toBe(0);
  });

  it('中国口径 85-89 = 3.7、60 = 1.0、不及格 = 0', () => {
    expect(evaluateCourse({ grade: 87, credits: 1 }, 0).points['china-100']).toBe(3.7);
    expect(evaluateCourse({ grade: 60, credits: 1 }, 0).points['china-100']).toBe(1.0);
    expect(evaluateCourse({ grade: 59, credits: 1 }, 0).points['china-100']).toBe(0);
  });

  it('改良 4.3：95+ 封顶 4.3，90-94 为 4.0', () => {
    expect(evaluateCourse({ grade: 96, credits: 1 }, 0).points['modified-4.3']).toBe(4.3);
    expect(evaluateCourse({ grade: 92, credits: 1 }, 0).points['modified-4.3']).toBe(4.0);
  });

  it('超出 0–100 的分数挂载行级错误', () => {
    expect(evaluateCourse({ grade: 101, credits: 2 }, 0).error).toContain('百分制成绩非法');
    expect(evaluateCourse({ grade: -1, credits: 2 }, 0).error).toContain('第 1 行');
  });

  it('学分为 0 / 负数 / 非数字挂载行级错误', () => {
    expect(evaluateCourse({ grade: 90, credits: 0 }, 0).error).toContain('学分非法');
    expect(evaluateCourse({ grade: 90, credits: -2 }, 0).error).toContain('学分非法');
    expect(
      evaluateCourse({ grade: 90, credits: Number.NaN }, 0).error,
    ).toContain('学分非法');
  });
});

describe('evaluateCourse - 等级成绩', () => {
  it('A+/A/B 在标准 4.0 口径为 4.0 / 4.0 / 3.0', () => {
    expect(evaluateCourse({ grade: 'A+', credits: 1 }, 0).points['standard-4.0']).toBe(4.0);
    expect(evaluateCourse({ grade: 'A', credits: 1 }, 0).points['standard-4.0']).toBe(4.0);
    expect(evaluateCourse({ grade: 'B', credits: 1 }, 0).points['standard-4.0']).toBe(3.0);
  });

  it('A+/A/B 在改良 4.3 口径为 4.3 / 4.0 / 3.0', () => {
    expect(evaluateCourse({ grade: 'A+', credits: 1 }, 0).points['modified-4.3']).toBe(4.3);
    expect(evaluateCourse({ grade: 'A', credits: 1 }, 0).points['modified-4.3']).toBe(4.0);
    expect(evaluateCourse({ grade: 'B', credits: 1 }, 0).points['modified-4.3']).toBe(3.0);
  });

  it('等级先转中位段再走 WES / 中国口径（链路透明）', () => {
    const aMinus = evaluateCourse({ grade: 'A-', credits: 1 }, 0);
    expect(aMinus.isLetter).toBe(true);
    expect(aMinus.percentage).toBe(89);
    expect(aMinus.points.wes).toBe(4.0);
    expect(aMinus.points['china-100']).toBe(3.7);
  });

  it('F 绩点为 0', () => {
    const f = evaluateCourse({ grade: 'F', credits: 2 }, 0);
    for (const scaleId of SCALE_ORDER) {
      expect(f.points[scaleId]).toBe(0);
    }
  });
});

describe('calculateTranscript - 固定成绩单手算向量', () => {
  const transcript: CourseInput[] = [
    { name: '高数', grade: 90, credits: 3 },
    { name: '英语', grade: 80, credits: 2 },
    { name: '体育', grade: 70, credits: 1 },
  ];

  it('总学分 6、课程数 3、算术平均分 80', () => {
    const { summary } = calculateTranscript(transcript);
    expect(summary.totalCredits).toBeCloseTo(6, 10);
    expect(summary.courseCount).toBe(3);
    expect(summary.arithmeticAverage).toBeCloseTo(80, 10);
  });

  it('标准 4.0 加权 GPA = (4×3 + 3×2 + 2×1)/6 = 20/6', () => {
    const { summary } = calculateTranscript(transcript);
    expect(summary.scales['standard-4.0'].weightedGpa).toBeCloseTo(20 / 6, 10);
  });

  it('WES 加权 GPA = (4×3 + 3×2 + 2×1)/6 = 20/6', () => {
    const { summary } = calculateTranscript(transcript);
    expect(summary.scales.wes.weightedGpa).toBeCloseTo(20 / 6, 10);
  });

  it('中国口径与标准 4.0 该向量同结果 20/6', () => {
    const { summary } = calculateTranscript(transcript);
    expect(summary.scales['china-100'].weightedGpa).toBeCloseTo(20 / 6, 10);
  });

  it('改良 4.3 加权 GPA = (4×3 + 3×2 + 2×1)/6 = 20/6（无 95+ 课程）', () => {
    const { summary } = calculateTranscript(transcript);
    expect(summary.scales['modified-4.3'].weightedGpa).toBeCloseTo(20 / 6, 10);
  });

  it('含 96 分课程时改良 4.3 高于标准 4.0', () => {
    const data: CourseInput[] = [
      { grade: 96, credits: 3 },
      { grade: 80, credits: 1 },
    ];
    const { summary } = calculateTranscript(data);
    // 改良：(4.3×3 + 3×1)/4 = 15.9/4；标准：(4×3 + 3×1)/4 = 15/4
    expect(summary.scales['modified-4.3'].weightedGpa).toBeCloseTo(15.9 / 4, 10);
    expect(summary.scales['standard-4.0'].weightedGpa).toBeCloseTo(15 / 4, 10);
  });
});

describe('calculateTranscript - 不及格与错误路径', () => {
  it('不及格课程绩点 0 但学分仍计入分母', () => {
    const { summary, rows } = calculateTranscript([
      { grade: 90, credits: 3 },
      { grade: 50, credits: 1 },
    ]);
    expect(rows).toHaveLength(2);
    expect(rows[1]!.points['standard-4.0']).toBe(0);
    // (4×3 + 0×1) / 4 = 3
    expect(summary.scales['standard-4.0'].weightedGpa).toBeCloseTo(3, 10);
    expect(summary.totalCredits).toBeCloseTo(4, 10);
  });

  it('F 等级同理：0 绩点计学分', () => {
    const { summary } = calculateTranscript([
      { grade: 'A', credits: 2 },
      { grade: 'F', credits: 2 },
    ]);
    // (4×2 + 0×2) / 4 = 2
    expect(summary.scales['standard-4.0'].weightedGpa).toBeCloseTo(2, 10);
  });

  it('任一行非法时整体抛错且带行号', () => {
    expect(() =>
      calculateTranscript([
        { grade: 90, credits: 2 },
        { grade: 120, credits: 1 },
      ]),
    ).toThrow('第 2 行');
  });

  it('未知等级整体抛错', () => {
    expect(() =>
      calculateTranscript([{ grade: 'X', credits: 1 }]),
    ).toThrowError(GpaError);
  });

  it('空成绩单抛错', () => {
    expect(() => calculateTranscript([])).toThrow('至少添加一门课程');
  });
});
