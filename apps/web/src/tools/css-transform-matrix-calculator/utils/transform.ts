/**
 * CSS Transform 矩阵运算核心（零依赖纯函数）
 *
 * 统一采用 4x4 矩阵、列主序（column-major）16 元素数组，与 CSS matrix3d()
 * 的参数排列一致：索引 index = column * 4 + row，即
 * [m11,m12,m13,m14, m21,m22,m23,m24, m31..m34, m41,m42,m43,m44]。
 * 本模块不触碰 DOM 与 React，所有角度统一使用弧度，角度换算由调用方负责。
 */

/** 列主序 4x4 矩阵（与 CSS matrix3d 参数顺序相同） */
export type Mat4 = number[];

/** 单位矩阵 */
export function identity(): Mat4 {
  return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
}

/** 读取矩阵第 row 行、第 col 列（均 0 起始） */
export function at(m: Mat4, row: number, col: number): number {
  return m[col * 4 + row];
}

/** 矩阵乘法 C = A × B（几何意义：先应用 B 再应用 A） */
export function multiply(a: Mat4, b: Mat4): Mat4 {
  const out = new Array<number>(16).fill(0);
  for (let col = 0; col < 4; col += 1) {
    for (let row = 0; row < 4; row += 1) {
      let sum = 0;
      for (let k = 0; k < 4; k += 1) {
        sum += at(a, row, k) * at(b, k, col);
      }
      out[col * 4 + row] = sum;
    }
  }
  return out;
}

/** 平移 translate3d(tx, ty, tz) */
export function translate(tx: number, ty: number, tz = 0): Mat4 {
  const m = identity();
  m[12] = tx;
  m[13] = ty;
  m[14] = tz;
  return m;
}

/** 缩放 scale3d(sx, sy, sz)；2D 缩放时 sz 取 1 */
export function scale(sx: number, sy?: number, sz = 1): Mat4 {
  const y = sy ?? sx;
  const m = identity();
  m[0] = sx;
  m[5] = y;
  m[10] = sz;
  return m;
}

/** 绕 Z 轴旋转（等价 2D rotate），角度为弧度 */
export function rotateZ(rad: number): Mat4 {
  const c = Math.cos(rad);
  const s = Math.sin(rad);
  const m = identity();
  m[0] = c;
  m[1] = s;
  m[4] = -s;
  m[5] = c;
  return m;
}

/** 绕 X 轴旋转（3D），角度为弧度 */
export function rotateX(rad: number): Mat4 {
  const c = Math.cos(rad);
  const s = Math.sin(rad);
  const m = identity();
  m[5] = c;
  m[6] = s;
  m[9] = -s;
  m[10] = c;
  return m;
}

/** 绕 Y 轴旋转（3D），角度为弧度 */
export function rotateY(rad: number): Mat4 {
  const c = Math.cos(rad);
  const s = Math.sin(rad);
  const m = identity();
  m[0] = c;
  m[2] = -s;
  m[8] = s;
  m[10] = c;
  return m;
}

/**
 * 2D 斜切 skew(skewX, skewY)，角度为弧度。
 * 等价 CSS matrix(1, tan(skewY), tan(skewX), 1, 0, 0)。
 */
export function skew(skewXRad: number, skewYRad = 0): Mat4 {
  const m = identity();
  m[4] = Math.tan(skewXRad);
  m[1] = Math.tan(skewYRad);
  return m;
}

/** 支持的变换函数类型 */
export type TransformKind =
  | "translate"
  | "scale"
  | "rotate"
  | "rotateX"
  | "rotateY"
  | "skew";

/** 一条变换函数；角度类参数在 UI 层以度录入，这里统一存弧度 */
export interface TransformStep {
  kind: TransformKind;
  /** 数值参数：translate=px、scale=倍数、rotate/skew=弧度 */
  values: number[];
}

/** 单条变换函数 → 4x4 矩阵 */
export function stepToMatrix(step: TransformStep): Mat4 {
  const v = step.values;
  switch (step.kind) {
    case "translate":
      return translate(v[0] ?? 0, v[1] ?? 0, v[2] ?? 0);
    case "scale":
      return scale(v[0] ?? 1, v.length > 1 ? v[1] : v[0], v[2] ?? 1);
    case "rotate":
      return rotateZ(v[0] ?? 0);
    case "rotateX":
      return rotateX(v[0] ?? 0);
    case "rotateY":
      return rotateY(v[0] ?? 0);
    case "skew":
      return skew(v[0] ?? 0, v[1] ?? 0);
    default:
      return identity();
  }
}

/**
 * 按 CSS 书写顺序合成变换列表。
 * CSS 中 `transform: A B C` 对点的作用为 A·B·C·p，故从左到右做左乘累积。
 */
export function compose(steps: TransformStep[]): Mat4 {
  return steps.reduce<Mat4>((acc, step) => multiply(acc, stepToMatrix(step)), identity());
}

/** 把矩阵序列化为 CSS 函数字符串（translate/scale/rotate 用度，skew 用度） */
export function stepsToCss(steps: TransformStep[]): string {
  return steps
    .map((step) => {
      const v = step.values;
      const fmt = (n: number) => formatNumber(n);
      switch (step.kind) {
        case "translate":
          return `translate(${fmt(v[0] ?? 0)}px, ${fmt(v[1] ?? 0)}px)`;
        case "scale":
          return `scale(${fmt(v[0] ?? 1)}, ${fmt(v[1] ?? v[0] ?? 1)})`;
        case "rotate":
          return `rotate(${fmt(radToDeg(v[0] ?? 0))}deg)`;
        case "rotateX":
          return `rotateX(${fmt(radToDeg(v[0] ?? 0))}deg)`;
        case "rotateY":
          return `rotateY(${fmt(radToDeg(v[0] ?? 0))}deg)`;
        case "skew":
          return `skew(${fmt(radToDeg(v[0] ?? 0))}deg, ${fmt(radToDeg(v[1] ?? 0))}deg)`;
        default:
          return "";
      }
    })
    .filter(Boolean)
    .join(" ");
}

/** 弧度 → 度 */
export function radToDeg(rad: number): number {
  return (rad * 180) / Math.PI;
}

/** 度 → 弧度 */
export function degToRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/** 浮点输出清洗：消除 -0 与二进制浮点尾差，保留 6 位小数 */
export function formatNumber(n: number, digits = 6): string {
  if (!Number.isFinite(n)) return String(n);
  const rounded = Number(n.toFixed(digits));
  return Object.is(rounded, -0) ? "0" : String(rounded);
}

/** 判断矩阵是否为纯 2D（第三行/第三列保持单位阵、Z 平移为 0） */
export function is2D(m: Mat4): boolean {
  const expect: Array<[number, number, number]> = [
    [2, 0, 0],
    [0, 2, 0],
    [2, 2, 1],
    [3, 2, 0],
    [2, 1, 0],
    [2, 3, 0],
  ];
  return expect.every(([row, col, val]) => at(m, row, col) === val);
}

/** 输出 2D matrix(a, b, c, d, e, f) 字符串；非 2D 时返回 null */
export function toCssMatrix2d(m: Mat4): string | null {
  if (!is2D(m)) return null;
  const a = m[0];
  const b = m[1];
  const c = m[4];
  const d = m[5];
  const e = m[12];
  const f = m[13];
  return `matrix(${[a, b, c, d, e, f].map((n) => formatNumber(n)).join(", ")})`;
}

/** 输出 matrix3d(...) 字符串（16 参数，列主序） */
export function toCssMatrix3d(m: Mat4): string {
  return `matrix3d(${m.map((n) => formatNumber(n)).join(", ")})`;
}

export interface ParseResult {
  matrix: Mat4;
  /** 原始识别到的函数名 */
  kind: "matrix" | "matrix3d";
}

/**
 * 解析 CSS matrix() / matrix3d() 字符串为 4x4 矩阵。
 * 非法输入抛出带字段说明的 Error。
 */
export function parseMatrix(input: string): ParseResult {
  const text = input.trim();
  const match = /^matrix(3d)?\(\s*([^)]*)\)$/i.exec(text);
  if (!match) {
    throw new Error("无法识别：输入必须是 matrix(...) 或 matrix3d(...) 形式");
  }
  const nums = match[2]
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s !== "")
    .map((s, i) => {
      const n = Number(s);
      if (!Number.isFinite(n)) {
        throw new Error(`第 ${i + 1} 个参数「${s}」不是合法数字`);
      }
      return n;
    });

  if (match[1]) {
    if (nums.length !== 16) {
      throw new Error(`matrix3d 需要 16 个参数，实际收到 ${nums.length} 个`);
    }
    return { matrix: nums, kind: "matrix3d" };
  }

  if (nums.length !== 6) {
    throw new Error(`matrix 需要 6 个参数，实际收到 ${nums.length} 个`);
  }
  const [a, b, c, d, e, f] = nums;
  // 2D matrix(a,b,c,d,e,f) 展开为列主序 4x4
  return {
    matrix: [a, b, 0, 0, c, d, 0, 0, 0, 0, 1, 0, e, f, 0, 1],
    kind: "matrix",
  };
}

export interface Decomposed2D {
  dimension: "2d";
  translateX: number;
  translateY: number;
  scaleX: number;
  scaleY: number;
  /** 旋转角（度） */
  rotate: number;
  /** 水平斜切角 skewX（度） */
  skewX: number;
}

export interface Decomposed3D {
  dimension: "3d";
  translateX: number;
  translateY: number;
  translateZ: number;
  scaleX: number;
  scaleY: number;
  scaleZ: number;
  /** ZYX 欧拉角（度） */
  rotateX: number;
  rotateY: number;
  rotateZ: number;
}

export type Decomposed = Decomposed2D | Decomposed3D;

/**
 * 矩阵分解（unmatrix）：把合成矩阵还原为平移 / 缩放 / 旋转 / 斜切。
 * 2D 走经典闭式分解；3D 走列归一化 + ZYX 欧拉角提取。
 */
export function decompose(m: Mat4): Decomposed {
  if (is2D(m)) {
    const a = at(m, 0, 0);
    const b = at(m, 1, 0);
    const c = at(m, 0, 1);
    const d = at(m, 1, 1);
    const scaleX = Math.hypot(a, b);
    const det = a * d - b * c;
    const scaleY = det / scaleX;
    const rotate = radToDeg(Math.atan2(b, a));
    const skewX = radToDeg(Math.atan2(a * c + b * d, det));
    return {
      dimension: "2d",
      translateX: at(m, 0, 3),
      translateY: at(m, 1, 3),
      scaleX,
      scaleY,
      rotate,
      skewX,
    };
  }

  // 3D：逐列剥离平移与剪切，归一化得到旋转矩阵与缩放
  const cols: number[][] = [0, 1, 2, 3].map((c) => [
    at(m, 0, c),
    at(m, 1, c),
    at(m, 2, c),
    at(m, 3, c),
  ]);
  const translate = cols[3].slice(0, 3);

  const norm = (v: number[]) => Math.hypot(v[0], v[1], v[2]);
  const dot = (u: number[], v: number[]) => u[0] * v[0] + u[1] * v[1] + u[2] * v[2];
  const subScaled = (u: number[], v: number[], k: number) =>
    u.map((x, i) => x - k * v[i]);

  const sx = norm(cols[0]);
  const r0 = cols[0].map((x) => x / sx);
  const shearXY = dot(r0, cols[1]);
  const col1 = subScaled(cols[1], r0, shearXY);
  const sy = norm(col1);
  const r1 = col1.map((x) => x / sy);
  const shearXZ = dot(r0, cols[2]);
  const shearYZ = dot(r1, cols[2]);
  const col2 = subScaled(subScaled(cols[2], r0, shearXZ), r1, shearYZ);
  const sz = norm(col2);
  const r2 = col2.map((x) => x / sz);

  // ZYX 欧拉角：R = Rz · Ry · Rx，按标准矩阵元素
  // R[2][0] = -sin(Ry)，R[1][0]/R[0][0] = tan(Rz)，R[2][1]/R[2][2] = tan(Rx)
  const ry = Math.asin(Math.max(-1, Math.min(1, -r0[2])));
  const rz = Math.atan2(r0[1], r0[0]);
  const rx = Math.atan2(r1[2], r2[2]);

  const [tx = 0, ty = 0, tz = 0] = translate;
  return {
    dimension: "3d",
    translateX: tx,
    translateY: ty,
    translateZ: tz,
    scaleX: sx,
    scaleY: sy,
    scaleZ: sz,
    rotateX: radToDeg(rx),
    rotateY: radToDeg(ry),
    rotateZ: radToDeg(rz),
  };
}

/** 用矩阵变换一个点（齐次坐标 [x,y,z,1]），返回变换后的 x/y/z */
export function transformPoint(m: Mat4, x: number, y: number, z = 0): [number, number, number] {
  const p = [x, y, z, 1];
  const out: number[] = [0, 0, 0, 0];
  for (let row = 0; row < 4; row += 1) {
    out[row] = p.reduce((sum, pv, col) => sum + at(m, row, col) * pv, 0);
  }
  return [out[0] ?? 0, out[1] ?? 0, out[2] ?? 0];
}
