/**
 * 布尔表达式词法 / 语法分析与真值表生成（零依赖纯函数）
 *
 * 支持运算符：
 * - AND：& / && / · / AND
 * - OR：| / || / + / OR
 * - NOT：! / ~ / NOT（前缀）
 * - XOR：^ / XOR
 * - 蕴含：->
 * - 等价（双条件）：<-> / <=>
 * 优先级自低到高：等价 < 蕴含 < OR < XOR < AND < NOT；蕴含右结合，其余二元左结合。
 * 本模块不触碰 DOM 与 React，语法错误以结果对象返回而非抛出。
 */

export type BinaryOp = 'and' | 'or' | 'xor' | 'imp' | 'eq';

export type AstNode =
  | { kind: 'var'; name: string }
  | { kind: 'not'; operand: AstNode }
  | { kind: 'bin'; op: BinaryOp; left: AstNode; right: AstNode };

export type ExpressionProperty = 'tautology' | 'contradiction' | 'contingent';

interface Token {
  type: 'var' | 'and' | 'or' | 'not' | 'xor' | 'imp' | 'eq' | 'lparen' | 'rparen';
  value: string;
  pos: number;
}

export interface ParseResult {
  ast: AstNode | null;
  variables: string[];
  error: string | null;
}

/* --------------------------------- 词法分析 -------------------------------- */

const KEYWORDS: Record<string, Token['type']> = {
  AND: 'and',
  OR: 'or',
  NOT: 'not',
  XOR: 'xor',
};

/** 单条表达式 → Token 序列；非法字符返回错误（位置为 0 基列号） */
export function tokenize(input: string): { tokens: Token[]; error: string | null; position: number } {
  const tokens: Token[] = [];
  let i = 0;
  while (i < input.length) {
    const ch = input[i] ?? '';
    if (/\s/.test(ch)) {
      i += 1;
      continue;
    }
    if (/[A-Za-z_]/.test(ch)) {
      const start = i;
      let name = '';
      while (i < input.length && /[A-Za-z0-9_]/.test(input[i] ?? '')) {
        name += input[i];
        i += 1;
      }
      const keyword = KEYWORDS[name.toUpperCase()];
      tokens.push({ type: keyword ?? 'var', value: name, pos: start });
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
    if (ch === '<' && (input[i + 1] === '-' || input[i + 1] === '=') && input[i + 2] === '>') {
      tokens.push({ type: 'eq', value: input.slice(i, i + 3), pos: i });
      i += 3;
      continue;
    }
    if (ch === '-' && input[i + 1] === '>') {
      tokens.push({ type: 'imp', value: '->', pos: i });
      i += 2;
      continue;
    }
    if (ch === '&') {
      if (input[i + 1] === '&') {
        tokens.push({ type: 'and', value: '&&', pos: i });
        i += 2;
      } else {
        tokens.push({ type: 'and', value: '&', pos: i });
        i += 1;
      }
      continue;
    }
    if (ch === '|') {
      if (input[i + 1] === '|') {
        tokens.push({ type: 'or', value: '||', pos: i });
        i += 2;
      } else {
        tokens.push({ type: 'or', value: '|', pos: i });
        i += 1;
      }
      continue;
    }
    if (ch === '!' || ch === '~') {
      tokens.push({ type: 'not', value: ch, pos: i });
      i += 1;
      continue;
    }
    if (ch === '^') {
      tokens.push({ type: 'xor', value: '^', pos: i });
      i += 1;
      continue;
    }
    if (ch === '·') {
      tokens.push({ type: 'and', value: '·', pos: i });
      i += 1;
      continue;
    }
    if (ch === '+') {
      tokens.push({ type: 'or', value: '+', pos: i });
      i += 1;
      continue;
    }
    return { tokens, error: `第 ${i + 1} 列：无法识别的字符「${ch}」`, position: i };
  }
  return { tokens, error: null, position: -1 };
}

/* --------------------------------- 语法分析 -------------------------------- */

class Parser {
  private cursor = 0;

  constructor(private readonly tokens: Token[]) {}

  parse(): AstNode {
    const node = this.parseEquiv();
    const token = this.peek();
    if (token) {
      throw new SyntaxError(
        token.type === 'rparen'
          ? `第 ${token.pos + 1} 列：存在多余的右括号`
          : `第 ${token.pos + 1} 列：「${token.value}」处存在多余内容`,
      );
    }
    return node;
  }

  /** 等价（左结合，优先级最低） */
  private parseEquiv(): AstNode {
    let node = this.parseImpl();
    while (this.match('eq')) {
      node = { kind: 'bin', op: 'eq', left: node, right: this.parseImpl() };
    }
    return node;
  }

  /** 蕴含（右结合） */
  private parseImpl(): AstNode {
    const node = this.parseOr();
    if (this.match('imp')) {
      return { kind: 'bin', op: 'imp', left: node, right: this.parseImpl() };
    }
    return node;
  }

  private parseOr(): AstNode {
    let node = this.parseXor();
    while (this.match('or')) {
      node = { kind: 'bin', op: 'or', left: node, right: this.parseXor() };
    }
    return node;
  }

  private parseXor(): AstNode {
    let node = this.parseAnd();
    while (this.match('xor')) {
      node = { kind: 'bin', op: 'xor', left: node, right: this.parseAnd() };
    }
    return node;
  }

  private parseAnd(): AstNode {
    let node = this.parseNot();
    while (this.match('and')) {
      node = { kind: 'bin', op: 'and', left: node, right: this.parseNot() };
    }
    return node;
  }

  private parseNot(): AstNode {
    if (this.match('not')) {
      return { kind: 'not', operand: this.parseNot() };
    }
    return this.parsePrimary();
  }

  private parsePrimary(): AstNode {
    const token = this.peek();
    if (!token) {
      throw new SyntaxError('表达式不完整：缺少操作数');
    }
    if (token.type === 'var') {
      this.cursor += 1;
      return { kind: 'var', name: token.value };
    }
    if (token.type === 'lparen') {
      this.cursor += 1;
      const node = this.parseEquiv();
      const closing = this.peek();
      if (!closing || closing.type !== 'rparen') {
        throw new SyntaxError(`第 ${token.pos + 1} 列：括号未闭合`);
      }
      this.cursor += 1;
      return node;
    }
    if (token.type === 'not') {
      // 前缀 NOT 已在 parseNot 处理，走到这里说明运算符位置异常
      this.cursor += 1;
      return { kind: 'not', operand: this.parsePrimary() };
    }
    throw new SyntaxError(`第 ${token.pos + 1} 列：「${token.value}」处缺少操作数`);
  }

  private peek(): Token | undefined {
    return this.tokens[this.cursor];
  }

  private atEnd(): boolean {
    return this.cursor >= this.tokens.length;
  }

  private match(type: Token['type']): boolean {
    if (this.peek()?.type === type) {
      this.cursor += 1;
      return true;
    }
    return false;
  }
}

/** 解析单条表达式并按首次出现顺序收集变量名；语法错误以 error 返回 */
export function parseExpression(input: string): ParseResult {
  const { tokens, error: lexError } = tokenize(input);
  if (lexError) {
    return { ast: null, variables: [], error: lexError };
  }
  if (tokens.length === 0) {
    return { ast: null, variables: [], error: '表达式不能为空' };
  }
  try {
    const ast = new Parser(tokens).parse();
    const variables: string[] = [];
    collectVariables(ast, variables);
    return { ast, variables, error: null };
  } catch (e) {
    return { ast: null, variables: [], error: e instanceof Error ? e.message : '表达式语法错误' };
  }
}

function collectVariables(node: AstNode, acc: string[]): void {
  if (node.kind === 'var') {
    if (!acc.includes(node.name)) {
      acc.push(node.name);
    }
  } else if (node.kind === 'not') {
    collectVariables(node.operand, acc);
  } else {
    collectVariables(node.left, acc);
    collectVariables(node.right, acc);
  }
}

/* --------------------------------- 求值与枚举 ------------------------------- */

/** 在给定变量赋值下求值 */
export function evaluate(node: AstNode, values: Record<string, boolean>): boolean {
  switch (node.kind) {
    case 'var':
      return values[node.name] === true;
    case 'not':
      return !evaluate(node.operand, values);
    case 'bin': {
      const left = evaluate(node.left, values);
      const right = evaluate(node.right, values);
      switch (node.op) {
        case 'and':
          return left && right;
        case 'or':
          return left || right;
        case 'xor':
          return left !== right;
        case 'imp':
          return !left || right;
        case 'eq':
          return left === right;
      }
    }
  }
}

export interface TableRow {
  /** 与 variables 同序的布尔赋值 */
  assignment: boolean[];
  /** 与 expressions 同序的各表达式结果 */
  results: boolean[];
}

export interface TruthTableResult {
  /** 全部表达式变量的并集，按首次出现排序 */
  variables: string[];
  expressions: string[];
  rows: TableRow[];
  /** 与 expressions 同序的性质判定 */
  properties: ExpressionProperty[];
  error: string | null;
}

export const MIN_VARIABLES = 2;
export const MAX_VARIABLES = 8;

/**
 * 由多行（每行一条）表达式构建同表对比真值表。
 * 空行忽略；变量并集数量须在 2–8 之间；任何语法错误均以 error 返回。
 */
export function buildTruthTable(input: string): TruthTableResult {
  const empty: TruthTableResult = {
    variables: [],
    expressions: [],
    rows: [],
    properties: [],
    error: null,
  };
  const lines = input
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line !== '');
  if (lines.length === 0) {
    return { ...empty, error: '请至少输入一条布尔表达式' };
  }

  const parsed: Array<{ expression: string; ast: AstNode; variables: string[] }> = [];
  for (const line of lines) {
    const result = parseExpression(line);
    if (result.error || !result.ast) {
      return { ...empty, error: `「${line}」${result.error ?? '语法错误'}` };
    }
    parsed.push({ expression: line, ast: result.ast, variables: result.variables });
  }

  const variables: string[] = [];
  for (const item of parsed) {
    for (const name of item.variables) {
      if (!variables.includes(name)) {
        variables.push(name);
      }
    }
  }
  if (variables.length < MIN_VARIABLES) {
    return { ...empty, error: `表达式需含至少 ${MIN_VARIABLES} 个变量，当前为 ${variables.length} 个` };
  }
  if (variables.length > MAX_VARIABLES) {
    return { ...empty, error: `变量数量不能超过 ${MAX_VARIABLES} 个，当前为 ${variables.length} 个` };
  }

  const rowCount = 2 ** variables.length;
  const rows: TableRow[] = [];
  for (let mask = 0; mask < rowCount; mask += 1) {
    const assignment = variables.map((_, index) => {
      // 首个变量为最高位，教科书式排列：00、01、10、11
      const bitIndex = variables.length - 1 - index;
      return ((mask >> bitIndex) & 1) === 1;
    });
    const values: Record<string, boolean> = {};
    variables.forEach((name, index) => {
      values[name] = assignment[index] === true;
    });
    rows.push({ assignment, results: parsed.map((item) => evaluate(item.ast, values)) });
  }

  const properties = parsed.map((_, exprIndex) => {
    const outcomes = rows.map((row) => row.results[exprIndex] === true);
    if (outcomes.every(Boolean)) {
      return 'tautology' as ExpressionProperty;
    }
    if (!outcomes.some(Boolean)) {
      return 'contradiction' as ExpressionProperty;
    }
    return 'contingent' as ExpressionProperty;
  });

  return {
    variables,
    expressions: parsed.map((item) => item.expression),
    rows,
    properties,
    error: null,
  };
}
