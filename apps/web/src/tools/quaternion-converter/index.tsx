'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import {
  Alert,
  Button,
  Card,
  InputNumber,
  Segmented,
  Select,
  Space,
  Switch,
  message,
} from 'antd';
import {
  EULER_ORDERS,
  eulerToQuaternion,
  isQuaternionError,
  matrixToEuler,
  matrixToQuaternion,
  normalizeQuaternion,
  quaternionToEuler,
  quaternionToMatrix,
  toDegrees,
  toRadians,
  trimNumber,
  type EulerAngles,
  type EulerOrder,
  type EulerResult,
  type Matrix3,
  type Quaternion,
} from './utils/quaternion';
import {
  EULER_FIELDS,
  EXAMPLE_PRESETS,
  INITIAL_EULER,
  INITIAL_MATRIX,
  INITIAL_ORDER,
  INITIAL_QUATERNION,
  QUATERNION_FIELDS,
  type ExamplePreset,
  type SourceKind,
} from './constants';
import styles from './index.module.css';

/** 展示用：把数值保留 10 位有效精度并消除 −0，得到可放入 InputNumber 的数字 */
function rounded(value: number): number {
  if (!Number.isFinite(value)) return value;
  const cleaned = parseFloat(value.toPrecision(10));
  return Object.is(cleaned, -0) ? 0 : cleaned;
}

/** 由当前输入源派生的三组表示（含错误与警告） */
interface DerivedState {
  /** 规范单位四元数；源输入非法时为 null */
  q: Quaternion | null;
  /** 四元数源的错误（全零 / NaN）或矩阵源的非正交错误 */
  error?: string;
  /** 当前四元数范数 */
  norm: number;
  /** 非单位四元数归一化提示 */
  normWarning?: string;
  /** 派生旋转矩阵 */
  matrix: Matrix3 | null;
  /** 派生欧拉角（按当前角度单位） */
  euler: EulerResult | null;
}

/** 三个面板的中文名称 */
const SOURCE_LABELS: Record<SourceKind, string> = {
  quaternion: '四元数',
  euler: '欧拉角',
  matrix: '旋转矩阵',
};

/**
 * 四元数 ↔ 欧拉角 ↔ 3×3 旋转矩阵互转器：
 * 任选一种表示作为输入源，其余两种实时显示转换结果；
 * 支持六种 Tait-Bryan 内旋顺序、角度 / 弧度切换与归一化、万向锁、矩阵正交性提示，
 * 全部在浏览器本地完成
 *
 * @returns 旋转表示互转交互界面
 */
const QuaternionConverter: React.FC<ToolComponentProps> = () => {
  const [source, setSource] = React.useState<SourceKind>('quaternion');
  const [qInput, setQInput] = React.useState<Quaternion>(INITIAL_QUATERNION);
  const [eulerInput, setEulerInput] = React.useState<EulerAngles>(INITIAL_EULER);
  const [matrixInput, setMatrixInput] = React.useState<Matrix3>(INITIAL_MATRIX);
  const [order, setOrder] = React.useState<EulerOrder>(INITIAL_ORDER);
  const [useDegree, setUseDegree] = React.useState(true);

  /** 由输入源实时派生其余表示 */
  const derived = React.useMemo<DerivedState>(() => {
    if (source === 'quaternion') {
      const normalized = normalizeQuaternion(qInput);
      if ('error' in normalized) {
        return { q: null, error: normalized.error, norm: 0, matrix: null, euler: null };
      }
      const matrix = quaternionToMatrix(normalized.q);
      const euler = quaternionToEuler(normalized.q, order, useDegree);
      return {
        q: normalized.q,
        norm: normalized.norm,
        normWarning: normalized.warning,
        matrix,
        euler,
      };
    }
    if (source === 'euler') {
      const q = eulerToQuaternion(eulerInput, order, useDegree);
      const matrix = quaternionToMatrix(q);
      const euler = quaternionToEuler(q, order, useDegree);
      return { q, norm: 1, matrix, euler };
    }
    const qResult = matrixToQuaternion(matrixInput);
    if (isQuaternionError(qResult)) {
      return { q: null, error: qResult.error, norm: 0, matrix: null, euler: null };
    }
    const eulerResult = matrixToEuler(matrixInput, order, useDegree);
    return {
      q: qResult,
      norm: 1,
      matrix: quaternionToMatrix(qResult),
      euler: isQuaternionError(eulerResult) ? null : eulerResult,
    };
  }, [source, qInput, eulerInput, matrixInput, order, useDegree]);

  /** 切换输入源：把当前派生结果写回各表单，保证编辑连续 */
  const switchSource = (next: SourceKind) => {
    if (next === source) return;
    if (derived.q) setQInput(derived.q);
    if (derived.euler) {
      setEulerInput({ roll: derived.euler.roll, pitch: derived.euler.pitch, yaw: derived.euler.yaw });
    }
    if (derived.matrix) setMatrixInput(derived.matrix);
    setSource(next);
  };

  /** 切换角度 / 弧度：欧拉角输入值同步换算 */
  const toggleAngleUnit = (degree: boolean) => {
    setEulerInput((previous) => {
      const convert = degree ? toDegrees : toRadians;
      return {
        roll: convert(previous.roll),
        pitch: convert(previous.pitch),
        yaw: convert(previous.yaw),
      };
    });
    setUseDegree(degree);
  };

  /** 应用示例预设 */
  const applyPreset = (preset: ExamplePreset) => {
    if (preset.order) setOrder(preset.order);
    if (preset.quaternion) setQInput(preset.quaternion);
    if (preset.euler) setEulerInput(preset.euler);
    if (preset.matrix) setMatrixInput(preset.matrix);
    setSource(preset.source);
  };

  const reset = () => {
    setQInput(INITIAL_QUATERNION);
    setEulerInput(INITIAL_EULER);
    setMatrixInput(INITIAL_MATRIX);
    setOrder(INITIAL_ORDER);
    setUseDegree(true);
    setSource('quaternion');
  };

  /** 复制当前输入与全部转换结果 */
  const copyResult = () => {
    if (!derived.q || !derived.matrix || !derived.euler) {
      message.warning('当前输入存在错误，暂无可复制的结果');
      return;
    }
    const unit = useDegree ? '°' : 'rad';
    const lines = [
      `旋转顺序：${order}（Tait-Bryan 内旋）`,
      `四元数 (x, y, z, w) = (${[derived.q.x, derived.q.y, derived.q.z, derived.q.w]
        .map((v) => trimNumber(v))
        .join(', ')})，范数 = ${trimNumber(derived.norm)}`,
      `欧拉角：roll(绕X) = ${trimNumber(derived.euler.roll)} ${unit}，pitch(绕Y) = ${trimNumber(
        derived.euler.pitch,
      )} ${unit}，yaw(绕Z) = ${trimNumber(derived.euler.yaw)} ${unit}${
        derived.euler.gimbalLock ? '（万向锁）' : ''
      }`,
      '旋转矩阵：',
      ...derived.matrix.map((row) => `  [${row.map((v) => trimNumber(v)).join(', ')}]`),
    ];
    navigator.clipboard
      .writeText(lines.join('\n'))
      .then(() => message.success('结果已复制'))
      .catch(() => message.error('复制失败，请手动选择复制'));
  };

  /** 四元数面板里某个分量的当前值（输入态取表单，结果态取派生值） */
  const quaternionValue = (key: keyof Quaternion): number =>
    source === 'quaternion' ? qInput[key] : derived.q ? rounded(derived.q[key]) : 0;

  /** 欧拉角面板里某个分量的当前值 */
  const eulerValue = (key: keyof EulerAngles): number =>
    source === 'euler' ? eulerInput[key] : derived.euler ? rounded(derived.euler[key]) : 0;

  const gimbalLock = derived.euler?.gimbalLock === true;

  return (
    <div className={styles.container}>
      <Card
        title="四元数 ↔ 欧拉角 ↔ 3×3 旋转矩阵互转器"
        extra={
          <Button size="small" onClick={copyResult}>
            复制结果
          </Button>
        }
      >
        <p className={styles.hint}>
          选择一种表示作为输入源（面板右上「设为输入源」），其余两种实时显示转换结果。
          欧拉角采用 Tait-Bryan 内旋约定：R = R_first · R_middle · R_last，roll = 绕 X 轴、pitch = 绕
          Y 轴、yaw = 绕 Z 轴；非单位四元数会自动归一化，矩阵需满足 det ≈ 1 且 RᵀR ≈ I。
        </p>

        <Space wrap style={{ marginBottom: 12 }}>
          <span className={styles.label}>输入源：</span>
          <Segmented
            value={source}
            onChange={(value) => switchSource(value as SourceKind)}
            options={[
              { label: '四元数 (x,y,z,w)', value: 'quaternion' },
              { label: '欧拉角 (roll,pitch,yaw)', value: 'euler' },
              { label: '3×3 旋转矩阵', value: 'matrix' },
            ]}
          />
        </Space>

        <div className={styles.panelGrid}>
          {/* 四元数面板 */}
          <div className={`${styles.panel} ${source === 'quaternion' ? styles.panelActive : ''}`}>
            <div className={styles.panelHeader}>
              <span className={styles.panelTitle}>四元数 (x, y, z, w)</span>
              <Button
                size="small"
                type={source === 'quaternion' ? 'primary' : 'default'}
                onClick={() => switchSource('quaternion')}
              >
                设为输入源
              </Button>
            </div>
            {QUATERNION_FIELDS.map((field) => (
              <div key={field.key} className={styles.fieldRow}>
                <span className={styles.fieldLabel}>{field.label}</span>
                <InputNumber
                  className={styles.numberInput}
                  readOnly={source !== 'quaternion' || !derived.q}
                  value={quaternionValue(field.key)}
                  onChange={(value) =>
                    setQInput((previous) => ({
                      ...previous,
                      [field.key]: value === null ? 0 : Number(value),
                    }))
                  }
                />
              </div>
            ))}
            <div className={styles.statusLine}>
              范数 ‖q‖ = <span className={styles.mono}>{trimNumber(derived.norm)}</span>
              {derived.q ? '（已归一化）' : ''}
            </div>
          </div>

          {/* 欧拉角面板 */}
          <div className={`${styles.panel} ${source === 'euler' ? styles.panelActive : ''}`}>
            <div className={styles.panelHeader}>
              <span className={styles.panelTitle}>欧拉角 (roll, pitch, yaw)</span>
              <Button
                size="small"
                type={source === 'euler' ? 'primary' : 'default'}
                onClick={() => switchSource('euler')}
                disabled={!derived.q}
              >
                设为输入源
              </Button>
            </div>
            {EULER_FIELDS.map((field) => (
              <div key={field.key} className={styles.fieldRow}>
                <span className={styles.fieldLabel}>{field.label}</span>
                <InputNumber
                  className={styles.numberInput}
                  readOnly={source !== 'euler' || !derived.euler}
                  addonAfter={useDegree ? '°' : 'rad'}
                  value={eulerValue(field.key)}
                  onChange={(value) =>
                    setEulerInput((previous) => ({
                      ...previous,
                      [field.key]: value === null ? 0 : Number(value),
                    }))
                  }
                />
              </div>
            ))}
            <div className={styles.controls}>
              <span className={styles.label}>旋转顺序</span>
              <Select
                size="small"
                style={{ width: 92 }}
                value={order}
                onChange={(value: EulerOrder) => setOrder(value)}
                options={EULER_ORDERS.map((item) => ({ label: item, value: item }))}
              />
              <span className={styles.label}>角度</span>
              <Switch size="small" checked={useDegree} onChange={toggleAngleUnit} />
              <span className={styles.mono}>{useDegree ? '度 °' : '弧度 rad'}</span>
            </div>
            <div className={styles.statusLine}>
              内旋约定 R = R_first · R_middle · R_last
              {gimbalLock ? '；当前处于万向锁区域' : ''}
            </div>
          </div>

          {/* 旋转矩阵面板 */}
          <div className={`${styles.panel} ${source === 'matrix' ? styles.panelActive : ''}`}>
            <div className={styles.panelHeader}>
              <span className={styles.panelTitle}>3×3 旋转矩阵（行 × 列）</span>
              <Button
                size="small"
                type={source === 'matrix' ? 'primary' : 'default'}
                onClick={() => switchSource('matrix')}
                disabled={!derived.q}
              >
                设为输入源
              </Button>
            </div>
            <div className={styles.matrixGrid}>
              {([0, 1, 2] as const).flatMap((row) =>
                ([0, 1, 2] as const).map((col) => (
                  <InputNumber
                    key={`${row}-${col}`}
                    size="small"
                    readOnly={source !== 'matrix' || !derived.matrix}
                    value={
                      source === 'matrix'
                        ? matrixInput[row]?.[col] ?? 0
                        : derived.matrix
                          ? rounded(derived.matrix[row]?.[col] ?? 0)
                          : 0
                    }
                    onChange={(value) =>
                      setMatrixInput((previous) => {
                        const next: Matrix3 = [
                          [...previous[0]] as [number, number, number],
                          [...previous[1]] as [number, number, number],
                          [...previous[2]] as [number, number, number],
                        ];
                        next[row][col] = value === null ? 0 : Number(value);
                        return next;
                      })
                    }
                  />
                )),
              )}
            </div>
            <div className={styles.statusLine}>行优先输入；要求 det ≈ 1 且 RᵀR ≈ I</div>
          </div>
        </div>

        {derived.error ? (
          <Alert
            style={{ marginTop: 12 }}
            type="error"
            showIcon
            message={`${SOURCE_LABELS[source]}输入无效`}
            description={derived.error}
          />
        ) : null}
        {derived.normWarning ? (
          <Alert
            style={{ marginTop: 12 }}
            type="warning"
            showIcon
            message="非单位四元数"
            description={derived.normWarning}
          />
        ) : null}
        {gimbalLock ? (
          <Alert
            style={{ marginTop: 12 }}
            type="warning"
            showIcon
            message="万向锁（Gimbal Lock）"
            description={`中间轴角（本顺序 ${order[1]} 轴）接近 ±90°，首末两个转角退化为绕同一轴的组合，欧拉角分解不唯一；四元数与矩阵结果仍然有效。`}
          />
        ) : null}

        <Space wrap style={{ marginTop: 16 }}>
          <span className={styles.label}>示例：</span>
          {EXAMPLE_PRESETS.map((preset) => (
            <Button key={preset.name} size="small" onClick={() => applyPreset(preset)}>
              {preset.name}
            </Button>
          ))}
          <Button size="small" onClick={reset}>
            重置
          </Button>
        </Space>
      </Card>
    </div>
  );
};

export default QuaternionConverter;
