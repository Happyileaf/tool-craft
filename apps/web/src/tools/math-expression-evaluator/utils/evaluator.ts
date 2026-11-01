/**
 * 数学表达式求值器：词法分析 + 递归下降语法分析 + 语法树求值。
 * 纯函数实现，不依赖 DOM / React，可直接在 Node 测试环境运行。
 *
 * 支持四则运算、取模、幂运算（右结合）、阶乘、括号嵌套、
 * 常用数学函数、pi / e / tau 常量以及多行变量赋值复用。
 */

/** 求值器选项 */
export interface EvaluateOptions {
  /** 三角函数是否以角度为单位（默认弧度） */
  degrees?: boolean;
  /** 预置变量上下文 */
  context?: Record<string, number>;
}

/** 单条逐步计算记录 */
export interface EvaluateStep {
  /** 是否为行标题（true 表示新起一行表达式） */
  heading: boolean;
  /** 展示文本 */
  text: string;
}

/** 求值结果 */
export interface EvaluateResult {
  /** 最后一条有效语句的求值结果 */
  value: number;
  /** 逐步计算过程 */
  steps: EvaluateStep[];
  /** 求值结束后用户定义的全部变量 */
  variables: Record<string, number>;
}

interface Token {
  type: 'num' | 'ident' | 'op' | 'lparen' | 'rparen' | 'comma';
  value: string;
  pos: number;
}

type BinOp = '+' | '-' | '*' | '/' | '%' | '^';

type AstNode =
  | { kind: 'num'; value: number }
  | { kind: 'ref'; name: string }
  | { kind: 'unary'; op: '+' | '-'; operand: AstNode }
  | { kind: 'binary'; op: BinOp; left: AstNode; right: AstNode }
  | { kind: 'call'; name: string; args: AstNode[] }
  | { kind: 'fact'; operand: AstNode };

interface FnDef {
  minArgs: number;
  maxArgs: number;
  impl: (args: number[], degrees: boolean) => number;
}

/** 内置常量（名称按小写匹配） */
const CONSTANTS: Record<string, number> = {
  pi: Math.PI,
  e: Math.E,
  tau: Math.PI * 2,
};

const toRadians = (deg: number): number => (deg * Math.PI) / 180;
const toDegrees = (rad: number): number => (rad * 180) / Math.PI;

const requirePositive = (n: number, label: string): number => {
  if (n <= 0) {
    throw new Error(`${label} 的参数必须大于 0，收到 ${formatNumber(n)}`);
  }
  return n;
};

/** 内置函数表（名称按小写匹配），参数个数由调用方校验 */
const FUNCTIONS: Record<string, FnDef> = {
  sin: { minArgs: 1, maxArgs: 1, impl: (a, d) => Math.sin(d ? toRadians(a[0]!) : a[0]!) },
  cos: { minArgs: 1, maxArgs: 1, impl: (a, d) => Math.cos(d ? toRadians(a[0]!) : a[0]!) },
  tan: { minArgs: 1, maxArgs: 1, impl: (a, d) => Math.tan(d ? toRadians(a[0]!) : a[0]!) },
  asin: {
    minArgs: 1,
    maxArgs: 1,
    impl: (a, d) => {
      const x = a[0]!;
      if (x < -1 || x > 1) {
        throw new Error(`asin 的参数必须在 [-1, 1] 区间内，收到 ${formatNumber(x)}`);
      }
      return d ? toDegrees(Math.asin(x)) : Math.asin(x);
    },
  },
  acos: {
    minArgs: 1,
    maxArgs: 1,
    impl: (a, d) => {
      const x = a[0]!;
      if (x < -1 || x > 1) {
        throw new Error(`acos 的参数必须在 [-1, 1] 区间内，收到 ${formatNumber(x)}`);
      }
      return d ? toDegrees(Math.acos(x)) : Math.acos(x);
    },
  },
  atan: { minArgs: 1, maxArgs: 1, impl: (a, d) => (d ? toDegrees(Math.atan(a[0]!)) : Math.atan(a[0]!)) },
  atan2: {
    minArgs: 2,
    maxArgs: 2,
    impl: (a, d) =>
      d ? toDegrees(Math.atan2(a[0]!, a[1]!)) : Math.atan2(a[0]!, a[1]!),
  },
  sinh: { minArgs: 1, maxArgs: 1, impl: (a) => Math.sinh(a[0]!) },
  cosh: { minArgs: 1, maxArgs: 1, impl: (a) => Math.cosh(a[0]!) },
  tanh: { minArgs: 1, maxArgs: 1, impl: (a) => Math.tanh(a[0]!) },
  sqrt: {
    minArgs: 1,
    maxArgs: 1,
    impl: (a) => {
      const x = a[0]!;
      if (x < 0) {
        throw new Error(`sqrt 不支持负数参数，收到 ${formatNumber(x)}`);
      }
      return Math.sqrt(x);
    },
  },
  cbrt: { minArgs: 1, maxArgs: 1, impl: (a) => Math.cbrt(a[0]!) },
  abs: { minArgs: 1, maxArgs: 1, impl: (a) => Math.abs(a[0]!) },
  floor: { minArgs: 1, maxArgs: 1, impl: (a) => Math.floor(a[0]!) },
  ceil: { minArgs: 1, maxArgs: 1, impl: (a) => Math.ceil(a[0]!) },
  round: { minArgs: 1, maxArgs: 1, impl: (a) => Math.round(a[0]!) },
  exp: { minArgs: 1, maxArgs: 1, impl: (a) => Math.exp(a[0]!) },
  log: { minArgs: 1, maxArgs: 1, impl: (a) => Math.log(requirePositive(a[0]!, 'log（自然对数）')) },
  ln: { minArgs: 1, maxArgs: 1, impl: (a) => Math.log(requirePositive(a[0]!, 'ln')) },
  log10: { minArgs: 1, maxArgs: 1, impl: (a) => Math.log10(requirePositive(a[0]!, 'log10')) },
  log2: { minArgs: 1, maxArgs: 1, impl: (a) => Math.log2(requirePositive(a[0]!, 'log2')) },
  pow: { minArgs: 2, maxArgs: 2, impl: (a) => Math.pow(a[0]!, a[1]!) },
  min: { minArgs: 1, maxArgs: Number.MAX_SAFE_INTEGER, impl: (a) => Math.min(...a) },
  max: { minArgs: 1, maxArgs: Number.MAX_SAFE_INTEGER, impl: (a) => Math.max(...a) },
};

/**
 * 数字展示格式化：整数原样输出，浮点保留 12 位有效数字并消除尾零
 *
 * @param n - 待格式化数字
 * @returns 展示文本
 */
export function formatNumber(n: number): string {
  if (Number.isNaN(n)) {
    return 'NaN';
  }
  if (!Number.isFinite(n)) {
    return n > 0 ? 'Infinity' : '-Infinity';
  }
  const normalized = Object.is(n, -0) ? 0 : n;
  if (Number.isInteger(normalized) && Math.abs(normalized) <= 1e15) {
    return String(normalized);
  }
  return String(parseFloat(normalized.toPrecision(12)));
}

/**
 * 对单行文本做词法分析
 *
 * @param line - 单行表达式
 * @returns token 序列
 */
function tokenize(line: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  while (i < line.length) {
    const ch = line[i]!;
    if (/\s/.test(ch)) {
      i += 1;
      continue;
    }
    if (/[0-9.]/.test(ch)) {
      const start = i;
      while (i < line.length && /[0-9.]/.test(line[i]!)) {
        i += 1;
      }
      if (i < line.length && /[eE]/.test(line[i]!)) {
        const expStart = i;
        i += 1;
        if (line[i] === '+' || line[i] === '-') {
          i += 1;
        }
        const digitStart = i;
        while (i < line.length && /[0-9]/.test(line[i]!)) {
          i += 1;
        }
        if (i === digitStart) {
          throw new Error(`第 ${expStart + 1} 列：科学计数法指数不完整`);
        }
      }
      const raw = line.slice(start, i);
      if (!/\d/.test(raw) || raw.includes('..')) {
        throw new Error(`第 ${start + 1} 列：无法识别的数字 "${raw}"`);
      }
      const value = Number(raw);
      if (!Number.isFinite(value)) {
        throw new Error(`第 ${start + 1} 列：数字 "${raw}" 超出可表示范围`);
      }
      tokens.push({ type: 'num', value: raw, pos: start });
      continue;
    }
    if (/[A-Za-z_]/.test(ch)) {
      const start = i;
      while (i < line.length && /[A-Za-z0-9_]/.test(line[i]!)) {
        i += 1;
      }
      tokens.push({ type: 'ident', value: line.slice(start, i), pos: start });
      continue;
    }
    if ('+-*/^%!='.includes(ch)) {
      tokens.push({ type: 'op', value: ch, pos: i });
      i += 1;
      continue;
    }
    if (ch === '(') {
      tokens.push({ type: 'lparen', value: ch, pos: i });
      i += 1;
      continue;
    }
    if (ch === ')') {
      tokens.push({ type: 'rparen', value: ch, pos: i });
      i += 1;
      continue;
    }
    if (ch === ',') {
      tokens.push({ type: 'comma', value: ch, pos: i });
      i += 1;
      continue;
    }
    throw new Error(`第 ${i + 1} 列：无法识别的字符 "${ch}"`);
  }
  return tokens;
}

/**
 * 递归下降语法分析器
 *
 * 文法（优先级从低到高）：
 * statement  := ident '=' expression | expression
 * expression := additive
 * additive   := multiplicative (('+' | '-') multiplicative)*
 * multiplicative := unary (('*' | '/' | '%') unary)*
 * power      := postfix ('^' unary)?        —— 右结合
 * unary      := ('+' | '-') unary | power
 * postfix    := primary ('!')*
 * primary    := number | ident ['(' args ')'] | '(' expression ')'
 */
class Parser {
  private pos = 0;

  constructor(private readonly tokens: Token[]) {}

  private peek(): Token | undefined {
    return this.tokens[this.pos];
  }

  private advance(): Token {
    const token = this.tokens[this.pos];
    if (!token) {
      const last = this.tokens[this.tokens.length - 1];
      throw new Error(
        `第 ${last ? last.pos + 2 : 1} 列：表达式不完整，可能缺少操作数或右括号`,
      );
    }
    this.pos += 1;
    return token;
  }

  private isOp(value?: string): boolean {
    const token = this.peek();
    return token?.type === 'op' && (value === undefined || token.value === value);
  }

  /**
   * 解析整条语句（赋值或表达式），结束后要求恰好消费全部 token
   */
  parseStatement(): AstNode | { assignment: string; node: AstNode } {
    const first = this.tokens[0];
    const second = this.tokens[1];
    if (
      first?.type === 'ident' &&
      second?.type === 'op' &&
      second.value === '='
    ) {
      this.advance();
      this.advance();
      const node = this.parseExpression();
      this.expectEnd();
      return { assignment: first.value, node };
    }
    const node = this.parseExpression();
    this.expectEnd();
    return node;
  }

  private expectEnd(): void {
    const token = this.peek();
    if (token) {
      throw new Error(`第 ${token.pos + 1} 列：意外的符号 "${token.value}"`);
    }
  }

  private parseExpression(): AstNode {
    return this.parseAdditive();
  }

  private parseAdditive(): AstNode {
    let left = this.parseMultiplicative();
    while (this.isOp('+') || this.isOp('-')) {
      const op = this.advance().value as BinOp;
      const right = this.parseMultiplicative();
      left = { kind: 'binary', op, left, right };
    }
    return left;
  }

  private parseMultiplicative(): AstNode {
    let left = this.parseUnary();
    while (this.isOp('*') || this.isOp('/') || this.isOp('%')) {
      const op = this.advance().value as BinOp;
      const right = this.parseUnary();
      left = { kind: 'binary', op, left, right };
    }
    return left;
  }

  private parseUnary(): AstNode {
    if (this.isOp('+') || this.isOp('-')) {
      const op = this.advance().value as '+' | '-';
      return { kind: 'unary', op, operand: this.parseUnary() };
    }
    return this.parsePower();
  }

  private parsePower(): AstNode {
    const base = this.parsePostfix();
    if (this.isOp('^')) {
      this.advance();
      const exponent = this.parseUnary();
      return { kind: 'binary', op: '^', left: base, right: exponent };
    }
    return base;
  }

  private parsePostfix(): AstNode {
    let node = this.parsePrimary();
    while (this.isOp('!')) {
      this.advance();
      node = { kind: 'fact', operand: node };
    }
    return node;
  }

  private parsePrimary(): AstNode {
    const token = this.advance();
    if (token.type === 'num') {
      return { kind: 'num', value: Number(token.value) };
    }
    if (token.type === 'ident') {
      if (this.peek()?.type === 'lparen') {
        this.advance();
        const args: AstNode[] = [];
        if (this.peek()?.type !== 'rparen') {
          args.push(this.parseExpression());
          while (this.peek()?.type === 'comma') {
            this.advance();
            args.push(this.parseExpression());
          }
        }
        const closing = this.peek();
        if (!closing || closing.type !== 'rparen') {
          throw new Error(`第 ${token.pos + 1} 列：函数 "${token.value}" 缺少右括号`);
        }
        this.advance();
        return { kind: 'call', name: token.value, args };
      }
      return { kind: 'ref', name: token.value };
    }
    if (token.type === 'lparen') {
      const node = this.parseExpression();
      const closing = this.peek();
      if (!closing || closing.type !== 'rparen') {
        throw new Error(`第 ${token.pos + 1} 列：缺少右括号`);
      }
      this.advance();
      return node;
    }
    if (token.type === 'rparen') {
      throw new Error(`第 ${token.pos + 1} 列：多余的右括号 ")"`);
    }
    throw new Error(`第 ${token.pos + 1} 列：此处应为数字、变量或左括号`);
  }
}

/**
 * 对语法树求值，并把每一步运算追加到 steps
 */
function evalNode(
  node: AstNode,
  variables: Record<string, number>,
  degrees: boolean,
  steps: EvaluateStep[],
): number {
  switch (node.kind) {
    case 'num':
      return node.value;
    case 'ref': {
      const { name } = node;
      if (name in variables) {
        return variables[name]!;
      }
      const constant = CONSTANTS[name.toLowerCase()];
      if (constant !== undefined) {
        return constant;
      }
      throw new Error(`未定义的变量 "${name}"`);
    }
    case 'unary': {
      const v = evalNode(node.operand, variables, degrees, steps);
      return node.op === '-' ? -v : v;
    }
    case 'binary': {
      const left = evalNode(node.left, variables, degrees, steps);
      const right = evalNode(node.right, variables, degrees, steps);
      let value: number;
      switch (node.op) {
        case '+':
          value = left + right;
          break;
        case '-':
          value = left - right;
          break;
        case '*':
          value = left * right;
          break;
        case '/':
          if (right === 0) {
            throw new Error('除数不能为 0');
          }
          value = left / right;
          break;
        case '%':
          if (right === 0) {
            throw new Error('取模运算的右操作数不能为 0');
          }
          value = left % right;
          break;
        case '^':
          value = Math.pow(left, right);
          break;
      }
      if (!Number.isFinite(value)) {
        throw new Error('运算结果超出可表示的数值范围');
      }
      steps.push({
        heading: false,
        text: `${formatNumber(left)} ${node.op} ${formatNumber(right)} = ${formatNumber(value)}`,
      });
      return value;
    }
    case 'fact': {
      const n = evalNode(node.operand, variables, degrees, steps);
      if (!Number.isInteger(n) || n < 0) {
        throw new Error(`阶乘仅支持非负整数，收到 ${formatNumber(n)}`);
      }
      if (n > 170) {
        throw new Error('阶乘结果过大（仅支持 0–170 的整数）');
      }
      let value = 1;
      for (let k = 2; k <= n; k += 1) {
        value *= k;
      }
      steps.push({ heading: false, text: `${formatNumber(n)}! = ${formatNumber(value)}` });
      return value;
    }
    case 'call': {
      const def = FUNCTIONS[node.name.toLowerCase()];
      if (!def) {
        throw new Error(`未知函数 "${node.name}"`);
      }
      if (node.args.length < def.minArgs || node.args.length > def.maxArgs) {
        throw new Error(
          `函数 "${node.name}" 需要 ${def.minArgs}${
            def.maxArgs === def.minArgs ? '' : `–${def.maxArgs === Number.MAX_SAFE_INTEGER ? '多' : def.maxArgs}`
          } 个参数，实际传入 ${node.args.length} 个`,
        );
      }
      const args = node.args.map((arg) => evalNode(arg, variables, degrees, steps));
      const value = def.impl(args, degrees);
      if (typeof value !== 'number' || Number.isNaN(value)) {
        throw new Error(`函数 ${node.name}(${args.map(formatNumber).join(', ')}) 的结果无效`);
      }
      steps.push({
        heading: false,
        text: `${node.name}(${args.map(formatNumber).join(', ')}) = ${formatNumber(value)}`,
      });
      return value;
    }
    default:
      throw new Error('未知的语法节点');
  }
}

/**
 * 求值入口：支持多行语句，每行可以是变量赋值或表达式，
 * 以 # 或 // 开头的行与空行会被忽略，返回最后一条语句的值
 *
 * @param rawInput - 用户输入的完整文本
 * @param options - 求值选项
 * @returns 求值结果、逐步过程与变量表
 */
export function evaluateProgram(rawInput: string, options?: EvaluateOptions): EvaluateResult {
  const lines = rawInput.split(/\r?\n/);
  const variables: Record<string, number> = { ...(options?.context ?? {}) };
  const degrees = options?.degrees ?? false;
  const steps: EvaluateStep[] = [];
  let value: number | undefined;

  lines.forEach((rawLine, index) => {
    const lineNumber = index + 1;
    const line = rawLine.trim();
    if (!line || line.startsWith('#') || line.startsWith('//')) {
      return;
    }
    try {
      const tokens = tokenize(line);
      if (tokens.length === 0) {
        return;
      }
      const statement = new Parser(tokens).parseStatement();
      steps.push({ heading: true, text: `第 ${lineNumber} 行：${line}` });
      if ('assignment' in statement) {
        const name = statement.assignment;
        const lower = name.toLowerCase();
        if (FUNCTIONS[lower]) {
          throw new Error(`"${name}" 是内置函数名，不能作为变量名`);
        }
        if (CONSTANTS[lower] !== undefined) {
          throw new Error(`"${name}" 是内置常量名，不能作为变量名`);
        }
        const assigned = evalNode(statement.node, variables, degrees, steps);
        variables[name] = assigned;
        value = assigned;
        steps.push({ heading: false, text: `${name} = ${formatNumber(assigned)}` });
      } else {
        value = evalNode(statement, variables, degrees, steps);
      }
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : '求值失败';
      const prefixed = /^第 \d+ 列/.test(message)
        ? `第 ${lineNumber} 行${message}`
        : `第 ${lineNumber} 行：${message}`;
      throw new Error(prefixed);
    }
  });

  if (value === undefined) {
    throw new Error('请输入至少一条数学表达式');
  }
  return { value, steps, variables };
}
