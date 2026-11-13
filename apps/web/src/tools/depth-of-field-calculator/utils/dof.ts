/**
 * 摄影景深与超焦距纯函数集合，不依赖 DOM 与 React；
 * 基于薄透镜几何光学模型，全部长度单位统一为毫米（mm）
 */

/** 景深计算完整结果 */
export interface DofResult {
  /** 超焦距 H（mm） */
  hyperfocal: number;
  /** 近界距离 Dn（mm） */
  nearLimit: number;
  /** 远界距离 Df（mm），对焦在超焦距或更远时为 Infinity */
  farLimit: number;
  /** 景深总深度（mm），远界无穷时为 Infinity */
  depthOfField: number;
  /** 前景深（对焦距离 − 近界，mm） */
  frontDepth: number;
  /** 后景深（远界 − 对焦距离，mm），远界无穷时为 Infinity */
  rearDepth: number;
  /** 对焦距离是否达到 / 超过超焦距 */
  atHyperfocalOrBeyond: boolean;
}

/** 常见传感器画幅与对应弥散圆直径（mm），依据标准冲印尺寸与观看距离约定 */
export const SENSOR_PRESETS: { label: string; value: number }[] = [
  { label: '全画幅（35mm）— 0.030 mm', value: 0.03 },
  { label: 'APS-H（Canon）— 0.024 mm', value: 0.024 },
  { label: 'APS-C（Canon）— 0.022 mm', value: 0.022 },
  { label: 'APS-C（尼康 / 索尼 / 富士）— 0.020 mm', value: 0.02 },
  { label: 'M4/3 画幅 — 0.015 mm', value: 0.015 },
  { label: '1 英寸 — 0.011 mm', value: 0.011 },
  { label: '1/2.3 英寸卡片机 — 0.006 mm', value: 0.006 },
];

/** 标准光圈档位（f 值，1/3 档精调由用户自行输入） */
export const APERTURE_STOPS: number[] = [
  1.4, 2, 2.8, 4, 5.6, 8, 11, 16, 22, 32,
];

/**
 * 计算超焦距 H = f² / (N × c)（标准定义）；
 * 对焦在 H 处时远界恰为无穷远，近界约为 H/2
 *
 * @param focalLength - 镜头焦距（mm）
 * @param aperture - 光圈 f 值（如 2.8 表示 f/2.8）
 * @param circleOfConfusion - 弥散圆直径（mm）
 * @returns 超焦距（mm）
 */
export function hyperfocalDistance(
  focalLength: number,
  aperture: number,
  circleOfConfusion: number,
): number {
  validateOpticsInputs(focalLength, aperture, circleOfConfusion);
  return round3((focalLength * focalLength) / (aperture * circleOfConfusion));
}

/** 内部使用的全精度超焦距，避免舍入误差影响近 / 远界推导 */
function rawHyperfocal(
  focalLength: number,
  aperture: number,
  circleOfConfusion: number,
): number {
  return (focalLength * focalLength) / (aperture * circleOfConfusion);
}

/**
 * 校验光学输入的合法性
 *
 * @param focalLength - 焦距
 * @param aperture - 光圈
 * @param circleOfConfusion - 弥散圆
 */
function validateOpticsInputs(
  focalLength: number,
  aperture: number,
  circleOfConfusion: number,
): void {
  if (!Number.isFinite(focalLength) || focalLength <= 0 || focalLength > 2000) {
    throw new Error('焦距需为 0–2000 mm 之间的正数');
  }
  if (!Number.isFinite(aperture) || aperture < 0.5 || aperture > 128) {
    throw new Error('光圈 f 值需落在 0.5–128 之间');
  }
  if (!Number.isFinite(circleOfConfusion) || circleOfConfusion <= 0 || circleOfConfusion > 0.1) {
    throw new Error('弥散圆直径需为 0–0.1 mm 之间的正数');
  }
}

/**
 * 计算完整景深结果。
 * 约定对焦距离 s 为镜头到被摄体的距离（mm）。
 * 近界 Dn = H × s / (H + (s − f))；
 * 远界 Df = H × s / (H − (s − f))，当 s ≥ H 时分母 ≤ 0，远界为无穷。
 *
 * @param focalLength - 焦距（mm）
 * @param aperture - 光圈 f 值
 * @param focusDistance - 对焦距离（mm）
 * @param circleOfConfusion - 弥散圆直径（mm）
 * @returns 超焦距、近 / 远界、景深与前 / 后景深
 */
export function calculateDepthOfField(
  focalLength: number,
  aperture: number,
  focusDistance: number,
  circleOfConfusion: number,
): DofResult {
  validateOpticsInputs(focalLength, aperture, circleOfConfusion);
  if (!Number.isFinite(focusDistance) || focusDistance <= 0) {
    throw new Error('对焦距离必须为大于 0 的数值');
  }

  const hyperfocal = rawHyperfocal(focalLength, aperture, circleOfConfusion);
  const atHyperfocalOrBeyond = focusDistance >= hyperfocal;

  // 标准薄透镜景深公式（H = f²/Nc）：
  // 近界 Dn = H × s / (H + s)；远界 Df = H × s / (H − s)，s ≥ H 时远界无穷
  const nearLimit = (hyperfocal * focusDistance) / (hyperfocal + focusDistance);

  let farLimit: number;
  const farDenominator = hyperfocal - focusDistance;
  if (farDenominator <= 0) {
    farLimit = Number.POSITIVE_INFINITY;
  } else {
    farLimit = (hyperfocal * focusDistance) / farDenominator;
  }

  const frontDepth = focusDistance - nearLimit;
  const rearDepth = Number.isFinite(farLimit) ? farLimit - focusDistance : Number.POSITIVE_INFINITY;
  const depthOfField = Number.isFinite(farLimit) ? farLimit - nearLimit : Number.POSITIVE_INFINITY;

  return {
    hyperfocal: round3(hyperfocal),
    nearLimit: round3(nearLimit),
    farLimit: Number.isFinite(farLimit) ? round3(farLimit) : Number.POSITIVE_INFINITY,
    depthOfField: Number.isFinite(depthOfField) ? round3(depthOfField) : Number.POSITIVE_INFINITY,
    frontDepth: round3(frontDepth),
    rearDepth: Number.isFinite(rearDepth) ? round3(rearDepth) : Number.POSITIVE_INFINITY,
    atHyperfocalOrBeyond,
  };
}

/**
 * 反推：给定目标近界距离，求所需对焦距离。
 * 由 Dn = H × s / (H + s) 解出 s = Dn × H / (H − Dn)
 *
 * @param targetNearLimit - 期望近界（mm）
 * @param focalLength - 焦距（mm）
 * @param aperture - 光圈 f 值
 * @param circleOfConfusion - 弥散圆直径（mm）
 * @returns 应对焦的距离（mm）
 */
export function focusDistanceForNearLimit(
  targetNearLimit: number,
  focalLength: number,
  aperture: number,
  circleOfConfusion: number,
): number {
  validateOpticsInputs(focalLength, aperture, circleOfConfusion);
  if (!Number.isFinite(targetNearLimit) || targetNearLimit <= 0) {
    throw new Error('目标近界必须为大于 0 的数值');
  }
  const hyperfocal = rawHyperfocal(focalLength, aperture, circleOfConfusion);
  if (targetNearLimit >= hyperfocal) {
    throw new Error('目标近界不能大于或等于超焦距，请改用超焦距对焦');
  }
  const focus = (targetNearLimit * hyperfocal) / (hyperfocal - targetNearLimit);
  return round3(focus);
}

/**
 * 毫米转米的展示格式化，小于 1000 mm 保留毫米，否则转米并保留两位小数
 *
 * @param mm - 毫米数值，允许 Infinity
 * @returns 带单位的中文字符串
 */
export function formatDistance(mm: number): string {
  if (!Number.isFinite(mm)) {
    return '∞（无穷远）';
  }
  if (mm < 1000) {
    return `${round3(mm)} mm`;
  }
  return `${(mm / 1000).toFixed(2)} m`;
}

/** 保留三位小数，消除浮点尾差 */
function round3(value: number): number {
  return Math.round((value + Number.EPSILON) * 1000) / 1000;
}
