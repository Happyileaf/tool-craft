/**
 * 确定型有限自动机（DFA）设计与测试序列模拟（零依赖纯函数）
 *
 * 转移声明按行书写，形如 `q0,a -> q1`：
 *   - 左侧「当前状态,输入符号」，右侧目标状态
 *   - 逗号/箭头两侧允许空白；空行与 # 开头注释忽略
 * 本模块只处理 DFA：同一「状态 × 输入」至多一条转移且必须唯一。
 */

export interface Transition {
  from: string;
  symbol: string;
  to: string;
  line: number;
}

export interface FsmDefinition {
  states: string[];
  alphabet: string[];
  start: string;
  accepting: string[];
  transitions: Transition[];
  /** 以 `${from}${symbol}` 为键的转移索引 */
  map: Record<string, Transition>;
}

export interface ParseIssue {
  line: number;
  message: string;
}

export interface ParseResult {
  fsm: FsmDefinition | null;
  errors: ParseIssue[];
}

const TRANSITION_RE = /^([^,\s]+)\s*,\s*(\S+)\s*->\s*(\S+)\s*$/;
const ARROW_RE = /->/;

/** 解析多行转移声明；start/accepting/states/alphabet 若未显式给出则由转移推导 */
export function parseTransitions(
  text: string,
  startInput: string,
  acceptingInput: string,
): ParseResult {
  const errors: ParseIssue[] = [];
  const transitions: Transition[] = [];
  const stateSet = new Set<string>();
  /** 仅由转移端点构成的状态集合，用于校验起始/接受状态是否真实存在 */
  const referencedSet = new Set<string>();
  const symbolSet = new Set<string>();
  const map: Record<string, Transition> = {};

  const lines = text.split('\n');
  lines.forEach((raw, index) => {
    const line = index + 1;
    const trimmed = raw.trim();
    if (trimmed === '' || trimmed.startsWith('#')) return;
    if (!ARROW_RE.test(trimmed)) {
      errors.push({ line, message: '缺少 `->` 箭头，正确格式：当前状态,输入符号 -> 目标状态' });
      return;
    }
    const match = TRANSITION_RE.exec(trimmed);
    if (!match) {
      errors.push({ line, message: '无法解析，正确格式：当前状态,输入符号 -> 目标状态' });
      return;
    }
    const [, from, symbol, to] = match;
    const key = `${from}${symbol}`;
    if (map[key]) {
      errors.push({ line, message: `冲突转移：${from} 在符号 ${symbol} 上已有目标 ${map[key]!.to}` });
      return;
    }
    const transition: Transition = { from: from!, symbol: symbol!, to: to!, line };
    transitions.push(transition);
    map[key] = transition;
    stateSet.add(from!).add(to!);
    referencedSet.add(from!).add(to!);
    symbolSet.add(symbol!);
  });

  const start = startInput.trim();
  const accepting = acceptingInput
    .split(/[\s,]+/)
    .map((s) => s.trim())
    .filter((s) => s !== '');

  // 引用一致性：起始/接受状态必须是转移中真实出现过的状态
  if (start !== '') {
    if (!referencedSet.has(start)) {
      errors.push({ line: 0, message: `起始状态 ${start} 未在任何转移中出现` });
    }
    stateSet.add(start);
  }
  accepting.forEach((s) => {
    if (!referencedSet.has(s)) {
      errors.push({ line: 0, message: `接受状态 ${s} 未在任何转移中出现` });
    }
    stateSet.add(s);
  });

  if (errors.length > 0) {
    return { fsm: null, errors };
  }

  const states = [...stateSet].sort();
  const alphabet = [...symbolSet].sort();
  return {
    fsm: { states, alphabet, start, accepting, transitions, map },
    errors: [],
  };
}

export interface SimulationStep {
  index: number;
  symbol: string;
  from: string;
  to: string;
}

export interface SimulationResult {
  accepted: boolean;
  steps: SimulationStep[];
  endState: string;
  error: string | null;
}

/** 对输入串逐步模拟；空串停在起始状态 */
export function simulate(fsm: FsmDefinition, input: string): SimulationResult {
  const steps: SimulationStep[] = [];
  let current = fsm.start;

  if (fsm.start === '') {
    return { accepted: false, steps, endState: '', error: '未设置起始状态' };
  }

  const chars = [...input];
  for (let i = 0; i < chars.length; i += 1) {
    const symbol = chars[i]!;
    if (!fsm.alphabet.includes(symbol)) {
      return {
        accepted: false,
        steps,
        endState: current,
        error: `位置 ${i + 1} 的符号「${symbol}」不在字母表中`,
      };
    }
    const transition = fsm.map[`${current}${symbol}`];
    if (!transition) {
      return {
        accepted: false,
        steps,
        endState: current,
        error: `状态 ${current} 在符号 ${symbol} 上没有定义转移（DFA 缺失转移）`,
      };
    }
    steps.push({ index: i + 1, symbol, from: current, to: transition.to });
    current = transition.to;
  }

  return {
    accepted: fsm.accepting.includes(current),
    steps,
    endState: current,
    error: null,
  };
}

export type TransitionTableCell = { to: string } | { missing: true };

/** 生成覆盖全部「状态 × 字母表」的转移表，缺失单元显式标记 */
export function buildTransitionTable(fsm: FsmDefinition): {
  headers: string[];
  rows: Array<{ state: string; cells: TransitionTableCell[] }>;
  missingCount: number;
} {
  let missingCount = 0;
  const rows = fsm.states.map((state) => {
    const cells = fsm.alphabet.map((symbol) => {
      const t = fsm.map[`${state}${symbol}`];
      if (t) return { to: t.to } as TransitionTableCell;
      missingCount += 1;
      return { missing: true } as TransitionTableCell;
    });
    return { state, cells };
  });
  return { headers: fsm.alphabet, rows, missingCount };
}

/** 从起始状态做可达性分析，返回不可达状态列表 */
export function findUnreachable(fsm: FsmDefinition): string[] {
  if (fsm.start === '') return fsm.states;
  const reachable = new Set<string>([fsm.start]);
  const queue = [fsm.start];
  while (queue.length > 0) {
    const current = queue.shift()!;
    fsm.alphabet.forEach((symbol) => {
      const t = fsm.map[`${current}${symbol}`];
      if (t && !reachable.has(t.to)) {
        reachable.add(t.to);
        queue.push(t.to);
      }
    });
  }
  return fsm.states.filter((s) => !reachable.has(s));
}

/** 生成 Graphviz DOT 文本；接受态双圆、起始态带入口箭头 */
export function toDot(fsm: FsmDefinition): string {
  const escape = (label: string) => label.replace(/"/g, '\\"');
  const lines: string[] = ['digraph FSM {', '  rankdir=LR;'];
  if (fsm.start !== '') {
    lines.push('  "" [shape=none];');
    lines.push(`  "" -> "${escape(fsm.start)}";`);
  }
  fsm.states.forEach((state) => {
    const shape = fsm.accepting.includes(state) ? 'doublecircle' : 'circle';
    lines.push(`  "${escape(state)}" [shape=${shape}];`);
  });
  // 合并相同 from->to 的标签，减少边数量
  const edgeLabels = new Map<string, Set<string>>();
  fsm.transitions.forEach((t) => {
    const key = `${t.from}=>${t.to}`;
    if (!edgeLabels.has(key)) edgeLabels.set(key, new Set());
    edgeLabels.get(key)!.add(t.symbol);
  });
  edgeLabels.forEach((symbols, key) => {
    const [from, to] = key.split('=>');
    const label = [...symbols].sort().join(', ');
    lines.push(`  "${escape(from!)}" -> "${escape(to!)}" [label="${escape(label)}"];`);
  });
  lines.push('}');
  return lines.join('\n');
}
