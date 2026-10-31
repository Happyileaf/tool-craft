'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Button, Card, Descriptions, Input, Space, Statistic, Table, Tag, Typography } from 'antd';
import { ANSCOMBE_QUARTET_I, LINEAR_EXAMPLE } from './constants';
import {
  formatEquation,
  linearRegression,
  parsePoints,
  pointsToCsv,
  type Point,
  type RegressionResult,
} from './utils/regression';
import styles from './index.module.css';

const { Text } = Typography;

/** 残差表行 */
interface ResidualRow {
  key: number;
  index: number;
  x: number;
  y: number;
  yHat: number;
  residual: number;
}

const RESIDUAL_COLUMNS = [
  { title: '#', dataIndex: 'index', key: 'index', width: 56 },
  {
    title: 'x',
    dataIndex: 'x',
    key: 'x',
    render: (value: number) => <span className={styles.mono}>{value}</span>,
  },
  {
    title: 'y（实际）',
    dataIndex: 'y',
    key: 'y',
    render: (value: number) => <span className={styles.mono}>{value}</span>,
  },
  {
    title: 'ŷ（拟合）',
    dataIndex: 'yHat',
    key: 'yHat',
    render: (value: number) => <span className={styles.mono}>{value.toFixed(4)}</span>,
  },
  {
    title: '残差 y − ŷ',
    dataIndex: 'residual',
    key: 'residual',
    render: (value: number) => (
      <span className={styles.mono}>{value >= 0 ? `+${value.toFixed(4)}` : value.toFixed(4)}</span>
    ),
  },
];

/**
 * 相关强度文字解读
 *
 * @param r - Pearson 相关系数
 * @returns 标签文案与颜色
 */
function describeCorrelation(r: number): { label: string; color: string } {
  const abs = Math.abs(r);
  const direction = r >= 0 ? '正相关' : '负相关';
  if (abs >= 0.8) return { label: `强${direction}`, color: r >= 0 ? 'green' : 'red' };
  if (abs >= 0.5) return { label: `中等${direction}`, color: r >= 0 ? 'lime' : 'orange' };
  if (abs >= 0.3) return { label: `弱${direction}`, color: 'gold' };
  return { label: '几乎无线性相关', color: 'default' };
}

function toPoints(tuples: ReadonlyArray<readonly [number, number]>): Point[] {
  return tuples.map(([x, y]) => ({ x, y }));
}

function fmt(value: number, digits = 4): string {
  return value.toFixed(digits);
}

/**
 * 一元线性回归与相关系数计算器
 *
 * @returns 线性回归交互界面
 */
const LinearRegression: React.FC<ToolComponentProps> = () => {
  const [input, setInput] = React.useState<string>(() => pointsToCsv(toPoints(LINEAR_EXAMPLE)));

  const outcome = React.useMemo<{ result: RegressionResult | null; error: string | null }>(() => {
    try {
      const points = parsePoints(input);
      return { result: linearRegression(points), error: null };
    } catch (error) {
      return { result: null, error: error instanceof Error ? error.message : String(error) };
    }
  }, [input]);

  const rows: ResidualRow[] = React.useMemo(
    () =>
      (outcome.result?.fits ?? []).map((fit, index) => ({
        key: index,
        index: index + 1,
        x: fit.x,
        y: fit.y,
        yHat: fit.yHat,
        residual: fit.residual,
      })),
    [outcome.result],
  );

  const correlation = outcome.result ? describeCorrelation(outcome.result.r) : null;

  return (
    <div className={styles.container}>
      <Card
        title="数据录入"
        extra={
          <Space wrap>
            <Button
              size="small"
              onClick={() => setInput(pointsToCsv(toPoints(ANSCOMBE_QUARTET_I)))}
            >
              Anscombe 示例
            </Button>
            <Button size="small" onClick={() => setInput(pointsToCsv(toPoints(LINEAR_EXAMPLE)))}>
              线性示例
            </Button>
            <Button size="small" onClick={() => setInput('')}>
              清空
            </Button>
          </Space>
        }
      >
        <p className={styles.hint}>
          每行输入一对 x、y，支持逗号 / 制表符 / 空格 / 分号分隔；可直接粘贴 Excel / Google
          表格的两列数据，# 开头的行与空行会被忽略。
        </p>
        <Input.TextArea
          value={input}
          onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) =>
            setInput(event.target.value)
          }
          autoSize={{ minRows: 8, maxRows: 16 }}
          spellCheck={false}
          className={styles.textarea}
          placeholder={'例如：\n1, 2.1\n2, 3.9\n3, 6.2'}
        />
      </Card>

      {outcome.error ? (
        <Alert type="error" showIcon message="无法拟合" description={outcome.error} />
      ) : outcome.result ? (
        <>
          <Card title="回归结果（最小二乘法）">
            <div className={styles.equationRow}>
              <Text strong className={styles.equation}>
                {formatEquation(outcome.result)}
              </Text>
              {correlation ? <Tag color={correlation.color}>{correlation.label}</Tag> : null}
            </div>
            <div className={styles.statsRow}>
              <Statistic title="数据点 n" value={outcome.result.n} />
              <Statistic
                title="斜率 b"
                value={fmt(outcome.result.slope)}
                className={styles.monoStat}
              />
              <Statistic
                title="截距 a"
                value={fmt(outcome.result.intercept)}
                className={styles.monoStat}
              />
              <Statistic
                title="相关系数 r"
                value={fmt(outcome.result.r)}
                className={styles.monoStat}
              />
              <Statistic
                title="决定系数 R²"
                value={fmt(outcome.result.rSquared)}
                className={styles.monoStat}
              />
            </div>
            <Descriptions
              column={{ xs: 1, sm: 2, md: 3 }}
              bordered
              size="small"
              className={styles.descriptions}
            >
              <Descriptions.Item label="x 均值 x̄">
                <span className={styles.mono}>{fmt(outcome.result.meanX)}</span>
              </Descriptions.Item>
              <Descriptions.Item label="y 均值 ȳ">
                <span className={styles.mono}>{fmt(outcome.result.meanY)}</span>
              </Descriptions.Item>
              <Descriptions.Item label="SSE 残差平方和">
                <span className={styles.mono}>{fmt(outcome.result.sse)}</span>
              </Descriptions.Item>
              <Descriptions.Item label="SSR 回归平方和">
                <span className={styles.mono}>{fmt(outcome.result.ssr)}</span>
              </Descriptions.Item>
              <Descriptions.Item label="SST 总离差平方和">
                <span className={styles.mono}>{fmt(outcome.result.sst)}</span>
              </Descriptions.Item>
              <Descriptions.Item label="平方和分解">
                <span className={styles.mono}>SST = SSR + SSE</span>
              </Descriptions.Item>
            </Descriptions>
          </Card>

          <Card title={`逐点拟合与残差（${rows.length} 个点）`}>
            <Table<ResidualRow>
              columns={RESIDUAL_COLUMNS}
              dataSource={rows}
              pagination={false}
              size="small"
              scroll={{ y: 360 }}
            />
          </Card>
        </>
      ) : null}
    </div>
  );
};

export default LinearRegression;
