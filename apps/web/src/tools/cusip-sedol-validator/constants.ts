/**
 * CUSIP / SEDOL 校验工具的常量：示例与默认输入
 */

/** 单个示例按钮 */
export interface SecurityIdExample {
  /** 按钮文案 */
  label: string;
  /** 示例识别码 */
  value: string;
  /** 是否为故意构造的非法示例 */
  invalid?: boolean;
}

/**
 * 示例集合：均为公开可查的真实证券代码
 *
 * - 037833100：Apple Inc.（CUSIP）
 * - 17275R102：Cisco Systems（CUSIP）
 * - 0263494：Barclays plc（SEDOL，伦敦上市）
 * - 037833101：Apple 代码末位改错的非法示例
 */
export const SECURITY_ID_EXAMPLES: SecurityIdExample[] = [
  { label: "CUSIP · Apple 037833100", value: "037833100" },
  { label: "CUSIP · Cisco 17275R102", value: "17275R102" },
  { label: "SEDOL · Barclays 0263494", value: "0263494" },
  { label: "CUSIP · 校验位错误", value: "037833101", invalid: true },
];

/** 默认填入的示例 */
export const DEFAULT_SECURITY_ID =
  SECURITY_ID_EXAMPLES[0]?.value ?? "037833100";
