/**
 * 四元数 / 欧拉角 / 旋转矩阵互转器常量
 */
import type { EulerAngles, EulerOrder, Matrix3, Quaternion } from './utils/quaternion';

/** 输入源类型 */
export type SourceKind = 'quaternion' | 'euler' | 'matrix';

/** 四元数分量展示配置 */
export const QUATERNION_FIELDS = [
  { key: 'x', label: 'x' },
  { key: 'y', label: 'y' },
  { key: 'z', label: 'z' },
  { key: 'w', label: 'w（实部）' },
] as const;

/** 欧拉角分量展示配置：roll 绕 X、pitch 绕 Y、yaw 绕 Z */
export const EULER_FIELDS = [
  { key: 'roll', label: 'roll（绕 X 轴）' },
  { key: 'pitch', label: 'pitch（绕 Y 轴）' },
  { key: 'yaw', label: 'yaw（绕 Z 轴）' },
] as const;

/** 示例预设：填入后以 source 指定的表示作为输入源 */
export interface ExamplePreset {
  /** 示例名称 */
  name: string;
  /** 该示例的输入源 */
  source: SourceKind;
  /** 四元数输入（source 为 quaternion 时使用） */
  quaternion?: Quaternion;
  /** 欧拉角输入（source 为 euler 时使用） */
  euler?: EulerAngles;
  /** 旋转顺序（source 为 euler 时使用），默认 XYZ */
  order?: EulerOrder;
  /** 矩阵输入（source 为 matrix 时使用） */
  matrix?: Matrix3;
}

/** 单位矩阵 */
const IDENTITY_MATRIX: Matrix3 = [
  [1, 0, 0],
  [0, 1, 0],
  [0, 0, 1],
];

/** 示例预设集合 */
export const EXAMPLE_PRESETS: ExamplePreset[] = [
  {
    name: '单位四元数（无旋转）',
    source: 'quaternion',
    quaternion: { x: 0, y: 0, z: 0, w: 1 },
  },
  {
    name: '绕 Z 轴 90°（XYZ）',
    source: 'euler',
    euler: { roll: 0, pitch: 0, yaw: 90 },
    order: 'XYZ',
  },
  {
    name: 'XYZ 复合（30°/40°/50°）',
    source: 'euler',
    euler: { roll: 30, pitch: 40, yaw: 50 },
    order: 'XYZ',
  },
  {
    name: 'pitch = 90° 万向锁（ZYX）',
    source: 'euler',
    euler: { roll: 30, pitch: 90, yaw: -20 },
    order: 'ZYX',
  },
  {
    name: '单位矩阵 I',
    source: 'matrix',
    matrix: IDENTITY_MATRIX,
  },
];

/** 初始输入：单位四元数 */
export const INITIAL_QUATERNION: Quaternion = { x: 0, y: 0, z: 0, w: 1 };

/** 初始欧拉角（全零） */
export const INITIAL_EULER: EulerAngles = { roll: 0, pitch: 0, yaw: 0 };

/** 初始矩阵（单位矩阵） */
export const INITIAL_MATRIX: Matrix3 = IDENTITY_MATRIX;

/** 初始旋转顺序 */
export const INITIAL_ORDER: EulerOrder = 'XYZ';
