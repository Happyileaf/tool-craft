/**
 * SMD 贴片电阻印字码解码 / 编码纯函数
 *
 * 覆盖三类主流标记体系：
 * - 3 位数字码（E24，±5%）：2 位有效数字 + 1 位 10 的幂次乘数，如 472 = 4.7 kΩ
 * - 4 位数字码（E24/E96，±1%）：3 位有效数字 + 1 位幂次乘数，如 4701 = 4.7 kΩ
 * - EIA-96 码（±1%）：2 位序号（01-96）+ 1 位字母乘数，如 47A = 301 Ω
 *
 * R / 小数点位置码（如 R10、1R0、10R0）与 000 / 0000 零欧姆跳线一并支持。
 * 单位统一为欧姆（Ω）。
 */

/** SMD 码体系类型 */
export type SmdCodeKind = "three-digit" | "four-digit" | "eia96" | "zero-ohm";

/** 解码结果 */
export interface SmdDecodeResult {
  /** 是否为合法印字码 */
  ok: boolean;
  /** 电阻值（欧姆）；非法时为 null */
  ohms: number | null;
  /** 识别出的码体系 */
  kind: SmdCodeKind | null;
  /** 精度（容差），如 ±5%、±1% */
  tolerance: string | null;
  /** 非法时的中文原因 */
  reason?: string;
}

/**
 * EIA-96 序号 01-96 → 三位有效数字（E96 系列基数，标准表）
 */
export const EIA96_MANTISSAS: number[] = [
  100, 102, 105, 107, 110, 113, 115, 118, 121, 124, 127, 130, 133, 137, 140,
  143, 147, 150, 154, 158, 162, 165, 169, 174, 178, 182, 187, 191, 196, 200,
  205, 209, 215, 221, 226, 232, 237, 243, 249, 255, 261, 267, 274, 280, 287,
  294, 301, 309, 316, 324, 332, 340, 348, 357, 365, 374, 383, 392, 402, 412,
  422, 432, 442, 453, 464, 475, 487, 499, 511, 523, 536, 549, 562, 576, 590,
  604, 619, 634, 649, 665, 681, 698, 715, 732, 750, 768, 787, 806, 825, 845,
  866, 887, 909, 931, 953, 976,
];

/** EIA-96 字母 → 10 的幂次乘数（Y=0.01 … Z=100000，跳过易混淆的 I、O） */
export const EIA96_MULTIPLIER_LETTERS: Record<string, number> = {
  Y: -2,
  X: -1,
  A: 0,
  B: 1,
  C: 2,
  D: 3,
  E: 4,
  F: 5,
  // G/H 为扩展乘数（部分厂家使用），保留以提升兼容性
  G: 6,
  H: 7,
  Z: 8,
};

/**
 * 将含 R 的位置码解析为欧姆值，R 表示小数点；无 R 时按纯数字返回
 *
 * 例：R10 → 0.10，1R0 → 1.0，10R0 → 10.0，0R01 → 0.01
 *
 * @param token - 形如 10R / 1R0 / R47 的字符串
 * @returns 数值；格式非法时返回 null
 */
function parseDecimalCode(token: string): number | null {
  if (!/^[0-9R]+$/.test(token) || !token.includes("R")) {
    return null;
  }
  const value = Number(token.replace("R", "."));
  return Number.isFinite(value) ? value : null;
}

/**
 * 解码标准 3 / 4 位数字码（含 R 位置码与零欧姆码）
 *
 * @param code - 已规范化为大写的印字码
 * @returns 解码结果
 */
function decodeDigital(code: string): SmdDecodeResult {
  // 零欧姆跳线：000 或 0000
  if (/^0{3,4}$/.test(code)) {
    return { ok: true, ohms: 0, kind: "zero-ohm", tolerance: null };
  }

  if (code.includes("R")) {
    // R 位置码：R10 / 1R0 / 10R0 / 0R01 等
    const totalDigits = code.length - 1;
    if (totalDigits < 2 || totalDigits > 3) {
      return {
        ok: false,
        ohms: null,
        kind: null,
        tolerance: null,
        reason: "R 位置码应为 3 位（±5%）或 4 位（±1%）字符长度，如 R10、10R0",
      };
    }
    const value = parseDecimalCode(code);
    if (value === null || value <= 0) {
      return {
        ok: false,
        ohms: null,
        kind: null,
        tolerance: null,
        reason: "R 位置码格式非法",
      };
    }
    return {
      ok: true,
      ohms: value,
      kind: totalDigits === 3 ? "four-digit" : "three-digit",
      tolerance: totalDigits === 3 ? "±1%" : "±5%",
    };
  }

  if (!/^\d{3,4}$/.test(code)) {
    return {
      ok: false,
      ohms: null,
      kind: null,
      tolerance: null,
      reason: "数字码必须为 3 位或 4 位",
    };
  }

  if (code.length === 3) {
    const significant = Number(code.slice(0, 2));
    const multiplier = Number(code[2]);
    if (significant === 0) {
      return {
        ok: false,
        ohms: null,
        kind: null,
        tolerance: null,
        reason: "前两位有效数字不能为 00",
      };
    }
    return {
      ok: true,
      ohms: significant * 10 ** multiplier,
      kind: "three-digit",
      tolerance: "±5%",
    };
  }

  // 4 位码
  const significant = Number(code.slice(0, 3));
  const multiplier = Number(code[3]);
  if (significant === 0) {
    return {
      ok: false,
      ohms: null,
      kind: null,
      tolerance: null,
      reason: "前三位有效数字不能为 000",
    };
  }
  return {
    ok: true,
    ohms: significant * 10 ** multiplier,
    kind: "four-digit",
    tolerance: "±1%",
  };
}

/**
 * 解码 SMD 电阻表面印字码（自动判别 3/4 位数字码与 EIA-96 码）
 *
 * @param rawInput - 用户原始输入（大小写、空格不限）
 * @returns 解码结果；非法输入给出中文原因
 */
export function decodeSmdCode(rawInput: string): SmdDecodeResult {
  const code = rawInput.replace(/\s+/g, "").toUpperCase();

  if (!code) {
    return {
      ok: false,
      ohms: null,
      kind: null,
      tolerance: null,
      reason: "请输入电阻表面印字码",
    };
  }
  if (!/^[0-9A-ZR]+$/.test(code)) {
    return {
      ok: false,
      ohms: null,
      kind: null,
      tolerance: null,
      reason: "含非法字符：印字码只能包含数字与字母（R / A-Z）",
    };
  }

  // EIA-96：恰好 3 字符，形如 2 位数字 + 1 位字母乘数
  if (/^\d{2}[A-Z]$/.test(code)) {
    const index = Number(code.slice(0, 2));
    const letter = code[2] ?? "";
    if (index < 1 || index > 96) {
      return {
        ok: false,
        ohms: null,
        kind: null,
        tolerance: null,
        reason: "EIA-96 序号应为 01-96",
      };
    }
    const exponent = EIA96_MULTIPLIER_LETTERS[letter];
    if (exponent === undefined) {
      return {
        ok: false,
        ohms: null,
        kind: null,
        tolerance: null,
        reason: `EIA-96 不使用字母 ${letter} 作为乘数`,
      };
    }
    return {
      ok: true,
      ohms: (EIA96_MANTISSAS[index - 1] ?? 0) * 10 ** exponent,
      kind: "eia96",
      tolerance: "±1%",
    };
  }

  // 3 位纯数字可能既是 3 位数字码又是 EIA-96（01A 已在上面分支处理）；
  // 其余形态统一走数字码 / R 位置码解析
  return decodeDigital(code);
}

/**
 * 将欧姆值格式化为带公制词头的易读字符串
 *
 * @param ohms - 电阻值（欧姆）
 * @returns 如 4.7 kΩ、301 Ω、2.2 MΩ、100 mΩ
 */
export function formatOhms(ohms: number): string {
  if (ohms === 0) {
    return "0 Ω（零欧姆跳线）";
  }
  const units: Array<{ threshold: number; suffix: string }> = [
    { threshold: 1e9, suffix: " GΩ" },
    { threshold: 1e6, suffix: " MΩ" },
    { threshold: 1e3, suffix: " kΩ" },
    { threshold: 1, suffix: " Ω" },
    { threshold: 1e-3, suffix: " mΩ" },
  ];
  const match = units.find((unit) => ohms >= unit.threshold) ?? {
    threshold: 1e-3,
    suffix: " mΩ",
  };
  const value = ohms / match.threshold;
  const rounded = Math.round(value * 100) / 100;
  return `${rounded}${match.suffix}`;
}

/**
 * 由目标阻值生成最接近的标准印字码候选
 *
 * 同时搜索 3 位码（E24 ±5%）、4 位码（±1%）与 EIA-96 码（±1%），
 * 返回相对偏差最小者。
 *
 * @param ohms - 目标阻值（欧姆，必须为正数）
 * @returns 候选码列表（按偏差升序，至多 3 条）；输入非法时返回空数组
 */
export function encodeSmdCode(
  ohms: number,
): Array<{
  code: string;
  kind: SmdCodeKind;
  ohms: number;
  deviationPct: number;
}> {
  if (!Number.isFinite(ohms) || ohms <= 0) {
    return [];
  }

  const candidates: Array<{
    code: string;
    kind: SmdCodeKind;
    ohms: number;
    deviationPct: number;
  }> = [];

  // 3 位码：有效数字 10-99，乘数 0-9（部分厂家印到 6 即 MΩ 级，这里允许全幂次）
  for (let sig = 10; sig <= 99; sig += 1) {
    for (let exp = 0; exp <= 6; exp += 1) {
      const value = sig * 10 ** exp;
      candidates.push({
        code: `${sig}${exp}`,
        kind: "three-digit",
        ohms: value,
        deviationPct: Math.abs((value - ohms) / ohms) * 100,
      });
    }
  }

  // 4 位码：有效数字 100-999，乘数 0-6
  for (let sig = 100; sig <= 999; sig += 1) {
    for (let exp = 0; exp <= 5; exp += 1) {
      const value = sig * 10 ** exp;
      candidates.push({
        code: `${sig}${exp}`,
        kind: "four-digit",
        ohms: value,
        deviationPct: Math.abs((value - ohms) / ohms) * 100,
      });
    }
  }

  // EIA-96 码：96 个基数 × 标准字母乘数
  for (let index = 1; index <= 96; index += 1) {
    Object.entries(EIA96_MULTIPLIER_LETTERS).forEach(([letter, exp]) => {
      const value = (EIA96_MANTISSAS[index - 1] ?? 0) * 10 ** exp;
      candidates.push({
        code: `${String(index).padStart(2, "0")}${letter}`,
        kind: "eia96",
        ohms: value,
        deviationPct: Math.abs((value - ohms) / ohms) * 100,
      });
    });
  }

  candidates.sort((a, b) => a.deviationPct - b.deviationPct);

  // 去重：同一体系只保留偏差最小的一条
  const seen = new Set<SmdCodeKind>();
  return candidates.filter((candidate) => {
    if (seen.has(candidate.kind)) {
      return false;
    }
    seen.add(candidate.kind);
    return true;
  });
}
