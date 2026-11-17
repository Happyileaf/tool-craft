import {
  LIMITS,
  NAMED_COLORS,
  type Direction,
  type ShapeConfig,
  type ShapeId,
} from '../constants';

/** 单条 CSS 声明 */
export interface CssDeclaration {
  property: string;
  value: string;
}

/** 形状生成结果 */
export interface ShapeOutput {
  /** 应用到形状元素的声明 */
  declarations: CssDeclaration[];
  /** 可直接复制的 CSS 文本 */
  css: string;
  /** 预览用的 clip-path / border 关键值 */
  previewClipPath: string;
  /** 实现方案说明 */
  method: string;
}

/** 校验颜色：命名白名单或 #rgb / #rrggbb / #rrggbbaa */
export function sanitizeColor(color: string): string {
  const value = color.trim().toLowerCase();
  if (NAMED_COLORS.has(value)) {
    return value;
  }
  if (/^#(?:[0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(value)) {
    return value;
  }
  return '#000000';
}

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    return min;
  }
  return Math.min(max, Math.max(min, value));
}

/** 把声明数组序列化为 CSS 规则文本 */
function toCss(declarations: CssDeclaration[]): string {
  return declarations.map((d) => `  ${d.property}: ${d.value};`).join('\n');
}

/** 四向三角形的边框宽度与配色（透明边框法） */
function triangleBorders(
  direction: Direction,
  horizontal: number,
  vertical: number,
  color: string,
): { width: string; color: string } {
  const transparent = 'transparent';
  const borderMap: Record<Direction, { width: string; color: string }> = {
    up: {
      width: `${vertical}px ${horizontal}px 0 ${horizontal}px`,
      color: `${color} ${transparent} ${transparent} ${transparent}`,
    },
    down: {
      width: `0 ${horizontal}px ${vertical}px ${horizontal}px`,
      color: `${transparent} ${transparent} ${color} ${transparent}`,
    },
    left: {
      width: `${horizontal}px ${horizontal * 2}px ${horizontal}px 0`,
      color: `${transparent} ${transparent} ${transparent} ${color}`,
    },
    right: {
      width: `${horizontal}px 0 ${horizontal}px ${horizontal * 2}px`,
      color: `${transparent} ${color} ${transparent} ${transparent}`,
    },
  };
  return borderMap[direction];
}

/**
 * border 三角形：宽高为 0，利用透明边框拼出直角等腰三角形。
 */
function buildTriangle(config: ShapeConfig): ShapeOutput {
  const width = clamp(config.width, LIMITS.minSize, LIMITS.maxSize);
  const height = clamp(config.height, LIMITS.minSize, LIMITS.maxSize);
  const color = sanitizeColor(config.color);
  const horizontal = Math.round(width / 2);
  const vertical = Math.round(height);
  const border = triangleBorders(config.direction, horizontal, vertical, color);

  const declarations: CssDeclaration[] = [
    { property: 'width', value: '0' },
    { property: 'height', value: '0' },
    { property: 'border-style', value: 'solid' },
    { property: 'border-width', value: border.width },
    { property: 'border-color', value: border.color },
  ];

  return {
    declarations,
    css: `.shape {\n${toCss(declarations)}\n}`,
    previewClipPath: '',
    method: 'border 透明边框法',
  };
}

/**
 * 箭头：主元素为矩形杆身，::after 伪元素用透明边框绘制三角箭头。
 * 水平方向杆身横置，垂直方向杆身竖置，避免同一属性出现重复声明。
 */
function buildArrow(config: ShapeConfig): ShapeOutput {
  const width = clamp(config.width, LIMITS.minSize, LIMITS.maxSize);
  const height = clamp(config.height, LIMITS.minSize, LIMITS.maxSize);
  const color = sanitizeColor(config.color);
  const horizontal = config.direction === 'left' || config.direction === 'right';
  const shaftThickness = Math.max(4, Math.round((horizontal ? height : width) * 0.12));
  const head = Math.round((horizontal ? height : width) * 0.4);

  const declarations: CssDeclaration[] = horizontal
    ? [
        { property: 'width', value: `${width}px` },
        { property: 'height', value: `${shaftThickness}px` },
        { property: 'background', value: color },
        { property: 'position', value: 'relative' },
      ]
    : [
        { property: 'width', value: `${shaftThickness}px` },
        { property: 'height', value: `${height}px` },
        { property: 'background', value: color },
        { property: 'position', value: 'relative' },
      ];

  const border = triangleBorders(config.direction, head, head, color);
  const positionMap: Record<Direction, string> = {
    up: 'bottom: 100%; left: 50%; transform: translateX(-50%);',
    down: 'top: 100%; left: 50%; transform: translateX(-50%);',
    left: 'right: 100%; top: 50%; transform: translateY(-50%);',
    right: 'left: 100%; top: 50%; transform: translateY(-50%);',
  };
  const pseudoCss = [
    "  content: '';",
    '  position: absolute;',
    '  border-style: solid;',
    `  border-width: ${border.width};`,
    `  border-color: ${border.color};`,
    `  ${positionMap[config.direction]}`,
  ].join('\n');

  return {
    declarations,
    css: `.shape {\n${toCss(declarations)}\n}\n\n.shape::after {\n${pseudoCss}\n}`,
    previewClipPath: '',
    method: '矩形杆身 + ::after 三角',
  };
}

/** border-radius 圆形 / 椭圆 */
function buildRadiusShape(config: ShapeConfig, ellipse: boolean): ShapeOutput {
  const width = clamp(config.width, LIMITS.minSize, LIMITS.maxSize);
  const height = clamp(config.height, LIMITS.minSize, LIMITS.maxSize);
  const color = sanitizeColor(config.color);
  const radius = clamp(config.radius, LIMITS.minRadius, LIMITS.maxRadius);
  const radiusValue = ellipse ? '50% / 50%' : `${radius}%`;

  const declarations: CssDeclaration[] = [
    { property: 'width', value: `${width}px` },
    { property: 'height', value: `${height}px` },
    { property: 'background', value: color },
    { property: 'border-radius', value: radiusValue },
  ];

  return {
    declarations,
    css: `.shape {\n${toCss(declarations)}\n}`,
    previewClipPath: '',
    method: 'border-radius 圆角法',
  };
}

/** 对话气泡：圆角矩形 + ::before 尖角 */
function buildSpeechBubble(config: ShapeConfig): ShapeOutput {
  const width = clamp(config.width, LIMITS.minSize, LIMITS.maxSize);
  const height = clamp(config.height, LIMITS.minSize, LIMITS.maxSize);
  const color = sanitizeColor(config.color);
  const radius = clamp(config.bubbleRadius, LIMITS.minBubbleRadius, LIMITS.maxBubbleRadius);
  const tail = clamp(config.tailSize, LIMITS.minTailSize, LIMITS.maxTailSize);

  const declarations: CssDeclaration[] = [
    { property: 'width', value: `${width}px` },
    { property: 'height', value: `${height}px` },
    { property: 'background', value: color },
    { property: 'border-radius', value: `${radius}px` },
    { property: 'position', value: 'relative' },
  ];

  // 尖角用透明边框三角形，方向决定贴边位置与边框配色
  const tailBorder: Record<Direction, { width: string; color: string; position: string }> = {
    up: {
      width: `0 ${Math.round(tail / 2)}px ${tail}px ${Math.round(tail / 2)}px`,
      color: `transparent transparent ${color} transparent`,
      position: `top: -${tail}px; left: 50%; transform: translateX(-50%);`,
    },
    down: {
      width: `${tail}px ${Math.round(tail / 2)}px 0 ${Math.round(tail / 2)}px`,
      color: `${color} transparent transparent transparent`,
      position: `bottom: -${tail}px; left: 50%; transform: translateX(-50%);`,
    },
    left: {
      width: `${Math.round(tail / 2)}px ${tail}px ${Math.round(tail / 2)}px 0`,
      color: `transparent ${color} transparent transparent`,
      position: `left: -${tail}px; top: 50%; transform: translateY(-50%);`,
    },
    right: {
      width: `${Math.round(tail / 2)}px 0 ${Math.round(tail / 2)}px ${tail}px`,
      color: `transparent transparent transparent ${color}`,
      position: `right: -${tail}px; top: 50%; transform: translateY(-50%);`,
    },
  };
  const t = tailBorder[config.direction];

  const pseudoDeclarations: CssDeclaration[] = [
    { property: 'content', value: "''" },
    { property: 'position', value: 'absolute' },
    { property: 'border-style', value: 'solid' },
    { property: 'border-width', value: t.width },
    { property: 'border-color', value: t.color },
  ];
  const pseudoCss = pseudoDeclarations
    .map((d) => `  ${d.property}: ${d.value};`)
    .join('\n')
    .concat(`\n  ${t.position}`);

  return {
    declarations,
    css: `.shape {\n${toCss(declarations)}\n}\n\n.shape::before {\n${pseudoCss}\n}`,
    previewClipPath: '',
    method: 'border-radius + ::before 尖角',
  };
}

/** 百分比坐标点 */
interface Point {
  x: number;
  y: number;
}

function point(p: Point): string {
  return `${round1(p.x)}% ${round1(p.y)}%`;
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

function polygonCss(points: Point[]): string {
  return `polygon(${points.map(point).join(', ')})`;
}

/** 八角形：四边各内缩 cut% 形成八个顶点 */
function buildOctagon(config: ShapeConfig): ShapeOutput {
  const width = clamp(config.width, LIMITS.minSize, LIMITS.maxSize);
  const height = clamp(config.height, LIMITS.minSize, LIMITS.maxSize);
  const color = sanitizeColor(config.color);
  const cut = clamp(config.cut, LIMITS.minCut, LIMITS.maxCut);

  const points: Point[] = [
    { x: cut, y: 0 },
    { x: 100 - cut, y: 0 },
    { x: 100, y: cut },
    { x: 100, y: 100 - cut },
    { x: 100 - cut, y: 100 },
    { x: cut, y: 100 },
    { x: 0, y: 100 - cut },
    { x: 0, y: cut },
  ];
  const clipPath = polygonCss(points);

  const declarations: CssDeclaration[] = [
    { property: 'width', value: `${width}px` },
    { property: 'height', value: `${height}px` },
    { property: 'background', value: color },
    { property: 'clip-path', value: clipPath },
  ];

  return {
    declarations,
    css: `.shape {\n${toCss(declarations)}\n}`,
    previewClipPath: clipPath,
    method: 'clip-path polygon 几何裁剪',
  };
}

/** 等腰梯形：上底宽度由 topWidth% 控制 */
function buildTrapezoid(config: ShapeConfig): ShapeOutput {
  const width = clamp(config.width, LIMITS.minSize, LIMITS.maxSize);
  const height = clamp(config.height, LIMITS.minSize, LIMITS.maxSize);
  const color = sanitizeColor(config.color);
  const topWidth = clamp(config.topWidth, LIMITS.minTopWidth, LIMITS.maxTopWidth);
  const inset = round1((100 - topWidth) / 2);

  // 方向控制梯形的平行边位于哪一侧
  const pointMap: Record<Direction, Point[]> = {
    up: [
      { x: inset, y: 0 },
      { x: 100 - inset, y: 0 },
      { x: 100, y: 100 },
      { x: 0, y: 100 },
    ],
    down: [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100 - inset, y: 100 },
      { x: inset, y: 100 },
    ],
    left: [
      { x: 0, y: inset },
      { x: 100, y: 0 },
      { x: 100, y: 100 },
      { x: 0, y: 100 - inset },
    ],
    right: [
      { x: 0, y: 0 },
      { x: 100, y: inset },
      { x: 100, y: 100 - inset },
      { x: 0, y: 100 },
    ],
  };
  const clipPath = polygonCss(pointMap[config.direction]);

  const declarations: CssDeclaration[] = [
    { property: 'width', value: `${width}px` },
    { property: 'height', value: `${height}px` },
    { property: 'background', value: color },
    { property: 'clip-path', value: clipPath },
  ];

  return {
    declarations,
    css: `.shape {\n${toCss(declarations)}\n}`,
    previewClipPath: clipPath,
    method: 'clip-path polygon 几何裁剪',
  };
}

/** 形状分发表 */
const BUILDERS: Record<ShapeId, (config: ShapeConfig) => ShapeOutput> = {
  triangle: buildTriangle,
  arrow: buildArrow,
  circle: (config) => buildRadiusShape(config, false),
  ellipse: (config) => buildRadiusShape(config, true),
  'speech-bubble': buildSpeechBubble,
  octagon: buildOctagon,
  trapezoid: buildTrapezoid,
};

/** 统一入口：按形状生成 CSS */
export function generateShape(config: ShapeConfig): ShapeOutput {
  const builder = BUILDERS[config.shape];
  if (!builder) {
    throw new Error(`Unknown shape: ${config.shape as string}`);
  }
  return builder(config);
}

/** 判断当前形状是否使用方向参数 */
export function shapeUsesDirection(shape: ShapeId): boolean {
  return shape === 'triangle' || shape === 'arrow' || shape === 'speech-bubble' || shape === 'trapezoid';
}
