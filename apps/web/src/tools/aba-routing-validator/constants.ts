/**
 * ABA 路由号码校验工具的常量：示例与默认输入
 */

/** 单个示例 */
export interface AbaExample {
  /** 按钮文案 */
  label: string;
  /** 示例号码 */
  value: string;
  /** 是否为故意构造的非法示例 */
  invalid?: boolean;
}

/**
 * 示例集合：均为公开可查的真实路由号码
 */
export const ABA_EXAMPLES: AbaExample[] = [
  { label: "JPMorgan Chase 021000021", value: "021000021" },
  { label: "Bank of America 026009593", value: "026009593" },
  { label: "校验位错误", value: "021000022", invalid: true },
  { label: "前缀非法（99）", value: "991000021", invalid: true },
];

/** 默认填入的示例 */
export const DEFAULT_ABA = ABA_EXAMPLES[0]?.value ?? "021000021";

/** 批量模式示例文本（每行一个号码，故意混入非法行） */
export const BATCH_SAMPLE = `021000021
026009593
021000022
991000021
121000358`;
