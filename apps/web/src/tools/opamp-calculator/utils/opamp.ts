/**
 * 理想运算放大器电路计算纯函数
 *
 * 基于理想运放「虚短」（V+ = V−）与「虚断」（输入电流为 0）两条假设，
 * 覆盖反相放大器、同相放大器、反相加法器与差分放大器四种经典负反馈拓扑。
 * 所有函数不触碰 DOM、不依赖第三方库，错误以抛出异常方式由调用方捕获。
 */

/** 支持的电路拓扑标识 */
export type OpAmpTopology = 'inverting' | 'nonInverting' | 'summing' | 'differential';

/** 数值解析结果 */
export interface ParsedQuantity {
  /** 解析后的 SI 基准单位数值（电阻为 Ω，电压为 V） */
  value: number;
  /** 归一化后的单位 */
  unit: string;
}

/**
 * 解析带工程单位后缀的电阻值。
 * 支持：纯数字（Ω）、k/K（kΩ）、m/M（MΩ），可带或不带 Ω 符号。
 *
 * @param input 用户输入
 * @returns 欧姆值
 * @throws 空、非数字、零或负值时抛错
 */
export function parseResistance(input: string): number {
  const trimmed = input.trim();
  if (trimmed === '') {
    throw new Error('电阻值不能为空');
  }
  const match = /^([+-]?\d*\.?\d+(?:[eE][+-]?\d+)?)\s*([kKmM]?)\s*[ΩoO]?$/.exec(trimmed);
  if (!match) {
    throw new Error(`「${input}」不是合法电阻值，请输入如 10k、10kΩ、2.2M 的数值`);
  }
  const numeric = Number.parseFloat(match[1] as string);
  const suffix = (match[2] as string).toLowerCase();
  if (!Number.isFinite(numeric)) {
    throw new Error(`「${input}」解析出的数值无效`);
  }
  if (numeric <= 0) {
    throw new Error('电阻值必须大于 0');
  }
  const multiplier = suffix === 'k' ? 1e3 : suffix === 'm' ? 1e6 : 1;
  return numeric * multiplier;
}

/**
 * 解析带单位后缀的电压值。
 * 支持：纯数字（V）、mV（毫伏）、kV（千伏），可带或不带 V 符号。
 *
 * @param input 用户输入
 * @returns 伏特值
 * @throws 空或非数字时抛错
 */
export function parseVoltage(input: string): number {
  const trimmed = input.trim();
  if (trimmed === '') {
    throw new Error('电压值不能为空');
  }
  const match = /^([+-]?\d*\.?\d+(?:[eE][+-]?\d+)?)\s*(m|k)?\s*[vV]?$/.exec(trimmed);
  if (!match) {
    throw new Error(`「${input}」不是合法电压值，请输入如 0.5、200mV、1.5V 的数值`);
  }
  const numeric = Number.parseFloat(match[1] as string);
  const suffix = (match[2] ?? '').toLowerCase();
  if (!Number.isFinite(numeric)) {
    throw new Error(`「${input}」解析出的数值无效`);
  }
  const multiplier = suffix === 'm' ? 1e-3 : suffix === 'k' ? 1e3 : 1;
  return numeric * multiplier;
}

/** 断言计算结果为有限数，防止溢出产生 NaN/Infinity */
function assertFinite(value: number, label: string): number {
  if (!Number.isFinite(value)) {
    throw new Error(`${label}计算结果超出有效数值范围，请检查输入数量级`);
  }
  return value;
}

/** 反相放大器结果 */
export interface InvertingResult {
  gain: number;
  vOut: number;
  inputImpedance: number;
  feedbackCurrent: number;
}

/**
 * 反相放大器：Av = −Rf/Rin，Vout = Av·Vin，输入阻抗 ≈ Rin。
 *
 * @param vinInput 输入电压
 * @param rinInput 输入电阻 Rin
 * @param rfInput 反馈电阻 Rf
 */
export function calcInverting(vinInput: string, rinInput: string, rfInput: string): InvertingResult {
  const vin = parseVoltage(vinInput);
  const rin = parseResistance(rinInput);
  const rf = parseResistance(rfInput);
  const gain = assertFinite(-rf / rin, '增益');
  const vOut = assertFinite(gain * vin, '输出电压');
  // 虚地：反相端电位为 0，反馈电流 = (0 − Vout)/Rf
  const feedbackCurrent = assertFinite((0 - vOut) / rf, '反馈电流');
  return { gain, vOut, inputImpedance: rin, feedbackCurrent };
}

/** 同相放大器结果 */
export interface NonInvertingResult {
  gain: number;
  vOut: number;
  feedbackCurrent: number;
}

/**
 * 同相放大器：Av = 1 + Rf/Rg，Vout = Av·Vin。
 *
 * @param vinInput 输入电压（加在同相端）
 * @param rgInput 接地电阻 Rg
 * @param rfInput 反馈电阻 Rf
 */
export function calcNonInverting(vinInput: string, rgInput: string, rfInput: string): NonInvertingResult {
  const vin = parseVoltage(vinInput);
  const rg = parseResistance(rgInput);
  const rf = parseResistance(rfInput);
  const gain = assertFinite(1 + rf / rg, '增益');
  const vOut = assertFinite(gain * vin, '输出电压');
  // 虚短：V− = V+ = Vin；反馈支路电流 = (Vout − Vin)/Rf
  const feedbackCurrent = assertFinite((vOut - vin) / rf, '反馈电流');
  return { gain, vOut, feedbackCurrent };
}

/** 加法器单通道输入 */
export interface SummingChannel {
  /** 通道输入电压文本 */
  voltage: string;
  /** 通道输入电阻文本 */
  resistance: string;
}

/** 反相加法器结果 */
export interface SummingResult {
  vOut: number;
  /** 各通道电流（A） */
  channelCurrents: number[];
  /** 参与求和的有效通道数 */
  channelCount: number;
}

/**
 * 反相加法器：Vout = −Rf·Σ(Vi/Ri)。
 *
 * @param channels 2–4 个通道
 * @param rfInput 反馈电阻 Rf
 */
export function calcSumming(channels: SummingChannel[], rfInput: string): SummingResult {
  const rf = parseResistance(rfInput);
  const active = channels.filter((channel) => channel.voltage.trim() !== '' || channel.resistance.trim() !== '');
  if (active.length === 0) {
    throw new Error('请至少填写一个有效输入通道（电压与电阻）');
  }
  let sum = 0;
  const channelCurrents: number[] = [];
  active.forEach((channel, index) => {
    const vi = parseVoltage(channel.voltage);
    const ri = parseResistance(channel.resistance);
    const current = vi / ri;
    if (!Number.isFinite(current)) {
      throw new Error(`第 ${index + 1} 通道电流计算无效`);
    }
    channelCurrents.push(current);
    sum += current;
  });
  const vOut = assertFinite(-rf * sum, '输出电压');
  return { vOut, channelCurrents, channelCount: active.length };
}

/** 差分放大器结果 */
export interface DifferentialResult {
  vOut: number;
  gain: number;
  /** 电阻网络是否匹配（Rf/R1 = Rg2/Rg1） */
  matched: boolean;
  /** 不匹配程度（相对偏差，百分比；匹配时为 0） */
  mismatchPercent: number;
  feedbackCurrent: number;
}

/**
 * 差分放大器（四电阻网络）。
 * 匹配条件 Rf/R1 = Rg2/Rg1 下：Vout = (Rf/R1)·(V2 − V1)。
 * 不匹配时使用通用节点公式并给出警告。
 *
 * @param v1Input 反相侧输入电压
 * @param v2Input 同相侧输入电压
 * @param r1Input 反相侧输入电阻 R1
 * @param rfInput 反相侧反馈电阻 Rf
 * @param rg1Input 同相侧输入电阻 Rg1（串接 V2 与同相端）
 * @param rg2Input 同相侧接地电阻 Rg2（同相端到地）
 */
export function calcDifferential(
  v1Input: string,
  v2Input: string,
  r1Input: string,
  rfInput: string,
  rg1Input: string,
  rg2Input: string,
): DifferentialResult {
  const v1 = parseVoltage(v1Input);
  const v2 = parseVoltage(v2Input);
  const r1 = parseResistance(r1Input);
  const rf = parseResistance(rfInput);
  const rg1 = parseResistance(rg1Input);
  const rg2 = parseResistance(rg2Input);

  const ratioInverting = rf / r1;
  const ratioNonInverting = rg2 / rg1;
  const mismatchPercent = Math.abs(ratioInverting - ratioNonInverting) / Math.max(ratioInverting, ratioNonInverting) * 100;
  const matched = mismatchPercent < 1e-9;

  // 同相端分压：V+ = V2 · Rg2/(Rg1+Rg2)
  const vPlus = (v2 * rg2) / (rg1 + rg2);
  // 通用公式（叠加 + 虚短 V− = V+）：Vout = V+·(1 + Rf/R1) − V1·Rf/R1
  const vOut = assertFinite(vPlus * (1 + rf / r1) - v1 * (rf / r1), '输出电压');
  const gain = assertFinite(v2 - v1 === 0 ? ratioInverting : vOut / (v2 - v1), '增益');
  // 反馈支路电流：(V− − Vout)/Rf，虚短 V− = V+
  const feedbackCurrent = assertFinite((vPlus - vOut) / rf, '反馈电流');

  return { vOut, gain, matched, mismatchPercent, feedbackCurrent };
}

/** E24 标称阻值系数（×10^n 覆盖各数量级） */
export const E24_BASE = [
  1.0, 1.1, 1.2, 1.3, 1.5, 1.6, 1.8, 2.0, 2.2, 2.4, 2.7, 3.0, 3.3, 3.6, 3.9, 4.3, 4.7, 5.1,
  5.6, 6.2, 6.8, 7.5, 8.2, 9.1,
];

/** 反推电阻建议结果 */
export interface ResistorRecommendation {
  /** 目标比值（Rf/Rin 或 Rf/Rg） */
  ratio: number;
  /** 基准电阻（Rin 或 Rg），固定建议 10 kΩ */
  baseResistance: number;
  /** 推荐反馈电阻理论值（Ω） */
  feedbackTarget: number;
  /** 最接近的 E24 标称反馈电阻（Ω） */
  feedbackE24: number;
  /** 采用 E24 后的实际增益 */
  achievedGain: number;
}

/**
 * 由目标闭环增益反推电阻比值与 E24 标称阻值建议。
 *
 * @param targetGain 目标增益（反相拓扑传负数，同相拓扑传正数且须 > 1）
 * @param topology 拓扑类型（仅支持反相 / 同相）
 */
export function recommendResistors(targetGain: number, topology: 'inverting' | 'nonInverting'): ResistorRecommendation {
  if (!Number.isFinite(targetGain)) {
    throw new Error('目标增益必须为有限数值');
  }
  const baseResistance = 10e3;
  let ratio: number;
  if (topology === 'inverting') {
    if (targetGain >= 0) {
      throw new Error('反相放大器目标增益应为负数（如 −10）');
    }
    ratio = Math.abs(targetGain); // Rf/Rin = |Av|
  } else {
    if (targetGain <= 1) {
      throw new Error('同相放大器目标增益必须大于 1');
    }
    ratio = targetGain - 1; // Rf/Rg = Av − 1
  }
  const feedbackTarget = ratio * baseResistance;
  const feedbackE24 = nearestE24(feedbackTarget);
  const achievedRatio = feedbackE24 / baseResistance;
  const achievedGain = topology === 'inverting' ? -achievedRatio : 1 + achievedRatio;
  return { ratio, baseResistance, feedbackTarget, feedbackE24, achievedGain };
}

/**
 * 在 E24 标称序列中找与目标阻值最接近的标称值。
 *
 * @param targetOhm 目标阻值（Ω）
 * @returns 最接近的 E24 标称阻值（Ω）
 */
export function nearestE24(targetOhm: number): number {
  if (targetOhm <= 0 || !Number.isFinite(targetOhm)) {
    throw new Error('目标阻值必须为大于 0 的有限数');
  }
  const decade = Math.floor(Math.log10(targetOhm));
  const baseScale = 10 ** decade;
  let best = E24_BASE[0] as number;
  let bestError = Number.POSITIVE_INFINITY;
  // 在相邻两个数量级内搜索，避免边界误差
  for (const scale of [baseScale / 10, baseScale, baseScale * 10]) {
    for (const coefficient of E24_BASE) {
      const candidate = coefficient * scale;
      const error = Math.abs(Math.log(candidate) - Math.log(targetOhm));
      if (error < bestError) {
        bestError = error;
        best = candidate;
      }
    }
  }
  return best;
}

/**
 * 按合理有效数字格式化数值（工程展示用）。
 *
 * @param value 数值
 * @param maxDigits 最大有效数字位数
 */
export function formatEngineering(value: number, maxDigits = 4): string {
  if (!Number.isFinite(value)) return '—';
  const abs = Math.abs(value);
  if (abs !== 0 && (abs < 1e-4 || abs >= 1e7)) {
    return value.toExponential(3);
  }
  const rounded = Number.parseFloat(value.toPrecision(maxDigits));
  return String(rounded);
}
