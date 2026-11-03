/**
 * CUSIP 与 SEDOL 证券识别码校验纯函数
 *
 * - CUSIP（北美，ANNA / CUSIP Global Services）：9 位字母数字，
 *   末位为模 10 加权校验位，偶数位权重 2（双精度加权）
 * - SEDOL（英国 / 爱尔兰，LSE）：7 位字母数字，
 *   末位为 CDMA（1,3,1,7,3,9）加权模 10 校验位
 *
 * 字符到数值：数字 0-9 -> 0-9；字母 A-Z -> 10-35。
 * CUSIP 允许 *、@、#（值 36-38），但现代发行码已不使用，本工具识别并报错提示。
 */

/** 识别码体系 */
export type IdKind = "CUSIP" | "SEDOL";

/** 校验结果 */
export interface IdValidationResult {
  /** 是否为合法识别码 */
  valid: boolean;
  /** 识别出的体系 */
  kind: IdKind | null;
  /** 去掉空格的大写规范化输入 */
  normalized: string;
  /** 实际校验位（末位） */
  actualCheck: string | null;
  /** 按前 8 / 前 6 位算出的期望校验位 */
  expectedCheck: string | null;
  /** 失败时的中文原因 */
  reason?: string;
}

/**
 * 将单个字符转换为 CUSIP 数值
 *
 * @param ch - 单个字符
 * @returns 0-35；* @ # 映射 36-38；非法返回 -1
 */
function cusipCharValue(ch: string): number {
  if (ch >= "0" && ch <= "9") {
    return ch.charCodeAt(0) - 48;
  }
  if (ch >= "A" && ch <= "Z") {
    return ch.charCodeAt(0) - 65 + 10;
  }
  if (ch === "*") {
    return 36;
  }
  if (ch === "@") {
    return 37;
  }
  if (ch === "#") {
    return 38;
  }
  return -1;
}

/**
 * 将单个字符转换为 SEDOL 数值（仅允许 0-9 与 B-Z，跳过元音）
 *
 * @param ch - 单个字符
 * @returns 0-35；非法或元音返回 -1
 */
function sedolCharValue(ch: string): number {
  if (ch >= "0" && ch <= "9") {
    return ch.charCodeAt(0) - 48;
  }
  if (ch >= "B" && ch <= "Z" && !"AEIOU".includes(ch)) {
    return ch.charCodeAt(0) - 65 + 10;
  }
  return -1;
}

/**
 * 计算 CUSIP 校验位（模 10 双精度加权）
 *
 * 规则：从首位（位置 1）开始，偶数位置数值乘以 2；乘积若为两位数则拆为十位与个位相加；
 * 全部求和后校验位 = (10 - sum mod 10) mod 10。
 *
 * @param body8 - 前 8 位
 * @returns 期望校验数字符；body 含非法字符时返回 null
 */
export function computeCusipCheck(body8: string): string | null {
  if (body8.length !== 8) {
    return null;
  }
  let sum = 0;
  for (let i = 0; i < 8; i += 1) {
    let v = cusipCharValue(body8[i] ?? "");
    if (v < 0) {
      return null;
    }
    if (i % 2 === 1) {
      v *= 2;
    }
    sum += Math.floor(v / 10) + (v % 10);
  }
  return String((10 - (sum % 10)) % 10);
}

/**
 * 计算 SEDOL 校验位（CDMA 权重 1,3,1,7,3,9 模 10）
 *
 * @param body6 - 前 6 位
 * @returns 期望校验数字符；body 含非法字符时返回 null
 */
export function computeSedolCheck(body6: string): string | null {
  if (body6.length !== 6) {
    return null;
  }
  const weights = [1, 3, 1, 7, 3, 9];
  let sum = 0;
  for (let i = 0; i < 6; i += 1) {
    const v = sedolCharValue(body6[i] ?? "");
    if (v < 0) {
      return null;
    }
    sum += v * (weights[i] ?? 0);
  }
  return String((10 - (sum % 10)) % 10);
}

/**
 * 校验 CUSIP（9 位）或 SEDOL（7 位），按长度自动判别
 *
 * @param rawInput - 用户原始输入（大小写、空格、短横线不限）
 * @returns 校验结果，含期望校验位与失败原因
 */
export function validateSecurityId(rawInput: string): IdValidationResult {
  const normalized = rawInput.replace(/[\s-]+/g, "").toUpperCase();

  if (!normalized) {
    return {
      valid: false,
      kind: null,
      normalized,
      actualCheck: null,
      expectedCheck: null,
      reason: "请输入 CUSIP（9 位）或 SEDOL（7 位）",
    };
  }

  if (normalized.length === 9) {
    return validateCusip(normalized);
  }
  if (normalized.length === 7) {
    return validateSedol(normalized);
  }

  return {
    valid: false,
    kind: null,
    normalized,
    actualCheck: null,
    expectedCheck: null,
    reason: `长度 ${normalized.length} 位：CUSIP 应为 9 位，SEDOL 应为 7 位`,
  };
}

/**
 * 校验 9 位 CUSIP
 *
 * @param normalized - 已规范化的 9 位字符串
 * @returns 校验结果
 */
function validateCusip(normalized: string): IdValidationResult {
  const actualCheck = normalized[8] ?? "";
  const body = normalized.slice(0, 8);

  if (/[*@#]/.test(normalized)) {
    return {
      valid: false,
      kind: "CUSIP",
      normalized,
      actualCheck,
      expectedCheck: null,
      reason:
        "含 *、@、# 扩展字符：仅 1970 年代以前的历史码使用，现代 CUSIP 只允许 0-9 与 A-Z",
    };
  }
  if (!/^[0-9A-Z]{9}$/.test(normalized)) {
    return {
      valid: false,
      kind: "CUSIP",
      normalized,
      actualCheck,
      expectedCheck: null,
      reason: "CUSIP 只能包含字母 A-Z 与数字 0-9",
    };
  }
  if (!/^\d$/.test(actualCheck)) {
    return {
      valid: false,
      kind: "CUSIP",
      normalized,
      actualCheck,
      expectedCheck: null,
      reason: "CUSIP 第 9 位校验位必须是数字 0-9",
    };
  }

  const expectedCheck = computeCusipCheck(body);
  if (expectedCheck === null) {
    return {
      valid: false,
      kind: "CUSIP",
      normalized,
      actualCheck,
      expectedCheck: null,
      reason: "前 8 位含非法字符",
    };
  }

  if (actualCheck !== expectedCheck) {
    return {
      valid: false,
      kind: "CUSIP",
      normalized,
      actualCheck,
      expectedCheck,
      reason: `校验位不匹配：末位为 ${actualCheck}，按前 8 位计算应为 ${expectedCheck}`,
    };
  }

  return { valid: true, kind: "CUSIP", normalized, actualCheck, expectedCheck };
}

/**
 * 校验 7 位 SEDOL
 *
 * @param normalized - 已规范化的 7 位字符串
 * @returns 校验结果
 */
function validateSedol(normalized: string): IdValidationResult {
  const actualCheck = normalized[6] ?? "";
  const body = normalized.slice(0, 6);

  if (!/^[0-9B-Z]{7}$/i.test(normalized) || /[AEIOU]/.test(normalized)) {
    return {
      valid: false,
      kind: "SEDOL",
      normalized,
      actualCheck,
      expectedCheck: null,
      reason:
        "SEDOL 只能包含数字 0-9 与辅音字母 B-Z（不使用元音 A、E、I、O、U）",
    };
  }
  if (!/^\d$/.test(actualCheck)) {
    return {
      valid: false,
      kind: "SEDOL",
      normalized,
      actualCheck,
      expectedCheck: null,
      reason: "SEDOL 第 7 位校验位必须是数字 0-9",
    };
  }

  const expectedCheck = computeSedolCheck(body);
  if (expectedCheck === null) {
    return {
      valid: false,
      kind: "SEDOL",
      normalized,
      actualCheck,
      expectedCheck: null,
      reason: "前 6 位含非法字符",
    };
  }

  if (actualCheck !== expectedCheck) {
    return {
      valid: false,
      kind: "SEDOL",
      normalized,
      actualCheck,
      expectedCheck,
      reason: `校验位不匹配：末位为 ${actualCheck}，按前 6 位计算应为 ${expectedCheck}`,
    };
  }

  return { valid: true, kind: "SEDOL", normalized, actualCheck, expectedCheck };
}
