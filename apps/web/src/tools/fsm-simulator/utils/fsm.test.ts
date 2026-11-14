import { describe, it, expect } from 'vitest';
import {
  parseTransitions,
  simulate,
  buildTransitionTable,
  findUnreachable,
  toDot,
} from './fsm';

/** 偶数个 a 的 DFA：q0 接受（偶数），q1 奇数；b 自环 */
const EVEN_A = `q0,a -> q1
q0,b -> q0
q1,a -> q0
q1,b -> q1`;

function buildEvenA() {
  const result = parseTransitions(EVEN_A, 'q0', 'q0');
  expect(result.errors).toEqual([]);
  return result.fsm!;
}

describe('parseTransitions', () => {
  it('parses states, alphabet, start and accepting sets', () => {
    const fsm = buildEvenA();
    expect(fsm.states).toEqual(['q0', 'q1']);
    expect(fsm.alphabet).toEqual(['a', 'b']);
    expect(fsm.start).toBe('q0');
    expect(fsm.accepting).toEqual(['q0']);
    expect(fsm.transitions).toHaveLength(4);
  });

  it('ignores blank lines and comments', () => {
    const result = parseTransitions(`# comment\n\nq0,a -> q1\n`, 'q0', 'q1');
    expect(result.errors).toEqual([]);
    expect(result.fsm!.transitions).toHaveLength(1);
  });

  it('reports malformed lines with line numbers', () => {
    const result = parseTransitions(`q0,a -> q1\nbadline`, 'q0', 'q0');
    expect(result.fsm).toBeNull();
    expect(result.errors.some((e) => e.line === 2 && /无法解析|箭头/.test(e.message))).toBe(true);
  });

  it('detects conflicting duplicate transitions', () => {
    const result = parseTransitions(
      `q0,a -> q1\nq0,a -> q0`,
      'q0',
      'q0',
    );
    expect(result.errors.some((e) => /冲突转移/.test(e.message))).toBe(true);
  });

  it('flags accepting state that never appears', () => {
    const result = parseTransitions(`q0,a -> q1`, 'q0', 'q9');
    expect(result.errors.some((e) => /q9/.test(e.message))).toBe(true);
  });
});

describe('simulate', () => {
  it('accepts strings with an even number of a', () => {
    const fsm = buildEvenA();
    // aba 含 2 个 a（偶数）→ 接受
    const even = simulate(fsm, 'aba');
    expect(even.accepted).toBe(true);
    expect(even.endState).toBe('q0');

    // abaa 含 3 个 a（奇数）→ 拒绝
    const odd = simulate(fsm, 'abaa');
    expect(odd.accepted).toBe(false);
    expect(odd.endState).toBe('q1');

    // 边界：空串 0 个 a（偶数）→ 接受；单个 a（奇数）→ 拒绝
    expect(simulate(fsm, '').accepted).toBe(true);
    expect(simulate(fsm, 'a').accepted).toBe(false);
    // b 自环不改变 a 的奇偶：bbb 仍为偶数 → 接受
    expect(simulate(fsm, 'bbb').accepted).toBe(true);
  });

  it('records the step-by-step path', () => {
    const fsm = buildEvenA();
    const r = simulate(fsm, 'ab');
    expect(r.steps).toEqual([
      { index: 1, symbol: 'a', from: 'q0', to: 'q1' },
      { index: 2, symbol: 'b', from: 'q1', to: 'q1' },
    ]);
  });

  it('handles the empty string by staying at the start state', () => {
    const fsm = buildEvenA();
    const r = simulate(fsm, '');
    expect(r.steps).toEqual([]);
    expect(r.endState).toBe('q0');
    expect(r.accepted).toBe(true); // q0 is accepting
  });

  it('rejects symbols outside the alphabet', () => {
    const fsm = buildEvenA();
    const r = simulate(fsm, 'ac');
    expect(r.error).toMatch(/字母表/);
    expect(r.accepted).toBe(false);
  });

  it('reports a missing DFA transition', () => {
    // 字母表为 {a,b}，但 q1 在 b 上没有定义转移
    const result = parseTransitions(`q0,a -> q1\nq0,b -> q0\nq1,a -> q0`, 'q0', 'q0');
    const fsm = result.fsm!;
    const r = simulate(fsm, 'ab');
    expect(r.error).toMatch(/没有定义转移/);
  });
});

describe('buildTransitionTable', () => {
  it('covers every state × alphabet cell and counts missing', () => {
    const result = parseTransitions(`q0,a -> q1`, 'q0', 'q1');
    const table = buildTransitionTable(result.fsm!);
    expect(table.headers).toEqual(['a']);
    expect(table.rows).toHaveLength(2);
    // q1 对 a 没有转移
    const q1Row = table.rows.find((r) => r.state === 'q1')!;
    expect(q1Row.cells[0]).toEqual({ missing: true });
    expect(table.missingCount).toBe(1);
  });
});

describe('findUnreachable', () => {
  it('detects states unreachable from the start', () => {
    const result = parseTransitions(`q0,a -> q1\nq2,b -> q2`, 'q0', 'q1');
    const unreachable = findUnreachable(result.fsm!);
    expect(unreachable).toContain('q2');
    expect(unreachable).not.toContain('q0');
  });
});

describe('toDot', () => {
  it('emits valid digraph with accepting doublecircle and start arrow', () => {
    const fsm = buildEvenA();
    const dot = toDot(fsm);
    expect(dot.startsWith('digraph FSM {')).toBe(true);
    expect(dot).toContain('"q0" [shape=doublecircle];');
    expect(dot).toContain('"" -> "q0";');
    expect(dot).toContain('"q1" [shape=circle];');
    expect(dot.trimEnd().endsWith('}')).toBe(true);
  });
});
