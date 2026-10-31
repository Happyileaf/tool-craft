/**
 * BMI（身体质量指数）计算与分级纯函数
 *
 * BMI = 体重(kg) / 身高(m)²。本模块同时支持中国卫生行业标准
 * （WS/T 428）与 WHO 国际标准两套成人分级，并可把英制（英尺 / 英寸 / 磅）
 * 统一换算为公制后计算。健康体重区间由分级边界反解：weight = BMI × height²。
 */

import {
  BMI_RANGE,
  CHINA_THRESHOLDS,
  CM_PER_INCH,
  HEIGHT_RANGE_CM,
  INCHES_PER_FOOT,
  KG_PER_POUND,
  WEIGHT_RANGE_KG,
  WHO_THRESHOLDS,
} from '../constants';

/** 分级键（两套标准共用，仅边界不同） */
export type BmiCategory = 'underweight' | 'normal' | 'overweight' | 'obese';

/** 分级结果（带中文文案） */
export interface BmiGrade {
  /** 分级键 */
  category: BmiCategory;
  /** 中文分级名 */
  label: string;
  /** antd Tag 语义色 */
  color: string;
  /** 该分级 BMI 区间文本 */
  rangeText: string;
}

/** 健康体重区间（千克） */
export interface HealthyWeightRange {
  /** 下限（含，千克） */
  minKg: number;
  /** 上限（不含，千克；中国标准下正常区间为 [18.5, 24)） */
  maxKg: number;
}

/** BMI 完整计算结果 */
export interface BmiResult {
  /** BMI 值（kg/m²） */
  bmi: number;
  /** 身高（米） */
  heightM: number;
  /** 体重（千克） */
  weightKg: number;
  /** 中国标准分级 */
  chinaGrade: BmiGrade;
  /** WHO 标准分级 */
  whoGrade: BmiGrade;
  /** 按中国标准反解的正常体重区间 */
  healthyRange: HealthyWeightRange;
  /** 距正常区间中点还需增减的体重（正为需增重，负为需减重，千克） */
  deltaToNormalKg: number;
}

const CHINA_GRADE_META: Record<BmiCategory, { label: string; color: string }> = {
  underweight: { label: '偏瘦', color: 'blue' },
  normal: { label: '正常', color: 'green' },
  overweight: { label: '超重', color: 'orange' },
  obese: { label: '肥胖', color: 'red' },
};

const WHO_GRADE_LABEL: Record<BmiCategory, string> = {
  underweight: 'Underweight（偏瘦）',
  normal: 'Normal（正常）',
  overweight: 'Overweight（超重）',
  obese: 'Obese（肥胖）',
};

/**
 * 校验公制身高 / 体重
 *
 * @param heightCm - 身高（厘米）
 * @param weightKg - 体重（千克）
 * @throws 输入非有限正数或超出合理范围时抛出错误
 */
export function validateMetric(heightCm: number, weightKg: number): void {
  if (!Number.isFinite(heightCm) || heightCm <= 0) {
    throw new Error('身高必须为大于 0 的数值（厘米）');
  }
  if (!Number.isFinite(weightKg) || weightKg <= 0) {
    throw new Error('体重必须为大于 0 的数值（千克）');
  }
  if (heightCm < HEIGHT_RANGE_CM.min || heightCm > HEIGHT_RANGE_CM.max) {
    throw new Error(`身高超出合理范围（${HEIGHT_RANGE_CM.min}–${HEIGHT_RANGE_CM.max} cm）`);
  }
  if (weightKg < WEIGHT_RANGE_KG.min || weightKg > WEIGHT_RANGE_KG.max) {
    throw new Error(`体重超出合理范围（${WEIGHT_RANGE_KG.min}–${WEIGHT_RANGE_KG.max} kg）`);
  }
}

/**
 * 计算 BMI
 *
 * @param weightKg - 体重（千克）
 * @param heightCm - 身高（厘米）
 * @returns BMI 值（kg/m²）
 */
export function calcBmi(weightKg: number, heightCm: number): number {
  validateMetric(heightCm, weightKg);
  const heightM = heightCm / 100;
  return weightKg / (heightM * heightM);
}

/**
 * 英制身高换算为厘米
 *
 * @param feet - 整英尺数
 * @param inches - 剩余英寸数
 * @returns 身高（厘米）
 */
export function imperialHeightToCm(feet: number, inches: number): number {
  if (!Number.isFinite(feet) || !Number.isFinite(inches) || feet < 0 || inches < 0) {
    throw new Error('英尺与英寸必须为非负数值');
  }
  return (feet * INCHES_PER_FOOT + inches) * CM_PER_INCH;
}

/**
 * 磅换算为千克
 *
 * @param pounds - 体重（磅）
 * @returns 体重（千克）
 */
export function poundsToKg(pounds: number): number {
  if (!Number.isFinite(pounds) || pounds <= 0) {
    throw new Error('体重必须为大于 0 的数值（磅）');
  }
  return pounds * KG_PER_POUND;
}

/**
 * 按中国成人标准判定 BMI 分级
 *
 * 边界：偏瘦 < 18.5；正常 [18.5, 24)；超重 [24, 28)；肥胖 ≥ 28。
 *
 * @param bmi - BMI 值
 * @returns 分级结果
 */
export function gradeChina(bmi: number): BmiGrade {
  if (bmi < CHINA_THRESHOLDS.underweight) {
    return {
      category: 'underweight',
      ...CHINA_GRADE_META.underweight,
      rangeText: `< ${CHINA_THRESHOLDS.underweight}`,
    };
  }
  if (bmi < CHINA_THRESHOLDS.overweight) {
    return {
      category: 'normal',
      ...CHINA_GRADE_META.normal,
      rangeText: `${CHINA_THRESHOLDS.underweight} – ${CHINA_THRESHOLDS.overweight}`,
    };
  }
  if (bmi < CHINA_THRESHOLDS.obese) {
    return {
      category: 'overweight',
      ...CHINA_GRADE_META.overweight,
      rangeText: `${CHINA_THRESHOLDS.overweight} – ${CHINA_THRESHOLDS.obese}`,
    };
  }
  return {
    category: 'obese',
    ...CHINA_GRADE_META.obese,
    rangeText: `≥ ${CHINA_THRESHOLDS.obese}`,
  };
}

/**
 * 按 WHO 成人标准判定 BMI 分级
 *
 * 边界：偏瘦 < 18.5；正常 [18.5, 25)；超重 [25, 30)；肥胖 ≥ 30。
 *
 * @param bmi - BMI 值
 * @returns 分级结果
 */
export function gradeWho(bmi: number): BmiGrade {
  const meta = CHINA_GRADE_META;
  if (bmi < WHO_THRESHOLDS.underweight) {
    return {
      category: 'underweight',
      label: WHO_GRADE_LABEL.underweight,
      color: meta.underweight.color,
      rangeText: `< ${WHO_THRESHOLDS.underweight}`,
    };
  }
  if (bmi < WHO_THRESHOLDS.normal) {
    return {
      category: 'normal',
      label: WHO_GRADE_LABEL.normal,
      color: meta.normal.color,
      rangeText: `${WHO_THRESHOLDS.underweight} – ${WHO_THRESHOLDS.normal}`,
    };
  }
  if (bmi < WHO_THRESHOLDS.overweight) {
    return {
      category: 'overweight',
      label: WHO_GRADE_LABEL.overweight,
      color: meta.overweight.color,
      rangeText: `${WHO_THRESHOLDS.normal} – ${WHO_THRESHOLDS.overweight}`,
    };
  }
  return {
    category: 'obese',
    label: WHO_GRADE_LABEL.obese,
    color: meta.obese.color,
    rangeText: `≥ ${WHO_THRESHOLDS.overweight}`,
  };
}

/**
 * 由身高反解某 BMI 边界对应的体重
 *
 * @param heightCm - 身高（厘米）
 * @param bmiBoundary - BMI 边界值
 * @returns 体重（千克）
 */
export function weightAtBmi(heightCm: number, bmiBoundary: number): number {
  const heightM = heightCm / 100;
  return bmiBoundary * heightM * heightM;
}

/**
 * 计算 BMI 完整结果（双标准分级 + 中国标准正常体重区间）
 *
 * @param heightCm - 身高（厘米）
 * @param weightKg - 体重（千克）
 * @returns BMI、双标准分级、健康体重区间与差值
 */
export function evaluateBmi(heightCm: number, weightKg: number): BmiResult {
  const bmi = calcBmi(weightKg, heightCm);
  if (bmi < BMI_RANGE.min || bmi > BMI_RANGE.max) {
    throw new Error(`BMI 超出合理范围（${BMI_RANGE.min}–${BMI_RANGE.max}），请核对输入`);
  }
  const heightM = heightCm / 100;
  const minKg = weightAtBmi(heightCm, CHINA_THRESHOLDS.underweight);
  const maxKg = weightAtBmi(heightCm, CHINA_THRESHOLDS.overweight);
  const targetKg = (minKg + maxKg) / 2;

  return {
    bmi,
    heightM,
    weightKg,
    chinaGrade: gradeChina(bmi),
    whoGrade: gradeWho(bmi),
    healthyRange: { minKg, maxKg },
    deltaToNormalKg: targetKg - weightKg,
  };
}
