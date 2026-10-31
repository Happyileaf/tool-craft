/**
 * BMI 计算器常量
 */

/** 1 英寸对应的厘米数 */
export const CM_PER_INCH = 2.54;

/** 1 磅（常衡制）对应的千克数 */
export const KG_PER_POUND = 0.45359237;

/** 1 英尺对应的英寸数 */
export const INCHES_PER_FOOT = 12;

/** 中国成人 BMI 分级阈值（kg/m²） */
export const CHINA_THRESHOLDS = {
  underweight: 18.5,
  overweight: 24,
  obese: 28,
} as const;

/** WHO 成人 BMI 分级阈值（kg/m²） */
export const WHO_THRESHOLDS = {
  underweight: 18.5,
  normal: 25,
  overweight: 30,
} as const;

/** 默认身高（厘米） */
export const DEFAULT_HEIGHT_CM = 170;

/** 默认体重（千克） */
export const DEFAULT_WEIGHT_KG = 65;

/** 身高输入步长（厘米） */
export const HEIGHT_STEP_CM = 1;

/** 体重输入步长（千克） */
export const WEIGHT_STEP_KG = 0.5;

/** 合理身高范围（厘米），用于输入校验 */
export const HEIGHT_RANGE_CM = { min: 50, max: 300 } as const;

/** 合理体重范围（千克），用于输入校验 */
export const WEIGHT_RANGE_KG = { min: 2, max: 1000 } as const;

/** BMI 输入合法范围（kg/m²） */
export const BMI_RANGE = { min: 5, max: 100 } as const;

/** 示例数据预设 */
export interface BmiPreset {
  /** 预设名 */
  name: string;
  /** 身高（厘米） */
  heightCm: number;
  /** 体重（千克） */
  weightKg: number;
}

/** 一键填充示例 */
export const BMI_PRESETS: BmiPreset[] = [
  { name: '偏瘦示例 175cm / 54kg', heightCm: 175, weightKg: 54 },
  { name: '正常示例 170cm / 65kg', heightCm: 170, weightKg: 65 },
  { name: '超重示例 170cm / 74kg', heightCm: 170, weightKg: 74 },
  { name: '肥胖示例 165cm / 82kg', heightCm: 165, weightKg: 82 },
];
