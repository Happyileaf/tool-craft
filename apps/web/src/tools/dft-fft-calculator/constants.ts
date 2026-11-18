/** DFT/FFT 计算器的固定文案、默认值与限制 */

/** 主线程可承受的最大采样点数 */
export const MAX_SAMPLE_COUNT = 4096;

/** 幅度低于该阈值的 bin，其相位视为未定义 */
export const PHASE_EPSILON = 1e-12;

/** 自动取实的逆变换虚部残差阈值（实数输入场景） */
export const IMAGINARY_DROP_EPSILON = 1e-10;

/** 默认输入：N=4 的 cos(2π·n/4) = [1, 0, -1, 0] */
export const DEFAULT_SAMPLES = '1, 0, -1, 0';

/** 默认频域输入（与 DEFAULT_SAMPLES 的变换结果对应：X[1]=−2i、X[3]=+2i） */
export const DEFAULT_FREQUENCY_SAMPLES = '0, -2i, 0, 2i';

/** 相位未定义时的展示文本 */
export const PHASE_UNDEFINED_LABEL = '未定义';

/** 算法标识 */
export const ALGORITHM_FFT = 'radix-2 Cooley–Tukey FFT' as const;
export const ALGORITHM_DFT = 'naive DFT' as const;

export type AlgorithmLabel = typeof ALGORITHM_FFT | typeof ALGORITHM_DFT;

/** 变换方向 */
export type TransformDirection = 'forward' | 'inverse';

/** 相位单位 */
export type PhaseUnit = 'radian' | 'degree';
