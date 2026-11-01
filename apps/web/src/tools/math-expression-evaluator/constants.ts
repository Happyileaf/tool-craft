/**
 * 数学表达式求值器工具内常量
 */

/**
 * 默认样例：变量赋值 + 圆面积 + 复合表达式
 */
export const DEFAULT_SAMPLE = `# 以 # 或 // 开头的是注释，空行会被忽略
r = 5
area = pi * r^2
sqrt(area) + 2 * r`;

/**
 * 示例二：括号、阶乘、幂与取模
 */
export const ARITHMETIC_SAMPLE = `(1 + 2) * (3 + 4)
5!
2^10
10! % 7`;

/**
 * 示例三：三角函数（弧度）
 */
export const TRIG_SAMPLE = `sin(pi / 2)
cos(pi) + 1
atan2(1, 1) * 4`;

/**
 * 示例按钮配置，顺序即按钮排列顺序
 */
export const SAMPLE_OPTIONS: Array<{ label: string; value: string }> = [
  { label: '变量与圆面积', value: DEFAULT_SAMPLE },
  { label: '括号 / 阶乘 / 幂', value: ARITHMETIC_SAMPLE },
  { label: '三角函数（弧度）', value: TRIG_SAMPLE },
];
