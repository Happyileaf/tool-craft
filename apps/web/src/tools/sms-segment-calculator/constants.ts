/**
 * SMS 分片计算器的界面常量
 */

export type SmsModeOption = 'auto' | 'gsm7' | 'ucs2';

export const SMS_MODE_OPTIONS: Array<{ label: string; value: SmsModeOption }> = [
  { label: '自动判定', value: 'auto' },
  { label: '强制 GSM-7', value: 'gsm7' },
  { label: '强制 UCS-2', value: 'ucs2' },
];

/** GSM 示例：纯英文，单条 */
export const SMS_SAMPLE_GSM =
  'Your verification code is 482915. It expires in 10 minutes. Do not share this code with anyone.';

/** UCS-2 示例：含中文，触发编码切换 */
export const SMS_SAMPLE_UCS2 =
  '【ToolCraft】您的验证码为 482915，10 分钟内有效。请勿向任何人泄露验证码，如非本人操作请忽略本短信。';

/** 扩展字符演示 */
export const SMS_SAMPLE_EXTENSION = 'Price: €100 ^_^ [sale] ~50% off | {code}';
