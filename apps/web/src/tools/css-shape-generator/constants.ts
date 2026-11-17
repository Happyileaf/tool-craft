/**
 * CSS 形状生成器静态配置
 *
 * 设计说明：
 * - 形状参数到 CSS 是确定性纯函数，零运行时依赖，全部在浏览器主线程计算
 * - 同时输出 border / border-radius / clip-path 三类方案，按形状选用最合适的实现
 * - 所有几何坐标以百分比表示，生成结果与元素尺寸解耦，可直接复制使用
 */

/** 形状标识 */
export type ShapeId =
  | 'triangle'
  | 'arrow'
  | 'circle'
  | 'ellipse'
  | 'speech-bubble'
  | 'octagon'
  | 'trapezoid';

/** 形状实现方案 */
export type ShapeMethod = 'border' | 'border-radius' | 'clip-path';

/** 形状选项（供 Segmented / 选择器使用） */
export const SHAPE_OPTIONS: ReadonlyArray<{ id: ShapeId; name: string; method: ShapeMethod }> = [
  { id: 'triangle', name: '三角形', method: 'border' },
  { id: 'arrow', name: '箭头', method: 'border' },
  { id: 'circle', name: '圆形', method: 'border-radius' },
  { id: 'ellipse', name: '椭圆', method: 'border-radius' },
  { id: 'speech-bubble', name: '对话气泡', method: 'border-radius' },
  { id: 'octagon', name: '八角形', method: 'clip-path' },
  { id: 'trapezoid', name: '梯形', method: 'clip-path' },
];

/** 三角形 / 箭头朝向 */
export type Direction = 'up' | 'down' | 'left' | 'right';

export const DIRECTION_OPTIONS: ReadonlyArray<{ id: Direction; name: string }> = [
  { id: 'up', name: '朝上' },
  { id: 'right', name: '朝右' },
  { id: 'down', name: '朝下' },
  { id: 'left', name: '朝左' },
];

/** 形状参数集合 */
export interface ShapeConfig {
  shape: ShapeId;
  /** 元素宽度 px */
  width: number;
  /** 元素高度 px */
  height: number;
  /** 形状主色（CSS 颜色字符串，已做白名单 / 十六进制校验） */
  color: string;
  /** 三角形 / 箭头朝向 */
  direction: Direction;
  /** 圆形 / 椭圆等圆角百分比 0–100 */
  radius: number;
  /** 八角形切角占边长的百分比 0–40 */
  cut: number;
  /** 梯形上底相对宽度的百分比 10–100（clip-path 方案） */
  topWidth: number;
  /** 对话气泡圆角半径 px */
  bubbleRadius: number;
  /** 对话气泡尖角大小 px */
  tailSize: number;
}

/** 默认配置：覆盖全部参数字段，registry 以 JSON 字符串引用 */
export const DEFAULT_CONFIG: ShapeConfig = {
  shape: 'triangle',
  width: 200,
  height: 200,
  color: '#3b82f6',
  direction: 'up',
  radius: 50,
  cut: 20,
  topWidth: 55,
  bubbleRadius: 16,
  tailSize: 24,
};

/** 参数边界，供 InputNumber min/max 与纯函数校验共用 */
export const LIMITS = {
  minSize: 20,
  maxSize: 800,
  minRadius: 0,
  maxRadius: 100,
  minCut: 0,
  maxCut: 40,
  minTopWidth: 10,
  maxTopWidth: 100,
  minBubbleRadius: 0,
  maxBubbleRadius: 80,
  minTailSize: 0,
  maxTailSize: 80,
} as const;

/** 允许的 CSS 命名颜色（安全白名单，杜绝表达式注入） */
export const NAMED_COLORS: ReadonlySet<string> = new Set([
  'black',
  'silver',
  'gray',
  'white',
  'maroon',
  'red',
  'purple',
  'fuchsia',
  'green',
  'lime',
  'olive',
  'yellow',
  'navy',
  'blue',
  'teal',
  'aqua',
  'orange',
  'pink',
  'brown',
  'cyan',
]);
