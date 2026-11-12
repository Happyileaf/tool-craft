/** OID 编解码工具的常量与示例 */

export const DEFAULT_DOTTED_INPUT = '1.2.840.113549.1.1.11';

export const DEFAULT_HEX_INPUT = '06 09 2a 86 48 86 f7 0d 01 01 0b';

export const HEX_PLACEHOLDER = '例如：06 06 2a 86 48 86 f7 0d';

export type CodecMode = 'encode' | 'decode';

export const MODE_OPTIONS: Array<{ value: CodecMode; label: string }> = [
  { value: 'encode', label: '点分十进制 → BER 十六进制' },
  { value: 'decode', label: 'BER 十六进制 → 点分十进制' },
];

/** 常见 OID 速查，供一键填充 */
export const OID_PRESETS: Array<{ label: string; dotted: string }> = [
  { label: 'RSA 加密 (pkcs-1)', dotted: '1.2.840.113549.1.1.1' },
  { label: 'SHA-256 签名', dotted: '1.2.840.113549.1.1.11' },
  { label: 'EC 公钥 (ecPublicKey)', dotted: '1.2.840.10045.2.1' },
  { label: 'P-256 曲线 (prime256v1)', dotted: '1.2.840.10045.3.1.7' },
  { label: 'X.500 CN (commonName)', dotted: '2.5.4.3' },
  { label: 'SNMP sysDescr', dotted: '1.3.6.1.2.1.1.1' },
];
