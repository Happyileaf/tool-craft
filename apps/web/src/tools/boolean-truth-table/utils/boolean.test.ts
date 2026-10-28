import { describe, it, expect } from 'vitest';
import {
  tokenize,
  parseExpression,
  evaluate,
  buildTruthTable,
  type AstNode,
} from './boolean';

/** 对自由变量做全赋值枚举，统计是否永真 / 永假 */
function classify(ast: AstNode, variables: string[]): boolean[] {
  const outcomes: boolean[] = [];
  const rowCount = 2 ** variables.length;
  for (let mask = 0; mask < rowCount; mask += 1) {
    const values: Record<string, boolean> = {};
    variables.forEach((name, index) => {
      values[name] = ((mask >> (variables.length - 1 - index)) & 1) === 1;
    });
    outcomes.push(evaluate(ast, values));
  }
  return outcomes;
}

describe('tokenize', () => {
  it('recognizes symbolic and keyword operators case-insensitively', () => {
    const { tokens } = tokenize('A and B OR !c ^ (x -> y) <-> z');
    expect(tokens.map((t) => t.type)).toEqual([
      'var',
      'and',
      'var',
      'or',
      'not',
      'var',
      'xor',
      'lparen',
      'var',
      'imp',
      'var',
      'rparen',
      'eq',
      'var',
    ]);
  });

  it('accepts doubled and alternative glyphs', () => {
    expect(tokenize('A && B || ~C').tokens.map((t) => t.type)).toEqual([
      'var',
      'and',
      'var',
      'or',
      'not',
      'var',
    ]);
    expect(tokenize('A & B | C + D · E').tokens.map((t) => t.type)).toEqual([
      'var',
      'and',
      'var',
      'or',
      'var',
      'or',
      'var',
      'and',
      'var',
    ]);
    expect(tokenize('A <=> B').tokens.map((t) => t.type)).toEqual(['var', 'eq', 'var']);
  });

  it('reports an illegal character with a 1-based column', () => {
    const result = tokenize('A @ B');
    expect(result.error).toMatch(/第 3 列/);
  });
});

describe('parseExpression', () => {
  it('binds NOT tighter than AND, and AND tighter than OR', () => {
    const ast = parseExpression('!A & B | C').ast as AstNode;
    // (!A AND B) OR C：A=0,B=0,C=0 时为 0；C=1 时为 1；A=1 时 NOT A 为 0
    expect(evaluate(ast, { A: false, B: false, C: true })).toBe(true);
    expect(evaluate(ast, { A: false, B: true, C: false })).toBe(true);
    expect(evaluate(ast, { A: true, B: true, C: false })).toBe(false);
  });

  it('binds XOR tighter than OR, and OR tighter than implication', () => {
    // 遵循 C/JS/Python 约定：AND > XOR > OR -> implication
    // A | B ^ C -> A OR (B XOR C)
    const ast = parseExpression('A | B ^ C').ast as AstNode;
    expect(evaluate(ast, { A: false, B: false, C: false })).toBe(false);
    expect(evaluate(ast, { A: true, B: false, C: true })).toBe(true);
    expect(evaluate(ast, { A: false, B: false, C: true })).toBe(true);
  });

  it('treats implication as right-associative', () => {
    // A -> B -> C 等价 A -> (B -> C)
    const ast = parseExpression('A -> B -> C').ast as AstNode;
    expect(evaluate(ast, { A: true, B: false, C: false })).toBe(true);
    expect(evaluate(ast, { A: true, B: true, C: false })).toBe(false);
  });

  it('evaluates equivalence and implication truth vectors', () => {
    const imp = parseExpression('A -> B').ast as AstNode;
    expect(classify(imp, ['A', 'B'])).toEqual([true, true, false, true]);
    const eq = parseExpression('A <-> B').ast as AstNode;
    expect(classify(eq, ['A', 'B'])).toEqual([true, false, false, true]);
  });

  it('collects variables in first-appearance order', () => {
    expect(parseExpression('B AND A AND B').variables).toEqual(['B', 'A']);
  });

  it('returns syntax errors instead of throwing', () => {
    expect(parseExpression('').error).toMatch(/不能为空/);
    expect(parseExpression('(A AND B').error).toMatch(/未闭合/);
    expect(parseExpression('A AND').error).toMatch(/不完整|缺少操作数/);
    expect(parseExpression('A B').error).toMatch(/多余内容/);
    expect(parseExpression('(A) )').error).toMatch(/多余的右括号/);
    expect(parseExpression('A AND * B').error).toMatch(/无法识别/);
  });
});

describe('expression properties', () => {
  it('classifies tautology, contradiction and contingent forms', () => {
    const taut = parseExpression('A OR NOT A').ast as AstNode;
    expect(classify(taut, ['A']).every(Boolean)).toBe(true);
    const contra = parseExpression('A AND NOT A').ast as AstNode;
    expect(classify(contra, ['A']).some(Boolean)).toBe(false);
    const xor = parseExpression('A XOR B').ast as AstNode;
    const outcomes = classify(xor, ['A', 'B']);
    expect(outcomes.some(Boolean)).toBe(true);
    expect(outcomes.every(Boolean)).toBe(false);
  });
});

describe('buildTruthTable', () => {
  it('builds the standard 4-row table for A AND B', () => {
    const result = buildTruthTable('A AND B');
    expect(result.error).toBeNull();
    expect(result.variables).toEqual(['A', 'B']);
    expect(result.rows).toHaveLength(4);
    expect(result.rows.map((row) => row.assignment)).toEqual([
      [false, false],
      [false, true],
      [true, false],
      [true, true],
    ]);
    expect(result.rows.map((row) => row.results[0])).toEqual([false, false, false, true]);
    expect(result.properties[0]).toBe('contingent');
  });

  it('classifies tautology and contradiction forms with two variables', () => {
    // (A AND B) OR NOT A OR NOT B —— 恒为真
    const tautology = buildTruthTable('(A AND B) OR NOT A OR NOT B');
    expect(tautology.rows).toHaveLength(4);
    expect(tautology.properties[0]).toBe('tautology');
    // (A OR B) AND NOT A AND NOT B —— 恒为假
    const contradiction = buildTruthTable('(A OR B) AND NOT A AND NOT B');
    expect(contradiction.properties[0]).toBe('contradiction');
  });

  it('compares multiple expressions in one table', () => {
    const result = buildTruthTable('A -> B\nNOT A OR B');
    expect(result.error).toBeNull();
    expect(result.expressions).toHaveLength(2);
    expect(result.rows).toHaveLength(4);
    // 蕴含与其析取定义每一行结果相同，但二者本身均非重言式
    for (const row of result.rows) {
      expect(row.results[0]).toBe(row.results[1]);
    }
    expect(result.properties).toEqual(['contingent', 'contingent']);
  });

  it('supports every operator spelling end to end', () => {
    const result = buildTruthTable('(A && B) <=> (B · A)');
    expect(result.error).toBeNull();
    expect(result.properties[0]).toBe('tautology');
    // !!A 与 A 等价，故两侧同为 A OR B，异或恒为假
    const symbols = buildTruthTable('(A || B) ^ (!!A + B)');
    expect(symbols.error).toBeNull();
    expect(symbols.properties[0]).toBe('contradiction');
  });

  it('rejects too few or too many variables and empty input', () => {
    expect(buildTruthTable('A AND NOT A').error).toMatch(/至少 2 个变量/);
    const nine = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'].join(' AND ');
    expect(buildTruthTable(nine).error).toMatch(/不能超过 8 个/);
    expect(buildTruthTable('\n  \n').error).toMatch(/至少输入/);
  });

  it('surfaces syntax errors with the offending expression', () => {
    const result = buildTruthTable('A AND B\n(C OR D');
    expect(result.error).toContain('(C OR D');
    expect(result.error).toMatch(/未闭合/);
  });
});
