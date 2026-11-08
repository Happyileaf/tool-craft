"use client";

import React from "react";
import {
  Alert,
  Button,
  Card,
  InputNumber,
  Input,
  Select,
  Space,
  Table,
  Tag,
  message,
} from "antd";
import {
  CopyOutlined,
  DeleteOutlined,
  PlusOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
} from "@ant-design/icons";
import type { ToolComponentProps } from "../loaders";
import {
  compose,
  toCssMatrix2d,
  toCssMatrix3d,
  parseMatrix,
  decompose,
  transformPoint,
  stepsToCss,
  formatNumber,
  degToRad,
  radToDeg,
  is2D,
  type Mat4,
  type TransformStep,
  type TransformKind,
} from "./utils/transform";
import { STEP_PRESETS, DEFAULT_STEPS, DEFAULT_MATRIX_INPUT } from "./constants";
import { copyToClipboard } from "@/lib/utils";
import styles from "./index.module.css";

/** UI 层的可编辑步骤：角度以度保存，提交给纯函数时再换算弧度 */
interface UiStep {
  key: string;
  kind: TransformKind;
  /** 与 preset.fields 一一对应的原始数值 */
  values: number[];
}

let keySeq = 0;
const nextKey = () => `step-${Date.now()}-${keySeq++}`;

const angleKinds: TransformKind[] = ["rotate", "rotateX", "rotateY", "skew"];

const CssTransformMatrixCalculator: React.FC<ToolComponentProps> = ({
  defaultInput,
}) => {
  const [steps, setSteps] = React.useState<UiStep[]>(() =>
    DEFAULT_STEPS.map((s) => ({
      key: nextKey(),
      kind: s.kind,
      values: s.values.map((v) =>
        angleKinds.includes(s.kind) ? Number(radToDeg(v).toFixed(4)) : v,
      ),
    })),
  );
  const [matrixInput, setMatrixInput] = React.useState(
    defaultInput || DEFAULT_MATRIX_INPUT,
  );
  const [point, setPoint] = React.useState<[number, number]>([10, 10]);

  const matrix = React.useMemo<Mat4>(
    () =>
      compose(
        steps.map<TransformStep>((s) => ({
          kind: s.kind,
          values: s.values.map((v) =>
            angleKinds.includes(s.kind) ? degToRad(v) : v,
          ),
        })),
      ),
    [steps],
  );

  const css2d = toCssMatrix2d(matrix);
  const css3d = toCssMatrix3d(matrix);
  const funcCss = stepsToCss(
    steps.map<TransformStep>((s) => ({
      kind: s.kind,
      values: s.values.map((v) =>
        angleKinds.includes(s.kind) ? degToRad(v) : v,
      ),
    })),
  );
  const decomposed = React.useMemo(() => decompose(matrix), [matrix]);
  const [px, py] = React.useMemo(
    () => transformPoint(matrix, point[0], point[1]),
    [matrix, point],
  );

  const parseResult = React.useMemo(() => {
    if (matrixInput.trim() === "") return { ok: false as const, error: "内容不能为空" };
    try {
      const r = parseMatrix(matrixInput);
      const d = decompose(r.matrix);
      return { ok: true as const, matrix: r.matrix, kind: r.kind, decomposed: d };
    } catch (e) {
      return { ok: false as const, error: (e as Error).message };
    }
  }, [matrixInput]);

  const addStep = (kind: TransformKind) => {
    const preset = STEP_PRESETS.find((p) => p.kind === kind);
    if (!preset) return;
    setSteps((prev) => [
      ...prev,
      { key: nextKey(), kind, values: [...preset.defaults] },
    ]);
  };

  const updateValue = (key: string, index: number, value: number | null) => {
    setSteps((prev) =>
      prev.map((s) =>
        s.key === key
          ? {
              ...s,
              values: s.values.map((v, i) => (i === index ? (value ?? 0) : v)),
            }
          : s,
      ),
    );
  };

  const removeStep = (key: string) =>
    setSteps((prev) => prev.filter((s) => s.key !== key));

  const move = (index: number, delta: -1 | 1) => {
    setSteps((prev) => {
      const target = index + delta;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const copy = (text: string, label: string) => {
    if (!text) {
      message.error("暂无可复制内容");
      return;
    }
    copyToClipboard(text);
    message.success(`已复制${label}`);
  };

  const decomposeRows =
    decomposed.dimension === "2d"
      ? [
          ["平移 X / Y", `${formatNumber(decomposed.translateX)}px, ${formatNumber(decomposed.translateY)}px`],
          ["缩放 X / Y", `${formatNumber(decomposed.scaleX)}, ${formatNumber(decomposed.scaleY)}`],
          ["旋转", `${formatNumber(decomposed.rotate)}deg`],
          ["斜切 skewX", `${formatNumber(decomposed.skewX)}deg`],
        ]
      : [
          ["平移 X / Y / Z", `${formatNumber(decomposed.translateX)}, ${formatNumber(decomposed.translateY)}, ${formatNumber(decomposed.translateZ)}px`],
          ["缩放 X / Y / Z", `${formatNumber(decomposed.scaleX)}, ${formatNumber(decomposed.scaleY)}, ${formatNumber(decomposed.scaleZ)}`],
          ["欧拉角 X / Y / Z", `${formatNumber(decomposed.rotateX)}°, ${formatNumber(decomposed.rotateY)}°, ${formatNumber(decomposed.rotateZ)}°`],
        ];

  return (
    <div className={styles.container}>
      <div className={styles.panels}>
        <Card
          className={styles.card}
          title="变换函数链（按 CSS 书写顺序）"
          extra={
            <Select
              size="small"
              style={{ width: 170 }}
              placeholder="添加变换"
              suffixIcon={<PlusOutlined />}
              value={null}
              onChange={(kind: TransformKind) => addStep(kind)}
              options={STEP_PRESETS.map((p) => ({ value: p.kind, label: p.label }))}
            />
          }
        >
          <div className={styles.steps}>
            {steps.length === 0 ? (
              <Alert type="info" showIcon message="尚未添加变换，当前为单位矩阵" />
            ) : (
              steps.map((step, index) => {
                const preset = STEP_PRESETS.find((p) => p.kind === step.kind);
                return (
                  <div className={styles.stepRow} key={step.key}>
                    <span className={styles.stepIndex}>#{index + 1}</span>
                    <Tag>{preset?.label ?? step.kind}</Tag>
                    <span className={styles.stepInputs}>
                      {preset?.fields.map((field, fi) => (
                        <span className={styles.field} key={field.label}>
                          <span className={styles.fieldLabel}>{field.label}</span>
                          <InputNumber
                            size="small"
                            style={{ width: 92 }}
                            value={step.values[fi]}
                            onChange={(v) => updateValue(step.key, fi, v)}
                          />
                          <span className={styles.unit}>{field.unit}</span>
                        </span>
                      ))}
                    </span>
                    <Space size={2}>
                      <Button
                        size="small"
                        type="text"
                        icon={<ArrowUpOutlined />}
                        disabled={index === 0}
                        onClick={() => move(index, -1)}
                      />
                      <Button
                        size="small"
                        type="text"
                        icon={<ArrowDownOutlined />}
                        disabled={index === steps.length - 1}
                        onClick={() => move(index, 1)}
                      />
                      <Button
                        size="small"
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => removeStep(step.key)}
                      />
                    </Space>
                  </div>
                );
              })
            )}
          </div>

          <div style={{ marginTop: 16 }}>
            <div className={styles.codeLine}>{funcCss || "/* 空变换（单位矩阵） */"}</div>
            <Button
              size="small"
              icon={<CopyOutlined />}
              onClick={() => copy(funcCss, "变换函数字符串")}
              style={{ marginTop: 8 }}
            >
              复制 transform 值
            </Button>
          </div>
        </Card>

        <Card className={styles.card} title="合成矩阵（列主序，与 matrix3d 参数一致）">
          <div className={styles.matrixGrid}>
            {matrix.map((v, i) => {
              const col = Math.floor(i / 4);
              const row = i % 4;
              const isDimCell =
                !is2D(matrix) ? false : (col === 2 || row === 2) && !(col === 2 && row === 2);
              return (
                <div
                  key={i}
                  className={`${styles.matrixCell} ${isDimCell ? styles.dim : ""}`}
                >
                  {formatNumber(v)}
                </div>
              );
            })}
          </div>
          <div className={styles.outputBlock} style={{ marginTop: 16 }}>
            {css2d ? (
              <>
                <div className={styles.codeLine}>{css2d}</div>
                <Button
                  size="small"
                  icon={<CopyOutlined />}
                  onClick={() => copy(css2d, "matrix()")}
                >
                  复制 matrix()
                </Button>
              </>
            ) : (
              <Alert
                type="warning"
                showIcon
                message="含 3D 变换，无法用 2D matrix() 表达，请使用 matrix3d()"
              />
            )}
            <div className={styles.codeLine}>{css3d}</div>
            <Button
              size="small"
              icon={<CopyOutlined />}
              onClick={() => copy(css3d, "matrix3d()")}
            >
              复制 matrix3d()
            </Button>
          </div>
        </Card>
      </div>

      <div className={styles.panels}>
        <Card className={styles.card} title="矩阵分解（unmatrix）">
          <Table
            size="small"
            pagination={false}
            showHeader={false}
            dataSource={decomposeRows.map(([k, v], i) => ({ key: i, k, v }))}
            columns={[
              { dataIndex: "k", width: 160 },
              { dataIndex: "v", className: styles.editor },
            ]}
          />
          <div className={styles.pointRow} style={{ marginTop: 16 }}>
            <span>点变换</span>
            <InputNumber
              size="small"
              style={{ width: 100 }}
              addonBefore="x"
              value={point[0]}
              onChange={(v) => setPoint([v ?? 0, point[1]])}
            />
            <InputNumber
              size="small"
              style={{ width: 100 }}
              addonBefore="y"
              value={point[1]}
              onChange={(v) => setPoint([point[0], v ?? 0])}
            />
            <Tag color="blue">
              → ({formatNumber(px)}, {formatNumber(py)})
            </Tag>
          </div>
          <div className={styles.previewBox} style={{ marginTop: 16 }}>
            <div className={styles.previewTarget} style={{ transform: funcCss }}>
              transform
            </div>
          </div>
        </Card>

        <Card
          className={styles.card}
          title="matrix() / matrix3d() 反向解析与分解"
          extra={
            <Button
              size="small"
              icon={<CopyOutlined />}
              onClick={() =>
                parseResult.ok &&
                copy(toCssMatrix3d(parseResult.matrix), "解析后 matrix3d()")
              }
            >
              复制规范化
            </Button>
          }
        >
          <Input.TextArea
            value={matrixInput}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              setMatrixInput(e.target.value)
            }
            spellCheck={false}
            className={styles.editor}
            autoSize={{ minRows: 3, maxRows: 6 }}
            placeholder="matrix(a, b, c, d, e, f) 或 matrix3d(16 个参数)"
          />
          {!parseResult.ok ? (
            <Alert
              style={{ marginTop: 12 }}
              type="error"
              showIcon
              message={parseResult.error}
            />
          ) : (
            <div className={styles.outputBlock} style={{ marginTop: 12 }}>
              <Tag color="green">
                识别为 {parseResult.kind === "matrix" ? "2D matrix()" : "matrix3d()"}
              </Tag>
              <Table
                size="small"
                pagination={false}
                showHeader={false}
                dataSource={Object.entries(parseResult.decomposed)
                  .filter(([k]) => k !== "dimension")
                  .map(([k, v], i) => ({ key: i, k, v: formatNumber(Number(v)) }))}
                columns={[
                  { dataIndex: "k", width: 160 },
                  { dataIndex: "v", className: styles.editor },
                ]}
              />
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default CssTransformMatrixCalculator;
