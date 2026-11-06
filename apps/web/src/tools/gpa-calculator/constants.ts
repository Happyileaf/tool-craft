import type { CourseInput } from './utils/gpa';

/**
 * 示例成绩单（一键填充）
 */
export const SAMPLE_COURSES: readonly CourseInput[] = [
  { name: '高等数学', grade: 92, credits: 4 },
  { name: '大学英语', grade: 85, credits: 3 },
  { name: '程序设计', grade: 'A', credits: 3 },
  { name: '体育', grade: 76, credits: 1 },
];

/**
 * 等级输入候选
 */
export const LETTER_OPTIONS = [
  'A+',
  'A',
  'A-',
  'B+',
  'B',
  'B-',
  'C+',
  'C',
  'C-',
  'D+',
  'D',
  'D-',
  'F',
] as const;

/**
 * 加权 GPA 展示保留小数位
 */
export const GPA_PRECISION = 4;

/**
 * 百分制平均分保留小数位
 */
export const AVERAGE_PRECISION = 2;
