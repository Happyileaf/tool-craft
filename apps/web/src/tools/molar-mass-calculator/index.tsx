'use client';

import React, { useMemo, useState } from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Button, Card, Input, Space, Table, Tag, Tooltip, message } from 'antd';
import { EXAMPLE_FORMULAS, FORMULA_SPLIT_PATTERN } from './constants';
import {
  calculateBatch,
  formatMass,
  type ElementBreakdown,
  type MolarResult,
} from './utils/molarMass';
import { copyToClipboard } from '@/lib/utils';
import styles from './index.module.css';

const DEFAULT_INPUT = 'H2O, NaCl, H2SO4, Ca(OH)2, Fe2(SO4)3, C6H12O6, CuSO4·5H2O';

/** 单条化学式结果卡片 */
const FormulaResultCard: React.FC<{ raw: string; result: MolarResult; error: string | null }> = ({
  raw,
  result,
  error,
}) => {
  if (error || !result) {
    return (
      <Card size="small" title={<span className={styles.formula}>{raw}</span>}>
        <Alert type="error" showIcon message={error ?? '解析失败'} />
      </Card>
    );
  }

  const columns = [
    {
      title: '元素',
      dataIndex: 'symbol',
      key: 'symbol',
      render: (symbol: string, row: ElementBreakdown) => (
        <Space size={4}>
          <span className={styles.formula}>{symbol}</span>
          <span style={{ color: 'var(--color-text-3, rgba(0,0,0,0.45))' }}>{row.name}</span>
          {row.bracketed && (
            <Tooltip title="该元素无标准原子量，数值取最稳定同位素质量数近似（IUPAC 方括号值）">
              <Tag color="default">≈</Tag>
            </Tooltip>
          )}
        </Space>
      ),
    },
    { title: '原子数', dataIndex: 'count', key: 'count', className: styles.mono },
    {
      title: '质量贡献 (g/mol)',
      dataIndex: 'massContribution',
      key: 'massContribution',
      className: styles.mono,
      render: (v: number) => formatMass(v),
    },
    {
      title: '质量占比',
      dataIndex: 'massPercent',
      key: 'massPercent',
      render: (v: number) => (
        <Space size={8} style={{ width: '100%' }}>
          <div
            style={{
              width: 90,
              height: 8,
              borderRadius: 4,
              background: 'var(--color-fill-secondary, rgba(0,0,0,0.06))',
              overflow: 'hidden',
            }}
          >
            <div
              style={{ width: `${Math.min(v, 100)}%`, height: '100%', background: '#1677ff' }}
            />
          </div>
          <span className={styles.mono}>{`${v.toFixed(2)}%`}</span>
        </Space>
      ),
    },
  ];

  return (
    <Card
      size="small"
      title={
        <Space wrap>
          <span className={styles.formula}>{result.normalized}</span>
          {result.normalized !== raw.trim() && (
            <Tag>{`原输入：${raw.trim()}`}</Tag>
          )}
        </Space>
      }
      extra={
        <Space>
          <span className={styles.bigMass}>{formatMass(result.molarMass)}</span>
          <span style={{ color: 'var(--color-text-3, rgba(0,0,0,0.45))' }}>g/mol</span>
        </Space>
      }
    >
      <Space direction="vertical" size="small" style={{ width: '100%' }}>
        <Space size="large">
          <span style={{ color: 'var(--color-text-3, rgba(0,0,0,0.45))' }}>
            {`原子总数：${result.totalAtoms}`}
          </span>
          {result.bracketedSymbols.length > 0 && (
            <Tag color="orange">
              {`含近似原子量元素：${result.bracketedSymbols.join('、')}`}
            </Tag>
          )}
        </Space>
        <Table<ElementBreakdown>
          size="small"
          rowKey="symbol"
          columns={columns}
          dataSource={result.breakdown}
          pagination={false}
        />
      </Space>
    </Card>
  );
};

/**
 * 化学式摩尔质量计算器：解析元素符号、下标、嵌套括号与结晶水，
 * 按 IUPAC 2021 常规原子量计算摩尔质量与各元素质量占比，支持批量输入。
 *
 * @param props - 工具组件属性
 * @returns 摩尔质量计算器界面
 */
const MolarMassCalculator: React.FC<ToolComponentProps> = () => {
  const [input, setInput] = useState<string>(DEFAULT_INPUT);
  const [messageApi, contextHolder] = message.useMessage();

  const results = useMemo(() => calculateBatch(input, FORMULA_SPLIT_PATTERN), [input]);

  const copySummary = async (): Promise<void> => {
    const lines = results.map(({ raw, result, error }) => {
      if (error || !result) return `${raw}: 解析失败（${error ?? ''}）`;
      const breakdown = result.breakdown
        .map((b) => `${b.symbol}${b.count > 1 ? b.count : ''}=${formatMass(b.massPercent)}%`)
        .join(', ');
      return `${result.normalized}: ${formatMass(result.molarMass)} g/mol [${breakdown}]`;
    });
    await copyToClipboard(lines.join('\n'));
    messageApi.success('已复制全部结果');
  };

  return (
    <div className={styles.container}>
      {contextHolder}
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <Card title="输入化学式（支持批量，用换行 / 逗号 / 分号分隔）">
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Input.TextArea
              className={styles.formula}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              autoSize={{ minRows: 2, maxRows: 8 }}
              placeholder="如 H2O、Ca(OH)2、Fe2(SO4)3、CuSO4·5H2O"
            />
            <Space wrap>
              <span style={{ color: 'var(--color-text-3, rgba(0,0,0,0.45))' }}>示例：</span>
              {EXAMPLE_FORMULAS.map((f) => (
                <a
                  key={f}
                  className={styles.exampleLink}
                  onClick={() => setInput((prev) => (prev.trim() ? `${prev.replace(/[,，;；\s]+$/, '')}, ${f}` : f))}
                >
                  {f}
                </a>
              ))}
            </Space>
            <Alert
              type="info"
              showIcon
              className={styles.hint}
              message="语法说明"
              description={
                <div className={styles.hint}>
                  元素符号区分大小写（H、He、Na）；数字为下标（H2O）；支持 () 与 [] 嵌套括号
                  （Ca(OH)2、Fe2(SO4)3、K4[Fe(CN)6]）；用「·」表示结晶水/加合物
                  （CuSO4·5H2O，也兼容 * 号）；可带电荷后缀（SO4^2-），不参与质量计算。
                </div>
              }
            />
          </Space>
        </Card>

        {results.length > 0 && (
          <Card
            title={`计算结果（${results.length} 个化学式，${results.filter((r) => r.result).length} 个成功）`}
            extra={
              <Button onClick={() => void copySummary()}>复制全部结果</Button>
            }
          >
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              {results.map((r, i) => (
                <FormulaResultCard key={`${r.raw}-${i}`} raw={r.raw} result={r.result as MolarResult} error={r.error} />
              ))}
            </Space>
          </Card>
        )}

        <Alert
          type="info"
          showIcon
          className={styles.hint}
          message="原子量数据"
          description="采用 IUPAC/CIAAW 2021 常规原子量（Conventional Atomic Weights）静态表，版本固定；Tc、Pm 及序数 ≥84 的天然放射性元素无标准原子量，结果中以 ≈ 标记并取最稳定同位素质量数近似。全部计算在浏览器本地完成，不联网。"
        />
      </Space>
    </div>
  );
};

export default MolarMassCalculator;
