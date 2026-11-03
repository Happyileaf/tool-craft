/**
 * ABA 路由转账号码（RTN / Routing Transit Number）校验纯函数
 *
 * 9 位数字结构：
 * - 前 2 位：联邦储备区 / 处理机构类型（合法范围 01–12、21–32、61–72、80）
 * - 第 3-4 位：联邦储备处理中心编号（机构标识前半）
 * - 第 5-8 位：金融机构标识
 * - 第 9 位：校验位
 *
 * 校验算法：d1…d8 按 3、7、1 循环加权求和，连同 d9 一起模 10 必须为 0
 * （Accuity / Federal Reserve 标准）。
 */

/** 单个 RTN 校验结果 */
export interface AbaValidationResult {
  /** 是否为合法 RTN */
  valid: boolean;
  /** 去掉空白后的 9 位号码 */
  normalized: string;
  /** 前两位联邦储备区码（01–12 等） */
  frbDistrict: string | null;
  /** 前四位联邦储备路由符号 */
  federalRoutingSymbol: string | null;
  /** 中间四位机构标识 */
  institutionId: string | null;
  /** 末位校验位 */
  checkDigit: string | null;
  /** 失败时的中文原因 */
  reason?: string;
}

/** 前两位是否落在 RTN 合法前缀范围：01–12、21–32、61–72、80 */
export function isValidRoutingPrefix(prefix2: number): boolean {
  return (
    (prefix2 >= 1 && prefix2 <= 12) ||
    (prefix2 >= 21 && prefix2 <= 32) ||
    (prefix2 >= 61 && prefix2 <= 72) ||
    prefix2 === 80
  );
}

/** 12 个联邦储备区码 → 名称（01–12） */
const FRB_DISTRICT_NAMES: Record<number, string> = {
  1: "01 波士顿联邦储备区（Boston）",
  2: "02 纽约联邦储备区（New York）",
  3: "03 费城联邦储备区（Philadelphia）",
  4: "04 克利夫兰联邦储备区（Cleveland）",
  5: "05 里士满联邦储备区（Richmond）",
  6: "06 亚特兰大联邦储备区（Atlanta）",
  7: "07 芝加哥联邦储备区（Chicago）",
  8: "08 圣路易斯联邦储备区（St. Louis）",
  9: "09 明尼阿波利斯联邦储备区（Minneapolis）",
  10: "10 堪萨斯城联邦储备区（Kansas City）",
  11: "11 达拉斯联邦储备区（Dallas）",
  12: "12 旧金山联邦储备区（San Francisco）",
};

/**
 * 描述前两位路由前缀的含义
 *
 * @param prefix2 - 前两位数值
 * @returns 中文描述；非法返回 null
 */
export function describeRoutingPrefix(prefix2: number): string | null {
  if (prefix2 >= 1 && prefix2 <= 12) {
    return FRB_DISTRICT_NAMES[prefix2] ?? null;
  }
  if (prefix2 >= 21 && prefix2 <= 32) {
    return `${String(prefix2).padStart(2, "0")} 储蓄机构（Thrift，储贷 / 信用社等）`;
  }
  if (prefix2 >= 61 && prefix2 <= 72) {
    return `${prefix2} 电子交易（Electronic Transaction，同上储备区）`;
  }
  if (prefix2 === 80) {
    return "80 旅客支票（Travelers Cheques）";
  }
  return null;
}

/**
 * 计算 9 位 RTN 的 3/7/1 加权和
 *
 * @param digits9 - 9 位数字字符串
 * @returns 加权和
 */
export function rtnWeightedSum(digits9: string): number {
  const weights = [3, 7, 1];
  let sum = 0;
  for (let i = 0; i < 9; i += 1) {
    sum += Number(digits9[i] ?? "0") * (weights[i % 3] ?? 0);
  }
  return sum;
}

/**
 * 校验单个 ABA 路由号码
 *
 * @param rawInput - 用户原始输入（允许空格 / 短横线，如 0210-0002-1）
 * @returns 校验结果与字段拆解
 */
export function validateAbaRtn(rawInput: string): AbaValidationResult {
  const normalized = rawInput.replace(/[\s-]+/g, "");

  if (!normalized) {
    return {
      valid: false,
      normalized,
      frbDistrict: null,
      federalRoutingSymbol: null,
      institutionId: null,
      checkDigit: null,
      reason: "请输入 9 位 ABA 路由号码（RTN）",
    };
  }

  if (!/^\d+$/.test(normalized)) {
    return {
      valid: false,
      normalized,
      frbDistrict: null,
      federalRoutingSymbol: null,
      institutionId: null,
      checkDigit: null,
      reason: "路由号码只能包含数字（允许输入空格或短横线分隔）",
    };
  }

  if (normalized.length !== 9) {
    return {
      valid: false,
      normalized,
      frbDistrict: null,
      federalRoutingSymbol: null,
      institutionId: null,
      checkDigit: null,
      reason: `长度为 ${normalized.length} 位，ABA 路由号码必须为 9 位数字`,
    };
  }

  const prefix2 = Number(normalized.slice(0, 2));
  if (!isValidRoutingPrefix(prefix2)) {
    return {
      valid: false,
      normalized,
      frbDistrict: normalized.slice(0, 2),
      federalRoutingSymbol: normalized.slice(0, 4),
      institutionId: normalized.slice(4, 8),
      checkDigit: normalized[8] ?? null,
      reason:
        "前两位不在合法范围：联邦储备区 01–12、储蓄机构 21–32、电子交易 61–72 或旅客支票 80",
    };
  }

  if (rtnWeightedSum(normalized) % 10 !== 0) {
    return {
      valid: false,
      normalized,
      frbDistrict: normalized.slice(0, 2),
      federalRoutingSymbol: normalized.slice(0, 4),
      institutionId: normalized.slice(4, 8),
      checkDigit: normalized[8] ?? null,
      reason: "校验位不符：3、7、1 循环加权和不能被 10 整除",
    };
  }

  return {
    valid: true,
    normalized,
    frbDistrict: normalized.slice(0, 2),
    federalRoutingSymbol: normalized.slice(0, 4),
    institutionId: normalized.slice(4, 8),
    checkDigit: normalized[8] ?? null,
  };
}

/** 批量校验中单行结果 */
export interface AbaBatchLine extends AbaValidationResult {
  /** 所在行号（从 1 开始） */
  line: number;
  /** 原始行文本 */
  rawLine: string;
}

/**
 * 批量校验多行 RTN（每行一个，空行跳过）
 *
 * @param rawText - 多行文本
 * @returns 每一行的校验结果（不含空行）
 */
export function validateAbaBatch(rawText: string): AbaBatchLine[] {
  return rawText
    .split(/\r?\n/)
    .map((line, index) => ({ line: index + 1, rawLine: line.trim() }))
    .filter((item) => item.rawLine.length > 0)
    .map((item) => ({ ...item, ...validateAbaRtn(item.rawLine) }));
}
