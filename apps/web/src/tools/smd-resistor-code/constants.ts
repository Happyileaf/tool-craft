/**
 * SMD 电阻码计算器：默认输入与示例
 */

/** 默认解码样例：EIA-96 码 47A = 301 Ω */
export const DEFAULT_SMD_CODE = "472";

export interface SmdExample {
  /** 按钮文字 */
  label: string;
  /** 印字码 */
  value: string;
}

/** 一键载入的示例印字码 */
export const SMD_EXAMPLES: SmdExample[] = [
  { label: "472（4.7 kΩ，±5%）", value: "472" },
  { label: "4701（4.7 kΩ，±1%）", value: "4701" },
  { label: "47A（EIA-96，301 Ω）", value: "47A" },
  { label: "R10（0.1 Ω）", value: "R10" },
  { label: "000（零欧姆跳线）", value: "000" },
];

/** 体系中文名 */
export const KIND_NAMES_ZH: Record<string, string> = {
  "three-digit": "3 位数字码（E24，±5%）",
  "four-digit": "4 位数字码（±1%）",
  eia96: "EIA-96 字母码（±1%）",
  "zero-ohm": "零欧姆跳线（0 Ω）",
};
