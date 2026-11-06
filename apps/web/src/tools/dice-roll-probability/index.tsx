'use client';

import React from 'react';
import {
  Alert,
  Button,
  Card,
  Empty,
  Input,
  InputNumber,
  Space,
  Statistic,
  Table,
  Tag,
  message,
} from 'antd';
import { ThunderboltFilled } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { ToolComponentProps } from '../loaders';
import {
  getDistribution,
  parseDiceExpression,
  probabilityAtLeast,
  rollDice,
  type DistributionEntry,
  type RollResult,
} from './utils/dice';
import {
  DEFAULT_EXPRESSION,
  EXPRESSION_EXAMPLES,
  INPUT_ROWS,
  MAX_HISTOGRAM_BARS,
  PROBABILITY_DIGITS,
} from './constants';
import styles from './index.module.css';

/**
 * 骰子投掷与点数概率分布工具：解析 NdS / 修正值 / keep-drop 表达式，
 * 使用 Web Crypto 随机投掷并展示明细，同时以概率 DP 给出精确分布、期望与区间概率
 *
 * @returns 骰子模拟与分布交互界面
 */
const DiceRollProbability: React.FC<ToolComponentProps> = () => {
  const [expression, setExpression] = React.useState(DEFAULT_EXPRESSION);
  const [target, setTarget] = React.useState<number | null>(10);
  const [history, setHistory] = React.useState<RollResult[]>([]);

  const ast = React.useMemo(() => {
    try {
      return { value: parseDiceExpression(expression), error: null as string | null };
    } catch (error) {
      return { value: null, error: (error as Error).message };
    }
  }, [expression]);

  const distribution = React.useMemo(() => {
    if (!ast.value) {
      return null;
    }
    try {
      return getDistribution(ast.value);
    } catch {
      return null;
    }
  }, [ast.value]);

  /** 执行一次投掷并保留最近 10 次历史 */
  const handleRoll = () => {
    if (!ast.value) {
      return;
    }
    const result = rollDice(ast.value);
    setHistory((previous) => [result, ...previous].slice(0, 10));
    message.success(`投掷结果：${result.total}`);
  };

  const columns: ColumnsType<DistributionEntry> = [
    { title: '点数和', dataIndex: 'sum', key: 'sum' },
    {
      title: '概率',
      dataIndex: 'probability',
      key: 'probability',
      render: (value: number) => `${(value * 100).toFixed(2)}%（${value.toFixed(PROBABILITY_DIGITS)}）`,
    },
    {
      title: '累积概率 P(X≤和)',
      dataIndex: 'cumulative',
      key: 'cumulative',
      render: (value: number) => `${(value * 100).toFixed(2)}%`,
    },
  ];

  const histogramEntries = React.useMemo(() => {
    if (!distribution) {
      return [];
    }
    const entries = distribution.entries;
    if (entries.length <= MAX_HISTOGRAM_BARS) {
      return entries;
    }
    const step = Math.ceil(entries.length / MAX_HISTOGRAM_BARS);
    return entries.filter((_, index) => index % step === 0);
  }, [distribution]);

  const maxProbability = histogramEntries.reduce(
    (max, entry) => Math.max(max, entry.probability),
    0,
  );

  return (
    <div className={styles.container}>
      <Card
        title="骰子表达式（如 3d6+2、2d20kh1、4d6dl1）"
        extra={<Tag color="blue">Web Crypto 随机 · 纯本地</Tag>}
      >
        <Input.TextArea
          value={expression}
          rows={INPUT_ROWS}
          onChange={(event) => setExpression(event.target.value)}
          placeholder="输入骰子表达式，例如 2d20kh1"
        />
        <div className={styles.exampleRow}>
          {EXPRESSION_EXAMPLES.map((example) => (
            <Button key={example} size="small" onClick={() => setExpression(example)}>
              {example}
            </Button>
          ))}
        </div>
        {ast.error && (
          <Alert type="error" showIcon message={ast.error} style={{ marginTop: 12 }} />
        )}
      </Card>

      {ast.error || !distribution ? (
        <Alert type="info" showIcon message="修正表达式后展示投掷与分布结果" />
      ) : (
        <>
          <div className={styles.statGrid}>
            <div className={styles.statCard}>
              <Statistic title="期望值" value={distribution.expected} precision={2} />
            </div>
            <div className={styles.statCard}>
              <Statistic title="最小总和" value={distribution.min} />
            </div>
            <div className={styles.statCard}>
              <Statistic title="最大总和" value={distribution.max} />
            </div>
            <div className={styles.statCard}>
              <Statistic
                title={`P(X ≥ ${target ?? '?'})`}
                value={
                  target === null
                    ? '—'
                    : `${(probabilityAtLeast(distribution, target) * 100).toFixed(2)}%`
                }
              />
            </div>
          </div>

          <Card
            title="模拟投掷"
            extra={
              <Space>
                <span>目标值</span>
                <InputNumber
                  value={target ?? undefined}
                  min={distribution.min}
                  max={distribution.max}
                  onChange={(value) => setTarget(value)}
                  style={{ width: 90 }}
                />
                <Button type="primary" icon={<ThunderboltFilled />} onClick={handleRoll}>
                  投掷
                </Button>
              </Space>
            }
          >
            {history.length === 0 ? (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="点击「投掷」生成结果" />
            ) : (
              <Space direction="vertical" style={{ width: '100%' }}>
                {history.map((result, index) => (
                  <div key={index}>
                    <Space wrap style={{ marginBottom: 8 }}>
                      <span className={styles.mono}>
                        第 {history.length - index} 次 · 骰子和 {result.diceSum}
                      </span>
                      {ast.value?.modifier !== 0 && (
                        <Tag>修正 {ast.value!.modifier > 0 ? '+' : ''}{ast.value!.modifier}</Tag>
                      )}
                      <Tag color="green">最终 {result.total}</Tag>
                    </Space>
                    <div className={styles.diceList}>
                      {result.dice.map((die, dieIndex) => (
                        <div
                          key={dieIndex}
                          className={`${styles.die} ${
                            die.kept ? styles.dieKept : styles.dieDropped
                          }`}
                          title={`d${die.sides}${die.kept ? ' · 保留' : ' · 丢弃'}`}
                        >
                          {die.value}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </Space>
            )}
          </Card>

          <Card title="点数和概率分布直方图">
            <div className={styles.histogram}>
              {histogramEntries.map((entry) => (
                <div
                  key={entry.sum}
                  className={styles.bar}
                  style={{ height: `${(entry.probability / maxProbability) * 100}%` }}
                  title={`和 ${entry.sum}：${(entry.probability * 100).toFixed(2)}%`}
                >
                  <span className={styles.barLabel}>{entry.sum}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card title="精确概率分布表（概率 DP 计算）" size="small">
            <Table<DistributionEntry>
              rowKey="sum"
              columns={columns}
              dataSource={distribution.entries}
              size="small"
              pagination={{ pageSize: 12, showSizeChanger: false }}
            />
          </Card>
        </>
      )}
    </div>
  );
};

export default DiceRollProbability;
