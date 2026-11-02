/**
 * 以太坊单位换算与 Gas 费用计算纯函数（零依赖、BigInt 整数内核）。
 *
 * 以太坊所有单位都是 Wei 的 10 的幂：1 ETH = 10^18 Wei、1 Gwei = 10^9 Wei。
 * JavaScript Number 只有 53 位安全整数，无法精确表示 Wei 级金额，
 * 因此内部一律使用 BigInt 保存 Wei；输入的小数（如 "0.00042 ETH"、
 * "20.5 Gwei"）按十进制字符串解析为「尾数 × 10^指数」的整数形式，
 * 全程不经过浮点。
 */

export interface EthUnit {
  /** 单位标识（Wei/Gwei/ETH…） */
  name: string;
  /** 相对 Wei 的 10 次幂指数 */
  factor: number;
  /** 说明 */
  description: string;
}

/** 以太坊常用单位表（按指数升序），与 web3.js/ethers 命名一致 */
export const ETH_UNITS: EthUnit[] = [
  { name: 'Wei', factor: 0, description: '最小原子单位' },
  { name: 'Kwei', factor: 3, description: '千 Wei（babbage）' },
  { name: 'Mwei', factor: 6, description: '百万 Wei（lovelace）' },
  { name: 'Gwei', factor: 9, description: '10⁹ Wei，Gas 报价单位（shannon）' },
  { name: 'Szabo', factor: 12, description: '10¹² Wei' },
  { name: 'Finney', factor: 15, description: '10⁻³ ETH' },
  { name: 'ETH', factor: 18, description: 'Ether，10¹⁸ Wei' },
  { name: 'Kether', factor: 21, description: '千 ETH' },
  { name: 'Mether', factor: 24, description: '千 Kether' },
  { name: 'Gether', factor: 27, description: '十亿 ETH' },
  { name: 'Tether', factor: 30, description: '万亿 ETH' },
];

const ZERO = BigInt(0);
const TEN = BigInt(10);

function power10(exp: number): bigint {
  return TEN ** BigInt(exp);
}

/**
 * 把十进制小数字符串解析为 BigInt 数值与该单位的小数位数。
 * 接受 "1"、"1.23"、"00.50"、"1_000.25"；不接受科学计数法、负号、非数字。
 */
export function parseDecimal(input: string): { value: bigint; decimals: number } {
  const cleaned = input.trim().replace(/_/g, '');
  if (cleaned === '') {
    throw new Error('请输入数值');
  }
  if (!/^\d+(\.\d+)?$/.test(cleaned)) {
    throw new Error('仅支持非负十进制数字（可含小数点），不支持科学计数法');
  }
  const [intPart, fracPart = ''] = cleaned.split('.');
  // 正则已保证 intPart 为非空数字串；BigInt 字符串允许前导零
  return {
    value: BigInt(`${intPart}${fracPart}`),
    decimals: fracPart.length,
  };
}

/**
 * 任意单位的十进制输入 → Wei（BigInt）。
 * 输入小数位多于该单位指数时（Wei 精度以下）抛错，避免静默丢精度。
 */
export function toWei(amount: string, unit: EthUnit): bigint {
  const { value, decimals } = parseDecimal(amount);
  if (decimals > unit.factor) {
    throw new Error(
      `${unit.name} 最多支持 ${unit.factor} 位小数（更低位超出 Wei 精度）`,
    );
  }
  return value * power10(unit.factor - decimals);
}

/**
 * Wei（BigInt）→ 指定单位的十进制字符串（不丢精度，末尾多余的 0 去掉）。
 */
export function fromWei(wei: bigint, unit: EthUnit): string {
  const negative = wei < ZERO;
  const abs = negative ? -wei : wei;
  const scale = power10(unit.factor);
  const whole = abs / scale;
  const frac = abs % scale;
  const sign = negative ? '-' : '';
  if (frac === ZERO) {
    return `${sign}${whole.toString()}`;
  }
  const fracText = frac.toString().padStart(unit.factor, '0').replace(/0+$/, '');
  return `${sign}${whole.toString()}.${fracText}`;
}

/** 两单位之间直接换算（便捷封装），返回目标单位的十进制字符串 */
export function convertUnit(
  amount: string,
  from: EthUnit,
  to: EthUnit,
): string {
  return fromWei(toWei(amount, from), to);
}

/** 千分位分组：1234567.89 → "1,234,567.89"（仅给整数部分加分隔符） */
export function groupThousands(text: string): string {
  const negative = text.startsWith('-');
  const body = negative ? text.slice(1) : text;
  const [intPart, fracPart] = body.split('.');
  const grouped = (intPart ?? '0').replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${negative ? '-' : ''}${grouped}${fracPart !== undefined ? `.${fracPart}` : ''}`;
}

/** 固定保留指定小数位（四舍五入到该位），用于法币等展示场景 */
export function formatFixed(text: string, digits: number): string {
  const neg = text.startsWith('-');
  const body = neg ? text.slice(1) : text;
  const [intPart, fracPart = ''] = body.split('.');
  if (fracPart.length <= digits) {
    return `${neg ? '-' : ''}${intPart}.${fracPart.padEnd(digits, '0')}`;
  }
  // 四舍五入
  const kept = fracPart.slice(0, digits);
  const roundUp = fracPart[digits]! >= '5';
  let value = BigInt(`${intPart}${kept.padStart(digits, '0')}` || '0') + (roundUp ? BigInt(1) : BigInt(0));
  const scale = power10(digits);
  const whole = value / scale;
  const frac = (value % scale).toString().padStart(digits, '0');
  return `${neg ? '-' : ''}${whole.toString()}.${frac}`;
}

/** 解析正整数（gas 用量 / gas limit） */
export function parsePositiveInt(text: string, label: string): bigint {
  const cleaned = text.trim().replace(/_/g, '');
  if (cleaned === '') {
    throw new Error(`请输入${label}`);
  }
  if (!/^\d+$/.test(cleaned)) {
    throw new Error(`${label}必须是非负整数`);
  }
  return BigInt(cleaned);
}

export interface LegacyGasFee {
  /** 费用（Wei） */
  wei: bigint;
  /** 费用（Gwei） */
  gwei: string;
  /** 费用（ETH） */
  eth: string;
}

/**
 * 传统 Gas 费用：gasUsed × gasPrice(Gwei)。
 * 例如 21000 × 20 Gwei = 420000 Gwei = 0.00042 ETH。
 */
export function legacyGasFee(gasUsedText: string, gasPriceGwei: string): LegacyGasFee {
  const gasUsed = parsePositiveInt(gasUsedText, 'Gas 用量');
  const gweiUnit = ETH_UNITS.find((u) => u.name === 'Gwei')!;
  const priceWei = toWei(gasPriceGwei, gweiUnit);
  const wei = gasUsed * priceWei;
  const ethUnit = ETH_UNITS.find((u) => u.name === 'ETH')!;
  return {
    wei,
    gwei: fromWei(wei, gweiUnit),
    eth: fromWei(wei, ethUnit),
  };
}

export interface Eip1559GasFee {
  /** 实际优先费（Wei）：gasUsed × priorityFee（baseFee 被燃烧） */
  priorityWei: bigint;
  priorityEth: string;
  /** 基础费燃烧（Wei）：gasUsed × baseFee（按已用量估算） */
  baseWei: bigint;
  baseEth: string;
  /** 按已用量估算的实际总费（Wei）：gasUsed × (baseFee + priorityFee) */
  totalWei: bigint;
  totalEth: string;
  /** 钱包授权上限（Wei）：gasLimit × maxFeePerGas */
  maxWei: bigint;
  maxEth: string;
}

/**
 * EIP-1559（伦敦升级后）费用估算。
 * 输入均为 Gwei 字符串：baseFee、priorityFee（tip）、maxFee、gasUsed、gasLimit。
 * 校验 maxFee >= baseFee + priorityFee 的常见配置关系（不满足时给警告而非报错，
 * 因为实际 baseFee 可能波动），由调用方决定展示。
 */
export function eip1559GasFee(params: {
  baseFeeGwei: string;
  priorityFeeGwei: string;
  maxFeeGwei: string;
  gasUsedText: string;
  gasLimitText: string;
}): Eip1559GasFee & { warning: string | null } {
  const gweiUnit = ETH_UNITS.find((u) => u.name === 'Gwei')!;
  const ethUnit = ETH_UNITS.find((u) => u.name === 'ETH')!;
  const base = toWei(params.baseFeeGwei, gweiUnit);
  const priority = toWei(params.priorityFeeGwei, gweiUnit);
  const max = toWei(params.maxFeeGwei, gweiUnit);
  const gasUsed = parsePositiveInt(params.gasUsedText, 'Gas 已用量');
  const gasLimit = parsePositiveInt(params.gasLimitText, 'Gas 上限');

  const priorityWei = gasUsed * priority;
  const baseWei = gasUsed * base;
  const totalWei = gasUsed * (base + priority);
  const maxWei = gasLimit * max;

  let warning: string | null = null;
  if (max < base + priority) {
    warning =
      'Max fee 低于 base fee + priority fee：当前 base fee 下该交易可能无法被打包（base fee 波动后或可成交）';
  }
  if (gasUsed > gasLimit) {
    warning = warning ?? 'Gas 已用量超过 Gas 上限，实际交易将回滚';
  }

  return {
    priorityWei,
    priorityEth: fromWei(priorityWei, ethUnit),
    baseWei,
    baseEth: fromWei(baseWei, ethUnit),
    totalWei,
    totalEth: fromWei(totalWei, ethUnit),
    maxWei,
    maxEth: fromWei(maxWei, ethUnit),
    warning,
  };
}
