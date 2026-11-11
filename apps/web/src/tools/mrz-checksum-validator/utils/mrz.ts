/**
 * ICAO 9303 机读旅行证件（MRZ）解析与模 10 校验，纯函数、零网络依赖。
 * 支持 TD1（3 行 × 30 字符）、TD2（2 行 × 36）、TD3（2 行 × 44）三种格式。
 */

/** MRZ 合法字符：A–Z、0–9、填充符 < */
const MRZ_CHARACTER = /^[A-Z0-9<]+$/;

/** 模 10 校验位循环权重 7、3、1 */
const WEIGHTS = [7, 3, 1];

/** TD1/TD2/TD3 的行宽定义 */
export const MRZ_FORMATS = {
  TD1: { lines: 3, width: 30 },
  TD2: { lines: 2, width: 36 },
  TD3: { lines: 2, width: 44 },
} as const;

/** MRZ 格式标识 */
export type MrzFormat = keyof typeof MRZ_FORMATS;

/** 单个校验位的校验结论 */
export interface CheckResult {
  /** 校验项名称 */
  name: string;
  /** 参与校验的原始字段串（不含校验位本身） */
  source: string;
  /** MRZ 中印出的实际校验位（填充字段为 < 时记为 null） */
  actual: number | null;
  /** 按算法计算出的期望校验位 */
  expected: number;
  /** 是否通过；填充字段（actual 为 null）按 ICAO 规则跳过并记为通过 */
  pass: boolean;
}

/** 解析后的结构化 MRZ 结果 */
export interface ParsedMrz {
  /** 识别出的格式 */
  format: MrzFormat;
  /** 拆分后的 MRZ 行 */
  lines: string[];
  /** 证件类型（首字段） */
  documentType: string;
  /** 签发国家/地区 ISO 3166-1 alpha-3 */
  issuingCountry: string;
  /** 姓名（< 转空格、<< 分段） */
  fullName: string;
  /** 证件号码（去掉右侧填充 <） */
  documentNumber: string;
  /** 国籍 alpha-3 */
  nationality: string;
  /** 出生日期 YYMMDD 原文 */
  birthDate: string;
  /** 性别字段原文（M/F/< 等） */
  sex: string;
  /** 有效期 YYMMDD 原文 */
  expiryDate: string;
  /** 个人号码（TD1/TD2，去填充，可能为空串） */
  personalNumber: string;
  /** 全部校验项 */
  checks: CheckResult[];
  /** 复合校验位是否通过 */
  compositePass: boolean;
}

/**
 * 把 MRZ 字母/数字/填充符映射为校验算法所需的数值。
 * A–Z → 10–35，0–9 → 0–9，填充符 < → 0。
 *
 * @param char - 单字符
 * @returns 映射数值
 */
function charValue(char: string): number {
  if (char === '<') {
    return 0;
  }
  if (char >= '0' && char <= '9') {
    return char.charCodeAt(0) - '0'.charCodeAt(0);
  }
  return char.charCodeAt(0) - 'A'.charCodeAt(0) + 10;
}

/**
 * 计算 ICAO 9303 模 10 校验位：加权和对 10 取模，权重循环 7、3、1，填充符按 0 参与。
 *
 * @param value - 待校验字段（不含校验位）
 * @returns 0–9 的校验位
 */
export function computeCheckDigit(value: string): number {
  let sum = 0;
  for (let index = 0; index < value.length; index += 1) {
    sum += charValue(value[index]!) * WEIGHTS[index % WEIGHTS.length]!;
  }
  return sum % 10;
}

/**
 * 构造单个校验项，actual 为填充符 < 时按 ICAO 规则跳过（记 pass=true）。
 *
 * @param name - 校验项名称
 * @param source - 参与校验的字段串
 * @param actualChar - MRZ 中的校验位字符
 * @returns 校验结论
 */
function buildCheck(name: string, source: string, actualChar: string): CheckResult {
  const expected = computeCheckDigit(source);
  const actual = actualChar === '<' ? null : Number(actualChar);
  return {
    name,
    source,
    actual,
    expected,
    pass: actual === null ? true : actual === expected,
  };
}

/**
 * 把 MRZ 姓名串（含 < 填充）转成可读姓名。
 * ICAO 9303 的姓名主字段为「姓 << 名（可含 < 连接的多个 given name）」，
 * 展示时按「名 姓」的常见顺序重排；TD1 第三行是整行姓名，同样遵循该结构。
 *
 * @param raw - MRZ 原始姓名字段
 * @returns 规范化姓名（given names 在前、surname 在后）
 */
function decodeName(raw: string): string {
  const trimmed = raw.replace(/<+$/, '');
  const separatorIndex = trimmed.indexOf('<<');
  if (separatorIndex === -1) {
    return trimmed.replace(/</g, ' ').trim();
  }
  const surname = trimmed.slice(0, separatorIndex).replace(/</g, ' ').trim();
  const givenNames = trimmed
    .slice(separatorIndex + 2)
    .replace(/</g, ' ')
    .trim();
  return `${givenNames} ${surname}`.trim();
}

/**
 * 校验 YYMMDD 日期是否为合法日历日期（宽松：仅拒绝月份/日期越界）。
 *
 * @param yymmdd - 6 位日期串
 * @returns 合法返回 true
 */
export function isValidDate(yymmdd: string): boolean {
  if (!/^\d{6}$/.test(yymmdd)) {
    return false;
  }
  const month = Number(yymmdd.slice(2, 4));
  const day = Number(yymmdd.slice(4, 6));
  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return false;
  }
  return true;
}

/**
 * 规范化原始 MRZ 文本：统一大写、按换行拆行、去空白并过滤空行。
 *
 * @param text - 用户粘贴的 MRZ
 * @returns 大写的 MRZ 行数组
 */
function normalizeLines(text: string): string[] {
  return text
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => line.replace(/\s+/g, '').toUpperCase())
    .filter((line) => line.length > 0);
}

/**
 * 根据行数与行宽识别 MRZ 格式，并校验整体形状与字符集。
 *
 * @param lines - 规范化后的行
 * @returns 格式标识
 */
function detectFormat(lines: string[]): MrzFormat {
  const candidates = Object.entries(MRZ_FORMATS) as [MrzFormat, { lines: number; width: number }][];
  const match = candidates.find(
    ([, spec]) => spec.lines === lines.length && lines.every((line) => line.length === spec.width),
  );
  if (!match) {
    const shape = lines.map((line) => line.length).join('/');
    throw new Error(
      `无法识别 MRZ 格式：当前行宽 ${shape}，TD1 应为 3×30、TD2 为 2×36、TD3 为 2×44`,
    );
  }
  lines.forEach((line, lineIndex) => {
    if (!MRZ_CHARACTER.test(line)) {
      const badIndex = [...line].findIndex((char) => !/[A-Z0-9<]/.test(char));
      throw new Error(
        `第 ${lineIndex + 1} 行第 ${badIndex + 1} 个字符「${line[badIndex]}」不属于 MRZ 合法字符集（A–Z、0–9、<）`,
      );
    }
  });
  return match[0];
}

/**
 * 解析 TD3（2 行 × 44，普通护照）。
 *
 * @param lines - 两行 MRZ
 * @returns 解析结果
 */
function parseTd3(lines: string[]): ParsedMrz {
  const [line1, line2] = [lines[0]!, lines[1]!];
  const documentNumber = line2.slice(0, 9).replace(/<+$/, '');
  const docCheck = buildCheck('证件号码校验位', line2.slice(0, 9), line2[9]!);
  const birthDate = line2.slice(13, 19);
  const birthCheck = buildCheck('出生日期校验位', birthDate, line2[19]!);
  const expiryDate = line2.slice(21, 27);
  const expiryCheck = buildCheck('有效期校验位', expiryDate, line2[27]!);
  const personalNumber = line2.slice(28, 42).replace(/<+$/, '');
  const personalCheck = buildCheck('个人号码校验位', line2.slice(28, 42), line2[42]!);
  const compositeSource =
    line2.slice(0, 10) + line2.slice(13, 20) + line2.slice(21, 28) + line2.slice(28, 43);
  const compositeCheck = buildCheck('复合校验位', compositeSource, line2[43]!);

  return {
    format: 'TD3',
    lines,
    documentType: line1.slice(0, 2).replace(/<+$/, ''),
    issuingCountry: line1.slice(2, 5),
    fullName: decodeName(line1.slice(5)),
    documentNumber,
    nationality: line2.slice(10, 13),
    birthDate,
    sex: line2[20]!,
    expiryDate,
    personalNumber,
    checks: [docCheck, birthCheck, expiryCheck, personalCheck, compositeCheck],
    compositePass: compositeCheck.pass,
  };
}

/**
 * 解析 TD2（2 行 × 36）。
 *
 * @param lines - 两行 MRZ
 * @returns 解析结果
 */
function parseTd2(lines: string[]): ParsedMrz {
  const [line1, line2] = [lines[0]!, lines[1]!];
  const documentNumber = line2.slice(0, 9).replace(/<+$/, '');
  const docCheck = buildCheck('证件号码校验位', line2.slice(0, 9), line2[9]!);
  const birthDate = line2.slice(13, 19);
  const birthCheck = buildCheck('出生日期校验位', birthDate, line2[19]!);
  const expiryDate = line2.slice(21, 27);
  const expiryCheck = buildCheck('有效期校验位', expiryDate, line2[27]!);
  const compositeSource = line2.slice(0, 10) + line2.slice(13, 20) + line2.slice(21, 28);
  const compositeCheck = buildCheck('复合校验位', compositeSource, line2[35]!);

  return {
    format: 'TD2',
    lines,
    documentType: line1.slice(0, 2).replace(/<+$/, ''),
    issuingCountry: line1.slice(2, 5),
    fullName: decodeName(line1.slice(5)),
    documentNumber,
    nationality: line2.slice(10, 13),
    birthDate,
    sex: line2[20]!,
    expiryDate,
    personalNumber: '',
    checks: [docCheck, birthCheck, expiryCheck, compositeCheck],
    compositePass: compositeCheck.pass,
  };
}

/**
 * 解析 TD1（3 行 × 30，身份证/通行证等）。
 *
 * @param lines - 三行 MRZ
 * @returns 解析结果
 */
function parseTd1(lines: string[]): ParsedMrz {
  const [line1, line2, line3] = [lines[0]!, lines[1]!, lines[2]!];
  const documentNumber = line1.slice(5, 14).replace(/<+$/, '');
  const docCheck = buildCheck('证件号码校验位', line1.slice(5, 14), line1[14]!);
  const birthDate = line2.slice(0, 6);
  const birthCheck = buildCheck('出生日期校验位', birthDate, line2[6]!);
  const expiryDate = line2.slice(8, 14);
  const expiryCheck = buildCheck('有效期校验位', expiryDate, line2[14]!);
  const compositeSource =
    line1.slice(5, 15) + line2.slice(0, 7) + line2.slice(8, 15) + line2.slice(18, 29);
  const compositeCheck = buildCheck('复合校验位', compositeSource, line2[29]!);
  const personalNumber = line2.slice(18, 29).replace(/<+$/, '');

  return {
    format: 'TD1',
    lines,
    documentType: line1.slice(0, 2).replace(/<+$/, ''),
    issuingCountry: line1.slice(2, 5),
    fullName: decodeName(line3),
    documentNumber,
    nationality: line2.slice(15, 18),
    birthDate,
    sex: line2[7]!,
    expiryDate,
    personalNumber,
    checks: [docCheck, birthCheck, expiryCheck, compositeCheck],
    compositePass: compositeCheck.pass,
  };
}

/**
 * 解析任意支持格式的 MRZ 文本并计算全部校验位。
 *
 * @param text - 用户粘贴的 MRZ 原文
 * @returns 结构化解析与校验结果
 */
export function parseMrz(text: string): ParsedMrz {
  if (!text.trim()) {
    throw new Error('请粘贴机读码（MRZ）内容');
  }
  const lines = normalizeLines(text);
  const format = detectFormat(lines);
  if (format === 'TD3') {
    return parseTd3(lines);
  }
  if (format === 'TD2') {
    return parseTd2(lines);
  }
  return parseTd1(lines);
}
