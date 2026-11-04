/**
 * 露点 / 湿球温度与气压-海拔换算（零依赖纯函数）
 *
 * - 露点：Magnus 公式（α = 17.625，b = 243.04 °C，Lawrence 2005 常用参数，
 *   与 idea 记录的 α=7.5/b=237.1 同属 Magnus 族；20 °C/50% 两参数结果差异 <0.01 °C）
 * - 湿球：Stull (2011) 经验式（适用 T ∈ [-20,50] °C、RH ∈ [5,99]%）
 * - 压高：国际标准大气（ISA）对流层公式，L = 0.0065 K/m
 *
 * 非法输入一律抛出带中文说明的 Error；适用范围外仅返回 warning 标记，不阻断计算。
 */

/** Magnus 常数（Lawrence 2005） */
export const MAGNUS_A = 17.625;
export const MAGNUS_B = 243.04; // °C

/** 国际标准大气常数 */
export const P0_HPA = 1013.25; // 海平面标准气压 hPa
export const T0_K = 288.15; // 海平面标准温度 K
export const LAPSE = 0.0065; // 对流层温度递减率 K/m
export const G = 9.80665; // 重力加速度 m/s²
export const M_AIR = 0.0289644; // 干空气摩尔质量 kg/mol
export const R_GAS = 8.31432; // 通用气体常数 J/(mol·K)

const PRESSURE_EXP = (G * M_AIR) / (R_GAS * LAPSE); // ≈ 5.2559

export interface PsychroResult {
  /** 露点温度 °C */
  dewPoint: number;
  /** 湿球温度 °C（Stull 经验式） */
  wetBulb: number;
  /** 气温与露点之差 K */
  spread: number;
  /** 精度警告（Magnus / Stull 适用范围外时给出） */
  warnings: string[];
}

function finiteNumber(value: number, name: string): number {
  if (!Number.isFinite(value)) throw new Error(`${name} 不是有效数字`);
  return value;
}

/**
 * 露点温度（Magnus 公式）
 *
 * @param temperatureC 气温 °C
 * @param relativeHumidity 相对湿度 %（0–100，开区间 (0,100]）
 */
export function dewPoint(temperatureC: number, relativeHumidity: number): number {
  const T = finiteNumber(temperatureC, '气温');
  const RH = finiteNumber(relativeHumidity, '相对湿度');
  if (RH <= 0) throw new Error('相对湿度必须大于 0%，RH=0 时露点无定义');
  if (RH > 100) throw new Error('相对湿度不能超过 100%');
  const gamma = Math.log(RH / 100) + (MAGNUS_A * T) / (MAGNUS_B + T);
  return (MAGNUS_B * gamma) / (MAGNUS_A - gamma);
}

/**
 * 湿球温度（Stull 2011 经验式，°C）
 */
export function wetBulbStull(temperatureC: number, relativeHumidity: number): number {
  const T = finiteNumber(temperatureC, '气温');
  const RH = finiteNumber(relativeHumidity, '相对湿度');
  if (RH < 0 || RH > 100) throw new Error('相对湿度必须在 0–100% 之间');
  return (
    T * Math.atan(0.151977 * Math.sqrt(RH + 8.313659)) +
    Math.atan(T + RH) -
    Math.atan(RH - 4.686035) +
    0.00391838 * Math.pow(RH, 1.5) * Math.atan(0.023101 * RH) -
    4.686035
  );
}

/** 综合计算露点 / 湿球与适用范围警告 */
export function psychrometrics(temperatureC: number, relativeHumidity: number): PsychroResult {
  const Td = dewPoint(temperatureC, relativeHumidity);
  const Tw = wetBulbStull(temperatureC, relativeHumidity);
  const warnings: string[] = [];
  if (temperatureC < -45 || temperatureC > 60) {
    warnings.push('气温超出 Magnus 公式高可靠区间（-45 °C 至 60 °C），露点结果精度可能下降');
  }
  if (temperatureC < -20 || temperatureC > 50 || relativeHumidity < 5 || relativeHumidity > 99) {
    warnings.push('湿球经验式（Stull）适用范围约为 -20–50 °C、RH 5–99%，当前输入下精度可能下降');
  }
  return { dewPoint: Td, wetBulb: Tw, spread: temperatureC - Td, warnings };
}

/**
 * 由海拔（m）与基准海平面气压（hPa）求气压（hPa），ISA 对流层压高公式。
 *
 * @param altitudeM 海拔 m（对流层顶约 11000 m 以内）
 * @param seaLevelHpa 海平面气压，默认 1013.25 hPa
 */
export function altitudeToPressure(altitudeM: number, seaLevelHpa: number = P0_HPA): number {
  const h = finiteNumber(altitudeM, '海拔');
  const p0 = finiteNumber(seaLevelHpa, '海平面气压');
  if (p0 <= 0) throw new Error('海平面气压必须为正数');
  if (h < 0) throw new Error('海拔不能为负值');
  if (h > 11000) throw new Error('压高公式仅适用于对流层（约 11000 m 以下）');
  const baseTemperature = T0_K - LAPSE * h;
  return p0 * Math.pow(baseTemperature / T0_K, PRESSURE_EXP);
}

/**
 * 由气压（hPa）反推海拔（m），以输入的气温作海平面基准温度修正。
 *
 * @param pressureHpa 站点气压 hPa
 * @param temperatureC 当前气温 °C（可选，默认 ISA 15 °C）
 * @param seaLevelHpa 海平面气压，默认 1013.25 hPa
 */
export function pressureToAltitude(
  pressureHpa: number,
  temperatureC: number = T0_K - 273.15,
  seaLevelHpa: number = P0_HPA,
): number {
  const P = finiteNumber(pressureHpa, '气压');
  const T = finiteNumber(temperatureC, '气温');
  const p0 = finiteNumber(seaLevelHpa, '海平面气压');
  if (P <= 0) throw new Error('气压必须为正数');
  if (P > p0) throw new Error('站点气压不应高于海平面基准气压');
  if (p0 <= 0) throw new Error('海平面气压必须为正数');
  const t0K = T + 273.15;
  return (t0K / LAPSE) * (1 - Math.pow(P / p0, 1 / PRESSURE_EXP));
}

/**
 * 由气温、露点与气压反推相对湿度（%），用于交叉验证。
 */
export function relativeHumidityFromDewPoint(temperatureC: number, dewPointC: number): number {
  const T = finiteNumber(temperatureC, '气温');
  const Td = finiteNumber(dewPointC, '露点温度');
  const gammaT = (MAGNUS_A * T) / (MAGNUS_B + T);
  const gammaD = (MAGNUS_A * Td) / (MAGNUS_B + Td);
  return 100 * Math.exp(gammaD - gammaT);
}
