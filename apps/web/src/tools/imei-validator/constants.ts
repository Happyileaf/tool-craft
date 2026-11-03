/** 示例 IMEI（公开的标准 Luhn 测试样例，非真实设备） */
export const IMEI_SAMPLE_INPUT = '356938035643809';

/** 可一键填入的其他样例 */
export const IMEI_SAMPLE_LIST = [
  { label: '合法 IMEI（15 位）', value: '356938035643809' },
  { label: 'IMEISV（16 位，无校验位）', value: '3569380356438091' },
  { label: '校验位错误', value: '356938035643800' },
];
