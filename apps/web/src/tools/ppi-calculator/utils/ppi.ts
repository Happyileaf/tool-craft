/**
 * 屏幕 PPI / 像素密度计算纯函数
 *
 * 已知屏幕横向像素 W、纵向像素 H 与对角线物理长度 D（英寸）：
 * 对角线像素数 = √(W² + H²)，PPI = 对角线像素 / D。
 * 其余物理尺寸由像素 / PPI 得到英寸，再乘 25.4 换算为毫米。
 */

/** 毫米 / 英寸换算常量 */
export const MM_PER_INCH = 25.4;

/** PPI 计算结果 */
export interface PpiResult {
  /** 对角线上的像素数（√(W² + H²)） */
  diagonalPixels: number;
  /** 每英寸像素数 */
  ppi: number;
  /** 每厘米像素数 */
  ppcm: number;
  /** 像素点距（毫米 / 像素，正方形像素假设） */
  pitchMm: number;
  /** 屏幕物理宽度（毫米） */
  widthMm: number;
  /** 屏幕物理高度（毫米） */
  heightMm: number;
  /** 屏幕对角线长度（毫米，由英寸换算） */
  diagonalMm: number;
  /** 屏幕面积（平方毫米） */
  areaMm2: number;
  /** 总像素数 */
  totalPixels: number;
  /** 宽高比（宽 / 高，浮点） */
  aspectRatio: number;
}

/**
 * 校验分辨率与对角线输入
 *
 * @param widthPx - 横向像素
 * @param heightPx - 纵向像素
 * @param diagonalInch - 对角线长度（英寸）
 * @throws 当输入非有限正数或非整数像素时抛出错误
 */
export function validateScreenInputs(
  widthPx: number,
  heightPx: number,
  diagonalInch: number,
): void {
  if (!Number.isFinite(widthPx) || !Number.isInteger(widthPx) || widthPx <= 0) {
    throw new Error('横向像素必须为正整数');
  }
  if (!Number.isFinite(heightPx) || !Number.isInteger(heightPx) || heightPx <= 0) {
    throw new Error('纵向像素必须为正整数');
  }
  if (!Number.isFinite(diagonalInch) || diagonalInch <= 0) {
    throw new Error('对角线长度必须为大于 0 的数值（英寸）');
  }
  if (widthPx > 100_000 || heightPx > 100_000) {
    throw new Error('分辨率超出合理范围（单边上限 100000 像素）');
  }
}

/**
 * 计算屏幕密度与物理尺寸
 *
 * @param widthPx - 横向像素
 * @param heightPx - 纵向像素
 * @param diagonalInch - 对角线长度（英寸）
 * @returns PPI、点距、物理宽高、面积、宽高比等指标
 */
export function calculatePpi(
  widthPx: number,
  heightPx: number,
  diagonalInch: number,
): PpiResult {
  validateScreenInputs(widthPx, heightPx, diagonalInch);

  const diagonalPixels = Math.hypot(widthPx, heightPx);
  const ppi = diagonalPixels / diagonalInch;
  const ppcm = ppi / MM_PER_INCH * 10;
  const pitchMm = MM_PER_INCH / ppi;
  const widthMm = (widthPx / ppi) * MM_PER_INCH;
  const heightMm = (heightPx / ppi) * MM_PER_INCH;
  const diagonalMm = diagonalInch * MM_PER_INCH;

  return {
    diagonalPixels,
    ppi,
    ppcm,
    pitchMm,
    widthMm,
    heightMm,
    diagonalMm,
    areaMm2: widthMm * heightMm,
    totalPixels: widthPx * heightPx,
    aspectRatio: widthPx / heightPx,
  };
}

/** 宽高比常见命名（按 width / height 浮点值匹配） */
export interface AspectLabel {
  /** 标准写法，如 16:9 */
  label: string;
  /** 对应浮点值 */
  value: number;
}

/** 常见宽高比参考（误差 1% 以内视为匹配） */
export const COMMON_ASPECT_RATIOS: AspectLabel[] = [
  { label: '4:3', value: 4 / 3 },
  { label: '3:2', value: 3 / 2 },
  { label: '16:10', value: 16 / 10 },
  { label: '16:9', value: 16 / 9 },
  { label: '19.5:9', value: 19.5 / 9 },
  { label: '20:9', value: 20 / 9 },
  { label: '21:9', value: 21 / 9 },
];

/**
 * 识别最接近的标准宽高比名称
 *
 * @param ratio - 实际宽 / 高（须 ≥ 1，竖屏请先取倒数）
 * @returns 相对误差 ≤ 1% 的标准名称；否则返回 null
 */
export function nearestAspectRatio(ratio: number): string | null {
  let best: { label: string; diff: number } | null = null;
  for (const item of COMMON_ASPECT_RATIOS) {
    const diff = Math.abs(item.value - ratio) / item.value;
    if (!best || diff < best.diff) {
      best = { label: item.label, diff };
    }
  }
  return best && best.diff <= 0.01 ? best.label : null;
}

/**
 * 按像素分辨率描述宽高比，自动识别横屏 / 竖屏方向
 *
 * @param widthPx - 横向像素
 * @param heightPx - 纵向像素
 * @returns 如 `16:9（横屏）`、`9:19.5（竖屏）`；无法匹配标准比例时返回 null
 */
export function describeAspectRatio(widthPx: number, heightPx: number): string | null {
  const landscape = widthPx >= heightPx;
  const ratio = landscape ? widthPx / heightPx : heightPx / widthPx;
  const label = nearestAspectRatio(ratio);
  if (!label) return null;
  if (landscape) return `${label}（横屏）`;
  const [w, h] = label.split(':');
  return `${h ?? ''}:${w ?? ''}（竖屏）`;
}

/** 常见设备密度参考行 */
export interface DeviceReference {
  /** 设备名 */
  name: string;
  /** 典型 PPI */
  ppi: number;
  /** 密度档位说明 */
  tier: string;
}

/** 常见设备 PPI 参考（典型值） */
export const DEVICE_REFERENCES: DeviceReference[] = [
  { name: '24" 1080p 显示器', ppi: 92, tier: '标准桌面密度（~96 PPI）' },
  { name: '27" 1440p 显示器', ppi: 109, tier: '桌面 HiDPI 门槛附近' },
  { name: '27" 4K 显示器', ppi: 163, tier: 'HiDPI / Retina 桌面' },
  { name: 'iPhone（约 460 PPI）', ppi: 460, tier: '高密度手机屏' },
  { name: '安卓旗舰（约 500+ PPI）', ppi: 520, tier: '超高密度手机屏' },
  { name: '300 PPI 印刷', ppi: 300, tier: '常见印刷精度' },
];

/**
 * 对 PPI 给出密度档位描述
 *
 * @param ppi - 每英寸像素数
 * @returns 中文档位说明
 */
export function densityTier(ppi: number): string {
  if (ppi < 100) return '标准密度（< 100 PPI），常见于早期 / 大尺寸显示器';
  if (ppi < 150) return '中高密度，桌面显示器主流区间';
  if (ppi < 220) return 'HiDPI 区间，macOS Retina 等效缩放常用';
  if (ppi < 350) return '高密度，小尺寸平板 / 轻薄本屏幕';
  if (ppi < 450) return '很高密度，手机屏主流区间';
  return '超高密度（≥ 450 PPI），旗舰手机常见';
}

/**
 * 把毫米数格式化为带单位文本
 *
 * @param mm - 毫米
 * @param digits - 小数位数
 * @returns 如 `309.43 mm`
 */
export function formatMm(mm: number, digits = 2): string {
  return `${mm.toFixed(digits)} mm`;
}
