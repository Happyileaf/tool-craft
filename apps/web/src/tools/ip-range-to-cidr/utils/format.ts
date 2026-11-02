/**
 * IP 数值的展示辅助（BigInt 地址数格式化）
 */

const QUADRILLION = BigInt(1_000_000_000_000_000);

/** 地址总数格式化：超过 10^15 使用指数近似，否则加千分位 */
export function formatAddressCount(value: bigint): string {
  if (value >= QUADRILLION) {
    const scientific = value.toString();
    const exponent = scientific.length - 1;
    const mantissa = `${scientific[0]}.${scientific.slice(1, 4)}`;
    return `${mantissa}×10^${exponent}`;
  }
  return value.toLocaleString('en-US');
}

/** 把多行/逗号/空白分隔的文本拆成条目 */
export function splitLines(text: string): string[] {
  return text
    .split(/[\s,;]+/)
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}
