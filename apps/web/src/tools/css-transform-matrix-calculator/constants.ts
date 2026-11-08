import type { TransformKind, TransformStep } from "./utils/transform";
import { degToRad } from "./utils/transform";

export interface StepPreset {
  label: string;
  kind: TransformKind;
  /** 默认参数：角度类为度，在构造时换算为弧度 */
  defaults: number[];
  /** 参数的展示标签与单位 */
  fields: Array<{ label: string; unit: "px" | "倍" | "deg" }>;
}

export const STEP_PRESETS: StepPreset[] = [
  {
    label: "translate 平移",
    kind: "translate",
    defaults: [20, 10],
    fields: [
      { label: "X", unit: "px" },
      { label: "Y", unit: "px" },
    ],
  },
  {
    label: "scale 缩放",
    kind: "scale",
    defaults: [1.5, 1.5],
    fields: [
      { label: "X", unit: "倍" },
      { label: "Y", unit: "倍" },
    ],
  },
  {
    label: "rotate 旋转",
    kind: "rotate",
    defaults: [30],
    fields: [{ label: "角度", unit: "deg" }],
  },
  {
    label: "rotateX 绕 X 轴",
    kind: "rotateX",
    defaults: [45],
    fields: [{ label: "角度", unit: "deg" }],
  },
  {
    label: "rotateY 绕 Y 轴",
    kind: "rotateY",
    defaults: [45],
    fields: [{ label: "角度", unit: "deg" }],
  },
  {
    label: "skew 斜切",
    kind: "skew",
    defaults: [15, 0],
    fields: [
      { label: "skewX", unit: "deg" },
      { label: "skewY", unit: "deg" },
    ],
  },
];

/** 把 UI 中以度录入的步骤换算为内部弧度表示 */
export function toStep(preset: StepPreset, rawValues: number[]): TransformStep {
  const angleKinds: TransformKind[] = ["rotate", "rotateX", "rotateY", "skew"];
  const values = rawValues.map((v, i) =>
    angleKinds.includes(preset.kind) ? degToRad(v) : v,
  );
  return { kind: preset.kind, values };
}

export const DEFAULT_STEPS: TransformStep[] = [
  { kind: "translate", values: [20, 10] },
  { kind: "rotate", values: [degToRad(30)] },
  { kind: "scale", values: [1.5, 1.5] },
];

export const DEFAULT_MATRIX_INPUT = "matrix(1.299, 0.75, -0.75, 1.299, 20, 10)";
