/** 景深与超焦距的纯函数计算（薄透镜近似） */

import { APERTURE_MAX, APERTURE_MIN, UNIT_TO_MM, type LengthUnit } from '../constants';

export interface DofInput {
  /** 焦距，单位 mm */
  focalLength: number;
  /** 光圈 f 值 */
  aperture: number;
  /** 对焦距离，单位 mm */
  subjectDistance: number;
  /** 弥散圆直径，单位 mm */
  coc: number;
}

export interface DofResult {
  /** 超焦距，单位 mm */
  hyperfocalMm: number;
  /** 近景深边界，单位 mm */
  nearMm: number;
  /** 远景深边界，单位 mm；无穷远时为 null */
  farMm: number | null;
  /** 总景深，单位 mm；远景深无穷远时为 null */
  totalMm: number | null;
  /** 前景深，单位 mm */
  frontMm: number;
  /** 后景深，单位 mm；远景深无穷远时为 null */
  rearMm: number | null;
  /** 远景深是否为无穷远 */
  isInfiniteFar: boolean;
}

export interface ApertureSolveInput {
  focalLength: number;
  subjectDistance: number;
  coc: number;
  /** 目标总景深，单位 mm */
  targetDepthMm: number;
}

export function validateDofInput(input: DofInput): string | null {
  if (!Number.isFinite(input.focalLength) || input.focalLength <= 0) {
    return '焦距必须为正数';
  }
  if (!Number.isFinite(input.aperture) || input.aperture <= 0) {
    return '光圈必须为正数';
  }
  if (!Number.isFinite(input.subjectDistance) || input.subjectDistance <= 0) {
    return '对焦距离必须为正数';
  }
  if (!Number.isFinite(input.coc) || input.coc <= 0) {
    return '弥散圆直径必须为正数';
  }
  if (input.subjectDistance <= input.focalLength) {
    return '对焦距离必须大于焦距（当前接近微距极限）';
  }
  return null;
}

/** 计算超焦距 H = f²/(N·c) + f */
export function hyperfocal(input: Pick<DofInput, 'focalLength' | 'aperture' | 'coc'>): number {
  return (input.focalLength ** 2) / (input.aperture * input.coc) + input.focalLength;
}

/**
 * 计算景深，全部输入输出以毫米为单位；
 * 对焦距离达到或超过超焦距时远景深为无穷远
 */
export function calculateDof(input: DofInput): DofResult {
  const message = validateDofInput(input);
  if (message) {
    throw new Error(message);
  }
  const h = hyperfocal(input);
  const f = input.focalLength;
  const s = input.subjectDistance;

  const nearMm = (s * (h - f)) / (h + s - 2 * f);
  const isInfiniteFar = s >= h;
  const farMm = isInfiniteFar ? null : (s * (h - f)) / (h - s);
  const frontMm = s - nearMm;
  const rearMm = farMm === null ? null : farMm - s;
  const totalMm = farMm === null ? null : farMm - nearMm;

  return { hyperfocalMm: h, nearMm, farMm, totalMm, frontMm, rearMm, isInfiniteFar };
}

/** 把毫米换算为指定单位 */
export function convertLength(mm: number, unit: LengthUnit): number {
  return mm / UNIT_TO_MM[unit];
}

/** 格式化景深长度，保留 2 位小数并附带单位；无穷远显示为 ∞ */
export function formatLength(mm: number | null, unit: LengthUnit): string {
  if (mm === null) {
    return '∞';
  }
  const value = convertLength(mm, unit);
  if (value >= 1000) {
    return `${value.toFixed(0)} ${unit}`;
  }
  return `${value.toFixed(2)} ${unit}`;
}

/**
 * 反向求解：给定目标总景深，求所需光圈 f 值；
 * 在 [APERTURE_MIN, APERTURE_MAX] 内二分，目标不可达时返回 null
 */
export function solveApertureForDepthOfField(input: ApertureSolveInput): number | null {
  if (input.focalLength <= 0 || input.subjectDistance <= input.focalLength || input.coc <= 0) {
    return null;
  }
  if (!Number.isFinite(input.targetDepthMm) || input.targetDepthMm <= 0) {
    return null;
  }

  const depthAt = (aperture: number): number => {
    const result = calculateDof({
      focalLength: input.focalLength,
      aperture,
      subjectDistance: input.subjectDistance,
      coc: input.coc,
    });
    return result.totalMm ?? Number.POSITIVE_INFINITY;
  };

  const atMin = depthAt(APERTURE_MIN);
  const atMax = depthAt(APERTURE_MAX);
  if (input.targetDepthMm < atMin || input.targetDepthMm > atMax) {
    return null;
  }
  if (input.targetDepthMm === atMax) {
    return APERTURE_MAX;
  }

  let low = APERTURE_MIN;
  let high = APERTURE_MAX;
  for (let index = 0; index < 80; index += 1) {
    const mid = (low + high) / 2;
    if (depthAt(mid) >= input.targetDepthMm) {
      high = mid;
    } else {
      low = mid;
    }
  }
  return Math.round(((low + high) / 2) * 100) / 100;
}
