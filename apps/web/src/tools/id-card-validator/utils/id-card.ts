/**
 * 居民身份证号校验与 15 → 18 位升位（GB 11643-1999，零依赖纯函数）
 *
 * - 18 位：前 17 位数字 + 末位数字或 X；末位为 ISO 7064 MOD 11-2 加权校验码；
 *   加权因子 [7,9,10,5,8,4,2,1,6,3,7,9,10,5,8,4,2]，和 mod 11 经 '10X98765432' 映射。
 * - 15 位（旧证）：全数字、无校验位，默认出生于 1900 年代，在第 6 位后插入 '19' 再补校验码。
 * 本模块不触碰 DOM 与 React，错误以结果对象返回而非抛出；不内置行政区划名称表。
 */

const WEIGHTS = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];
const CHECK_CODES = '10X98765432';

export type Gender = '男' | '女';

export interface IdCardInfo {
  /** 6 位行政区划码（仅校验为数字，不内置名称表） */
  regionCode: string;
  /** 公历出生日期 YYYY-MM-DD */
  birthDate: string;
  /** 按顺序码末位奇偶判定 */
  gender: Gender;
}

export interface IdCardResult {
  /** 规范化后的 18 位号码；无法构成时为空串 */
  normalized: string;
  valid: boolean;
  /** 是否由 15 位旧证升位得到 */
  upgraded: boolean;
  info: IdCardInfo | null;
  error: string | null;
}

/** 去除空白，末位 x 统一为 X */
function normalize(input: string): string {
  return input.replace(/\s/g, '').toUpperCase();
}

/** 由不含校验位的 17 位本体计算校验码 */
export function computeCheckDigit(body17: string): string {
  let sum = 0;
  for (let i = 0; i < 17; i += 1) {
    sum += Number(body17[i]) * (WEIGHTS[i] ?? 0);
  }
  return CHECK_CODES[sum % 11] ?? '';
}

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/** 校验公历日期真实存在（含闰年 2 月 29 日） */
export function isValidDate(year: number, month: number, day: number): boolean {
  if (month < 1 || month > 12 || day < 1) {
    return false;
  }
  const daysInMonth = [31, isLeapYear(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return day <= (daysInMonth[month - 1] ?? 0);
}

function buildInfo(regionCode: string, year: number, month: number, day: number, seqLast: number): IdCardInfo {
  const mm = String(month).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return {
    regionCode,
    birthDate: `${year}-${mm}-${dd}`,
    gender: seqLast % 2 === 1 ? '男' : '女',
  };
}

/** 单条处理：18 位校验合法性，15 位升位为 18 位 */
export function processCode(input: string): IdCardResult {
  const code = normalize(input);

  if (code.length === 0) {
    return { normalized: '', valid: false, upgraded: false, info: null, error: '内容不能为空' };
  }

  if (code.length !== 15 && code.length !== 18) {
    return {
      normalized: '',
      valid: false,
      upgraded: false,
      info: null,
      error: `长度必须为 15 位（旧证升位）或 18 位（校验合法性），当前为 ${code.length} 位`,
    };
  }

  if (code.length === 15) {
    if (!/^\d{15}$/.test(code)) {
      return {
        normalized: '',
        valid: false,
        upgraded: false,
        info: null,
        error: '15 位旧证号码必须全部为数字',
      };
    }
    const year = 1900 + Number(code.slice(6, 8));
    const month = Number(code.slice(8, 10));
    const day = Number(code.slice(10, 12));
    if (!isValidDate(year, month, day)) {
      return {
        normalized: '',
        valid: false,
        upgraded: false,
        info: null,
        error: `出生日期 ${year}-${code.slice(8, 10)}-${code.slice(10, 12)} 不是合法日期`,
      };
    }
    const body17 = `${code.slice(0, 6)}19${code.slice(6)}`;
    const normalized = body17 + computeCheckDigit(body17);
    return {
      normalized,
      valid: true,
      upgraded: true,
      info: buildInfo(code.slice(0, 6), year, month, day, Number(code[14])),
      error: null,
    };
  }

  if (!/^\d{17}[\dX]$/.test(code)) {
    return {
      normalized: '',
      valid: false,
      upgraded: false,
      info: null,
      error: '18 位号码前 17 位必须为数字，末位为数字或 X',
    };
  }

  const errors: string[] = [];
  const year = Number(code.slice(6, 10));
  const month = Number(code.slice(10, 12));
  const day = Number(code.slice(12, 14));
  if (!isValidDate(year, month, day)) {
    errors.push(
      `出生日期 ${code.slice(6, 10)}-${code.slice(10, 12)}-${code.slice(12, 14)} 不是合法日期`,
    );
  }

  const expected = computeCheckDigit(code.slice(0, 17));
  if (code[17] !== expected) {
    errors.push(`校验码不正确：末位为 ${code[17]}，正确校验码应为 ${expected}`);
  }

  if (errors.length > 0) {
    return {
      normalized: code.slice(0, 17) + expected,
      valid: false,
      upgraded: false,
      info: isValidDate(year, month, day)
        ? buildInfo(code.slice(0, 6), year, month, day, Number(code[16]))
        : null,
      error: errors.join('；'),
    };
  }

  return {
    normalized: code,
    valid: true,
    upgraded: false,
    info: buildInfo(code.slice(0, 6), year, month, day, Number(code[16])),
    error: null,
  };
}

/** 生成结果展示行 */
export function formatResult(rawLine: string, result: IdCardResult): string {
  if (result.valid && result.info) {
    const prefix = result.upgraded
      ? `${rawLine.trim()} → ${result.normalized}（15 位已升位为 18 位）`
      : `${result.normalized}（校验通过）`;
    return `${prefix}｜出生日期 ${result.info.birthDate}｜性别 ${result.info.gender}｜行政区划码 ${result.info.regionCode}`;
  }
  return rawLine;
}

export interface BatchResult {
  output: string;
  warnings: string[];
}

/** 多行批量处理：每行一个号码，非法行原样保留并逐行标注 */
export function processLines(input: string): BatchResult {
  const outputs: string[] = [];
  const warnings: string[] = [];
  input.split('\n').forEach((line, index) => {
    if (line.trim() === '') {
      outputs.push('');
      return;
    }
    const result = processCode(line);
    outputs.push(formatResult(line, result));
    if (result.error) {
      warnings.push(`第 ${index + 1} 行：${result.error}`);
    }
  });
  return { output: outputs.join('\n'), warnings };
}
