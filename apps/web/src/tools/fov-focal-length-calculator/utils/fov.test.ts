import { describe, expect, it } from 'vitest';
import {
  calculateFov,
  compareSensors,
  cropFactorFromSize,
  dimensionSize,
  equivalentAperture,
  equivalentFocal,
  fieldOfView,
  focalFromFov,
  sensorDiagonal,
} from './fov';

describe('sensorDiagonal 与裁切系数', () => {
  it('全画幅对角线约 43.27mm，裁切系数为 1', () => {
    expect(sensorDiagonal(36, 24)).toBeCloseTo(43.267, 2);
    expect(cropFactorFromSize(36, 24)).toBeCloseTo(1, 3);
  });

  it('APS-C 23.6 × 15.7 的裁切系数约 1.53', () => {
    expect(cropFactorFromSize(23.6, 15.7)).toBeCloseTo(1.53, 2);
  });

  it('非法尺寸抛错', () => {
    expect(() => sensorDiagonal(0, 24)).toThrow('传感器宽度必须大于 0');
    expect(() => sensorDiagonal(36, -1)).toThrow('传感器高度必须大于 0');
  });
});

describe('fieldOfView', () => {
  it('全画幅 50mm 对角线视角约 46.8 度', () => {
    expect(fieldOfView(sensorDiagonal(36, 24), 50)).toBeCloseTo(46.79, 1);
  });

  it('全画幅 24mm 水平视角约 73.7 度、对角线约 84.1 度', () => {
    expect(fieldOfView(36, 24)).toBeCloseTo(73.74, 1);
    expect(fieldOfView(sensorDiagonal(36, 24), 24)).toBeCloseTo(84.05, 1);
  });

  it('非法焦距抛错', () => {
    expect(() => fieldOfView(36, 0)).toThrow('焦距必须大于 0');
  });
});

describe('等效焦距与等效光圈', () => {
  it('APS-C 裁切 1.5 时 50mm 等效 75mm', () => {
    expect(equivalentFocal(50, 1.5)).toBe(75);
  });

  it('M4/3 裁切 2.0 时 25mm 等效 50mm', () => {
    expect(equivalentFocal(25, 2)).toBe(50);
  });

  it('等效光圈按裁切系数换算', () => {
    expect(equivalentAperture(1.8, 1.5)).toBeCloseTo(2.7, 6);
  });
});

describe('calculateFov 与反向换算', () => {
  it('综合结果包含三个视角与等效焦距', () => {
    const result = calculateFov({ width: 36, height: 24 }, 50, 1.8, 1);
    expect(result.cropFactor).toBe(1);
    expect(result.diagonalFov).toBeCloseTo(46.79, 1);
    expect(result.horizontalFov).toBeCloseTo(39.6, 1);
    expect(result.verticalFov).toBeCloseTo(26.99, 1);
    expect(result.equivalentFocal).toBe(50);
  });

  it('由目标对角线视角 46.8 度反推全画幅焦距约 50mm', () => {
    expect(focalFromFov(46.79, sensorDiagonal(36, 24))).toBeCloseTo(50, 1);
  });

  it('目标视角超出范围时报错', () => {
    expect(() => focalFromFov(0, 36)).toThrow('目标视角必须大于 0 且小于 180 度');
    expect(() => focalFromFov(180, 36)).toThrow('目标视角必须大于 0 且小于 180 度');
    expect(() => focalFromFov(50, 0)).toThrow('传感器尺寸必须大于 0');
  });
});

describe('dimensionSize 与 compareSensors', () => {
  it('按维度返回对应尺寸', () => {
    const sensor = { width: 36, height: 24 };
    expect(dimensionSize(sensor, 'horizontal')).toBe(36);
    expect(dimensionSize(sensor, 'vertical')).toBe(24);
    expect(dimensionSize(sensor, 'diagonal')).toBeCloseTo(43.267, 2);
  });

  it('预设对比表覆盖全部画幅且视角随画幅变化', () => {
    const rows = compareSensors(50);
    expect(rows.length).toBeGreaterThan(5);
    const fullFrame = rows.find((row) => row.key === 'full-frame');
    expect(fullFrame?.label).toContain('全画幅');
    expect(fullFrame?.cropFactor).toBe(1);
    expect(fullFrame?.diagonalFov).toBeCloseTo(46.79, 1);
    const oneInch = rows.find((row) => row.key === 'one-inch');
    const mediumFormat = rows.find((row) => row.key === 'medium-format');
    expect(oneInch?.diagonalFov).toBeLessThan(fullFrame?.diagonalFov ?? 0);
    expect(mediumFormat?.diagonalFov).toBeGreaterThan(fullFrame?.diagonalFov ?? 0);
  });

  it('非法焦距无法生成对比表', () => {
    expect(() => compareSensors(0)).toThrow('焦距必须大于 0');
  });
});
