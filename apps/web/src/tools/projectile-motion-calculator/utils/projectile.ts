/**
 * 抛体运动纯函数：理想真空解析解 + 线性空气阻力（与速度成正比）RK4 数值积分。
 * 内部统一使用 SI 单位（m、m/s、s、m/s²）；零外部依赖，M 复杂度。
 */

/** 速度输入单位 */
export type SpeedUnit = 'ms' | 'kmh' | 'fts';

/** 发射模式：自由落体 / 平抛 / 斜抛 */
export type LaunchMode = 'free-fall' | 'horizontal' | 'oblique';

/** 轨迹采样点（等时间隔或落地插值点） */
export interface TrajectoryPoint {
  /** 时刻（s） */
  t: number;
  /** 水平坐标（m），发射点为 x=0 */
  x: number;
  /** 高度（m），地面为 y=0 */
  y: number;
  /** 水平速度分量（m/s） */
  vx: number;
  /** 竖直速度分量（m/s，向上为正） */
  vy: number;
  /** 合速度大小（m/s） */
  speed: number;
}

/** 一次抛体求解的完整结果 */
export interface ProjectileResult {
  /** 飞行总时间（s） */
  flightTime: number;
  /** 水平射程（m） */
  range: number;
  /** 最高点高度（m） */
  maxHeight: number;
  /** 到达最高点的时刻（s） */
  timeToApex: number;
  /** 最高点水平坐标（m） */
  apexx: number;
  /** 落地瞬间合速度大小（m/s） */
  landingSpeed: number;
  /** 等时间隔轨迹点（含起点与落地插值点） */
  points: TrajectoryPoint[];
}

/** 综合输入（速度字段按 speedUnit 解释，内部换算为 m/s） */
export interface ProjectileInput {
  mode: LaunchMode;
  /** 初速度大小（自由落体忽略，平抛/斜抛使用），单位由 speedUnit 决定 */
  initialSpeed: number;
  /** 斜抛发射角（度，0–90），仅 oblique 使用 */
  angleDeg: number;
  /** 初始高度（m） */
  initialHeight: number;
  /** 重力加速度（m/s²，正数） */
  gravity: number;
  /** 速度输入单位 */
  speedUnit: SpeedUnit;
  /** 线性阻力系数 k（1/s），0 或省略表示真空 */
  dragCoefficient?: number;
}

/** 综合分析结果：真空解始终返回，阻力开启时额外返回数值积分解 */
export interface ProjectileAnalysis {
  ok: boolean;
  error?: string;
  vacuum: ProjectileResult;
  drag?: ProjectileResult;
  /** 实际参与计算的初速度分量（m/s） */
  vx0: number;
  vy0: number;
}

const FEET_PER_METER = 3.280839895;

/**
 * 将任意支持单位的速度换算为 m/s。
 *
 * @param value - 输入速度数值
 * @param unit - 输入单位
 * @returns m/s 速度
 */
export function toMetersPerSecond(value: number, unit: SpeedUnit): number {
  if (unit === 'kmh') {
    return value / 3.6;
  }
  if (unit === 'fts') {
    return value / FEET_PER_METER;
  }
  return value;
}

/** m/s → km/h */
export function toKmh(ms: number): number {
  return ms * 3.6;
}

/** m/s → ft/s */
export function toFeetPerSecond(ms: number): number {
  return ms * FEET_PER_METER;
}

/** 角度（度）→ 弧度 */
function degToRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/**
 * 由模式与输入解析初始速度分量（m/s）。
 *
 * @returns [vx0, vy0]
 */
function resolveInitialVelocity(input: ProjectileInput): [number, number] {
  const speed = toMetersPerSecond(input.initialSpeed, input.speedUnit);
  if (input.mode === 'free-fall') {
    return [0, 0];
  }
  if (input.mode === 'horizontal') {
    return [speed, 0];
  }
  const rad = degToRad(input.angleDeg);
  return [speed * Math.cos(rad), speed * Math.sin(rad)];
}

/** 由状态分量构造轨迹点 */
function makePoint(
  t: number,
  x: number,
  y: number,
  vx: number,
  vy: number,
): TrajectoryPoint {
  return { t, x, y, vx, vy, speed: Math.hypot(vx, vy) };
}

/**
 * 真空模式解析解（二次方程求飞行时间，全程闭合公式）。
 */
function solveVacuum(
  vx0: number,
  vy0: number,
  h0: number,
  g: number,
): ProjectileResult {
  // 0.5 g t² - vy0 t - h0 = 0 的正根
  const flightTime = (vy0 + Math.sqrt(vy0 * vy0 + 2 * g * h0)) / g;
  const range = vx0 * flightTime;

  const timeToApex = vy0 > 0 ? vy0 / g : 0;
  const maxHeight = h0 + (vy0 > 0 ? (vy0 * vy0) / (2 * g) : 0);
  const apexx = vx0 * timeToApex;

  const landingVx = vx0;
  const landingVy = vy0 - g * flightTime;
  const landingSpeed = Math.hypot(landingVx, landingVy);

  // 等时间隔采样（固定 41 个内部时刻 + 落地插值点）
  const segmentCount = 40;
  const points: TrajectoryPoint[] = [];
  for (let i = 0; i <= segmentCount; i += 1) {
    const t = (flightTime * i) / segmentCount;
    const x = vx0 * t;
    const y = h0 + vy0 * t - 0.5 * g * t * t;
    const vx = vx0;
    const vy = vy0 - g * t;
    points.push(makePoint(t, x, y, vx, vy));
  }
  const last = points[points.length - 1];
  if (!last || Math.abs(last.y) > 1e-9) {
    points.push(makePoint(flightTime, range, 0, landingVx, landingVy));
  }

  return {
    flightTime,
    range,
    maxHeight,
    timeToApex,
    apexx,
    landingSpeed,
    points,
  };
}

/** RK4 单步积分的状态向量 [x, y, vx, vy] */
type State = [number, number, number, number];

/**
 * 线性阻力运动方程：
 * dx/dt = vx, dy/dt = vy, dvx/dt = -k vx, dvy/dt = -g - k vy。
 */
function derivative(state: State, g: number, k: number): State {
  const [, , vx, vy] = state;
  return [vx, vy, -k * vx, -g - k * vy];
}

function rk4Step(state: State, dt: number, g: number, k: number): State {
  const addScaled = (a: State, b: State, scale: number): State => [
    a[0] + b[0] * scale,
    a[1] + b[1] * scale,
    a[2] + b[2] * scale,
    a[3] + b[3] * scale,
  ];
  const k1 = derivative(state, g, k);
  const k2 = derivative(addScaled(state, k1, dt / 2), g, k);
  const k3 = derivative(addScaled(state, k2, dt / 2), g, k);
  const k4 = derivative(addScaled(state, k3, dt), g, k);
  return [
    state[0] + (dt / 6) * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]),
    state[1] + (dt / 6) * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]),
    state[2] + (dt / 6) * (k1[2] + 2 * k2[2] + 2 * k3[2] + k4[2]),
    state[3] + (dt / 6) * (k1[3] + 2 * k2[3] + 2 * k3[3] + k4[3]),
  ];
}

/**
 * 线性阻力模式：定步长 RK4 积分至首次触地，触地段线性插值。
 *
 * @param markerInterval - 等时间隔标记间距（s）
 */
function solveDrag(
  vx0: number,
  vy0: number,
  h0: number,
  g: number,
  k: number,
  markerInterval: number,
): ProjectileResult {
  // 步长按标记间隔细分，保证标记点落在积分网格上
  const dt = Math.min(markerInterval / 10, 0.01);
  const maxSteps = 1_000_000;

  let state: State = [0, h0, vx0, vy0];
  let t = 0;
  let nextMarker = 0;
  const points: TrajectoryPoint[] = [makePoint(0, 0, h0, vx0, vy0)];
  nextMarker += markerInterval;

  let maxHeight = h0;
  let timeToApex = 0;
  let apexx = 0;

  for (let step = 0; step < maxSteps; step += 1) {
    const before = state;
    const tBefore = t;
    state = rk4Step(before, dt, g, k);
    t += dt;

    // 最高点：vy 由正转负的时刻
    if (before[3] >= 0 && state[3] < 0) {
      const frac = before[3] / (before[3] - state[3]);
      timeToApex = tBefore + frac * dt;
      apexx = before[0] + (state[0] - before[0]) * frac;
      maxHeight = Math.max(maxHeight, before[1], state[1]);
    } else {
      maxHeight = Math.max(maxHeight, state[1]);
    }

    // 首次触地：线性插值到 y=0
    if (state[1] <= 0) {
      const frac = before[1] / (before[1] - state[1]);
      const landT = tBefore + frac * dt;
      const landX = before[0] + (state[0] - before[0]) * frac;
      const landVx = before[2] + (state[2] - before[2]) * frac;
      const landVy = before[3] + (state[3] - before[3]) * frac;
      points.push(makePoint(landT, landX, 0, landVx, landVy));
      return {
        flightTime: landT,
        range: landX,
        maxHeight,
        timeToApex,
        apexx,
        landingSpeed: Math.hypot(landVx, landVy),
        points,
      };
    }

    // 等时间隔标记（不含落地，落地由上面的插值处理）
    while (nextMarker <= t + 1e-12 && nextMarker < t) {
      const frac = (nextMarker - tBefore) / dt;
      points.push(
        makePoint(
          nextMarker,
          before[0] + (state[0] - before[0]) * frac,
          before[1] + (state[1] - before[1]) * frac,
          before[2] + (state[2] - before[2]) * frac,
          before[3] + (state[3] - before[3]) * frac,
        ),
      );
      nextMarker += markerInterval;
    }
  }

  // 理论上不可达：阻力下存在终端速度，必然触地
  throw new Error('数值积分未在安全步数内收敛到地面');
}

/**
 * 抛体运动综合分析。真空解为解析公式；dragCoefficient > 0 时追加 RK4 阻力解。
 *
 * @param input - 综合输入
 * @returns 真空解与可选阻力解
 */
export function analyzeProjectile(input: ProjectileInput): ProjectileAnalysis {
  const g = input.gravity;
  const h0 = input.initialHeight;
  const k = input.dragCoefficient ?? 0;

  if (!Number.isFinite(g) || g <= 0) {
    return {
      ok: false,
      error: '重力加速度必须为正数',
      vacuum: emptyResult(),
      vx0: 0,
      vy0: 0,
    };
  }
  if (!Number.isFinite(h0) || h0 < 0) {
    return {
      ok: false,
      error: '初始高度不能为负数',
      vacuum: emptyResult(),
      vx0: 0,
      vy0: 0,
    };
  }
  if (!Number.isFinite(input.initialSpeed) || input.initialSpeed < 0) {
    return {
      ok: false,
      error: '初速度不能为负数',
      vacuum: emptyResult(),
      vx0: 0,
      vy0: 0,
    };
  }
  if (input.mode === 'oblique' && (input.angleDeg < 0 || input.angleDeg > 90)) {
    return {
      ok: false,
      error: '发射角度必须在 0° 到 90° 之间',
      vacuum: emptyResult(),
      vx0: 0,
      vy0: 0,
    };
  }
  if (k < 0) {
    return {
      ok: false,
      error: '阻力系数不能为负数',
      vacuum: emptyResult(),
      vx0: 0,
      vy0: 0,
    };
  }

  const [vx0, vy0] = resolveInitialVelocity(input);
  const vacuum = solveVacuum(vx0, vy0, h0, g);

  if (k === 0) {
    return { ok: true, vacuum, vx0, vy0 };
  }

  // 标记间隔约为真空飞行时间的 1/20，便于两条曲线同粒度对比
  const markerInterval = Math.max(vacuum.flightTime / 20, 1e-4);
  const drag = solveDrag(vx0, vy0, h0, g, k, markerInterval);
  return { ok: true, vacuum, drag, vx0, vy0 };
}

/** 校验失败时的占位空结果 */
function emptyResult(): ProjectileResult {
  return {
    flightTime: 0,
    range: 0,
    maxHeight: 0,
    timeToApex: 0,
    apexx: 0,
    landingSpeed: 0,
    points: [],
  };
}
