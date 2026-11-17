/**
 * GS1 标识体系 Mod 10 加权校验位与应用标识符（AI）包装，零依赖纯函数。
 *
 * 覆盖：
 *   - SSCC（18 位，AI 00，含 1 位扩展位 + 厂商/序列号 16 位 + 校验位）
 *   - GTIN-14 / EAN-14（14 位，AI 01，含 1 位包装指示符 + 12 位 GTIN + 校验位）
 *   - GTIN-13 / EAN-13（13 位）、GTIN-12 / UPC-A（12 位）、GTIN-8 / EAN-8（8 位）
 *
 * GS1 通用 Mod 10 算法（GS1 General Specifications §7.9）：
 *   从不含校验位的数字串最右侧起，自右向左按 ×3、×1 交替加权求和，
 *   校验位 = (10 - (加权和 mod 10)) mod 10。
 */

/** 支持的 GS1 标识类型 */
export type Gs1Kind = 'SSCC' | 'GTIN14' | 'GTIN13' | 'GTIN12' | 'GTIN8';

export interface Gs1TypeSpec {
  kind: Gs1Kind;
  /** 完整编码长度（含校验位） */
  fullLength: number;
  /** 不含校验位的本体长度 */
  bodyLength: number;
  /** GS1 应用标识符；无固定 AI 的零售单元为 null */
  ai: string | null;
  label: string;
}

/** 各类型长度与 AI 规格表 */
export const GS1_TYPES: Readonly<Record<Gs1Kind, Gs1TypeSpec>> = {
  SSCC: { kind: 'SSCC', fullLength: 18, bodyLength: 17, ai: '00', label: 'SSCC 系列货运包装箱代码' },
  GTIN14: { kind: 'GTIN14', fullLength: 14, bodyLength: 13, ai: '01', label: 'GTIN-14 / EAN-14 贸易项目' },
  GTIN13: { kind: 'GTIN13', fullLength: 13, bodyLength: 12, ai: null, label: 'GTIN-13 / EAN-13 零售单元' },
  GTIN12: { kind: 'GTIN12', fullLength: 12, bodyLength: 11, ai: null, label: 'GTIN-12 / UPC-A 零售单元' },
  GTIN8: { kind: 'GTIN8', fullLength: 8, bodyLength: 7, ai: null, label: 'GTIN-8 / EAN-8 小包装单元' },
};

export interface Gs1Result {
  kind: Gs1Kind;
  /** 规范化后的数字串（去除空白与连字符） */
  normalized: string;
  /** 计算或核对出的校验位 */
  checkDigit: string;
  /** 输入为完整编码时的校验结果；补全模式下为 null */
  valid: boolean | null;
  /** 含 AI 前缀的 GS1-128 数据载体形式（无 AI 的类型回退为纯编码） */
  aiForm: string;
  /** 人类可读的带括号 AI 形式，如 (00)123... */
  humanReadable: string;
  errors: string[];
}

/** 去除空白与连字符（条码常按分组排版） */
function normalize(input: string): string {
  return (input ?? '').replace(/[\s-]/g, '');
}

/**
 * GS1 Mod 10 校验位：body 为不含校验位的数字串，从最右位起 ×3/×1 交替。
 */
export function computeGs1CheckDigit(body: string): string {
  let sum = 0;
  for (let index = 0; index < body.length; index += 1) {
    const digit = Number(body[body.length - 1 - index]);
    sum += index % 2 === 0 ? digit * 3 : digit;
  }
  return String((10 - (sum % 10)) % 10);
}

/**
 * 处理一条 SSCC / GTIN 编码：
 *   - 输入 bodyLength 位 → 补全校验位
 *   - 输入 fullLength 位 → 核对末位校验位
 *   - 其他长度或含非数字 → 收集错误
 *
 * @param kind - 标识类型
 * @param raw - 原始输入
 */
export function processGs1Code(kind: Gs1Kind, raw: string): Gs1Result {
  const spec = GS1_TYPES[kind];
  const normalized = normalize(raw);
  const errors: string[] = [];
  const base: Gs1Result = {
    kind,
    normalized,
    checkDigit: '',
    valid: null,
    aiForm: '',
    humanReadable: '',
    errors,
  };

  if (!normalized) {
    errors.push('输入不能为空');
    return base;
  }
  if (!/^\d+$/.test(normalized)) {
    errors.push(`「${normalized}」含非数字字符，GS1 编码仅允许 0–9`);
    return base;
  }
  if (normalized.length !== spec.bodyLength && normalized.length !== spec.fullLength) {
    errors.push(
      `${spec.label}需要 ${spec.bodyLength} 位（补全校验位）或 ${spec.fullLength} 位（核对校验位），当前为 ${normalized.length} 位`,
    );
    return base;
  }

  const isFull = normalized.length === spec.fullLength;
  const body = isFull ? normalized.slice(0, -1) : normalized;
  const checkDigit = computeGs1CheckDigit(body);
  const full = body + checkDigit;
  const valid = isFull ? normalized[normalized.length - 1] === checkDigit : null;

  if (isFull && !valid) {
    errors.push(`校验位错误：末位为 ${normalized[normalized.length - 1]}，按 GS1 Mod 10 应为 ${checkDigit}`);
  }

  const aiForm = spec.ai ? `${spec.ai}${full}` : full;
  const humanReadable = spec.ai ? `(${spec.ai})${full}` : full;
  return { ...base, normalized: full, checkDigit, valid, aiForm, humanReadable };
}

/** SSCC 扩展位（首位）合法性提示：仅允许 0–9，厂商常用 0–8，9 保留给特殊用途 */
export function explainSs1ExtensionDigit(ssccBodyOrFull: string): string | null {
  const code = normalize(ssccBodyOrFull);
  if (!/^\d{17,18}$/.test(code)) {
    return null;
  }
  const extension = code[0]!;
  if (extension === '9') {
    return '扩展位为 9：GS1 保留用于特殊用途，普通货运箱建议使用 0–8';
  }
  return `扩展位 ${extension}：由发运方自定义的包装类型标识，合法范围 0–9`;
}

/** 批量处理：每行「类型,编码」或仅编码（需指定默认类型） */
export interface BulkRow extends Gs1Result {
  line: number;
  rawInput: string;
}

/**
 * 批量校验 / 补全。
 *
 * @param raw - 多行文本；每行可为 `SSCC,123...` 形式（类型名大小写不敏感），
 *              或纯数字（使用 defaultKind）
 * @param defaultKind - 无类型前缀行使用的默认类型
 */
export function processGs1Batch(
  raw: string,
  defaultKind: Gs1Kind = 'GTIN14',
): { rows: BulkRow[]; total: number; okCount: number; failCount: number } {
  const rows: BulkRow[] = [];
  const lines = raw.split(/\r?\n/);
  lines.forEach((original, index) => {
    const line = index + 1;
    const trimmed = original.trim();
    if (!trimmed) {
      return;
    }
    const parts = trimmed.split(/[,\t]/).map((each) => each.trim());
    let kind: Gs1Kind = defaultKind;
    let code: string;
    if (parts.length >= 2) {
      const candidate = parts[0]!.toUpperCase() as Gs1Kind;
      if (candidate in GS1_TYPES) {
        kind = candidate;
        code = parts.slice(1).join('');
      } else {
        code = trimmed;
      }
    } else {
      code = trimmed;
    }
    const result = processGs1Code(kind, code);
    rows.push({ ...result, line, rawInput: trimmed });
  });
  const okCount = rows.filter((row) => row.errors.length === 0).length;
  return { rows, total: rows.length, okCount, failCount: rows.length - okCount };
}
