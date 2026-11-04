/**
 * CSS clamp() 流式排版生成器的静态配置与输入约束
 */

/** 字号/视口输入的最小合法值（px） */
export const MIN_PX_VALUE = 0;

/** 字号/视口输入的最大合法值（px） */
export const MAX_PX_VALUE = 10000;

/** 数值输出保留的小数位数 */
export const OUTPUT_DECIMALS = 4;

/** 视口单位选项：vw 相对浏览器视口，cqw 相对查询容器 */
export type ViewportUnit = 'vw' | 'cqw';

/** 视口单位的展示元数据 */
export const VIEWPORT_UNIT_OPTIONS: {
  value: ViewportUnit;
  label: string;
  hint: string;
}[] = [
  {
    value: 'vw',
    label: 'vw（视口宽度）',
    hint: '相对于浏览器视口宽度，1vw = 视口宽度的 1%',
  },
  {
    value: 'cqw',
    label: 'cqw（容器查询宽度）',
    hint: '相对于最近的查询容器宽度，需在容器上声明 container-type',
  },
];

/** 生成器输入参数 */
export interface ClampInput {
  /** 最小字号（px），在最小视口及以下生效 */
  minFontSize: number;
  /** 最大字号（px），在最大视口及以上生效 */
  maxFontSize: number;
  /** 最小视口/容器宽度（px） */
  minViewport: number;
  /** 最大视口/容器宽度（px） */
  maxViewport: number;
  /** 视口单位：vw 或 cqw */
  viewportUnit: ViewportUnit;
}

/** 线性公式的计算中间量与最终产物 */
export interface ClampResult {
  /** 斜率：每 1px 视口宽度对应的字号增量（px） */
  slope: number;
  /** 以 vw/cqw 百分比表示的斜率系数 */
  slopeInViewportUnit: number;
  /** 线性截距（px），即视口宽度为 0 时的理论字号 */
  intercept: number;
  /** 根字号（rem 换算基准，px），固定 16px */
  rootFontSize: number;
  /** 最终 clamp() 表达式（px + 视口单位混合写法） */
  clampExpression: string;
  /** 可直接使用的 CSS 声明片段 */
  cssDeclaration: string;
}

/** 界面默认参数，覆盖典型移动端到桌面端的标题字号场景 */
export const DEFAULT_INPUT: ClampInput = {
  minFontSize: 16,
  maxFontSize: 32,
  minViewport: 375,
  maxViewport: 1280,
  viewportUnit: 'vw',
};
