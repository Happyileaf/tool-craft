/**
 * Widmark 血液酒精浓度（BAC）估算的纯函数工具集。
 * 参考 Widmark 公式与 NHTSA 公开代谢参数，仅用于安全教育，不构成医学判断。
 */

/** 生理性别（决定 Widmark 分布因子 r 的默认值） */
export type Gender = 'male' | 'female';

/** 单份饮酒记录 */
export interface DrinkInput {
  /** 饮品名称（仅用于结果回显） */
  name: string;
  /** 容量，单位毫升 */
  volumeMl: number;
  /** 酒精度 ABV，百分数（如 5 表示 5%） */
  abvPercent: number;
  /** 份数 */
  quantity: number;
}

/** BAC 计算入参 */
export interface BacInput {
  /** 体重，单位千克 */
  weightKg: number;
  gender: Gender;
  /** 自定义 Widmark r 因子，缺省按性别取 0.68 / 0.55 */
  rFactor?: number;
  /** 每小时代谢下降的 BAC（g/100mL），缺省 0.015 */
  eliminationPerHour?: number;
  /** 从开始饮酒到测量经过的小时数 */
  elapsedHours: number;
  drinks: DrinkInput[];
}

/** 单份饮品的酒精核算明细 */
export interface DrinkDetail {
  name: string;
  /** 纯酒精质量，单位克（乙醇密度 0.789 g/mL） */
  alcoholGrams: number;
  /** 折合标准饮品份数（每份 14 g 纯酒精，NHTSA 口径） */
  standardDrinks: number;
}

/** BAC 计算结果 */
export interface BacResult {
  /** 各饮品酒精明细 */
  details: DrinkDetail[];
  /** 纯酒精总质量（克） */
  totalAlcoholGrams: number;
  /** 折合标准饮品总份数 */
  totalStandardDrinks: number;
  /** 采用的 Widmark r 因子 */
  rFactor: number;
  /** 未代谢的峰值 BAC（g/100mL） */
  peakBac: number;
  /** 经 elapsedHours 代谢后的当前 BAC（g/100mL），不会低于 0 */
  currentBac: number;
  /** 从当前 BAC 代谢到 0 还需的小时数 */
  hoursToSober: number;
  /** 从当前起预计完全清醒的时刻提示文案（由 UI 结合当前时间渲染） */
  eliminationPerHour: number;
}

/** 乙醇密度（g/mL，20°C） */
export const ETHANOL_DENSITY = 0.789;

/** 一份美国标准饮品的纯酒精质量（克） */
export const STANDARD_DRINK_GRAMS = 14;

/** 按性别的默认 Widmark 分布因子 */
export const DEFAULT_R_FACTOR: Record<Gender, number> = {
  male: 0.68,
  female: 0.55,
};

/** NHTSA 常用平均代谢速率（g/100mL 每小时） */
export const DEFAULT_ELIMINATION = 0.015;

/**
 * 计算单份饮品贡献的纯酒精质量。
 *
 * @param drink - 饮品记录
 * @returns 纯酒精克数
 */
export function alcoholGramsForDrink(drink: DrinkInput): number {
  if (drink.volumeMl < 0 || drink.abvPercent < 0 || drink.quantity < 0) {
    throw new Error('饮品容量、酒精度与份数必须为非负数');
  }
  const alcoholVolumeMl = drink.volumeMl * (drink.abvPercent / 100) * drink.quantity;
  return alcoholVolumeMl * ETHANOL_DENSITY;
}

/**
 * 按 Widmark 模型估算 BAC 与代谢时间。
 *
 * @param input - 体重、性别、时长与饮酒明细
 * @returns 酒精总量、峰值/当前 BAC 与清醒所需时间
 */
export function calculateBac(input: BacInput): BacResult {
  const { weightKg, gender, elapsedHours, drinks } = input;
  if (!Number.isFinite(weightKg) || weightKg <= 0) {
    throw new Error('体重必须为正数');
  }
  if (elapsedHours < 0) {
    throw new Error('经过时长不能为负');
  }

  const rFactor = input.rFactor ?? DEFAULT_R_FACTOR[gender];
  if (!(rFactor > 0)) {
    throw new Error('Widmark r 因子必须为正数');
  }
  const eliminationPerHour = input.eliminationPerHour ?? DEFAULT_ELIMINATION;
  if (!(eliminationPerHour > 0)) {
    throw new Error('代谢速率必须为正数');
  }

  const details: DrinkDetail[] = drinks.map((drink) => {
    const alcoholGrams = alcoholGramsForDrink(drink);
    return {
      name: drink.name,
      alcoholGrams,
      standardDrinks: alcoholGrams / STANDARD_DRINK_GRAMS,
    };
  });

  const totalAlcoholGrams = details.reduce((sum, item) => sum + item.alcoholGrams, 0);
  const totalStandardDrinks = totalAlcoholGrams / STANDARD_DRINK_GRAMS;

  // Widmark：BAC(g/100mL) = 酒精克数 / (体重 kg × r × 10)
  const peakBac = totalAlcoholGrams / (weightKg * rFactor * 10);
  const currentBac = Math.max(0, peakBac - eliminationPerHour * elapsedHours);
  const hoursToSober = currentBac / eliminationPerHour;

  return {
    details,
    totalAlcoholGrams,
    totalStandardDrinks,
    rFactor,
    peakBac,
    currentBac,
    hoursToSober,
    eliminationPerHour,
  };
}

/**
 * 把 BAC（g/100mL）换算为千分号表示（‰），数值相同仅单位展示不同。
 *
 * @param bac - g/100mL 口径的 BAC
 * @returns 千分比数值
 */
export function bacToPermille(bac: number): number {
  return bac * 10;
}

/**
 * 把小时数格式化为「x 小时 y 分钟」的中文时长。
 *
 * @param hours - 小时数
 * @returns 可读时长
 */
export function formatDurationHours(hours: number): string {
  if (hours <= 0) {
    return '0 分钟';
  }
  const totalMinutes = Math.round(hours * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h === 0) {
    return `${m} 分钟`;
  }
  return m === 0 ? `${h} 小时` : `${h} 小时 ${m} 分钟`;
}
