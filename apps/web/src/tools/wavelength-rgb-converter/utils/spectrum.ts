/**
 * 可见光波长 → sRGB 颜色转换纯函数
 *
 * 采用 Dan Bruton 经典可见光近似算法的工程化移植：
 * 先在 380–750nm 上做六段线性插值得到线性 R/G/B（0–1），
 * 再按边缘衰减因子 factor 与 gamma 校正映射到 0–255 整数。
 * 所有分段边界与参数固定写死，不引入任何第三方依赖。
 */
import {
  BAND_NEAR_IR,
  BAND_NEAR_UV,
  DEFAULT_GAMMA,
  GRADIENT_STEP_NM,
  SPECTRAL_BANDS,
  VISIBLE_MAX_NM,
  VISIBLE_MIN_NM,
} from '../constants';

/** RGB 三元组，各通道取值 0–255 */
export type RgbTriplet = [number, number, number];

/** 线性光通道三元组，各通道取值 0–1 */
type LinearTriplet = [number, number, number];

/** 光谱区间元信息 */
export interface SpectralBandMeta {
  /** 区间标识（越界时为 near-uv / near-ir） */
  key: string;
  /** 中文区间名 */
  label: string;
  /** antd Tag 配色；越界时为 null */
  tagColor: string | null;
}

/** 波长转换结果：越界时 rgb / hex 均为 null，不伪造颜色 */
export interface WavelengthColorResult {
  /** 是否落在可见光谱（380–750nm）之外 */
  outOfRange: boolean;
  /** 中文区间名（紫 / 蓝 / 青 / 绿 / 黄 / 橙 / 红 / 近紫外 / 近红外） */
  band: string;
  /** 0–255 整数 RGB；越界为 null */
  rgb: RgbTriplet | null;
  /** 大写 #RRGGBB；越界为 null */
  hex: string | null;
  /** 边缘衰减因子（0.3–1）；越界为 null */
  factor: number | null;
}

/** 批量转换的合法行结果 */
export interface BatchSuccessRow {
  /** 原始文本中的行号（从 1 开始，空行也占行号） */
  line: number;
  /** 去空白后的原始输入 */
  raw: string;
  /** 解析出的波长（nm） */
  wavelength: number;
  /** 单波长转换结果 */
  result: WavelengthColorResult;
}

/** 批量转换的非法行结果 */
export interface BatchErrorRow {
  /** 原始文本中的行号（从 1 开始，空行也占行号） */
  line: number;
  /** 去空白后的原始输入 */
  raw: string;
  /** 非法原因 */
  error: string;
}

/** 批量转换汇总结果，合法与非法行分别收集，不整体抛出 */
export interface BatchConvertResult {
  /** 可解析为有限数字的行（含落在可见光谱之外的行） */
  validRows: BatchSuccessRow[];
  /** 非数字等无法解析的行 */
  invalidRows: BatchErrorRow[];
}

/**
 * 按六段线性插值计算线性 R/G/B（0–1）
 *
 * 分段（左闭右开，末段含 750nm）：
 * 380–440 紫色段 R 衰减；440–490 蓝色段 G 上升；490–510 青色段 B 衰减；
 * 510–580 绿色段 R 上升；580–645 黄橙段 G 衰减；645–750 纯红段。
 *
 * @param wavelengthNm - 波长（nm），调用方需保证在 380–750 之间
 * @returns 线性光三通道 [R, G, B]
 */
function linearRgbFromWavelength(wavelengthNm: number): LinearTriplet {
  let r = 0;
  let g = 0;
  let b = 0;

  if (wavelengthNm >= 380 && wavelengthNm < 440) {
    r = -(wavelengthNm - 440) / 60;
    g = 0;
    b = 1;
  } else if (wavelengthNm >= 440 && wavelengthNm < 490) {
    r = 0;
    g = (wavelengthNm - 440) / 50;
    b = 1;
  } else if (wavelengthNm >= 490 && wavelengthNm < 510) {
    r = 0;
    g = 1;
    b = -(wavelengthNm - 510) / 20;
  } else if (wavelengthNm >= 510 && wavelengthNm < 580) {
    r = (wavelengthNm - 510) / 70;
    g = 1;
    b = 0;
  } else if (wavelengthNm >= 580 && wavelengthNm < 645) {
    r = 1;
    g = -(wavelengthNm - 645) / 65;
    b = 0;
  } else {
    // 645–750nm：纯红段
    r = 1;
    g = 0;
    b = 0;
  }

  return [r, g, b];
}

/**
 * 计算光谱两端的边缘衰减因子
 *
 * 380–420nm 由 0.3 线性升到 1；420–700nm 恒为 1；
 * 700–750nm 由 1 线性降到 0.3，模拟人眼对光谱边缘敏感度下降。
 *
 * @param wavelengthNm - 波长（nm），调用方需保证在 380–750 之间
 * @returns 衰减因子（0.3–1）
 */
function edgeAttenuationFactor(wavelengthNm: number): number {
  if (wavelengthNm < 420) {
    return 0.3 + (0.7 * (wavelengthNm - 380)) / 40;
  }
  if (wavelengthNm > 700) {
    return 0.3 + (0.7 * (750 - wavelengthNm)) / 50;
  }
  return 1;
}

/**
 * 将单通道线性值经衰减与 gamma 校正映射为 0–255 整数
 *
 * @param linear - 线性通道值（0–1）
 * @param factor - 边缘衰减因子
 * @param gamma - gamma 校正指数
 * @returns 四舍五入并 clamp 到 0–255 的整数
 */
function toChannel(linear: number, factor: number, gamma: number): number {
  const value = 255 * factor * Math.pow(linear, gamma);
  return Math.max(0, Math.min(255, Math.round(value)));
}

/**
 * 将 0–255 RGB 三元组转换为大写、补零的 #RRGGBB 十六进制字符串
 *
 * @param rgb - RGB 三元组
 * @returns 形如 `#FF0010` 的 HEX 字符串
 */
export function rgbToHex(rgb: RgbTriplet): string {
  const [r, g, b] = rgb;
  const toHex = (channel: number): string =>
    Math.max(0, Math.min(255, Math.round(channel))).toString(16).padStart(2, '0').toUpperCase();
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * 查询波长对应的光谱区间元信息
 *
 * 边界归属高频段（分界点 440 / 490 / 510 / 580 / 600 / 645nm），
 * 与六段插值条件保持一致；越界返回近紫外 / 近红外。
 *
 * @param wavelengthNm - 波长（nm）
 * @returns 区间标识、中文名与 Tag 配色
 */
export function getSpectralBandMeta(wavelengthNm: number): SpectralBandMeta {
  if (wavelengthNm < VISIBLE_MIN_NM) {
    return { key: 'near-uv', label: BAND_NEAR_UV, tagColor: null };
  }
  if (wavelengthNm > VISIBLE_MAX_NM) {
    return { key: 'near-ir', label: BAND_NEAR_IR, tagColor: null };
  }
  const matched = SPECTRAL_BANDS.find((band, index) => {
    const isLast = index === SPECTRAL_BANDS.length - 1;
    return wavelengthNm >= band.min && (isLast ? wavelengthNm <= band.max : wavelengthNm < band.max);
  });
  // 入参已在 380–750 范围内，常量表必定命中；兜底保证类型完整
  const band = matched ?? { key: 'violet', label: BAND_NEAR_UV, tagColor: null };
  return { key: band.key, label: band.label, tagColor: band.tagColor };
}

/**
 * 查询波长对应的中文光谱区间名
 *
 * @param wavelengthNm - 波长（nm）
 * @returns 紫 / 蓝 / 青 / 绿 / 黄 / 橙 / 红；越界返回近紫外 / 近红外
 */
export function getSpectralBand(wavelengthNm: number): string {
  return getSpectralBandMeta(wavelengthNm).label;
}

/**
 * 将可见光波长转换为 sRGB 颜色
 *
 * 落在 380–750nm 之外时不伪造颜色，返回 outOfRange=true 且 rgb / hex 为 null。
 *
 * @param wavelengthNm - 波长（nm）
 * @param gamma - gamma 校正指数，默认 0.8
 * @returns 转换结果（区间、RGB、HEX、衰减因子与越界标志）
 */
export function wavelengthToRgb(
  wavelengthNm: number,
  gamma: number = DEFAULT_GAMMA,
): WavelengthColorResult {
  const bandMeta = getSpectralBandMeta(wavelengthNm);

  if (wavelengthNm < VISIBLE_MIN_NM || wavelengthNm > VISIBLE_MAX_NM) {
    return {
      outOfRange: true,
      band: bandMeta.label,
      rgb: null,
      hex: null,
      factor: null,
    };
  }

  const factor = edgeAttenuationFactor(wavelengthNm);
  const [lr, lg, lb] = linearRgbFromWavelength(wavelengthNm);
  const rgb: RgbTriplet = [
    toChannel(lr, factor, gamma),
    toChannel(lg, factor, gamma),
    toChannel(lb, factor, gamma),
  ];

  return {
    outOfRange: false,
    band: bandMeta.label,
    rgb,
    hex: rgbToHex(rgb),
    factor,
  };
}

/**
 * 批量解析并转换多行 / 逗号分隔的波长输入
 *
 * 按换行、英文逗号或中文逗号分割，自动跳过空白行；
 * 无法解析为有限数字的行收集为错误行（带行号），不影响合法行，整体不抛出。
 *
 * @param input - 原始多行文本
 * @returns 合法行结果与非法行错误汇总
 */
export function batchConvert(input: string): BatchConvertResult {
  const validRows: BatchSuccessRow[] = [];
  const invalidRows: BatchErrorRow[] = [];
  const tokens = input.split(/[\n,，]/);

  tokens.forEach((token, index) => {
    const line = index + 1;
    const raw = token.trim();
    if (raw === '') {
      return;
    }
    const wavelength = Number(raw);
    if (!Number.isFinite(wavelength)) {
      invalidRows.push({ line, raw, error: '无法解析为数字波长' });
      return;
    }
    validRows.push({ line, raw, wavelength, result: wavelengthToRgb(wavelength) });
  });

  return { validRows, invalidRows };
}

/**
 * 以固定步长离散采样可见光谱，生成 CSS linear-gradient 字符串
 *
 * @param stepNm - 采样步长（nm），默认 10nm
 * @returns 形如 `linear-gradient(to right, #4D004D 0%, #4D004D 1.35%, ...)` 的 CSS 值
 */
export function buildSpectrumGradient(stepNm: number = GRADIENT_STEP_NM): string {
  const stops: string[] = [];
  const span = VISIBLE_MAX_NM - VISIBLE_MIN_NM;
  for (let wavelength = VISIBLE_MIN_NM; wavelength <= VISIBLE_MAX_NM; wavelength += stepNm) {
    const color = wavelengthToRgb(wavelength);
    if (color.hex === null) {
      continue;
    }
    const percent = (((wavelength - VISIBLE_MIN_NM) / span) * 100).toFixed(2);
    stops.push(`${color.hex} ${percent}%`);
  }
  return `linear-gradient(to right, ${stops.join(', ')})`;
}
