import { describe, it, expect } from 'vitest';
import {
  parseMintermString,
  findPrimeImplicants,
  selectMinimumCover,
  simplifyKmap,
  evaluateSop,
  evaluatePos,
  type CellValue,
} from './kmap';

/** 规范化表达式中的空白，便于固定断言 */
function normalize(expression: string): string {
  return expression.replace(/\s+/g, ' ').trim();
}

/** 由 1 集合与无关项构造单元格数组 */
function buildCells(ones: number[], dontCares: number[], varCount: number): CellValue[] {
  const size = 1 << varCount;
  const cells: CellValue[] = new Array<CellValue>(size).fill(0);
  for (const term of ones) {
    cells[term] = 1;
  }
  for (const term of dontCares) {
    cells[term] = 'x';
  }
  return cells;
}

describe('parseMintermString 解析 Σm 记号', () => {
  it('容忍空格、全角逗号与缺省 d 分组', () => {
    expect(parseMintermString('Σm(1, 3，5, 7)', 4)).toEqual({
      ones: [1, 3, 5, 7],
      dontCares: [],
    });
  });

  it('支持大写 M/D 与全角括号', () => {
    expect(parseMintermString('M(1, 2)+D（3）', 3)).toEqual({
      ones: [1, 2],
      dontCares: [3],
    });
  });

  it('对重复编号去重并保持升序', () => {
    expect(parseMintermString('m(3,1,1)+d(2,2)', 3)).toEqual({
      ones: [1, 3],
      dontCares: [2],
    });
  });

  it('非法编号（≥ 2^n）抛出带位置的错误', () => {
    // 'm(1, 99)' 中 99 起始于第 6 个字符（1 基）
    expect(() => parseMintermString('m(1, 99)', 4)).toThrow(/第\s*6\s*位/);
  });

  it('非数字编号抛出带位置的错误', () => {
    expect(() => parseMintermString('m(a)', 2)).toThrow(/第\s*3\s*位/);
  });

  it('m 与 d 出现同一编号时抛出冲突错误', () => {
    expect(() => parseMintermString('m(1)+d(1)', 2)).toThrow('冲突');
  });

  it('空字符串与缺失分组抛出明确错误', () => {
    expect(() => parseMintermString('   ', 2)).toThrow();
    expect(() => parseMintermString('m1,2)', 2)).toThrow(/第\s*2\s*位/);
  });
});

describe('findPrimeImplicants 质蕴涵项', () => {
  it('2 变量相邻最小项合并为单字面量', () => {
    // m0=00、m2=10 相差最高位 A（A 被消除），B 固定为 0，合并为 B'
    const primes = findPrimeImplicants([0, 2], [], 2);
    expect(primes).toHaveLength(1);
    expect(primes[0]?.literals).toEqual(["B'"]);
    expect(primes[0]?.minterms).toEqual([0, 2]);
    // m0=00、m1=01 相差最低位 B（B 被消除），A 固定为 0，合并为 A'
    const lowerPair = findPrimeImplicants([0, 1], [], 2);
    expect(lowerPair[0]?.literals).toEqual(["A'"]);
  });

  it('无关项参与合并但质蕴涵项仍完整返回', () => {
    const primes = findPrimeImplicants([1, 3], [0, 2, 4, 6], 3);
    const literals = primes.map((prime) => prime.literals.join('')).sort();
    expect(literals).toContain("A'");
    expect(literals).toContain("C'");
  });

  it('空集合返回空数组', () => {
    expect(findPrimeImplicants([], [], 4)).toEqual([]);
  });

  it('非法变量数或编号抛出错误', () => {
    expect(() => findPrimeImplicants([16], [], 4)).toThrow();
    expect(() => findPrimeImplicants([1], [], 5)).toThrow();
  });
});

describe('selectMinimumCover 最小覆盖', () => {
  it('本质质蕴涵项必须入选', () => {
    // 4 变量：m0 只被 B'C'D' 唯一覆盖，m12 只被 AC'D' 唯一覆盖
    const ones = [0, 8, 12];
    const primes = findPrimeImplicants(ones, [], 4);
    const cover = selectMinimumCover(primes, ones);
    const expressions = cover.map((term) => term.literals.join('')).sort();
    expect(expressions).toContain("B'C'D'");
    expect(expressions).toContain("AC'D'");
    // 两个本质 PI 已覆盖全部 one，无需额外项
    expect(cover).toHaveLength(2);
  });

  it('覆盖结果确实包含全部 1 最小项', () => {
    const ones = [2, 3, 7, 9, 11];
    const primes = findPrimeImplicants(ones, [10], 4);
    const cover = selectMinimumCover(primes, ones);
    const covered = new Set(cover.flatMap((term) => term.minterms));
    for (const term of ones) {
      expect(covered.has(term)).toBe(true);
    }
  });
});

describe('simplifyKmap 经典固定向量', () => {
  it('Σm(2,3,4,5,6,7)（4 变量）化简为 A′B + A′C（全部最小项 A 位均为 0）', () => {
    const result = simplifyKmap({ ones: [2, 3, 4, 5, 6, 7], dontCares: [] }, 4);
    // 这些最小项编号均 < 8，即 A=0；B=1 或 C=1，故正确最简式为 A'B + A'C
    expect(normalize(result.sopExpression)).toBe("A'B + A'C");
    expect(result.sop.map((term) => term.literals.join('')).sort()).toEqual(["A'B", "A'C"]);
    expect(result.gateStats).toEqual({
      andGates: 2,
      orGates: 1,
      notGates: 1,
      literals: 4,
    });
  });

  it('真正的 B + C 用例：B=1 或 C=1 的 12 个最小项', () => {
    // B=1（bit2）：4,5,6,7,12,13,14,15；C=1（bit1）：2,3,6,7,10,11,14,15；
    // 并集共 12 个最小项，B 与 C 各为本质质蕴涵项，最简式恰为 B + C
    const result = simplifyKmap(
      { ones: [2, 3, 4, 5, 6, 7, 10, 11, 12, 13, 14, 15], dontCares: [] },
      4,
    );
    expect(normalize(result.sopExpression)).toBe('B + C');
  });

  it('Σm(1,3)+d(0,2,4,6) 化简为单字面量 A′', () => {
    const result = simplifyKmap({ ones: [1, 3], dontCares: [0, 2, 4, 6] }, 3);
    expect(normalize(result.sopExpression)).toBe("A'");
    expect(result.sop).toHaveLength(1);
    expect(result.sop[0]?.literals).toEqual(["A'"]);
  });

  it('全 1 返回常量 1', () => {
    const cells = buildCells([0, 1, 2, 3, 4, 5, 6, 7], [], 3);
    const result = simplifyKmap(cells, 3);
    expect(result.sopExpression).toBe('1');
    expect(result.posExpression).toBe('1');
    expect(result.sop).toHaveLength(1);
    expect(result.sop[0]?.literals).toEqual([]);
    expect(result.gateStats.literals).toBe(0);
  });

  it('全 0（单元格数组）返回常量 0', () => {
    const cells = buildCells([], [], 2);
    const result = simplifyKmap(cells, 2);
    expect(result.sopExpression).toBe('0');
    expect(result.posExpression).toBe('0');
    expect(result.sop).toEqual([]);
    expect(result.pos).toHaveLength(1);
    expect(result.pos[0]?.literals).toEqual([]);
  });

  it('空输入（对象形式）抛出明确错误', () => {
    expect(() => simplifyKmap({ ones: [], dontCares: [] }, 3)).toThrow(/空映射/);
  });

  it('仅含无关项时抛出明确错误', () => {
    expect(() => simplifyKmap({ ones: [], dontCares: [1, 2] }, 3)).toThrow();
  });

  it('单元格数组长度不符时抛出错误', () => {
    expect(() => simplifyKmap([0, 1, 0] as CellValue[], 2)).toThrow();
  });
});

describe('SOP 与 POS 真值表等价（穷举 2^n）', () => {
  const vectors: Array<{ varCount: number; ones: number[]; dontCares: number[] }> = [
    { varCount: 2, ones: [1, 2], dontCares: [] },
    { varCount: 3, ones: [1, 3, 7], dontCares: [4] },
    { varCount: 4, ones: [0, 1, 2, 5, 8, 10, 15], dontCares: [6] },
  ];

  for (const vector of vectors) {
    it(`n=${vector.varCount} 向量 ones=[${vector.ones.join(',')}] 两表达式与原始函数一致`, () => {
      const { varCount, ones, dontCares } = vector;
      const result = simplifyKmap({ ones, dontCares }, varCount);
      const cells = buildCells(ones, dontCares, varCount);
      const dontCareSet = new Set(dontCares);
      for (let minterm = 0; minterm < (1 << varCount); minterm += 1) {
        const sopValue = evaluateSop(result.sop, minterm, varCount);
        const posValue = evaluatePos(result.pos, minterm, varCount);
        expect(sopValue).toBe(posValue);
        if (!dontCareSet.has(minterm)) {
          expect(sopValue).toBe(cells[minterm] === 1);
        }
      }
      // 表达式结构非空且可渲染
      expect(result.sopExpression.length).toBeGreaterThan(0);
      expect(result.posExpression.length).toBeGreaterThan(0);
    });
  }
});

describe('确定性：重复运行输出完全一致', () => {
  const vectors: Array<{ varCount: number; ones: number[]; dontCares: number[] }> = [
    { varCount: 4, ones: [2, 3, 4, 5, 6, 7], dontCares: [] },
    { varCount: 4, ones: [0, 1, 2, 5, 8, 10, 15], dontCares: [6] },
    { varCount: 3, ones: [1, 3, 7], dontCares: [4] },
  ];

  for (const vector of vectors) {
    it(`ones=[${vector.ones.join(',')}] 连跑 3 次 JSON 序列化一致`, () => {
      const outputs = Array.from({ length: 3 }, () =>
        JSON.stringify(simplifyKmap(vector, vector.varCount)),
      );
      expect(outputs[0]).toBe(outputs[1]);
      expect(outputs[1]).toBe(outputs[2]);
    });
  }
});
