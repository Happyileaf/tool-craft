import type { WifiEncryption } from './utils/wifi';

export interface EncryptionOption {
  value: WifiEncryption;
  label: string;
  description: string;
}

export const ENCRYPTION_OPTIONS: EncryptionOption[] = [
  { value: 'WPA', label: 'WPA / WPA2 / WPA3', description: '最常见的家用与企业 Wi-Fi 加密' },
  { value: 'WEP', label: 'WEP', description: '老旧加密方式，仅兼容旧设备时使用' },
  { value: 'nopass', label: '开放网络（无密码）', description: '免密公共热点，不输出 P 字段' },
];

export const DEFAULT_SSID = 'MyHomeWiFi';
export const DEFAULT_PASSWORD = 'wireless-password';
