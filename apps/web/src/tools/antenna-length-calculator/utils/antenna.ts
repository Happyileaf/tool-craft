/** 天线长度与频率 / 波长互算的纯函数 */

/** 天线类型 */
export type AntennaType = 'dipole' | 'quarterWave' | 'fiveEighth' | 'fullWaveLoop';

/** 天线类型定义：谐振长度系数（MHz × 米） */
export const ANTENNA_TYPES: Array<{ value: AntennaType; label: string; factor: number; note: string }> = [
  { value: 'dipole', label: '半波偶极子', factor: 143, note: '含端效应缩短，总长约为半波长' },
  { value: 'quarterWave', label: '四分之一波长垂直天线', factor: 71.5, note: '单极子，需要地网或良好接地' },
  { value: 'fiveEighth', label: '5/8 波长垂直天线', factor: 187.5, note: '增益略高于 1/4 波长，常见于车载与基地台' },
  { value: 'fullWaveLoop', label: '全波环形天线', factor: 300, note: '导线总长约为一个波长，闭合环形' },
];

/** 单类天线长度 */
export interface AntennaLength {
  type: AntennaType;
  label: string;
  note: string;
  lengthMeters: number;
  lengthFeet: number;
}

/** 正推结果 */
export interface AntennaResult {
  frequencyMhz: number;
  velocityFactor: number;
  wavelengthMeters: number;
  wavelengthFeet: number;
  antennas: AntennaLength[];
}

const METERS_TO_FEET = 3.28084;

/**
 * 由频率计算自由空间波长与各类天线物理长度
 */
export function calculateAntennaLengths(frequencyMhz: number, velocityFactor: number): AntennaResult {
  if (!Number.isFinite(frequencyMhz) || frequencyMhz < 0.1 || frequencyMhz > 6000) {
    throw new Error('频率需在 0.1–6000 MHz 之间');
  }
  if (!Number.isFinite(velocityFactor) || velocityFactor < 0.5 || velocityFactor > 1) {
    throw new Error('速度因子需在 0.50–1.00 之间');
  }

  const wavelengthMeters = (300 / frequencyMhz) * velocityFactor;
  return {
    frequencyMhz,
    velocityFactor,
    wavelengthMeters,
    wavelengthFeet: wavelengthMeters * METERS_TO_FEET,
    antennas: ANTENNA_TYPES.map((antenna) => {
      const lengthMeters = (antenna.factor / frequencyMhz) * velocityFactor;
      return {
        type: antenna.value,
        label: antenna.label,
        note: antenna.note,
        lengthMeters,
        lengthFeet: lengthMeters * METERS_TO_FEET,
      };
    }),
  };
}

/**
 * 由已知天线长度反推谐振频率（MHz）
 */
export function frequencyFromLength(
  lengthMeters: number,
  type: AntennaType,
  velocityFactor: number,
): number {
  if (!Number.isFinite(lengthMeters) || lengthMeters <= 0) {
    throw new Error('天线长度需大于 0 米');
  }
  if (!Number.isFinite(velocityFactor) || velocityFactor < 0.5 || velocityFactor > 1) {
    throw new Error('速度因子需在 0.50–1.00 之间');
  }
  const antenna = ANTENNA_TYPES.find((item) => item.value === type);
  if (!antenna) {
    throw new Error('未知的天线类型');
  }
  return (antenna.factor * velocityFactor) / lengthMeters;
}

/**
 * 按 5 位有效数字格式化
 */
export function formatLength(value: number): string {
  if (value >= 100) {
    return value.toFixed(1);
  }
  if (value >= 10) {
    return value.toFixed(2);
  }
  if (value >= 1) {
    return value.toFixed(3);
  }
  return value.toPrecision(5);
}
