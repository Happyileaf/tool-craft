/**
 * 二维码容错等级枚举，等级越高可遮挡面积越大、可编码字符越少
 */
export enum QrErrorLevelEnum {
  /** 低容错，约可恢复 7% 损毁面积 */
  L = 'L',
  /** 中容错，约可恢复 15% 损毁面积 */
  M = 'M',
  /** 四分位容错，约可恢复 25% 损毁面积 */
  Q = 'Q',
  /** 高容错，约可恢复 30% 损毁面积 */
  H = 'H',
}

/**
 * 容错等级对应的国际化文案键，键为容错等级枚举值，值为点分文案路径
 */
export const QrErrorLevelLabelKeyMap: Record<QrErrorLevelEnum, string> = {
  /** 低容错文案键 */
  [QrErrorLevelEnum.L]: 'tools.qr.levelL',
  /** 中容错文案键 */
  [QrErrorLevelEnum.M]: 'tools.qr.levelM',
  /** 四分位容错文案键 */
  [QrErrorLevelEnum.Q]: 'tools.qr.levelQ',
  /** 高容错文案键 */
  [QrErrorLevelEnum.H]: 'tools.qr.levelH',
};

/**
 * 容错等级说明文案键，键为容错等级枚举值，值为损毁恢复百分比的点分文案路径
 */
export const QrErrorLevelDescKeyMap: Record<QrErrorLevelEnum, string> = {
  /** 低容错说明文案键 */
  [QrErrorLevelEnum.L]: 'tools.qr.levelLDesc',
  /** 中容错说明文案键 */
  [QrErrorLevelEnum.M]: 'tools.qr.levelMDesc',
  /** 四分位容错说明文案键 */
  [QrErrorLevelEnum.Q]: 'tools.qr.levelQDesc',
  /** 高容错说明文案键 */
  [QrErrorLevelEnum.H]: 'tools.qr.levelHDesc',
};

/**
 * 容错等级选项数据源，供分段选择控件渲染
 */
export const QrErrorLevelOptions: Array<{
  label: string;
  value: QrErrorLevelEnum;
}> = [
  {
    label: QrErrorLevelLabelKeyMap[QrErrorLevelEnum.L],
    value: QrErrorLevelEnum.L,
  },
  {
    label: QrErrorLevelLabelKeyMap[QrErrorLevelEnum.M],
    value: QrErrorLevelEnum.M,
  },
  {
    label: QrErrorLevelLabelKeyMap[QrErrorLevelEnum.Q],
    value: QrErrorLevelEnum.Q,
  },
  {
    label: QrErrorLevelLabelKeyMap[QrErrorLevelEnum.H],
    value: QrErrorLevelEnum.H,
  },
];

/**
 * 二维码输出格式枚举
 */
export enum QrOutputFormatEnum {
  /** PNG 位图格式 */
  PNG = 'png',
  /** SVG 矢量格式 */
  SVG = 'svg',
}

/**
 * 输出格式对应的国际化文案键，键为格式枚举值，值为点分文案路径
 */
export const QrOutputFormatLabelKeyMap: Record<QrOutputFormatEnum, string> = {
  /** PNG 格式文案键 */
  [QrOutputFormatEnum.PNG]: 'tools.qr.downloadPng',
  /** SVG 格式文案键 */
  [QrOutputFormatEnum.SVG]: 'tools.qr.downloadSvg',
};

/**
 * 输出格式选项数据源
 */
export const QrOutputFormatOptions: Array<{
  label: string;
  value: QrOutputFormatEnum;
}> = [
  {
    label: QrOutputFormatLabelKeyMap[QrOutputFormatEnum.PNG],
    value: QrOutputFormatEnum.PNG,
  },
  {
    label: QrOutputFormatLabelKeyMap[QrOutputFormatEnum.SVG],
    value: QrOutputFormatEnum.SVG,
  },
];

/**
 * 工具首次载入时填入的示例内容，使用工具箱官方域名便于直接扫码体验
 */
export const DEFAULT_TEXT = 'https://toolcraft.dev';

/**
 * 二维码最小边长（像素），低于该尺寸手机摄像头难以稳定识别
 */
export const SIZE_MIN = 128;

/**
 * 二维码最大边长（像素），兼顾高清打印需求与浏览器渲染性能
 */
export const SIZE_MAX = 1024;

/**
 * 默认边长（像素），在常见屏幕上扫码清晰度与布局体积的平衡点
 */
export const DEFAULT_SIZE = 256;

/**
 * 默认前景色，近黑色保证最高扫码对比度
 */
export const DEFAULT_DARK_COLOR = '#0F172A';

/**
 * 默认背景色，纯白色符合扫码器对静区亮度的要求
 */
export const DEFAULT_LIGHT_COLOR = '#FFFFFF';
