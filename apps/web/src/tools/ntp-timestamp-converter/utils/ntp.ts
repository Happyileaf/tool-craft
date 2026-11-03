/**
 * NTP 64 位时间戳换算
 *
 * NTP 时间戳为 64 位无符号定点数：高 32 位是自 1900-01-01 UTC 起的秒数，
 * 低 32 位是秒的小数部分（分辨率约 2.33e-10 秒）。
 *
 * 注意 2036-02-07T06:28:16Z 会发生第一次秒字段回卷（era rollover）。
 */

/** NTP 纪元（1900-01-01T00:00:00Z）与 Unix 纪元（1970-01-01T00:00:00Z）相差 70 年的秒数（含 17 个闰日） */
export const NTP_EPOCH_OFFSET_SECONDS = 2208988800;

/** 32 位小数部分的比例因子 2^32 */
export const NTP_FRACTION_SCALE = 4294967296;

/** 第一次 NTP 秒字段回卷的 Unix 毫秒时间戳（2036-02-07T06:28:16Z） */
export const NTP_ROLLOVER_UNIX_MS = Date.UTC(2036, 1, 7, 6, 28, 16);

/**
 * 将 NTP 原始 64 位值（BigInt）换算为 Unix 毫秒
 *
 * @param value - NTP 时间戳原始无符号 64 位值
 * @param era - 回卷纪年号，0 表示 1900–2036，1 表示 2036–2152
 * @returns Unix 毫秒时间戳
 */
const BIGINT_32 = BigInt(32);
const BIGINT_32_MASK = BigInt(0xffffffff);

export function ntpToUnixMs(value: bigint, era = 0): number {
  const seconds = Number((value >> BIGINT_32) & BIGINT_32_MASK) + era * NTP_FRACTION_SCALE;
  const fraction = Number(value & BIGINT_32_MASK);
  return Math.round((seconds - NTP_EPOCH_OFFSET_SECONDS) * 1000 + (fraction * 1000) / NTP_FRACTION_SCALE);
}

/**
 * 将 Unix 毫秒换算为 NTP 原始 64 位值（默认按当前纪元截断到 64 位）
 *
 * @param unixMs - Unix 毫秒时间戳
 * @returns NTP 时间戳原始值与所在纪年号
 */
export function unixMsToNtp(unixMs: number): { value: bigint; era: number } {
  const unixSeconds = unixMs / 1000;
  const ntpSecondsFloat = unixSeconds + NTP_EPOCH_OFFSET_SECONDS;
  const era = Math.max(0, Math.floor(ntpSecondsFloat / NTP_FRACTION_SCALE));
  const secondsInEra = Math.floor(ntpSecondsFloat) % NTP_FRACTION_SCALE;
  const fraction = Math.round(((ntpSecondsFloat - Math.floor(ntpSecondsFloat)) * NTP_FRACTION_SCALE) % NTP_FRACTION_SCALE);
  return {
    value: (BigInt(secondsInEra) << BIGINT_32) | BigInt(fraction),
    era,
  };
}

/**
 * 解析常见写法的 NTP 时间戳
 *
 * 支持：
 * - 十进制整数（uint64，可能超过 Number.MAX_SAFE_INTEGER，按 BigInt 解析）
 * - 0x 前缀的十六进制（最多 16 个十六进制字符）
 * - 点分十进制（seconds.fraction，两部分均为十进制）
 *
 * @param text - 输入文本
 * @returns 解析出的原始 64 位值；非法输入返回 null
 */
export function parseNtpInput(text: string): bigint | null {
  const input = text.trim().toLowerCase();
  if (!input) {
    return null;
  }

  if (input.startsWith('0x')) {
    const hex = input.slice(2);
    if (!/^[0-9a-f]{1,16}$/.test(hex)) {
      return null;
    }
    return BigInt(`0x${hex}`);
  }

  if (input.includes('.')) {
    const parts = input.split('.');
    const secText = parts[0] ?? '';
    const fracText = parts[1] ?? '';
    if (parts.length !== 2 || !/^\d+$/.test(secText) || !/^\d+$/.test(fracText)) {
      return null;
    }
    const seconds = BigInt(secText);
    // 小数十进制串 -> 32 位定点小数：fraction / 10^k * 2^32
    const decimalDivisor = BigInt(10) ** BigInt(fracText.length);
    const fraction = (BigInt(fracText) * BigInt(NTP_FRACTION_SCALE)) / decimalDivisor;
    return (seconds << BIGINT_32) | fraction;
  }

  if (/^\d+$/.test(input)) {
    return BigInt(input);
  }

  return null;
}

/** 格式化为 UTC ISO 字符串（毫秒精度） */
export function formatUtcIso(unixMs: number): string {
  return new Date(unixMs).toISOString();
}

/** 格式化为北京时间（UTC+8）字符串 */
export function formatBeijing(unixMs: number): string {
  return new Date(unixMs).toLocaleString('zh-CN', {
    timeZone: 'Asia/Shanghai',
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

/**
 * 将 64 位值拆成两个 32 位部分
 */
export function splitNtp(value: bigint): { seconds: number; fraction: number } {
  return {
    seconds: Number((value >> BIGINT_32) & BIGINT_32_MASK),
    fraction: Number(value & BIGINT_32_MASK),
  };
}
