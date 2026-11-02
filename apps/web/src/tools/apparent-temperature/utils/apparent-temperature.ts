/**
 * 体感温度计算（美国国家气象局 NWS 官方公式）
 *
 * - 炎热侧：Rothfusz 回归多项式热指数（Heat Index），含低湿/高湿调整项
 * - 寒冷侧：2001 年美加联合风寒温度（Wind Chill）
 * - 所有内部计算均以华氏度 / 英里每小时进行，摄氏度输入先换算
 */

export type CalcMode = 'heat-index' | 'wind-chill';

export type TempUnit = 'C' | 'F';

export interface ApparentInput {
  /** 环境气温 */
  temperature: number;
  /** 热指数模式：相对湿度 0–100（%） */
  humidity: number;
  /** 风寒模式：风速 */
  windSpeed: number;
  unit: TempUnit;
}

export interface DangerLevel {
  /** 危险等级 key */
  key: string;
  /** 中文短标签 */
  label: string;
  /** 中文说明 */
  description: string;
  /** Ant Design Tag 语义色 */
  color: string;
}

export interface ApparentResult {
  /** 体感温度（与输入单位一致） */
  apparent: number;
  /** 体感温度（华氏度，内部原始结果） */
  apparentF: number;
  /** 使用的计算方法说明 */
  method: string;
  /** 危险等级 */
  level: DangerLevel;
  /** 输入校验错误信息；null 表示无错误 */
  error: string | null;
}

const C_TO_F = (c: number): number => (c * 9) / 5 + 32;
const F_TO_C = (f: number): number => ((f - 32) * 5) / 9;
const KMH_TO_MPH = (kmh: number): number => kmh / 1.609344;

/**
 * 计算 NWS Rothfusz 热指数（华氏度）
 *
 * 规则：
 * 1. 先算简单公式并与气温平均，平均值 < 80°F 时直接采用
 * 2. 否则使用 9 项回归多项式
 * 3. 低湿（RH<13，80≤T≤111）减调整项 ADJ1
 * 4. 高湿（RH>85，80≤T≤87）加调整项 ADJ2
 *
 * @param tempF - 气温（°F）
 * @param humidity - 相对湿度（%）
 * @returns 热指数（°F）与实际使用的方法
 */
export function heatIndexF(tempF: number, humidity: number): { value: number; method: string } {
  const rh = humidity;
  const simple = 0.5 * (tempF + 61.0 + (tempF - 68) * 1.2 + rh * 0.094);
  const average = (simple + tempF) / 2;

  if (average < 80) {
    return { value: average, method: 'simple' };
  }

  const t2 = tempF * tempF;
  const r2 = rh * rh;
  let hi =
    -42.379 +
    2.04901523 * tempF +
    10.14333127 * rh -
    0.22475541 * tempF * rh -
    0.00683783 * t2 -
    0.05481717 * r2 +
    0.00122874 * t2 * rh +
    0.00085282 * tempF * r2 -
    0.00000199 * t2 * r2;

  let method = 'regression';

  if (rh < 13 && tempF >= 80 && tempF <= 111) {
    const adjustment = ((13 - rh) / 4) * Math.sqrt((17 - Math.abs(tempF - 95)) / 17);
    hi -= adjustment;
    method = 'regression-dry';
  }

  if (rh > 85 && tempF >= 80 && tempF <= 87) {
    const adjustment = ((rh - 85) / 10) * ((87 - tempF) / 5);
    hi += adjustment;
    method = 'regression-humid';
  }

  return { value: hi, method };
}

/**
 * 计算 2001 版 NWS 风寒温度（华氏度）
 *
 * 仅当气温 ≤ 50°F 且风速 > 3 mph 时公式适用，否则返回 null。
 *
 * @param tempF - 气温（°F）
 * @param windMph - 风速（mph）
 * @returns 风寒温度（°F）；不适用时为 null
 */
export function windChillF(tempF: number, windMph: number): number | null {
  if (tempF > 50 || windMph <= 3) {
    return null;
  }
  const v16 = Math.pow(windMph, 0.16);
  return 35.74 + 0.6215 * tempF - 35.75 * v16 + 0.4275 * tempF * v16;
}

/**
 * 按 NWS 阈值给出热指数危险等级
 *
 * @param hiF - 热指数（°F）
 * @returns 危险等级
 */
export function heatDangerLevel(hiF: number): DangerLevel {
  if (hiF < 80) {
    return {
      key: 'safe',
      label: '安全',
      description: '无热相关疾病风险',
      color: 'green',
    };
  }
  if (hiF < 91) {
    return {
      key: 'caution',
      label: '注意',
      description: '长时间暴露或剧烈活动可能引起疲劳',
      color: 'gold',
    };
  }
  if (hiF < 104) {
      return {
      key: 'extreme-caution',
      label: '极小心',
      description: '可能发生热痉挛与热衰竭',
      color: 'orange',
    };
  }
  if (hiF < 126) {
    return {
      key: 'danger',
      label: '危险',
      description: '可能发生热痉挛、热衰竭甚至中暑',
      color: 'volcano',
    };
  }
  return {
    key: 'extreme-danger',
    label: '极度危险',
    description: '极易中暑，属紧急健康威胁',
    color: 'red',
  };
}

/**
 * 按 NWS 风寒图表给出风寒危险等级（阈值为华氏度）
 *
 * @param wcF - 风寒温度（°F）
 * @returns 危险等级
 */
export function windDangerLevel(wcF: number): DangerLevel {
  if (wcF >= 0) {
    return {
      key: 'safe',
      label: '安全',
      description: '不适风险较低，但仍需注意保暖',
      color: 'green',
    };
  }
  if (wcF >= -19) {
    return {
      key: 'caution',
      label: '注意',
      description: '长时间户外有冻伤风险，应穿着保暖衣物',
      color: 'gold',
    };
  }
  if (wcF >= -49) {
    return {
      key: 'danger',
      label: '危险',
      description: '暴露皮肤可在 30 分钟内冻伤，避免长时间户外活动',
      color: 'volcano',
    };
  }
  return {
    key: 'extreme-danger',
    label: '极度危险',
    description: '暴露皮肤可在 5 分钟内冻伤，应避免外出',
    color: 'red',
  };
}

const METHOD_LABELS: Record<CalcMode, Record<string, string>> = {
  'heat-index': {
    simple: '简单公式（热指数 < 80°F 的低温低湿情形）',
    regression: 'Rothfusz 回归多项式（NWS 标准热指数）',
    'regression-dry': '回归多项式 + 低湿调整项 ADJ1（RH < 13%）',
    'regression-humid': '回归多项式 + 高湿调整项 ADJ2（RH > 85%）',
  },
  'wind-chill': {
    standard: '2001 年美加联合风寒公式',
  },
};

/**
 * 体感温度统一入口：校验输入、换算单位并给出危险等级
 *
 * @param mode - heat-index（炎热侧）或 wind-chill（寒冷侧）
 * @param input - 温度 / 湿度 / 风速与单位
 * @returns 体感温度结果
 */
export function apparentTemperature(mode: CalcMode, input: ApparentInput): ApparentResult {
  const { temperature, humidity, windSpeed, unit } = input;
  const tempF = unit === 'C' ? C_TO_F(temperature) : temperature;

  if (mode === 'heat-index') {
    if (!Number.isFinite(temperature) || !Number.isFinite(humidity)) {
      return {
        apparent: NaN,
        apparentF: NaN,
        method: '',
        level: heatDangerLevel(0),
        error: '请输入有效的气温与相对湿度',
      };
    }
    if (humidity < 0 || humidity > 100) {
      return {
        apparent: NaN,
        apparentF: NaN,
        method: '',
        level: heatDangerLevel(0),
        error: '相对湿度必须在 0–100% 之间',
      };
    }
    if (tempF < 40) {
      return {
        apparent: NaN,
        apparentF: NaN,
        method: '',
        level: heatDangerLevel(0),
        error: '热指数公式适用于气温不低于 40°F（约 4°C）的环境',
      };
    }

    const { value, method } = heatIndexF(tempF, humidity);
    const apparent = unit === 'C' ? F_TO_C(value) : value;
    return {
      apparent,
      apparentF: value,
      method: METHOD_LABELS['heat-index'][method],
      level: heatDangerLevel(value),
      error: null,
    };
  }

  if (!Number.isFinite(temperature) || !Number.isFinite(windSpeed)) {
    return {
      apparent: NaN,
      apparentF: NaN,
      method: '',
      level: windDangerLevel(0),
      error: '请输入有效的气温与风速',
    };
  }
  if (windSpeed < 0) {
    return {
      apparent: NaN,
      apparentF: NaN,
      method: '',
      level: windDangerLevel(0),
      error: '风速不能为负数',
    };
  }
  if (windSpeed <= 3) {
    return {
      apparent: NaN,
      apparentF: NaN,
      method: '',
      level: windDangerLevel(0),
      error: '风速不超过 3 mph（约 4.8 km/h）时风寒效应可忽略，风寒公式不适用',
    };
  }
  if (tempF > 50) {
    return {
      apparent: NaN,
      apparentF: NaN,
      method: '',
      level: windDangerLevel(0),
      error: '气温高于 50°F（10°C）时不计算风寒温度，请改用热指数模式',
    };
  }

  const windMph = KMH_TO_MPH(windSpeed);
  const wc = windChillF(tempF, windMph);
  if (wc === null) {
    return {
      apparent: NaN,
      apparentF: NaN,
      method: '',
      level: windDangerLevel(0),
      error: '当前条件不在风寒公式适用范围内',
    };
  }
  const apparent = unit === 'C' ? F_TO_C(wc) : wc;
  return {
    apparent,
    apparentF: wc,
    method: METHOD_LABELS['wind-chill'].standard,
    level: windDangerLevel(wc),
    error: null,
  };
}
