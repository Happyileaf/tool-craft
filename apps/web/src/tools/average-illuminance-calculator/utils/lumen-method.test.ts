import { describe, it, expect } from 'vitest';
import {
  roomArea,
  calculatedHeight,
  roomCavityRatio,
  roomIndex,
  averageIlluminance,
  requiredLuminaireCount,
  requiredLumenPerLuminaire,
  interpolateUtilizationFactor,
  calculateRoomGeometry,
  MAX_LUMINAIRE_COUNT,
  type CuTablePoint,
} from './lumen-method';

describe('房间几何量', () => {
  it('教材算例：10m×8m、hrc=2.5m → RCR=2.8125，RI=1.777...', () => {
    const L = 10;
    const W = 8;
    const hrc = 2.5;
    expect(roomArea(L, W)).toBeCloseTo(80, 12);
    // RCR = 5×2.5×18/80 = 2.8125
    expect(roomCavityRatio(L, W, hrc)).toBeCloseTo(2.8125, 12);
    // RI = 80/(2.5×18) = 1.777...
    expect(roomIndex(L, W, hrc)).toBeCloseTo(80 / 45, 12);
  });

  it('恒等关系 RCR·RI = 5（即 RI = 5/RCR）', () => {
    const cases: Array<[number, number, number]> = [
      [10, 8, 2.5],
      [6, 4, 1.8],
      [12, 10, 3.2],
    ];
    for (const [L, W, hrc] of cases) {
      const rcr = roomCavityRatio(L, W, hrc);
      const ri = roomIndex(L, W, hrc);
      expect(rcr * ri).toBeCloseTo(5, 10);
      expect(ri).toBeCloseTo(5 / rcr, 10);
    }
  });

  it('hrc = 安装高度 − 工作面高度，高度关系非法时抛错', () => {
    expect(calculatedHeight(3, 0.75)).toBeCloseTo(2.25, 12);
    expect(() => calculatedHeight(0.75, 0.8)).toThrow('计算高度');
    expect(() => calculatedHeight(3, -0.1)).toThrow('工作面高度');
  });

  it('calculateRoomGeometry 汇总一致', () => {
    const geometry = calculateRoomGeometry(10, 8, 3.25, 0.75);
    expect(geometry.hrc).toBeCloseTo(2.5, 12);
    expect(geometry.area).toBe(80);
    expect(geometry.rcr).toBeCloseTo(2.8125, 12);
    expect(geometry.ri).toBeCloseTo(80 / 45, 12);
  });

  it('非正尺寸抛错', () => {
    expect(() => roomArea(0, 8)).toThrow('长度');
    expect(() => roomCavityRatio(10, -8, 2.5)).toThrow('宽度');
    expect(() => roomIndex(10, 8, 0)).toThrow('计算高度');
  });
});

describe('流明法正算 Eavg', () => {
  it('教材向量：N=12、Φ=3000lm、CU=0.55、MF=0.8、A=80m²', () => {
    const e = averageIlluminance(12, 3000, 0.55, 0.8, 80);
    // 12×3000×0.55×0.8/80 = 198 lux
    expect(e).toBeCloseTo(198, 10);
  });

  it('CU/MF 越界与非整数 N 抛错', () => {
    expect(() => averageIlluminance(12, 3000, 0, 0.8, 80)).toThrow('CU');
    expect(() => averageIlluminance(12, 3000, 0.55, 1.2, 80)).toThrow('MF');
    expect(() => averageIlluminance(12.5, 3000, 0.55, 0.8, 80)).toThrow('正整数');
    expect(() => averageIlluminance(-1, 3000, 0.55, 0.8, 80)).toThrow('数量');
  });
});

describe('反算灯具数量与光通量', () => {
  it('反算 N 向上取整且复核照度 ≥ 目标', () => {
    // 目标 200 lux：raw = 200×80/(3000×0.55×0.8) ≈ 12.121 → 13
    const result = requiredLuminaireCount(200, 3000, 0.55, 0.8, 80);
    expect(result.rawCount).toBeCloseTo(12.1212121, 5);
    expect(result.count).toBe(13);
    expect(result.achievedIlluminance).toBeCloseTo(
      averageIlluminance(13, 3000, 0.55, 0.8, 80),
      10,
    );
    expect(result.achievedIlluminance).toBeGreaterThanOrEqual(200);
  });

  it('恰好整除时不额外加一（浮点容差）', () => {
    // 目标 198 lux 恰好需要 12 盏
    const result = requiredLuminaireCount(198, 3000, 0.55, 0.8, 80);
    expect(result.count).toBe(12);
    expect(result.achievedIlluminance).toBeCloseTo(198, 10);
  });

  it('所需光通量反算与正算互逆', () => {
    const phi = requiredLumenPerLuminaire(198, 12, 0.55, 0.8, 80);
    expect(phi).toBeCloseTo(3000, 10);
    expect(averageIlluminance(12, phi, 0.55, 0.8, 80)).toBeCloseTo(198, 10);
  });

  it('反算数量超上限抛错', () => {
    expect(() =>
      requiredLuminaireCount(1e9, 100, 0.5, 0.6, 100),
    ).toThrow(String(MAX_LUMINAIRE_COUNT));
  });

  it('非法输入抛错', () => {
    expect(() => requiredLumenPerLuminaire(200, 0, 0.5, 0.8, 80)).toThrow('数量');
    expect(() => requiredLuminaireCount(0, 3000, 0.5, 0.8, 80)).toThrow('目标照度');
  });
});

describe('CU 对照表分段线性插值', () => {
  const table: CuTablePoint[] = [
    { rcr: 0, cu: 0.75 },
    { rcr: 2, cu: 0.62 },
    { rcr: 4, cu: 0.48 },
    { rcr: 6, cu: 0.36 },
    { rcr: 8, cu: 0.27 },
    { rcr: 10, cu: 0.2 },
  ];

  it('节点上取值精确', () => {
    expect(interpolateUtilizationFactor(0, table)).toBe(0.75);
    expect(interpolateUtilizationFactor(4, table)).toBe(0.48);
    expect(interpolateUtilizationFactor(10, table)).toBe(0.2);
  });

  it('节点间线性：RCR=3 → 0.55', () => {
    expect(interpolateUtilizationFactor(3, table)).toBeCloseTo(0.55, 12);
    expect(interpolateUtilizationFactor(5, table)).toBeCloseTo(0.42, 12);
  });

  it('教材 RCR=2.8125 可在示例表中插值', () => {
    const cu = interpolateUtilizationFactor(2.8125, table);
    // 位于 2→4 之间：0.62 + (2.8125-2)/2 × (0.48-0.62)
    const expected = 0.62 + (2.8125 - 2) / 2 * (0.48 - 0.62);
    expect(cu).toBeCloseTo(expected, 12);
  });

  it('超范围不允许外插', () => {
    expect(() => interpolateUtilizationFactor(11, table)).toThrow('超出对照表范围');
    expect(() => interpolateUtilizationFactor(-1, table)).toThrow();
  });

  it('表为空、节点不足、乱序、重复、CU 越界均抛错', () => {
    expect(() => interpolateUtilizationFactor(2, [])).toThrow('至少需要 2 个节点');
    expect(() => interpolateUtilizationFactor(2, [table[0] as CuTablePoint])).toThrow('至少需要 2 个节点');
    const unsorted: CuTablePoint[] = [
      { rcr: 4, cu: 0.48 },
      { rcr: 2, cu: 0.62 },
    ];
    expect(() => interpolateUtilizationFactor(3, unsorted)).toThrow('升序');
    const duplicate: CuTablePoint[] = [
      { rcr: 2, cu: 0.62 },
      { rcr: 2, cu: 0.5 },
    ];
    expect(() => interpolateUtilizationFactor(2, duplicate)).toThrow('升序');
    const badCu: CuTablePoint[] = [
      { rcr: 0, cu: 0.8 },
      { rcr: 2, cu: 1.4 },
    ];
    expect(() => interpolateUtilizationFactor(1, badCu)).toThrow('CU');
  });
});
