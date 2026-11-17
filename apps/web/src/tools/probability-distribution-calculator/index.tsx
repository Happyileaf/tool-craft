'use client';

import React from 'react';
import {
  Alert,
  Card,
  Empty,
  InputNumber,
  Segmented,
  Space,
  Statistic,
  Table,
  Tag,
} from 'antd';
import type { ToolComponentProps } from '../loaders';
import {
  DEFAULT_DISTRIBUTION,
  DISTRIBUTION_OPTIONS,
  PMF_TABLE_LIMIT,
  type DistributionConfig,
  type DistributionId,
} from './constants';
import {
  binomialPmf,
  normalQuantile,
  poissonPmf,
  summarize,
} from './utils/distributions';
import styles from './index.module.css';

const PERCENT = (value: number): string => `${(value * 100).toFixed(4)}%`;

/**
 * 概率分布计算器：正态 / 二项 / 泊松分布的 PDF·PMF、CDF、分位与汇总指标
 *
 * @param props - 工具组件属性
 * @param props.defaultInput - 预留默认输入（本工具以结构化参数为准，未使用）
 * @returns 概率分布计算界面
 */
const ProbabilityDistributionCalculator: React.FC<ToolComponentProps> = () => {
  const [config, setConfig] = React.useState<DistributionConfig>(DEFAULT_DISTRIBUTION);

  const patch = (partial: Partial<DistributionConfig>) =>
    setConfig((prev) => ({ ...prev, ...partial }));

  const summary = React.useMemo(() => {
    try {
      return summarize(config.kind, config, config.x);
    } catch (error) {
      return error instanceof Error ? error : new Error(String(error));
    }
  }, [config]);

  const quantile = React.useMemo(() => {
    if (summary instanceof Error) {
      return null;
    }
    try {
      if (config.kind === 'normal') {
        return normalQuantile(0.95, config.mean ?? 0, config.stdDev ?? 1);
      }
      // 离散分布的 95 分位在质量表中直接体现，这里仅计算正态分位
      return null;
    } catch {
      return null;
    }
  }, [config, summary]);

  const pmfRows = React.useMemo(() => {
    if (config.kind === 'normal' || summary instanceof Error) {
      return [];
    }
    if (config.kind === 'binomial') {
      const n = config.trials ?? 1;
      const p = config.prob ?? 0.5;
      const limit = Math.min(n + 1, PMF_TABLE_LIMIT);
      let cumulative = 0;
      return Array.from({ length: limit }, (_, k) => {
        const mass = binomialPmf(k, n, p);
        cumulative += mass;
        return { key: k, k, mass, cumulative };
      });
    }
    const lambda = config.lambda ?? 1;
    let cumulative = 0;
    return Array.from({ length: PMF_TABLE_LIMIT }, (_, k) => {
      const mass = poissonPmf(k, lambda);
      cumulative += mass;
      return { key: k, k, mass, cumulative };
    });
  }, [config, summary]);

  return (
    <div className={styles.container}>
      <Alert
        type="info"
        showIcon
        message="三种常用概率分布的本地数值计算，无需统计表"
        description="正态分布使用 Abramowitz & Stegun 有理逼近计算 CDF 并以二分法求分位；二项与泊松分布基于对数阶乘计算 PMF/CDF，避免大 n 下的数值下溢。所有计算在浏览器本地完成。"
      />

      <Card title="分布与参数">
        <Space direction="vertical" size="middle" className={styles.fullWidth}>
          <Segmented
            block
            value={config.kind}
            onChange={(value) => patch({ kind: value as DistributionId })}
            options={DISTRIBUTION_OPTIONS.map((d) => ({ label: d.name, value: d.id }))}
          />
          <div className={styles.paramGrid}>
            {config.kind === 'normal' && (
              <>
                <label className={styles.paramItem}>
                  <span>均值 μ</span>
                  <InputNumber
                    value={config.mean}
                    step={0.5}
                    onChange={(v) => patch({ mean: typeof v === 'number' ? v : 0 })}
                  />
                </label>
                <label className={styles.paramItem}>
                  <span>标准差 σ（&gt; 0）</span>
                  <InputNumber
                    value={config.stdDev}
                    min={0.0001}
                    step={0.5}
                    onChange={(v) => patch({ stdDev: typeof v === 'number' ? v : 1 })}
                  />
                </label>
              </>
            )}
            {config.kind === 'binomial' && (
              <>
                <label className={styles.paramItem}>
                  <span>试验次数 n（正整数）</span>
                  <InputNumber
                    value={config.trials}
                    min={1}
                    precision={0}
                    onChange={(v) => patch({ trials: typeof v === 'number' ? v : 1 })}
                  />
                </label>
                <label className={styles.paramItem}>
                  <span>成功概率 p（0, 1）</span>
                  <InputNumber
                    value={config.prob}
                    min={0.0001}
                    max={0.9999}
                    step={0.05}
                    onChange={(v) => patch({ prob: typeof v === 'number' ? v : 0.5 })}
                  />
                </label>
              </>
            )}
            {config.kind === 'poisson' && (
              <label className={styles.paramItem}>
                <span>发生率 λ（&gt; 0）</span>
                <InputNumber
                  value={config.lambda}
                  min={0.0001}
                  step={0.5}
                  onChange={(v) => patch({ lambda: typeof v === 'number' ? v : 1 })}
                />
              </label>
            )}
            <label className={styles.paramItem}>
              <span>
                求值点 {config.kind === 'normal' ? 'x' : 'k（自动取整）'}
              </span>
              <InputNumber
                value={config.x}
                step={1}
                onChange={(v) => patch({ x: typeof v === 'number' ? v : 0 })}
              />
            </label>
          </div>
        </Space>
      </Card>

      {summary instanceof Error ? (
        <Card title="计算结果">
          <Alert type="error" showIcon message="参数无效" description={summary.message} />
        </Card>
      ) : (
        <>
          <Card title="汇总指标与求值点概率">
            <div className={styles.statRow}>
              <Statistic title="均值 E(X)" value={summary.mean} precision={4} />
              <Statistic title="方差 Var(X)" value={summary.variance} precision={4} />
              <Statistic title="标准差" value={summary.stdDev} precision={4} />
              <Statistic
                title={config.kind === 'normal' ? '密度 f(x)' : '质量 P(X=k)'}
                value={summary.densityAtX}
                precision={6}
              />
              <Statistic
                title={config.kind === 'normal' ? '累积 P(X ≤ x)' : '累积 P(X ≤ k)'}
                value={PERCENT(summary.cdfAtX)}
              />
              <Statistic title="右尾 P(X > x)" value={PERCENT(summary.tailAtX)} />
              {quantile !== null && (
                <Statistic title="95% 分位数 x₀.₉₅" value={quantile} precision={4} />
              )}
            </div>
          </Card>

          {config.kind === 'normal' ? (
            <Card>
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="连续分布不逐点列出质量表；请调整求值点 x 查看 PDF 与 CDF"
              />
            </Card>
          ) : (
            <Card
              title={
                <Space>
                  概率质量表
                  <Tag color="blue">
                    展示前 {Math.min(pmfRows.length, PMF_TABLE_LIMIT)} 个取值
                  </Tag>
                </Space>
              }
            >
              <Table
                size="small"
                pagination={{ pageSize: 10, showSizeChanger: false }}
                dataSource={pmfRows}
                columns={[
                  { title: 'k', dataIndex: 'k', width: 80 },
                  {
                    title: 'P(X = k)',
                    dataIndex: 'mass',
                    render: (v: number) => v.toExponential(4),
                  },
                  {
                    title: 'P(X ≤ k)',
                    dataIndex: 'cumulative',
                    render: (v: number) => PERCENT(Math.min(1, v)),
                  },
                ]}
              />
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default ProbabilityDistributionCalculator;
