/**
 * Dijkstra 调度场（Shunting-yard）算法纯函数实现。
 *
 * 三段式：tokenize（词法分析）→ toRPN（中缀转后缀，逐步快照）→ evalRPN（值栈逐步求值）。
 * 不触碰 DOM / React，全部为确定性纯函数，便于固定向量单测。
 */

export type TokenType = 'number' | 'operator' | 'lparen' | 'rparen' | 'comma' | 'function' | 'constant';

export interface Token {
  type: TokenType;
  /** 原文拼写，数字保留原始字面量（如 3.14），一元负号为 'u-' */
  value: string;
  /** 0 基字符偏移 */
  pos: number;
  /** 数字 token 的数值；常量在 tokenize 阶段已内联为 number */
  numericValue?: number;
  /** 函数参数个数（仅 function token，toRPN 收尾时回填，变长函数按实际调用计数） */
  argCount?: number;
}

export interface RpnStep {
  /** 第几步，从 1 开始 */
  index: number;
  /** 当前读入的 token 原文 */
  token: string;
  /** 决策原因，面向教学展示 */
  action: string;
  /** 本步结束后运算符栈（栈顶在数组末尾） */
  operatorStack: string[];
  /** 本步结束后输出队列（RPN） */
  output: string[];
}

export interface RpnResult {
  tokens: Token[];
  steps: RpnStep[];
  /** 字符串形式 RPN */
  rpn: string[];
  /** 带类型的输出 token，求值器直接消费，避免二次解析 */
  outputTokens: Token[];
}

export interface EvalStep {
  index: number;
  token: string;
  action: string;
  /** 本步结束后的值栈（栈顶在数组末尾） */
  valueStack: number[];
}

export interface EvalResult {
  steps: EvalStep[];
  result: number;
}

/** 带定位的算法错误，UI 可直接展示出错位置。 */
export class ShuntingYardError extends Error {
  pos: number;
  partialSteps: RpnStep[] | EvalStep[];

  constructor(message: string, pos: number, partialSteps: RpnStep[] | EvalStep[] = []) {
    super(message);
    this.name = 'ShuntingYardError';
    this.pos = pos;
    this.partialSteps = partialSteps;
  }
}

interface OperatorDef {
  precedence: number;
  rightAssociative: boolean;
  label: string;
}

/** 运算符表：加减优先级 1 左结合，乘除优先级 2 左结合，u- 优先级 3 右结合，^ 优先级 4 右结合。 */
const OPERATORS: Record<string, OperatorDef> = {
  '+': { precedence: 1, rightAssociative: false, label: '加法' },
  '-': { precedence: 1, rightAssociative: false, label: '减法' },
  '*': { precedence: 2, rightAssociative: false, label: '乘法' },
  '/': { precedence: 2, rightAssociative: false, label: '除法' },
  'u-': { precedence: 3, rightAssociative: true, label: '一元负号' },
  '^': { precedence: 4, rightAssociative: true, label: '幂运算' },
};

/** 内置常量，tokenize 阶段直接内联为数字 token。 */
const CONSTANTS: Record<string, number> = {
  pi: Math.PI,
  e: Math.E,
};

/** 固定参数个数的函数；max/min 为变长（argCount 标记为 -1）。 */
const FUNCTIONS: Record<string, { argCount: number; label: string }> = {
  sin: { argCount: 1, label: '正弦' },
  cos: { argCount: 1, label: '余弦' },
  sqrt: { argCount: 1, label: '平方根' },
  abs: { argCount: 1, label: '绝对值' },
  max: { argCount: -1, label: '最大值' },
  min: { argCount: -1, label: '最小值' },
};

const IDENT_RE = /[a-zA-Z]/;
const NUMBER_CHAR_RE = /[0-9.]/;
const IDENT_CHAR_RE = /[a-zA-Z0-9_]/;

/**
 * 词法分析：识别浮点数字面量、运算符、括号、逗号与标识符（函数/常量）。
 * '-' 在表达式起始、左括号/逗号/运算符之后识别为一元负号 'u-'。
 */
export function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  const text = input;
  let i = 0;

  const prevType = (): TokenType | null => {
    const last = tokens[tokens.length - 1];
    return last ? last.type : null;
  };

  while (i < text.length) {
    const ch = text[i] ?? '';

    if (ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r') {
      i += 1;
      continue;
    }

    // 数字字面量（含小数）
    if (NUMBER_CHAR_RE.test(ch)) {
      const start = i;
      let dotCount = 0;
      while (i < text.length && NUMBER_CHAR_RE.test(text[i] ?? '')) {
        if (text[i] === '.') dotCount += 1;
        i += 1;
      }
      const literal = text.slice(start, i);
      if (dotCount > 1 || literal === '.') {
        throw new ShuntingYardError(`非法数字字面量「${literal}」`, start);
      }
      const value = Number(literal);
      if (Number.isNaN(value)) {
        throw new ShuntingYardError(`非法数字字面量「${literal}」`, start);
      }
      tokens.push({ type: 'number', value: literal, pos: start, numericValue: value });
      continue;
    }

    // 标识符：函数或常量
    if (IDENT_RE.test(ch)) {
      const start = i;
      while (i < text.length && IDENT_CHAR_RE.test(text[i] ?? '')) {
        i += 1;
      }
      const name = text.slice(start, i);
      if (name in CONSTANTS) {
        tokens.push({ type: 'number', value: name, pos: start, numericValue: CONSTANTS[name] });
      } else if (name in FUNCTIONS) {
        tokens.push({ type: 'function', value: name, pos: start });
      } else {
        throw new ShuntingYardError(
          `未知标识符「${name}」（仅支持 ${Object.keys(FUNCTIONS).join('/')} 函数与 pi/e 常量）`,
          start,
        );
      }
      continue;
    }

    if (ch === '(') {
      tokens.push({ type: 'lparen', value: '(', pos: i });
      i += 1;
      continue;
    }
    if (ch === ')') {
      tokens.push({ type: 'rparen', value: ')', pos: i });
      i += 1;
      continue;
    }
    if (ch === ',') {
      tokens.push({ type: 'comma', value: ',', pos: i });
      i += 1;
      continue;
    }

    if (ch === '+' || ch === '-' || ch === '*' || ch === '/' || ch === '^') {
      if (ch === '-') {
        const last = prevType();
        const isUnary = last === null || last === 'operator' || last === 'lparen' || last === 'comma';
        if (isUnary) {
          tokens.push({ type: 'operator', value: 'u-', pos: i });
          i += 1;
          continue;
        }
      }
      tokens.push({ type: 'operator', value: ch, pos: i });
      i += 1;
      continue;
    }

    throw new ShuntingYardError(`非法字符「${ch}」`, i);
  }

  return tokens;
}

/**
 * 调度场：中缀表达式 → 后缀（RPN），逐 token 产出栈/队列快照与决策原因。
 * 错误抛出 ShuntingYardError（携带已产生的 partialSteps）。
 */
export function toRPN(input: string): RpnResult {
  const tokens = tokenize(input);
  const output: Token[] = [];
  const stack: Token[] = [];
  const steps: RpnStep[] = [];
  /** 与 stack 中 lparen 平行：标记该左括号是否属于函数调用。 */
  const parenIsFunction: boolean[] = [];
  /** 与 parenIsFunction 平行：当前函数已遇到的逗号数。 */
  const functionCommaCounts: number[] = [];

  const snapshot = (token: string, action: string) => {
    steps.push({
      index: steps.length + 1,
      token,
      action,
      operatorStack: stack.map((t) => t.value),
      output: output.map((t) => t.value),
    });
  };

  if (tokens.length === 0) {
    throw new ShuntingYardError('表达式为空', 0);
  }

  for (const token of tokens) {
    if (token.type === 'number') {
      output.push(token);
      snapshot(token.value, `读入操作数 ${token.value}，直接进入输出队列`);
      continue;
    }

    if (token.type === 'function') {
      stack.push(token);
      snapshot(token.value, `函数 ${token.value} 压入运算符栈`);
      continue;
    }

    if (token.type === 'operator') {
      const incoming = OPERATORS[token.value];
      if (!incoming) throw new ShuntingYardError(`不支持的运算符「${token.value}」`, token.pos, steps);
      // 因优先级或结合性弹出栈顶运算符；函数 token 不被运算符规则弹出（由右括号或逗号处理）
      while (stack.length > 0 && stack[stack.length - 1]?.type === 'operator') {
        const top = stack[stack.length - 1];
        if (!top) break;
        const topDef = OPERATORS[top.value];
        if (!topDef) break;
        const shouldPop = incoming.rightAssociative
          ? topDef.precedence > incoming.precedence
          : topDef.precedence >= incoming.precedence;
        if (!shouldPop) break;
        stack.pop();
        output.push(top);
        snapshot(token.value, `栈顶 ${top.value}（优先级 ${topDef.precedence}）满足弹出条件，弹入输出队列`);
      }
      stack.push(token);
      snapshot(token.value, `${incoming.label} ${token.value}（优先级 ${incoming.precedence}）压入运算符栈`);
      continue;
    }

    if (token.type === 'lparen') {
      // 若栈顶是函数，则该左括号属于函数调用
      const belongsToFunction = stack.length > 0 && stack[stack.length - 1]?.type === 'function';
      parenIsFunction.push(belongsToFunction);
      functionCommaCounts.push(0);
      stack.push(token);
      snapshot('(', belongsToFunction ? '函数调用的左括号压入运算符栈' : '左括号压入运算符栈');
      continue;
    }

    if (token.type === 'comma') {
      if (!parenIsFunction.some(Boolean)) {
        throw new ShuntingYardError('逗号只能出现在函数参数列表中', token.pos, steps);
      }
      while (stack.length > 0 && stack[stack.length - 1]?.type !== 'lparen') {
        const top = stack.pop();
        if (top) {
          output.push(top);
          snapshot(',', `逗号：弹出栈顶运算符 ${top.value} 到输出队列`);
        }
      }
      if (stack.length === 0) {
        throw new ShuntingYardError('逗号缺少匹配的左括号', token.pos, steps);
      }
      for (let p = parenIsFunction.length - 1; p >= 0; p -= 1) {
        if (parenIsFunction[p]) {
          functionCommaCounts[p] = (functionCommaCounts[p] ?? 0) + 1;
          break;
        }
      }
      snapshot(',', '逗号：参数分隔完成，运算符栈保持到左括号为止');
      continue;
    }

    if (token.type === 'rparen') {
      while (stack.length > 0 && stack[stack.length - 1]?.type !== 'lparen') {
        const top = stack.pop();
        if (top) {
          output.push(top);
          snapshot(')', `右括号：弹出栈顶运算符 ${top.value} 到输出队列`);
        }
      }
      if (stack.length === 0) {
        throw new ShuntingYardError('右括号缺少匹配的左括号', token.pos, steps);
      }
      stack.pop(); // 弹出左括号
      const wasFunction = parenIsFunction.pop() ?? false;
      const commaCount = functionCommaCounts.pop() ?? 0;
      if (wasFunction) {
        const fn = stack[stack.length - 1];
        if (fn && fn.type === 'function') {
          // n 个逗号对应 n+1 个参数；空参（如 max()）在求值期拦截
          fn.argCount = commaCount + 1;
          stack.pop();
          output.push(fn);
          snapshot(')', `右括号匹配函数调用，函数 ${fn.value}（${fn.argCount} 个参数）弹入输出队列`);
        }
      } else {
        snapshot(')', '右括号匹配普通左括号，括号组处理完成');
      }
      continue;
    }
  }

  // 收尾：弹出栈内剩余 token；残留左括号即括号不匹配
  while (stack.length > 0) {
    const top = stack.pop();
    if (!top) break;
    if (top.type === 'lparen') {
      throw new ShuntingYardError('左括号缺少匹配的右括号', top.pos, steps);
    }
    output.push(top);
    snapshot('∎', `输入结束：弹出栈顶 ${top.value} 到输出队列`);
  }

  // RPN 合法性校验：用模拟值栈检测操作数缺失（如尾随运算符 1 +）
  let arity = 0;
  for (const t of output) {
    if (t.type === 'number') {
      arity += 1;
    } else if (t.type === 'operator') {
      arity += t.value === 'u-' ? 0 : -1;
      if (arity < 1) {
        throw new ShuntingYardError(`表达式不完整：运算符 ${t.value} 缺少足够的操作数`, t.pos, steps);
      }
    } else if (t.type === 'function') {
      const argc = t.argCount ?? 1;
      arity -= argc - 1;
      if (arity < 1) {
        throw new ShuntingYardError(`表达式不完整：函数 ${t.value} 参数不足`, t.pos, steps);
      }
    }
  }
  if (arity !== 1) {
    throw new ShuntingYardError('表达式不完整：无法归约为单个值', 0, steps);
  }

  return { tokens, steps, rpn: output.map((t) => t.value), outputTokens: output };
}

/** 浮点展示辅助：消除二进制浮点误差尾巴（如 0.1 + 0.2），最多保留 12 位有效小数。 */
export function formatNumber(n: number): string {
  if (!Number.isFinite(n)) return String(n);
  const rounded = Number.parseFloat(n.toPrecision(12));
  return String(rounded);
}

/**
 * 对 RPN 执行值栈逐步求值，每步产出值栈快照与决策说明。
 */
export function evalRPN(rpnResult: RpnResult): EvalResult {
  const valueStack: number[] = [];
  const steps: EvalStep[] = [];

  const snapshot = (token: string, action: string) => {
    steps.push({
      index: steps.length + 1,
      token,
      action,
      valueStack: [...valueStack],
    });
  };

  for (const token of rpnResult.outputTokens) {
    if (token.type === 'number') {
      const v = token.numericValue ?? Number(token.value);
      valueStack.push(v);
      snapshot(token.value, `操作数 ${formatNumber(v)} 压入值栈`);
      continue;
    }

    if (token.type === 'function') {
      const def = FUNCTIONS[token.value];
      if (!def) throw new ShuntingYardError(`未知函数「${token.value}」`, token.pos, steps);
      const argc = token.argCount ?? def.argCount;
      if (argc <= 0 || valueStack.length < argc) {
        throw new ShuntingYardError(`函数 ${token.value} 参数个数错误或参数不足`, token.pos, steps);
      }
      if (def.argCount !== -1 && argc !== def.argCount) {
        throw new ShuntingYardError(`函数 ${token.value} 参数个数错误：期望 ${def.argCount} 个，实际 ${argc} 个`, token.pos, steps);
      }
      const args = valueStack.splice(valueStack.length - argc, argc);
      const result = applyFunction(token.value, args, token.pos, steps);
      valueStack.push(result);
      snapshot(token.value, `弹出 ${argc} 个参数应用${def.label}，结果 ${formatNumber(result)} 压回值栈`);
      continue;
    }

    if (token.type === 'operator') {
      if (token.value === 'u-') {
        const operand = valueStack.pop();
        if (operand === undefined) throw new ShuntingYardError('一元负号缺少操作数', token.pos, steps);
        const result = -operand;
        valueStack.push(result);
        snapshot('u-', `弹出栈顶 ${formatNumber(operand)} 取负，结果 ${formatNumber(result)} 压回值栈`);
        continue;
      }
      const right = valueStack.pop();
      const left = valueStack.pop();
      if (right === undefined || left === undefined) {
        throw new ShuntingYardError(`运算符 ${token.value} 缺少操作数`, token.pos, steps);
      }
      const result = applyBinary(token.value, left, right, steps, token.pos);
      valueStack.push(result);
      snapshot(
        token.value,
        `弹出 ${formatNumber(right)} 与 ${formatNumber(left)} 执行${OPERATORS[token.value]?.label ?? token.value}，结果 ${formatNumber(result)} 压回值栈`,
      );
      continue;
    }

    throw new ShuntingYardError(`RPN 中出现意外 token「${token.value}」`, token.pos, steps);
  }

  if (valueStack.length !== 1) {
    throw new ShuntingYardError('表达式不完整：求值结束后值栈剩余多个值', 0, steps);
  }

  return { steps, result: valueStack[0] ?? 0 };
}

function applyBinary(op: string, left: number, right: number, steps: EvalStep[], pos: number): number {
  switch (op) {
    case '+':
      return left + right;
    case '-':
      return left - right;
    case '*':
      return left * right;
    case '/':
      if (right === 0) throw new ShuntingYardError('除零错误：除数为 0', pos, steps);
      return left / right;
    case '^':
      return Math.pow(left, right);
    default:
      throw new ShuntingYardError(`不支持的运算符「${op}」`, pos, steps);
  }
}

function applyFunction(name: string, args: number[], pos: number, steps: EvalStep[]): number {
  switch (name) {
    case 'sin':
      return Math.sin(args[0] ?? 0);
    case 'cos':
      return Math.cos(args[0] ?? 0);
    case 'sqrt': {
      const v = args[0] ?? 0;
      if (v < 0) throw new ShuntingYardError('sqrt 不能对负数取实平方根', pos, steps);
      return Math.sqrt(v);
    }
    case 'abs':
      return Math.abs(args[0] ?? 0);
    case 'max':
      return Math.max(...args);
    case 'min':
      return Math.min(...args);
    default:
      throw new ShuntingYardError(`未知函数「${name}」`, pos, steps);
  }
}

/** 一次性便捷入口：表达式 → RPN 字符串与数值结果（UI 与外部消费用）。 */
export function evaluateExpression(input: string): {
  rpn: string[];
  rpnText: string;
  result: number;
  rpnSteps: RpnStep[];
  evalSteps: EvalStep[];
} {
  const rpnResult = toRPN(input);
  const evalResult = evalRPN(rpnResult);
  return {
    rpn: rpnResult.rpn,
    rpnText: rpnResult.rpn.join(' '),
    result: evalResult.result,
    rpnSteps: rpnResult.steps,
    evalSteps: evalResult.steps,
  };
}
