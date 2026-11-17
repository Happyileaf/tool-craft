import { describe, expect, it } from 'vitest';
import {
  GAS_CONSTANT_R,
  MASS_UNITS,
  MOLAR_MASS_UNITS,
  MOLE_UNITS,
  PRESSURE_UNITS,
  REFERENCE_POINTS,
  VOLUME_UNITS,
  cubicMeterToUnit,
  formatSignificant,
  fromKelvin,
  molarVolumeAt,
  molesFromMass,
  molesToMol,
  pascalToUnit,
  pressureToPascal,
  solveIdealGas,
  toKelvin,
  volumeToCubicMeter,
  type GasLawInput,
  type TemperatureUnit,
} from './ideal-gas';

/** 构造四字段输入，默认全部留空，由用例按需填值 */
type PartialField = { value: number | null; unit: string; tempUnit?: TemperatureUnit };

function makeInput(partial: Partial<Record<keyof GasLawInput, PartialField>>): GasLawInput {
  return {
    pressure: { value: null, unit: 'Pa', ...(partial.pressure ?? {}) },
    volume: { value: null, unit: 'm³', ...(partial.volume ?? {}) },
    moles: { value: null, unit: 'mol', ...(partial.moles ?? {}) },
    temperature: {
      value: null,
      unit: 'K',
      tempUnit: 'K',
      ...(partial.temperature ?? {}),
    },
  } as GasLawInput;
}

describe('单位换算因子（constants 锁定）', () => {
  it('压强：1 bar = 100000 Pa、1 atm = 101325 Pa = 760 mmHg', () => {
    const pa = PRESSURE_UNITS.find((item) => item.label === 'Pa')?.factor;
    const bar = PRESSURE_UNITS.find((item) => item.label === 'bar')?.factor;
    const atm = PRESSURE_UNITS.find((item) => item.label === 'atm')?.factor;
    const mmhg = PRESSURE_UNITS.find((item) => item.label === 'mmHg (Torr)')?.factor;
    expect(bar).toBe(100000);
    expect(atm).toBe(101325);
    expect(pa).toBe(1);
    expect(mmhg).toBeCloseTo(101325 / 760, 10);
    expect(pressureToPascal(1, 'atm')).toBeCloseTo(760 * pressureToPascal(1, 'mmHg (Torr)'), 6);
    expect(pascalToUnit(100000, 'bar')).toBe(1);
  });

  it('体积：1 L = 0.001 m³、1 mL = 1e-6 m³', () => {
    expect(volumeToCubicMeter(1, 'L')).toBe(0.001);
    expect(volumeToCubicMeter(1, 'mL')).toBe(1e-6);
    expect(cubicMeterToUnit(1, 'L')).toBe(1000);
    expect(VOLUME_UNITS.find((item) => item.label === 'm³')?.factor).toBe(1);
  });

  it('物质的量：1 mmol = 0.001 mol，往返一致', () => {
    expect(molesToMol(1, 'mmol')).toBe(0.001);
    expect(MOLE_UNITS.find((item) => item.label === 'mol')?.factor).toBe(1);
  });

  it('温度：25 °C = 298.15 K、77 °F = 25 °C，往返一致', () => {
    expect(toKelvin(25, '°C')).toBe(298.15);
    expect(toKelvin(77, '°F')).toBeCloseTo(298.15, 10);
    expect(fromKelvin(298.15, '°C')).toBe(25);
    expect(fromKelvin(toKelvin(77, '°F'), '°F')).toBeCloseTo(77, 10);
    expect(toKelvin(0, 'K')).toBe(0);
  });

  it('质量与摩尔质量单位因子', () => {
    expect(MASS_UNITS.find((item) => item.label === 'kg')?.factor).toBe(1000);
    expect(MOLAR_MASS_UNITS.find((item) => item.label === 'g/mol')?.factor).toBe(1);
  });
});

describe('教科书固定向量', () => {
  it('STP（273.15 K、1 atm）下 1 mol 气体体积 ≈ 0.022414 m³（22.414 L，容差 0.1%）', () => {
    const result = solveIdealGas(
      makeInput({
        pressure: { value: 101325, unit: 'Pa' },
        moles: { value: 1, unit: 'mol' },
        temperature: { value: 273.15, unit: 'K', tempUnit: 'K' },
      }),
    );
    expect(result.unknown).toBe('volume');
    expect(result.siValue).toBeGreaterThan(0.022414 * 0.999);
    expect(result.siValue).toBeLessThan(0.022414 * 1.001);
    expect(cubicMeterToUnit(result.siValue, 'L')).toBeGreaterThan(22.414 * 0.999);
    expect(cubicMeterToUnit(result.siValue, 'L')).toBeLessThan(22.414 * 1.001);
  });

  it('P=101325 Pa、V=0.022414 m³、T=273.15 K 反解 n ≈ 1.000 mol（容差 0.2%）', () => {
    const result = solveIdealGas(
      makeInput({
        pressure: { value: 101325, unit: 'Pa' },
        volume: { value: 0.022414, unit: 'm³' },
        temperature: { value: 273.15, unit: 'K', tempUnit: 'K' },
      }),
    );
    expect(result.unknown).toBe('moles');
    expect(result.siValue).toBeGreaterThan(1 * 0.998);
    expect(result.siValue).toBeLessThan(1 * 1.002);
  });

  it('25 °C、1 atm 下摩尔体积 ≈ 24.465 L/mol（容差 0.1%）', () => {
    const result = solveIdealGas(
      makeInput({
        pressure: { value: 1, unit: 'atm' },
        moles: { value: 1, unit: 'mol' },
        temperature: { value: 25, unit: '°C', tempUnit: '°C' },
      }),
    );
    const litersPerMol = cubicMeterToUnit(result.siValue, 'L');
    expect(litersPerMol).toBeGreaterThan(24.465 * 0.999);
    expect(litersPerMol).toBeLessThan(24.465 * 1.001);
  });

  it('四量互解一致性：解出的未知量回代满足 PV=nRT', () => {
    const base = makeInput({
      pressure: { value: 2, unit: 'bar' },
      volume: { value: 5, unit: 'L' },
      moles: { value: 0.5, unit: 'mol' },
    });
    const tResult = solveIdealGas(base);
    expect(tResult.unknown).toBe('temperature');
    const lhs = 200000 * 0.005;
    const rhs = 0.5 * GAS_CONSTANT_R * tResult.siValue;
    expect(Math.abs(lhs - rhs) / rhs).toBeLessThan(1e-10);
  });

  it('求解压强并按 kPa 界面单位输出', () => {
    const result = solveIdealGas(
      makeInput({
        volume: { value: 10, unit: 'L' },
        moles: { value: 1, unit: 'mol' },
        temperature: { value: 300, unit: 'K', tempUnit: 'K' },
        pressure: { value: null, unit: 'kPa' },
      }),
    );
    expect(result.unknown).toBe('pressure');
    expect(result.displayUnit).toBe('kPa');
    const expectedKPa = (1 * GAS_CONSTANT_R * 300) / 0.01 / 1000;
    expect(result.displayValue).toBeCloseTo(expectedKPa, 6);
  });
});

describe('参考点与摩尔质量辅助', () => {
  it('REFERENCE_POINTS 含 STP/SATP 且摩尔体积与标称值偏差 <0.1%', () => {
    expect(REFERENCE_POINTS).toHaveLength(2);
    for (const point of REFERENCE_POINTS) {
      const vmM3 = molarVolumeAt(point);
      const vmL = vmM3 * 1000;
      expect(Math.abs(vmL - point.molarVolumeLPerMol) / point.molarVolumeLPerMol).toBeLessThan(0.001);
    }
  });

  it('摩尔质量模式：44.01 g/mol 的 CO₂ 88.02 g → n=2.000 mol', () => {
    const n = molesFromMass(88.02, 'g', 44.01, 'g/mol');
    expect(n).toBeCloseTo(2.0, 6);
  });

  it('kg 与 kg/mol 组合换算后结果不变', () => {
    const n = molesFromMass(0.08802, 'kg', 0.04401, 'kg/mol');
    expect(n).toBeCloseTo(2.0, 6);
  });
});

describe('边界与错误分支', () => {
  it('留空两个及以上字段报「仅支持四量求一」', () => {
    expect(() =>
      solveIdealGas(
        makeInput({
          pressure: { value: 101325, unit: 'Pa' },
          temperature: { value: 273.15, unit: 'K', tempUnit: 'K' },
        }),
      ),
    ).toThrow(/四量求一/);
  });

  it('四个字段全填时报错提示留空待求字段', () => {
    expect(() =>
      solveIdealGas(
        makeInput({
          pressure: { value: 1, unit: 'atm' },
          volume: { value: 1, unit: 'L' },
          moles: { value: 1, unit: 'mol' },
          temperature: { value: 300, unit: 'K', tempUnit: 'K' },
        }),
      ),
    ).toThrow(/留空/);
  });

  it('T=−10 °C（=263.15 K）合法可计算', () => {
    const result = solveIdealGas(
      makeInput({
        pressure: { value: 1, unit: 'atm' },
        moles: { value: 1, unit: 'mol' },
        temperature: { value: -10, unit: '°C', tempUnit: '°C' },
      }),
    );
    expect(result.siValue).toBeGreaterThan(0);
  });

  it('T=−300 °C（低于绝对零度）明确报错', () => {
    expect(() =>
      solveIdealGas(
        makeInput({
          pressure: { value: 1, unit: 'atm' },
          moles: { value: 1, unit: 'mol' },
          temperature: { value: -300, unit: '°C', tempUnit: '°C' },
        }),
      ),
    ).toThrow(/绝对温度/);
  });

  it('T=0 K 报绝对温度错误', () => {
    expect(() =>
      solveIdealGas(
        makeInput({
          pressure: { value: 1, unit: 'atm' },
          moles: { value: 1, unit: 'mol' },
          temperature: { value: 0, unit: 'K', tempUnit: 'K' },
        }),
      ),
    ).toThrow(/绝对温度/);
  });

  it('P=0 求体积时报发散错误而非崩溃', () => {
    expect(() =>
      solveIdealGas(
        makeInput({
          pressure: { value: 0, unit: 'Pa' },
          moles: { value: 1, unit: 'mol' },
          temperature: { value: 300, unit: 'K', tempUnit: 'K' },
        }),
      ),
    ).toThrow(/发散/);
  });

  it('非正体积或物质的量报错', () => {
    expect(() =>
      solveIdealGas(
        makeInput({
          pressure: { value: 1, unit: 'atm' },
          volume: { value: 0, unit: 'L' },
          temperature: { value: 300, unit: 'K', tempUnit: 'K' },
        }),
      ),
    ).toThrow(/体积/);
    expect(() =>
      solveIdealGas(
        makeInput({
          pressure: { value: 1, unit: 'atm' },
          volume: { value: 1, unit: 'L' },
          moles: { value: -2, unit: 'mol' },
        }),
      ),
    ).toThrow(/物质的量/);
  });

  it('摩尔质量模式非正输入报错', () => {
    expect(() => molesFromMass(0, 'g', 44.01, 'g/mol')).toThrow(/质量/);
    expect(() => molesFromMass(88, 'g', 0, 'g/mol')).toThrow(/摩尔质量/);
  });
});

describe('格式化', () => {
  it('默认 6 位有效数字', () => {
    expect(formatSignificant(22.414123456)).toBe('22.4141');
    expect(formatSignificant(0.0000123456789)).toBe('1.23457e-5');
  });

  it('浮点残差不显示为 −0', () => {
    expect(formatSignificant(-0)).toBe('0');
    // 6 位有效数字下舍入为 0 的运算残差（含负号）统一显示为 0
    expect(formatSignificant(-1e-12)).toBe('0');
    expect(formatSignificant(1e-12)).toBe('0');
  });
});
