/**
 * IPC-2221 印制板导线宽度计算纯函数。
 *
 * 载流面积公式：A[mil²] = (I / (k · ΔT^0.44))^(1 / 0.725)
 * 导线宽度：W[mil] = A / t[mil]
 * 外层 k = 0.048，内层 k = 0.024；1 oz 铜厚 ≈ 1.378 mil（35 µm）
 */

export type LayerType = 'external' | 'internal';

export const LAYER_K: Record<LayerType, number> = {
  external: 0.048,
  internal: 0.024,
};

/** 1 盎司铜对应的厚度（mil） */
export const OUNCE_TO_MIL = 1.378;

/** 1 mil 对应的毫米数 */
export const MIL_TO_MM = 0.0254;

export interface TraceWidthInput {
  /** 负载电流，单位安培 */
  current: number;
  /** 允许温升，单位摄氏度 */
  tempRise: number;
  /** 铜厚，单位盎司 */
  copperOunce: number;
  layer: LayerType;
}

export interface TraceWidthResult {
  /** 所需最小导线宽度（mil） */
  widthMil: number;
  /** 所需最小导线宽度（mm） */
  widthMm: number;
  /** 载流截面积（mil²） */
  areaMil2: number;
  /** 铜厚（mil） */
  thicknessMil: number;
  /** 截面积（mm²） */
  areaMm2: number;
}

export interface MaxCurrentInput {
  /** 导线宽度（mil） */
  widthMil: number;
  /** 允许温升，单位摄氏度 */
  tempRise: number;
  /** 铜厚，单位盎司 */
  copperOunce: number;
  layer: LayerType;
}

const assertPositive = (value: number, name: string): void => {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${name}必须为大于 0 的数值`);
  }
};

/** 盎司换算为 mil 厚度 */
export function ounceToMil(ounce: number): number {
  assertPositive(ounce, '铜厚');
  return ounce * OUNCE_TO_MIL;
}

/** 根据电流、温升、铜厚与层类型计算最小导线宽度 */
export function calculateTraceWidth(input: TraceWidthInput): TraceWidthResult {
  const { current, tempRise, copperOunce, layer } = input;
  assertPositive(current, '电流');
  assertPositive(tempRise, '温升');
  const thicknessMil = ounceToMil(copperOunce);

  const areaMil2 = Math.pow(
    current / (LAYER_K[layer] * Math.pow(tempRise, 0.44)),
    1 / 0.725,
  );
  const widthMil = areaMil2 / thicknessMil;

  return {
    widthMil,
    widthMm: widthMil * MIL_TO_MM,
    areaMil2,
    thicknessMil,
    areaMm2: areaMil2 * MIL_TO_MM * MIL_TO_MM,
  };
}

/** 根据导线宽度、温升、铜厚与层类型反推可持续承载的电流 */
export function calculateMaxCurrent(input: MaxCurrentInput): number {
  const { widthMil, tempRise, copperOunce, layer } = input;
  assertPositive(widthMil, '导线宽度');
  assertPositive(tempRise, '温升');
  const thicknessMil = ounceToMil(copperOunce);
  return LAYER_K[layer] * Math.pow(tempRise, 0.44) * Math.pow(widthMil * thicknessMil, 0.725);
}
