/** EPC069-12 固定头（BCD / 版本 001 / UTF-8 字符集 1 / SCT） */
export const EPC_HEADER_LINES = ['BCD', '001', '1', 'SCT'] as const;

/** 各业务字段的 EPC 规范长度上限 */
export const EPC_LIMITS = {
  /** 收款人名称 */
  name: 70,
  /** IBAN */
  iban: 34,
  /** 金额行（含 EUR 前缀） */
  amountLine: 12,
  /** 用途代码 */
  purposeCode: 4,
  /** 债权人引用 / 汇款说明 */
  remittance: 35,
  /** 备注 */
  note: 70,
  /** BIC */
  bic: 11,
} as const;

/** 生成面板默认填充的示例表单（EPC069-12 官方比利时红十字会示例） */
export const SAMPLE_FORM = {
  bic: 'BPOTBEB1',
  name: 'Red Cross',
  iban: 'BE72000000001616',
  amount: 12.34,
  purposeCode: 'CHAR',
  creditorReference: 'RF18539007547034',
  remittance: '',
  note: '',
} as const;

/** 解析面板默认填充的官方示例负载 */
export const SAMPLE_PAYLOAD = [
  'BCD',
  '001',
  '1',
  'SCT',
  'BPOTBEB1',
  'Red Cross',
  'BE72000000001616',
  'EUR12.34',
  'CHAR',
  'RF18539007547034',
  '',
  '',
].join('\r\n');
