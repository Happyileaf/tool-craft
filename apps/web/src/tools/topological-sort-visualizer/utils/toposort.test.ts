import { describe, expect, it } from 'vitest';
import {
  analyzeGraph,
  GraphParseError,
  MAX_NODES,
  parseGraph,
} from './toposort';

describe('parseGraph', () => {
  it('accepts arrow, comma and Chinese arrow separators with loose whitespace', () => {
    const parsed = parseGraph('A -> B\nA, C\nB → D\nB=>C');
    expect(parsed.nodes).toEqual(['A', 'B', 'C', 'D']);
    expect(parsed.edges).toEqual([
      { from: 'A', to: 'B' },
      { from: 'A', to: 'C' },
      { from: 'B', to: 'D' },
      { from: 'B', to: 'C' },
    ]);
  });

  it('ignores blank lines and keeps first-appearance node order', () => {
    const parsed = parseGraph('\n  \nZ -> A\n\nA -> M\n');
    expect(parsed.nodes).toEqual(['Z', 'A', 'M']);
    expect(parsed.edges).toHaveLength(2);
  });

  it('deduplicates repeated edges and reports them', () => {
    const parsed = parseGraph('A -> B\nA->B\nA -> B\nB -> C');
    expect(parsed.edges).toEqual([
      { from: 'A', to: 'B' },
      { from: 'B', to: 'C' },
    ]);
    expect(parsed.duplicateEdges).toEqual([
      { from: 'A', to: 'B' },
      { from: 'A', to: 'B' },
    ]);
  });

  it('throws a line-numbered error for an empty arrow side', () => {
    expect.assertions(2);
    try {
      parseGraph('A -> B\n-> C');
    } catch (error) {
      expect(error).toBeInstanceOf(GraphParseError);
      expect((error as GraphParseError).line).toBe(2);
    }
  });

  it('throws a line-numbered error for a line without a separator', () => {
    expect.assertions(2);
    try {
      parseGraph('A B C');
    } catch (error) {
      expect(error).toBeInstanceOf(GraphParseError);
      expect((error as GraphParseError).line).toBe(1);
    }
  });

  it('throws when node count exceeds the limit', () => {
    const lines: string[] = [];
    for (let i = 0; i <= MAX_NODES; i += 1) {
      lines.push(`N${i} -> N${i + 1}`);
    }
    expect(() => parseGraph(lines.join('\n'))).toThrow(/上限/);
  });
});

describe('analyzeGraph — DAG', () => {
  const DAG = 'A -> B\nA -> C\nB -> D\nC -> D';

  it('produces Kahn and DFS orders that satisfy the partial order', () => {
    const result = analyzeGraph(DAG);
    expect(result.status).toBe('acyclic');
    expect(result.kahnOrder).toEqual(['A', 'B', 'C', 'D']);
    expect(result.dfsOrder).toEqual(['A', 'C', 'B', 'D']);

    const assertTopological = (order: string[]) => {
      const pos = new Map(order.map((node, index) => [node, index]));
      for (const { from, to } of result.adjacency
        ? Object.entries(result.adjacency).flatMap(([from, tos]) =>
            tos.map((to) => ({ from, to })),
          )
        : []) {
        expect(pos.get(from)).toBeLessThan(pos.get(to) as number);
      }
    };
    assertTopological(result.kahnOrder);
    assertTopological(result.dfsOrder);
  });

  it('exposes stable adjacency and initial indegree tables', () => {
    const result = analyzeGraph(DAG);
    expect(result.adjacency).toEqual({
      A: ['B', 'C'],
      B: ['D'],
      C: ['D'],
      D: [],
    });
    expect(result.indegree).toEqual({ A: 0, B: 1, C: 1, D: 2 });
  });

  it('records Kahn steps with relaxed edges', () => {
    const result = analyzeGraph(DAG);
    expect(result.kahnSteps.map((step) => step.node)).toEqual([
      'A',
      'B',
      'C',
      'D',
    ]);
    expect(result.kahnSteps[0]?.relaxedEdges).toEqual([
      { from: 'A', to: 'B' },
      { from: 'A', to: 'C' },
    ]);
    expect(result.kahnSteps[3]?.relaxedEdges).toEqual([]);
  });

  it('records DFS enter/exit coloring events', () => {
    const result = analyzeGraph('A -> B');
    expect(result.dfsSteps).toEqual([
      { event: 'enter', node: 'A' },
      { event: 'enter', node: 'B' },
      { event: 'exit', node: 'B' },
      { event: 'exit', node: 'A' },
    ]);
  });

  it('keeps isolated nodes in the node set and both orders', () => {
    const result = analyzeGraph('A -> B\nX\nY -> Z');
    expect(result.nodes).toEqual(['A', 'B', 'X', 'Y', 'Z']);
    expect(result.status).toBe('acyclic');
    expect(result.kahnOrder).toContain('X');
    expect(result.dfsOrder).toContain('X');
    expect(result.indegree['X']).toBe(0);
  });

  it('returns an empty but acyclic result for empty input', () => {
    const result = analyzeGraph('');
    expect(result.status).toBe('acyclic');
    expect(result.nodes).toEqual([]);
    expect(result.kahnOrder).toEqual([]);
    expect(result.dfsOrder).toEqual([]);
  });
});

describe('analyzeGraph — cycles', () => {
  it('detects a 3-node cycle and returns its path and closing edge', () => {
    const result = analyzeGraph('A -> B\nB -> C\nC -> A');
    expect(result.status).toBe('cyclic');
    expect(result.cycle).toBeDefined();
    expect(result.cycle?.path).toEqual(['A', 'B', 'C']);
    expect(result.cycle?.closingEdge).toEqual({ from: 'C', to: 'A' });
    expect(result.dfsOrder).toEqual([]);
    // Kahn 只产出环外节点，这里全部在环上
    expect(result.kahnOrder).toEqual([]);
  });

  it('detects a self-loop as a cycle', () => {
    const result = analyzeGraph('A -> A\nA -> B');
    expect(result.status).toBe('cyclic');
    expect(result.cycle?.path).toEqual(['A']);
    expect(result.cycle?.closingEdge).toEqual({ from: 'A', to: 'A' });
  });

  it('still returns a partial Kahn order for nodes outside the cycle', () => {
    const result = analyzeGraph('X -> Y\nB -> C\nC -> B');
    expect(result.status).toBe('cyclic');
    expect(result.kahnOrder).toEqual(['X', 'Y']);
    expect(result.cycle?.path).toEqual(['B', 'C']);
  });
});

describe('analyzeGraph — duplicates and notices', () => {
  it('dedupes repeated edges without changing the topological order', () => {
    const result = analyzeGraph('A -> B\nA -> B\nB -> C');
    expect(result.edgeCount).toBe(2);
    expect(result.duplicateEdges).toHaveLength(1);
    expect(result.kahnOrder).toEqual(['A', 'B', 'C']);
  });
});
