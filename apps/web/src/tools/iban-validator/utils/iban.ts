/**
 * IBAN（International Bank Account Number，ISO 13616）校验与格式化纯函数
 *
 * IBAN 结构：CCKKBBBB...，其中 CC 为两位字母国家码，KK 为两位数字校验位，
 * 其余为各国自定义的 BBAN（仅含大写字母与数字）。
 * 校验采用 ISO 7064 MOD 97-10：将前 4 位移到末尾，字母 A-Z 映射为 10-35，
 * 拼成十进制串后模 97，余数为 1 即通过。
 */
import { IBAN_LENGTHS } from '../constants';

export { IBAN_LENGTHS };

/** 校验结果 */
export interface IbanValidationResult {
  /** 综合结论：结构与 mod 97-10 校验均通过 */
  valid: boolean;
  /** 非法时的具体原因（合法时为 undefined） */
  reason?: string;
  /** 识别到的两位国家码（国家码合法时返回） */
  countryCode?: string;
}

/**
 * 规范化 IBAN 输入：去除所有空白字符与连字符，并转为大写
 *
 * @param input - 用户原始输入
 * @returns 无分隔符的大写字符串
 */
export function normalizeIban(input: string): string {
  return input.replace(/[\s-]/g, '').toUpperCase();
}

/**
 * 将规范化后的 IBAN 按每 4 位一组分组（组间以空格连接）
 *
 * @param normalized - 规范化后的 IBAN（大写、无分隔符）
 * @returns 4 位分组的易读字符串
 */
export function formatIbanGroups(normalized: string): string {
  return normalized.replace(/(.{4})(?=.)/g, '$1 ');
}

/**
 * 对「前 4 位移到末尾、字母已映射为数字」的十进制串计算模 97
 *
 * 采用分段取模以兼容大整数：每次最多追加 9 位数字。
 * 设当前余数为 r，追加 9 位（数值为 x）后新余数为 (r·10⁹ + x) mod 97；
 * 因为 r < 97，r·10⁹ + x 始终不超过 97·10⁹，可用安全整数精确表示，
 * 故无需 BigInt，兼容性更好。
 *
 * @param digits - 仅含数字的字符串
 * @returns 模 97 的余数（合法 IBAN 应为 1）
 */
function mod97(digits: string): number {
  const CHUNK_SIZE = 9;
  let remainder = 0;
  for (let start = 0; start < digits.length; start += CHUNK_SIZE) {
    const chunk = digits.slice(start, start + CHUNK_SIZE);
    remainder = (remainder * 10 ** chunk.length + Number(chunk)) % 97;
  }
  return remainder;
}

/**
 * 对原始输入执行完整的 IBAN 校验
 *
 * @param input - 用户输入的 IBAN（可含空格 / 连字符 / 小写字母）
 * @returns 校验结论、失败原因与识别到的国家码
 */
export function validateIban(input: string): IbanValidationResult {
  const iban = normalizeIban(input);

  if (iban.length === 0) {
    return { valid: false, reason: '请输入 IBAN 银行账号' };
  }
  if (iban.length < 2) {
    return { valid: false, reason: '内容过短：前两位应为字母国家码' };
  }

  const countryCode = iban.slice(0, 2);
  if (!/^[A-Z]{2}$/.test(countryCode)) {
    return { valid: false, reason: '前两位必须为字母国家码（如 DE、GB）' };
  }

  const expectedLength = IBAN_LENGTHS[countryCode];
  if (expectedLength === undefined) {
    return {
      valid: false,
      countryCode,
      reason: `未知国家码 ${countryCode}：该国家 / 地区未启用 IBAN（中国大陆不使用 IBAN）`,
    };
  }

  if (iban.length !== expectedLength) {
    return {
      valid: false,
      countryCode,
      reason: `长度应为 ${expectedLength} 位，实际 ${iban.length} 位`,
    };
  }

  // 前 4 位之后为各国 BBAN，统一按 ISO 13616 基本形态校验：大写字母或数字
  if (!/^[A-Z0-9]+$/.test(iban)) {
    return { valid: false, countryCode, reason: '含非法字符：IBAN 只能包含字母与数字' };
  }

  if (!/^\d{2}$/.test(iban.slice(2, 4))) {
    return { valid: false, countryCode, reason: '第 3-4 位必须为两位数字校验位' };
  }

  // mod 97-10：前 4 位移到末尾，字母 A-Z 映射为 10-35
  const rearranged = `${iban.slice(4)}${iban.slice(0, 4)}`;
  const numeric = rearranged.replace(/[A-Z]/g, (char) => String(char.charCodeAt(0) - 55));
  if (mod97(numeric) !== 1) {
    return { valid: false, countryCode, reason: 'mod 97-10 校验位错误，请核对账号' };
  }

  return { valid: true, countryCode };
}
