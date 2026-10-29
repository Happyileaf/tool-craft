'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Button, Card, Empty, Input, Radio, Space, Tag } from 'antd';
import { ClearOutlined, CopyOutlined, ReloadOutlined } from '@ant-design/icons';
import { copyToClipboard } from '@/lib/utils';
import { computeStats, formatNumber, parseNumbers } from './utils/statistics';
import { DEFAULT_INPUT } from './constants';
import styles from './index.module.css';

type StdDevMode = 'population' | 'sample';

/**
 * 描述性统计计算器：粘贴一列数值（支持逗号 / 空格 / 换行 / 分号等分隔），
 * 实时计算集中趋势、离散程度与四分位数，全部在浏览器本地完成
 *
 * @param props - 工具组件属性
 * @param props.defaultInput - 可选默认输入
 * @returns 描述性统计交互界面
 */
const DescriptiveStatistics: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [text, setText] = React.useState<string>(defaultInput || DEFAULT_INPUT);
  const [mode, setMode] = React.useState<StdDevMode>('population');

  const parsed = React.useMemo(() => parseNumbers(text), [text]);
  const stats = React.useMemo(() => computeStats(parsed.values), [parsed.values]);

  const metrics = React.useMemo(() => {
    if (!stats) {
      return [];
    }
    const variance = mode === 'population' ? stats.populationVariance : stats.sampleVariance;
    const stdDev = mode === 'population' ? stats.populationStdDev : stats.sampleStdDev;
    return [
      { label: '数量 Count', value: String(stats.count) },
      { label: '总和 Sum', value: formatNumber(stats.sum) },
      { label: '均值 Mean', value: formatNumber(stats.mean) },
      { label: '中位数 Median (Q2)', value: formatNumber(stats.median) },
      {
        label: '众数 Mode',
        value: stats.mode.length === 0 ? '无（所有值唯一）' : stats.mode.map((v) => formatNumber(v)).join(', '),
      },
      { label: '最小值 Min', value: formatNumber(stats.min) },
      { label: '最大值 Max', value: formatNumber(stats.max) },
      { label: '极差 Range', value: formatNumber(stats.range) },
      { label: '下四分位数 Q1', value: formatNumber(stats.q1) },
      { label: '上四分位数 Q3', value: formatNumber(stats.q3) },
      {
        label: mode === 'population' ? '总体方差 σ²' : '样本方差 s²',
        value: variance === null ? 'n < 2 时不可计算' : formatNumber(variance),
      },
      {
        label: mode === 'population' ? '总体标准差 σ' : '样本标准差 s',
        value: stdDev === null ? 'n < 2 时不可计算' : formatNumber(stdDev),
      },
    ];
  }, [stats, mode]);

  const copyStats = async (): Promise<void> => {
    if (!stats) {
      return;
    }
    const lines = metrics.map((item) => `${item.label}: ${item.value}`);
    lines.push('', `排序后数据: ${stats.sorted.map((v) => formatNumber(v)).join(', ')}`);
    await copyToClipboard(lines.join('\n'));
  };

  return (
    <div className={styles.container}>
      <Card title="描述性统计计算器">
        <Input.TextArea
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="输入一列数值，支持逗号、空格、换行、分号等分隔，如 1, 2, 3&#10;4 5 6"
          autoSize={{ minRows: 5, maxRows: 14 }}
        />
        <Space style={{ marginTop: 12 }} wrap>
          <Button icon={<ReloadOutlined />} onClick={() => setText(DEFAULT_INPUT)}>
            载入示例
          </Button>
          <Button icon={<ClearOutlined />} onClick={() => setText('')}>
            清空
          </Button>
          <Radio.Group
            value={mode}
            onChange={(event) => setMode(event.target.value as StdDevMode)}
            optionType="button"
            buttonStyle="solid"
          >
            <Radio.Button value="population">总体 σ</Radio.Button>
            <Radio.Button value="sample">样本 s</Radio.Button>
          </Radio.Group>
        </Space>

        {parsed.invalidTokens.length > 0 ? (
          <Alert
            type="warning"
            showIcon
            style={{ marginTop: 12 }}
            message={`已忽略 ${parsed.invalidTokens.length} 个无法识别的项`}
            description={parsed.invalidTokens.slice(0, 20).join(', ')}
          />
        ) : null}
      </Card>

      {!stats ? (
        <Card>
          <Empty description="请输入至少一个有效数值" />
        </Card>
      ) : (
        <>
          <Card
            title="统计指标"
            extra={
              <Button size="small" icon={<CopyOutlined />} onClick={copyStats}>
                复制结果
              </Button>
            }
          >
            <div className={styles.statsGrid}>
              {metrics.map((item) => (
                <div key={item.label} className={styles.statCard}>
                  <div className={styles.statLabel}>{item.label}</div>
                  <div className={styles.statValue}>{item.value}</div>
                </div>
              ))}
            </div>
            <div className={styles.muted} style={{ marginTop: 12 }}>
              <Space size={[8, 8]} wrap>
                <Tag color="blue">有效 {parsed.values.length} 项</Tag>
                <Tag color={parsed.invalidTokens.length > 0 ? 'warning' : 'default'}>
                  无效 {parsed.invalidTokens.length} 项
                </Tag>
              </Space>
              分位数采用线性插值法（等价 Excel PERCENTILE.INC）；样本方差分母为 n−1，仅 1 个数据时不可计算。
            </div>
          </Card>

          <Card title="排序后数据分布">
            <div className={styles.sortedPreview}>{stats.sorted.map((v) => formatNumber(v)).join('  ')}</div>
          </Card>
        </>
      )}
    </div>
  );
};

export default DescriptiveStatistics;
