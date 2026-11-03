/**
 * AWG 线规计算器：默认输入与示例
 */

/** 默认线号 */
export const DEFAULT_AWG = "12";

export interface AwgExample {
  /** 按钮文字 */
  label: string;
  /** 线号 */
  value: string;
}

/** 常见线号快捷示例 */
export const AWG_EXAMPLES: AwgExample[] = [
  { label: "4/0（大电流母线）", value: "4/0" },
  { label: "10 AWG（5500 W 家电）", value: "10" },
  { label: "12 AWG（家居布线）", value: "12" },
  { label: "18 AWG（低压线束）", value: "18" },
  { label: "24 AWG（Cat5 网线）", value: "24" },
  { label: "30 AWG（绕接细线）", value: "30" },
];
