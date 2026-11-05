export type PlusCodeMode = 'encode' | 'decode' | 'shorten';

export interface ModeOption {
  value: PlusCodeMode;
  label: string;
  hint: string;
}

export const MODE_OPTIONS: ModeOption[] = [
  { value: 'encode', label: '坐标 → Plus Code', hint: '把经纬度编码为完整 Plus Code，可指定码长' },
  { value: 'decode', label: 'Plus Code → 坐标区域', hint: '解码完整 Plus Code，返回中心、四角边界与精度' },
  { value: 'shorten', label: '短码缩短 / 还原', hint: '基于参考位置在完整码与短码之间互转' },
];

/** 可选码长：偶数 2..8 与 10..15 */
export const CODE_LENGTH_OPTIONS: number[] = [2, 4, 6, 8, 10, 11, 12, 13, 14, 15];

export const DEFAULT_LATITUDE = 20.3701135;
export const DEFAULT_LONGITUDE = 2.78223535156;
export const DEFAULT_CODE_LENGTH = 11;
export const DEFAULT_FULL_CODE = '7FG49QCJ+2VX';
export const DEFAULT_SHORT_CODE = '9QCJ+2VX';
