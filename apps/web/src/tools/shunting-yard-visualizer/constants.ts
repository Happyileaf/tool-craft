/** 预置示例表达式，覆盖优先级、括号、一元负号、右结合幂与函数。 */
export interface SampleExpression {
  label: string;
  expression: string;
  hint: string;
}

export const SAMPLE_EXPRESSIONS: SampleExpression[] = [
  {
    label: '优先级与括号',
    expression: '3 + 4 * 2 / ( 1 - 5 ) ^ 2',
    hint: '固定教学向量，RPN 为 3 4 2 * 1 5 - 2 ^ / +，结果 3.5',
  },
  {
    label: '一元负号',
    expression: '-2 + 3',
    hint: "表达式起始的 '-' 识别为一元负号 u-",
  },
  {
    label: '右结合幂',
    expression: '2 ^ 3 ^ 2',
    hint: '^ 右结合，等价于 2 ^ (3 ^ 2) = 512',
  },
  {
    label: '函数与常量',
    expression: 'max(1, 3, sqrt(16)) + sin(0) * pi',
    hint: '变长函数 max、嵌套 sqrt，以及常量 pi',
  },
  {
    label: '错误示例（除零）',
    expression: '1 / 0',
    hint: '求值期在对应步骤抛出除零错误',
  },
];

export const DEFAULT_EXPRESSION = SAMPLE_EXPRESSIONS[0]?.expression ?? '';

export type PhaseKey = 'rpn' | 'eval';

export const PHASE_OPTIONS: Array<{ value: PhaseKey; label: string }> = [
  { value: 'rpn', label: '① 调度场转 RPN' },
  { value: 'eval', label: '② RPN 逐步求值' },
];

/** 运算符速查表，用于页内说明。 */
export const OPERATOR_TABLE: Array<{ symbol: string; precedence: number; associativity: string; note: string }> = [
  { symbol: '+ -', precedence: 1, associativity: '左结合', note: '加减' },
  { symbol: '* /', precedence: 2, associativity: '左结合', note: '乘除' },
  { symbol: 'u-', precedence: 3, associativity: '右结合', note: '一元负号' },
  { symbol: '^', precedence: 4, associativity: '右结合', note: '幂运算 Math.pow' },
];
