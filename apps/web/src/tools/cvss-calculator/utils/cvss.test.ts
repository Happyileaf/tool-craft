import { describe, expect, it } from 'vitest';
import {
  buildVector,
  calculateCvss,
  parseVector,
  roundup,
  scoreSeverity,
  type CvssMetrics,
} from './cvss';

/** 从向量快捷计算基础分 */
function scoreOf(vector: string): number {
  return calculateCvss(parseVector(vector)).score;
}

describe('roundup（Appendix B）', () => {
  it('matches specification examples', () => {
    expect(roundup(4.02)).toBe(4.1);
    expect(roundup(0.1)).toBe(0.1);
    expect(roundup(3.10545)).toBe(3.2);
    expect(roundup(9.999)).toBe(10);
    expect(roundup(0)).toBe(0);
    expect(roundup(6.96)).toBe(7.0);
  });
});

describe('scoreSeverity（Table 14）', () => {
  it('classifies boundaries correctly', () => {
    expect(scoreSeverity(0)).toBe('None');
    expect(scoreSeverity(0.1)).toBe('Low');
    expect(scoreSeverity(3.9)).toBe('Low');
    expect(scoreSeverity(4.0)).toBe('Medium');
    expect(scoreSeverity(6.9)).toBe('Medium');
    expect(scoreSeverity(7.0)).toBe('High');
    expect(scoreSeverity(8.9)).toBe('High');
    expect(scoreSeverity(9.0)).toBe('Critical');
    expect(scoreSeverity(10)).toBe('Critical');
  });
});

describe('calculateCvss — FIRST CVSS v3.1 标准向量', () => {
  // 前 10 条取自 FIRST 规范 Appendix A 官方示例；
  // 11-14 为业界著名 CVE / 典型报告向量，期望值可由 NVD 计算器交叉验证
  const vectors: Array<[string, number]> = [
    // 1. Critical network worm
    ['CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H', 9.8],
    // 2. Critical changed scope
    ['CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:C/C:H/I:H/A:H', 10],
    // 3. SQL injection
    ['CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:H/I:H/A:H', 8.8],
    // 4. Changed-scope XSS
    ['CVSS:3.1/AV:N/AC:L/PR:L/UI:R/S:C/C:H/I:H/A:N', 8.7],
    // 5. Low privilege read
    ['CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:H/I:N/A:N', 6.5],
    // 6. Local disclosure
    ['CVSS:3.1/AV:L/AC:L/PR:N/UI:R/S:U/C:H/I:N/A:N', 5.5],
    // 7. Physical-adjacent minimal leak
    ['CVSS:3.1/AV:L/AC:H/PR:N/UI:N/S:U/C:L/I:N/A:N', 2.9],
    // 8. No impact = 0
    ['CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:N/A:N', 0],
    // 9. Physical vector
    ['CVSS:3.1/AV:P/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H', 6.8],
    // 10. Authenticated DoS
    ['CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:N/I:N/A:H', 6.5],
    // 11. Heartbleed (CVE-2014-0160)
    ['CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:N/A:N', 7.5],
    // 12. Typical unauthenticated partial read
    ['CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:L/I:N/A:N', 5.3],
    // 13. Classic reflected XSS
    ['CVSS:3.1/AV:N/AC:L/PR:N/UI:R/S:C/C:L/I:L/A:N', 6.1],
    // 14. Local privilege escalation
    ['CVSS:3.1/AV:L/AC:L/PR:L/UI:N/S:U/C:H/I:H/A:H', 7.8],
  ];

  vectors.forEach(([vector, expected]) => {
    it(`scores ${vector} => ${expected.toFixed(1)}`, () => {
      expect(scoreOf(vector)).toBe(expected);
    });
  });

  it('returns the correct severity labels', () => {
    expect(
      calculateCvss(parseVector('CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H'))
        .severity,
    ).toBe('Critical');
    expect(
      calculateCvss(parseVector('CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:H/I:H/A:H'))
        .severity,
    ).toBe('High');
    expect(
      calculateCvss(parseVector('CVSS:3.1/AV:L/AC:H/PR:N/UI:N/S:U/C:L/I:N/A:N'))
        .severity,
    ).toBe('Low');
    expect(
      calculateCvss(parseVector('CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:N/A:N'))
        .severity,
    ).toBe('None');
  });
});

describe('buildVector / parseVector 往返', () => {
  const base: CvssMetrics = {
    AV: 'N',
    AC: 'L',
    PR: 'N',
    UI: 'N',
    S: 'U',
    C: 'H',
    I: 'H',
    A: 'H',
  };

  it('builds canonical-order vectors', () => {
    expect(buildVector(base)).toBe('CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H');
  });

  it('round-trips and tolerates arbitrary metric order', () => {
    const shuffled = 'CVSS:3.1/A:H/C:H/I:H/S:U/UI:N/PR:N/AC:L/AV:N';
    expect(parseVector(shuffled)).toEqual(base);
    expect(buildVector(parseVector(shuffled))).toBe(buildVector(base));
  });

  it('tolerates surrounding whitespace', () => {
    expect(parseVector('  CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:N/A:N \n')).toEqual({
      ...base,
      C: 'N',
      I: 'N',
      A: 'N',
    });
  });

  it('exposes rounded impact and exploitability subscores', () => {
    const result = calculateCvss(base);
    expect(result.exploitability).toBe(3.9);
    expect(result.iscBase).toBe(1);
    expect(result.impact).toBe(5.9);
  });
});

describe('parseVector 非法输入', () => {
  const bad: Array<[string, string]> = [
    ['AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H', 'CVSS:3.1'],
    ['CVSS:3.0/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H', 'CVSS:3.1'],
    ['CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H', '缺少基础指标'],
    ['CVSS:3.1/AV:X/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H', '取值非法'],
    ['CVSS:3.1/AV:N/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H', '重复'],
    ['CVSS:3.1/E:F/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H', '非基础指标'],
    ['CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H/', '空段'],
  ];

  bad.forEach(([vector, messagePart]) => {
    it(`rejects "${vector}"`, () => {
      expect(() => parseVector(vector)).toThrow(messagePart);
    });
  });
});
