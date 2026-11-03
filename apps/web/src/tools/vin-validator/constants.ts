/**
 * VIN（车辆识别代号）校验常量
 * 依据：ISO 3779 / GB 16735-2019，校验位算法见 49 CFR 565.15（美国 FMVSS 115 沿用）
 */

/** VIN 固定长度（除历史车型外，1981 年后全球统一 17 位） */
export const VIN_LENGTH = 17;

/**
 * 字母转码值表（GB 16735 附录 / 49 CFR 565.15 Table I）
 * I、O、Q 禁止出现在 VIN 中；其余字母按表映射 1-9
 */
export const VIN_TRANSLITERATION: Record<string, number> = {
  A: 1, B: 2, C: 3, D: 4, E: 5, F: 6, G: 7, H: 8,
  J: 1, K: 2, L: 3, M: 4, N: 5,
  P: 7, R: 9,
  S: 2, T: 3, U: 4, V: 5, W: 6, X: 7, Y: 8, Z: 9,
  '0': 0, '1': 1, '2': 2, '3': 3, '4': 4,
  '5': 5, '6': 6, '7': 7, '8': 8, '9': 9,
};

/** 各位权重（49 CFR 565.15 Table II，第 9 位为校验位不参与、权重 0） */
export const VIN_WEIGHTS = [8, 7, 6, 5, 4, 3, 2, 10, 0, 9, 8, 7, 6, 5, 4, 3, 2];

/** 校验位所在位置（1-基）：第 9 位 */
export const CHECK_DIGIT_POSITION = 9;

/** VIN 中禁止出现的字母（易与 1/0 混淆） */
export const FORBIDDEN_LETTERS = new Set(['I', 'O', 'Q']);

/** 合法字符集：数字 0-9 + 除 I/O/Q 外的大写字母 */
export const VALID_VIN_PATTERN = /^[0-9A-HJ-NPR-Z]{17}$/;

/** 中国乘用车 WMI 常见前缀（仅提示用，非穷举、不参与合法性判定） */
export const CN_WMI_PREFIXES = ['L', 'LS', 'LFV', 'LGW', 'LHG', 'LJD', 'LNV', 'LPA', 'LSG', 'LVV'];

/** 示例 VIN：1HGCM82633A004352（公开教学示例，第 9 位校验码 3 合法） */
export const SAMPLE_VIN = '1HGCM82633A004352';
