import { describe, expect, it } from 'vitest';
import {
  DEFAULT_TOLERANCE_PERCENT,
  E24_BASE,
  calculateNetwork,
  e24Series,
  formatResistance,
  nearestE24,
  parallelEquivalent,
  parseResistance,
  seriesEquivalent,
  type ResistorInput,
} from './resistorNetwork';

describe('parseResistance 工程简写解析', () => {
  it('验收：10k→10000、4k7→4700、2R2→2.2、1M→1000000', () => {
    expect(parseResistance('10k')).toBe(10000);
    expect(parseResistance('4k7')).toBe(4700);
    expect(parseResistance('2R2')).toBe(2.2);
    expect(parseResistance('1M')).toBe(1000000);
  });

  it('纯数字按欧姆处理，并容忍 Ω 单位、空白与大小写', () => {
    expect(parseResistance('100')).toBe(100);
    expect(parseResistance('100Ω')).toBe(100);
    expect(parseResistance(' 10k ')).toBe(10000);
    expect(parseResistance('10K')).toBe(10000);
    expect(parseResistance('1m')).toBe(1_000_000);
  });

  it('R 后缀作小数点：R22→0.22、22R→22、0R1→0.1', () => {
    expect(parseResistance('R22')).toBe(0.22);
    expect(parseResistance('22R')).toBe(22);
    expect(parseResistance('0R1')).toBe(0.1);
  });

  it('非法文本与空值抛出明确错误', () => {
    expect(() => parseResistance('abc')).toThrow(/无法解析/);
    expect(() => parseResistance('')).toThrow(/不能为空/);
    expect(() => parseResistance('10x')).toThrow(/无法解析/);
  });
});

describe('标称等效电阻', () => {
  it('验收：串联 100+200=300，并联 100||100=50', () => {
    const pair: ResistorInput[] = [
      { resistance: 100, tolerancePercent: 0 },
      { resistance: 200, tolerancePercent: 0 },
    ];
    expect(seriesEquivalent(pair)).toBe(300);
    expect(parallelEquivalent([
      { resistance: 100 },
      { resistance: 100 },
    ])).toBeCloseTo(50, 10);
    const series = calculateNetwork(pair, 'series');
    expect(series.equivalent).toBe(300);
    const parallel = calculateNetwork(
      [
        { resistance: 100, tolerancePercent: 0 },
        { resistance: 100, tolerancePercent: 0 },
      ],
      'parallel',
    );
    expect(parallel.equivalent).toBeCloseTo(50, 10);
  });

  it('三电阻并联公式 1/R=Σ(1/Ri)', () => {
    // 6 || 3 || 2 = 1
    const result = parallelEquivalent([
      { resistance: 6 },
      { resistance: 3 },
      { resistance: 2 },
    ]);
    expect(result).toBeCloseTo(1, 10);
  });
});

describe('公差累积', () => {
  const pair: ResistorInput[] = [
    { resistance: 100, tolerancePercent: 5 },
    { resistance: 200, tolerancePercent: 5 },
  ];

  it('验收：两个 ±5% 串联最坏情况范围 285–315Ω', () => {
    const result = calculateNetwork(pair, 'series');
    expect(result.minResistance).toBeCloseTo(285, 6);
    expect(result.maxResistance).toBeCloseTo(315, 6);
    expect(result.worstCaseTolerancePercent).toBeCloseTo(5, 6);
  });

  it('串联 RSS 公差小于最坏情况且公式正确', () => {
    const result = calculateNetwork(pair, 'series');
    // RSS = sqrt(((100/300)*0.05)^2 + ((200/300)*0.05)^2) * 100
    const expected =
      Math.sqrt((100 / 300 / 20) ** 2 + (200 / 300 / 20) ** 2) * 100;
    expect(result.rssTolerancePercent).toBeCloseTo(expected, 4);
    expect(result.rssTolerancePercent).toBeLessThan(result.worstCaseTolerancePercent);
  });

  it('并联最坏情况界与 RSS 按并联灵敏度计算', () => {
    const parallelPair: ResistorInput[] = [
      { resistance: 100, tolerancePercent: 5 },
      { resistance: 100, tolerancePercent: 5 },
    ];
    const result = calculateNetwork(parallelPair, 'parallel');
    // 单电阻界：95 与 105；并联 95||95=47.5，105||105=52.5
    expect(result.minResistance).toBeCloseTo(47.5, 6);
    expect(result.maxResistance).toBeCloseTo(52.5, 6);
    // 灵敏度 (Req/Ri)^2 = (50/100)^2 = 0.25，两电阻相同
    const expectedRss = Math.sqrt(2 * (0.25 * 0.05) ** 2) * 100;
    expect(result.rssTolerancePercent).toBeCloseTo(expectedRss, 4);
    expect(result.rssTolerancePercent).toBeLessThan(result.worstCaseTolerancePercent);
  });

  it('公差缺省时按默认 5% 处理', () => {
    expect(DEFAULT_TOLERANCE_PERCENT).toBe(5);
    const result = calculateNetwork(
      [{ resistance: 100 }, { resistance: 200 }],
      'series',
    );
    expect(result.minResistance).toBeCloseTo(285, 6);
  });
});

describe('E24 标准阻值推荐', () => {
  it('E24 基础数列含 24 个基数且按升序', () => {
    expect(E24_BASE).toHaveLength(24);
    expect([...E24_BASE]).toEqual([...E24_BASE].sort((a, b) => a - b));
  });

  it('e24Series 按十倍频展开', () => {
    const values = e24Series(2, 2);
    expect(values).toHaveLength(24);
    expect(values[0]).toBe(100);
    expect(values[values.length - 1]).toBe(910);
  });

  it('验收：等效 303Ω 附近推荐 300Ω（比 330Ω 更接近）', () => {
    const recommendation = nearestE24(303);
    expect(recommendation.value).toBe(300);
    expect(recommendation.delta).toBe(3);
    expect(recommendation.deltaPercent).toBeCloseTo((3 / 303) * 100, 4);
  });

  it('精确命中标准值时偏差为 0', () => {
    const recommendation = nearestE24(4700);
    expect(recommendation.value).toBe(4700);
    expect(recommendation.delta).toBe(0);
  });

  it('非正目标报错', () => {
    expect(() => nearestE24(0)).toThrow(/正的目标阻值/);
  });

  it('calculateNetwork 结果附带 E24 推荐', () => {
    const result = calculateNetwork(
      [
        { resistance: 100, tolerancePercent: 0 },
        { resistance: 200, tolerancePercent: 0 },
      ],
      'series',
    );
    expect(result.e24.value).toBe(300);
  });
});

describe('错误处理', () => {
  it('并联遇 0Ω 报短路/除零错误', () => {
    expect(() =>
      calculateNetwork(
        [
          { resistance: 100 },
          { resistance: 0 },
        ],
        'parallel',
      ),
    ).toThrow(/短路/);
    expect(() => parallelEquivalent([{ resistance: 0 }])).toThrow(/短路/);
  });

  it('负阻值与负公差抛出明确错误', () => {
    expect(() =>
      calculateNetwork([{ resistance: -10 }], 'series'),
    ).toThrow(/非负有限数值/);
    expect(() =>
      calculateNetwork([{ resistance: 100, tolerancePercent: -1 }], 'series'),
    ).toThrow(/非负百分比/);
  });

  it('无电阻时提示先添加', () => {
    expect(() => calculateNetwork([], 'series')).toThrow(/先添加/);
  });

  it('串联允许 0Ω（不报错），并联不允许', () => {
    const result = calculateNetwork(
      [
        { resistance: 0, tolerancePercent: 0 },
        { resistance: 100, tolerancePercent: 0 },
      ],
      'series',
    );
    expect(result.equivalent).toBe(100);
  });
});

describe('formatResistance 自动单位', () => {
  it('按数量级选择 Ω/kΩ/MΩ', () => {
    expect(formatResistance(300)).toBe('300 Ω');
    expect(formatResistance(1500)).toBe('1.5 kΩ');
    expect(formatResistance(1_000_000)).toBe('1 MΩ');
    expect(formatResistance(2.2)).toBe('2.2 Ω');
  });
});
