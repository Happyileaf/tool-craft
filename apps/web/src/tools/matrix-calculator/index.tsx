'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Button, Card, Collapse, Input, Select, Space, Switch, Tag, message } from 'antd';
import { ClearOutlined, CopyOutlined } from '@ant-design/icons';
import { copyToClipboard } from '@/lib/utils';
import { Fraction, parseFraction } from './utils/fraction';
import {
  add,
  determinant,
  gaussJordan,
  inverse,
  multiply,
  parseMatrix,
  scalarMultiply,
  solveSystem,
  subtract,
  transpose,
  type EliminationStep,
  type Matrix,
} from './utils/matrix';
import {
  DEFAULT_SAMPLE,
  OPERATION_OPTIONS,
  SAMPLE_OPTIONS,
  matrixToText,
  type Operation,
} from './constants';
import styles from './index.module.css';

/** 计算结果：矩阵 / 标量 / 方程组判定三类 */
interface ComputeResult {
  kind: 'matrix' | 'scalar' | 'system';
  matrix?: Matrix;
  scalar?: Fraction;
  rankValue?: number;
  steps?: EliminationStep[];
  system?: {
    status: 'unique' | 'none' | 'infinite';
    unique?: Fraction[];
    freeVariables?: number[];
  };
}

/**
 * 小数展示：保留 6 位并去除多余尾零，非有限数回退分数
 *
 * @param value - 分数
 * @returns 小数字符串
 */
function formatDecimal(value: Fraction): string {
  const number = value.toNumber();
  if (!Number.isFinite(number)) {
    return value.toString();
  }
  const rounded = Number(number.toFixed(6));
  return String(rounded);
}

/**
 * 单个分数单元格
 */
const FractionCell: React.FC<{ value: Fraction; decimal: boolean }> = ({ value, decimal }) => (
  <span className={styles.cell}>{decimal ? formatDecimal(value) : value.toString()}</span>
);

/**
 * 矩阵网格展示
 */
const MatrixView: React.FC<{ matrix: Matrix; decimal: boolean }> = ({ matrix, decimal }) => (
  <div className={styles.matrixWrap}>
    <table className={styles.matrix}>
      <tbody>
        {matrix.map((row, i) => (
          <tr key={i}>
            {row.map((value, j) => (
              <td key={j}>
                <FractionCell value={value} decimal={decimal} />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

/**
 * 行向量展示
 */
const VectorView: React.FC<{ values: Fraction[]; decimal: boolean }> = ({ values, decimal }) => (
  <div className={styles.vector}>
    (
    {values.map((value, i) => (
      <span key={i}>
        <FractionCell value={value} decimal={decimal} />
        {i < values.length - 1 ? ', ' : ''}
      </span>
    ))}
    )
  </div>
);

/**
 * 消元步骤折叠面板
 */
const StepsView: React.FC<{ steps: EliminationStep[]; decimal: boolean }> = ({
  steps,
  decimal,
}) => {
  if (steps.length === 0) {
    return <p className={styles.meta}>矩阵已经是简化行阶梯形，无需消元步骤。</p>;
  }
  return (
    <Collapse
      ghost
      items={steps.map((step, index) => ({
        key: index,
        label: (
          <span className={styles.stepLabel}>
            {index + 1}. {step.action}
          </span>
        ),
        children: <MatrixView matrix={step.matrix} decimal={decimal} />,
      }))}
    />
  );
};

/** 需要矩阵 B 的运算 */
const NEEDS_B: Operation[] = ['add', 'subtract', 'multiply'];
/** 需要标量的运算 */
const NEEDS_SCALAR: Operation[] = ['scalarMultiply'];
/** 需要右端向量的运算 */
const NEEDS_VECTOR: Operation[] = ['solve'];

/**
 * 线性代数矩阵计算器：矩阵加减、标量乘、矩阵乘、转置、
 * 行列式、逆、秩、RREF 逐步消元与 Ax=b 求解，BigInt 分数精确运算。
 * 全部运算在浏览器本地完成，不发起任何网络请求。
 *
 * @param props - 工具组件属性
 * @param props.defaultInput - 可选默认矩阵 A 输入
 * @returns 矩阵计算器交互界面
 */
const MatrixCalculator: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [operation, setOperation] = React.useState<Operation>(DEFAULT_SAMPLE.operation);
  const [matrixA, setMatrixA] = React.useState<string>(defaultInput || DEFAULT_SAMPLE.matrixA);
  const [matrixB, setMatrixB] = React.useState<string>(DEFAULT_SAMPLE.matrixB);
  const [scalar, setScalar] = React.useState<string>(DEFAULT_SAMPLE.scalar);
  const [vector, setVector] = React.useState<string>(DEFAULT_SAMPLE.vector);
  const [decimal, setDecimal] = React.useState<boolean>(false);

  const { result, error } = React.useMemo<{
    result: ComputeResult | null;
    error: string | null;
  }>(() => {
    try {
      const a = parseMatrix(matrixA);
      switch (operation) {
        case 'add':
          return { result: { kind: 'matrix', matrix: add(a, parseMatrix(matrixB)) }, error: null };
        case 'subtract':
          return {
            result: { kind: 'matrix', matrix: subtract(a, parseMatrix(matrixB)) },
            error: null,
          };
        case 'scalarMultiply':
          return {
            result: {
              kind: 'matrix',
              matrix: scalarMultiply(a, parseFraction(scalar || ' ')),
            },
            error: null,
          };
        case 'multiply':
          return {
            result: { kind: 'matrix', matrix: multiply(a, parseMatrix(matrixB)) },
            error: null,
          };
        case 'transpose':
          return { result: { kind: 'matrix', matrix: transpose(a) }, error: null };
        case 'determinant':
          return { result: { kind: 'scalar', scalar: determinant(a) }, error: null };
        case 'inverse': {
          const inv = inverse(a);
          if (inv === null) {
            throw new Error('该矩阵是奇异矩阵（行列式为 0），不存在逆矩阵');
          }
          return { result: { kind: 'matrix', matrix: inv }, error: null };
        }
        case 'rank': {
          const { rref, rank: rankValue, steps } = gaussJordan(a);
          return { result: { kind: 'matrix', matrix: rref, rankValue, steps }, error: null };
        }
        case 'rref': {
          const { rref, rank: rankValue, steps } = gaussJordan(a);
          return { result: { kind: 'matrix', matrix: rref, rankValue, steps }, error: null };
        }
        case 'solve': {
          const b = vector
            .split(/[\s,]+/)
            .filter((token) => token.length > 0)
            .map((token) => parseFraction(token));
          const solution = solveSystem(a, b);
          return {
            result: {
              kind: 'system',
              matrix: solution.rref,
              steps: solution.steps,
              system: {
                status: solution.kind,
                unique: solution.unique,
                freeVariables: solution.freeVariables,
              },
            },
            error: null,
          };
        }
        default:
          return { result: null, error: '未知运算' };
      }
    } catch (caught) {
      return {
        result: null,
        error: caught instanceof Error ? caught.message : '矩阵运算失败',
      };
    }
  }, [operation, matrixA, matrixB, scalar, vector]);

  /**
   * 应用示例预设
   */
  const applySample = (sample: (typeof SAMPLE_OPTIONS)[number]) => {
    setOperation(sample.operation);
    setMatrixA(sample.matrixA);
    setMatrixB(sample.matrixB);
    setScalar(sample.scalar);
    setVector(sample.vector);
  };

  /**
   * 清空全部输入
   */
  const handleClear = () => {
    setMatrixA('');
    setMatrixB('');
    setScalar('');
    setVector('');
  };

  /**
   * 复制当前结果为文本
   */
  const handleCopy = async () => {
    if (error || !result) {
      message.error('暂无可复制的结果');
      return;
    }
    let text = '';
    if (result.kind === 'matrix' && result.matrix) {
      text = matrixToText(result.matrix);
      if (result.rankValue !== undefined) {
        text = `秩 rank = ${result.rankValue}\n${text}`;
      }
    } else if (result.kind === 'scalar' && result.scalar) {
      text = result.scalar.toString();
    } else if (result.kind === 'system' && result.system) {
      if (result.system.status === 'unique' && result.system.unique) {
        text = result.system.unique.map((value) => value.toString()).join('\n');
      } else if (result.system.status === 'none') {
        text = '方程组无解';
      } else {
        const free = (result.system.freeVariables ?? [])
          .map((index) => `x${index + 1}`)
          .join(', ');
        text = `方程组有无穷多解，自由变量：${free}`;
      }
    }
    await copyToClipboard(text);
    message.success('复制成功');
  };

  const showResult = !error && result !== null;

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        <Space wrap className={styles.options}>
          <Select<Operation>
            value={operation}
            onChange={setOperation}
            options={OPERATION_OPTIONS}
            style={{ width: 240 }}
          />
          <Space size={4}>
            <span>小数显示</span>
            <Switch checked={decimal} onChange={setDecimal} />
            <span className={styles.meta}>{decimal ? '显示浮点近似值' : '默认精确分数'}</span>
          </Space>
          <span className={styles.meta}>
            {SAMPLE_OPTIONS.map((sample) => (
              <Button
                key={sample.label}
                size="small"
                type="link"
                style={{ padding: '0 4px' }}
                onClick={() => applySample(sample)}
              >
                {sample.label}
              </Button>
            ))}
          </span>
        </Space>
        <Space>
          <Button icon={<ClearOutlined />} onClick={handleClear}>
            清空
          </Button>
        </Space>
      </div>

      <div className={styles.panels}>
        <Card title="输入矩阵 A（空格 / 逗号分列，换行 / 分号分行；支持分数与小数）" className={styles.card}>
          <Input.TextArea
            className={styles.code}
            value={matrixA}
            onChange={(event) => setMatrixA(event.target.value)}
            placeholder={'例如：\n1 2 3\n0 1 4\n5 6 0\n\n分数写 3/4，小数写 0.5'}
            autoSize={{ minRows: 10, maxRows: 22 }}
          />
          {NEEDS_B.includes(operation) ? (
            <div className={styles.subInput}>
              <div className={styles.subLabel}>矩阵 B</div>
              <Input.TextArea
                className={styles.code}
                value={matrixB}
                onChange={(event) => setMatrixB(event.target.value)}
                placeholder="矩阵 B"
                autoSize={{ minRows: 4, maxRows: 12 }}
              />
            </div>
          ) : null}
          {NEEDS_SCALAR.includes(operation) ? (
            <div className={styles.subInput}>
              <div className={styles.subLabel}>标量 k</div>
              <Input
                className={styles.code}
                value={scalar}
                onChange={(event) => setScalar(event.target.value)}
                placeholder="例如 2、-1/3、0.5"
              />
            </div>
          ) : null}
          {NEEDS_VECTOR.includes(operation) ? (
            <div className={styles.subInput}>
              <div className={styles.subLabel}>右端向量 b（每行一个，或空格分隔）</div>
              <Input.TextArea
                className={styles.code}
                value={vector}
                onChange={(event) => setVector(event.target.value)}
                placeholder={'例如：\n8\n-11\n-3'}
                autoSize={{ minRows: 3, maxRows: 10 }}
              />
            </div>
          ) : null}
        </Card>

        <Card
          title="计算结果"
          className={styles.card}
          extra={
            showResult ? (
              <Button type="text" icon={<CopyOutlined />} onClick={handleCopy}>
                复制结果
              </Button>
            ) : null
          }
        >
          {error ? (
            <Alert type="error" showIcon message="无法计算" description={error} />
          ) : result ? (
            <div className={styles.output}>
              {result.kind === 'matrix' ? (
                <>
                  {result.rankValue !== undefined ? (
                    <div className={styles.summary}>
                      <Tag color="blue">秩 rank = {result.rankValue}</Tag>
                      <span className={styles.meta}>
                        {operation === 'rank' ? 'RREF 为：' : '简化行阶梯形 RREF：'}
                      </span>
                    </div>
                  ) : null}
                  {result.matrix ? <MatrixView matrix={result.matrix} decimal={decimal} /> : null}
                  {result.steps ? (
                    <div className={styles.steps}>
                      <div className={styles.stepHeading}>消元步骤</div>
                      <StepsView steps={result.steps} decimal={decimal} />
                    </div>
                  ) : null}
                </>
              ) : null}
              {result.kind === 'scalar' && result.scalar ? (
                <div className={styles.result}>
                  {decimal ? formatDecimal(result.scalar) : result.scalar.toString()}
                </div>
              ) : null}
              {result.kind === 'system' && result.system ? (
                <>
                  <div className={styles.summary}>
                    {result.system.status === 'unique' ? (
                      <Tag color="green">方程组有唯一解</Tag>
                    ) : result.system.status === 'none' ? (
                      <Tag color="red">方程组无解</Tag>
                    ) : (
                      <Tag color="orange">方程组有无穷多解</Tag>
                    )}
                  </div>
                  {result.system.status === 'unique' && result.system.unique ? (
                    <div>
                      <div className={styles.subLabel}>解向量（按 x₁, x₂, … 顺序）</div>
                      <VectorView values={result.system.unique} decimal={decimal} />
                    </div>
                  ) : null}
                  {result.system.status === 'infinite' && result.system.freeVariables ? (
                    <p>
                      自由变量：
                      {result.system.freeVariables.map((index) => `x${index + 1}`).join('、')}
                    </p>
                  ) : null}
                  {result.matrix ? (
                    <div className={styles.steps}>
                      <div className={styles.stepHeading}>增广矩阵 RREF 与消元步骤</div>
                      <MatrixView matrix={result.matrix} decimal={decimal} />
                      {result.steps ? <StepsView steps={result.steps} decimal={decimal} /> : null}
                    </div>
                  ) : null}
                </>
              ) : null}
            </div>
          ) : null}
        </Card>
      </div>
    </div>
  );
};

export default MatrixCalculator;
