import type { ImageFitEnum, ImageFormatEnum } from '../constants';

/**
 * 图片缩放参数表单状态
 * 数值字段以字符串保存，空字符串表示未填写
 */
type ImageResizeFormState = {
  /** 目标宽度输入，空字符串表示未填写 */
  width: string;
  /** 目标高度输入，空字符串表示未填写 */
  height: string;
  /** 缩放策略 */
  fit: ImageFitEnum;
  /** 输出格式 */
  format: ImageFormatEnum;
  /** 压缩质量输入（1-100），空字符串表示按默认值处理 */
  quality: string;
};

/**
 * 图片缩放请求参数
 * 结构与 image.resize 能力的 params 契约对齐，width 与 height 至少提供一个
 */
type ImageResizeRequestParams = {
  /** 目标宽度（像素），未提供时按高度与原图宽高比推算 */
  width?: number;
  /** 目标高度（像素），未提供时按宽度与原图宽高比推算 */
  height?: number;
  /** 缩放策略 */
  fit: ImageFitEnum;
  /** 输出格式 */
  format: ImageFormatEnum;
  /** 压缩质量 1-100，仅对 jpeg / webp 输出生效 */
  quality: number;
};

/**
 * 图片缩放结果
 */
type ImageResizeResult = {
  /** 结果图片的 object URL，用于预览与下载 */
  url: string;
  /** 结果宽度（像素），由结果图片实测得出 */
  width: number;
  /** 结果高度（像素），由结果图片实测得出 */
  height: number;
  /** 输出格式 */
  format: ImageFormatEnum;
  /** 下载文件名，含新尺寸与格式扩展名，如 resized-50x50.png */
  filename: string;
};

export type { ImageResizeFormState, ImageResizeRequestParams, ImageResizeResult };
