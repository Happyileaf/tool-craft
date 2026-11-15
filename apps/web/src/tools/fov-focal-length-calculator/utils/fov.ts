import { FOV_DIMENSIONS, FULL_FRAME_DIAGONAL, SENSOR_PRESETS } from '../constants';
import type { FovDimension, SensorPreset } from '../constants';

export interface SensorSize {
  width: number;
  height: number;
}

export interface FovResult {
  /** 画幅对角线长度（毫米） */
  diagonal: number;
  /** 相对全画幅的裁切系数 */
  cropFactor: number;
  /** 对角线视角（度） */
  diagonalFov: number;
  /** 水平视角（度） */
  horizontalFov: number;
  /** 垂直视角（度） */
  verticalFov: number;
  /** 35mm 等效焦距 */
  equivalentFocal: number;
  /** 35mm 等效光圈 */
  equivalentAperture: number;
}

export interface SensorComparisonRow {
  key: string;
  label: string;
  cropFactor: number;
  diagonalFov: number;
  horizontalFov: number;
  equivalentFocal: number;
}

const DEG = 180 / Math.PI;

/**
 * 计算画幅对角线长度
 */
export function sensorDiagonal(width: number, height: number): number {
  validateSensorSize(width, height);
  return Math.sqrt(width ** 2 + height ** 2);
}

/**
 * 由画幅尺寸计算相对 35mm 全画幅的裁切系数
 */
export function cropFactorFromSize(width: number, height: number): number {
  return FULL_FRAME_DIAGONAL / sensorDiagonal(width, height);
}

/**
 * 单边视角：FOV = 2 × atan(size / (2 × focal))
 */
export function fieldOfView(size: number, focal: number): number {
  if (!Number.isFinite(size) || size <= 0) {
    throw new Error('传感器尺寸必须大于 0');
  }
  if (!Number.isFinite(focal) || focal <= 0) {
    throw new Error('焦距必须大于 0');
  }
  return 2 * Math.atan(size / (2 * focal)) * DEG;
}

/**
 * 已知目标视角反推焦距：f = size / (2 × tan(FOV / 2))
 */
export function focalFromFov(fovDegrees: number, size: number): number {
  if (!Number.isFinite(fovDegrees) || fovDegrees <= 0 || fovDegrees >= 180) {
    throw new Error('目标视角必须大于 0 且小于 180 度');
  }
  if (!Number.isFinite(size) || size <= 0) {
    throw new Error('传感器尺寸必须大于 0');
  }
  return size / (2 * Math.tan((fovDegrees / 2) / DEG));
}

/**
 * 35mm 等效焦距
 */
export function equivalentFocal(focal: number, crop: number): number {
  if (!Number.isFinite(focal) || focal <= 0) {
    throw new Error('焦距必须大于 0');
  }
  if (!Number.isFinite(crop) || crop <= 0) {
    throw new Error('裁切系数必须大于 0');
  }
  return focal * crop;
}

/**
 * 35mm 等效光圈（仅用于景深 / 视角等效表达）
 */
export function equivalentAperture(aperture: number, crop: number): number {
  if (!Number.isFinite(aperture) || aperture <= 0) {
    throw new Error('光圈值必须大于 0');
  }
  if (!Number.isFinite(crop) || crop <= 0) {
    throw new Error('裁切系数必须大于 0');
  }
  return aperture * crop;
}

/**
 * 综合计算某画幅、某焦距下的视角与等效参数
 */
export function calculateFov(
  sensor: SensorSize,
  focal: number,
  aperture: number,
  cropFactor?: number,
): FovResult {
  validateSensorSize(sensor.width, sensor.height);
  if (!Number.isFinite(focal) || focal <= 0) {
    throw new Error('焦距必须大于 0');
  }
  const diagonal = sensorDiagonal(sensor.width, sensor.height);
  const crop = cropFactor ?? FULL_FRAME_DIAGONAL / diagonal;
  if (!Number.isFinite(crop) || crop <= 0) {
    throw new Error('裁切系数必须大于 0');
  }
  return {
    diagonal,
    cropFactor: crop,
    diagonalFov: fieldOfView(diagonal, focal),
    horizontalFov: fieldOfView(sensor.width, focal),
    verticalFov: fieldOfView(sensor.height, focal),
    equivalentFocal: equivalentFocal(focal, crop),
    equivalentAperture: equivalentAperture(aperture, crop),
  };
}

/**
 * 按指定视角维度获取对应物理尺寸
 */
export function dimensionSize(sensor: SensorSize, dimension: FovDimension): number {
  const diagonal = sensorDiagonal(sensor.width, sensor.height);
  if (dimension === 'horizontal') {
    return sensor.width;
  }
  if (dimension === 'vertical') {
    return sensor.height;
  }
  return diagonal;
}

/**
 * 同一焦距下遍历所有预设画幅，生成视角与等效焦距对比表
 */
export function compareSensors(focal: number): SensorComparisonRow[] {
  if (!Number.isFinite(focal) || focal <= 0) {
    throw new Error('焦距必须大于 0');
  }
  return SENSOR_PRESETS.map((preset: SensorPreset) => {
    const diagonal = sensorDiagonal(preset.width, preset.height);
    return {
      key: preset.key,
      label: preset.label,
      cropFactor: preset.cropFactor,
      diagonalFov: fieldOfView(diagonal, focal),
      horizontalFov: fieldOfView(preset.width, focal),
      equivalentFocal: equivalentFocal(focal, preset.cropFactor),
    };
  });
}

/**
 * 根据维度值返回中文标签
 */
export function dimensionLabel(dimension: FovDimension): string {
  return FOV_DIMENSIONS.find((item) => item.value === dimension)?.label ?? '对角线视角';
}

function validateSensorSize(width: number, height: number): void {
  if (!Number.isFinite(width) || width <= 0) {
    throw new Error('传感器宽度必须大于 0');
  }
  if (!Number.isFinite(height) || height <= 0) {
    throw new Error('传感器高度必须大于 0');
  }
}
