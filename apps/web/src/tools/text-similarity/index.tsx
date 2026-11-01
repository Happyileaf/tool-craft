'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Button, Card, Input, Progress, Space, Switch, Tag, message } from 'antd';
import { ClearOutlined } from '@ant-design/icons';
import { compareTexts, type EditOp } from './utils/similarity';
import { DEFAULT_SAMPLE, SAMPLE_OPTIONS } from './constants';
import styles from './index.module.css';

/**
 * 把 0–1 的比率渲染为百分比文本
 *
 * @param ratio - 比率
 * @returns 形如 87.50% 的文本
 */
function percent(ratio: number): string {
  return `${(ratio * 100).toFixed(2)}%`;
}

/** 单个指标行 */
const MetricRow: React.FC<{ label: string; value: string; ratio: number }> = ({
  label,
  value,
  ratio,
}) => (
  <div className={styles.metric}>
    <div className={styles.metricHead}>
      <span>{label}</span>
      <span className={styles.metricValue}>{value}</span>
    </div>
    <Progress percent={Math.round(ratio * 1000) / 10} size="small" showInfo={false} />
  </div>
);

/** 对齐字符单元格 */
const AlignCell: React.FC<{ op: EditOp }> = ({ op }) => {
  const labelMap: Record<EditOp['type'], { text: string; cls: string }> = {
    equal: {
      text: op.aChar ?? '',
      cls: styles.equal!,
    },
    replace: {
      text: `${op.aChar ?? ''}→${op.bChar ?? ''}`,
      cls: styles.replace!,
    },
    delete: {
      text: op.aChar ?? '',
      cls: styles.delete!,
    },
    insert: {
      text: `+${op.bChar ?? ''}`,
      cls: styles.insert!,
    },
  };
  const item = labelMap[op.type];
  return <span className={`${styles.chip} ${item.cls}`}>{item.text === ' ' ? '␣' : item.text}</span>;
};

/**
 * 文本相似度计算器：对两段文本计算 Levenshtein 编辑距离与相似度、
 * LCS、Jaro-Winkler、Sørensen–Dice 系数，并展示编辑对齐视图。
 * 全部算法在浏览器本地完成，不发起任何网络请求。
 *
 * @param props - 工具组件属性
 * @param props.defaultInput - 可选默认输入（作为文本 A）
 * @returns 文本相似度交互界面
 */
const TextSimilarity: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [textA, setTextA] = React.useState<string>(defaultInput || DEFAULT_SAMPLE.a);
  const [textB, setTextB] = React.useState<string>(DEFAULT_SAMPLE.b);
  const [ignoreCase, setIgnoreCase] = React.useState<boolean>(false);
  const [showAlignment, setShowAlignment] = React.useState<boolean>(true);

  const { result, error } = React.useMemo(() => {
    try {
      if (textA.length === 0 && textB.length === 0) {
        return { result: null, error: null as string | null };
      }
      return { result: compareTexts(textA, textB, { ignoreCase }), error: null };
    } catch (caught) {
      return {
        result: null,
        error: caught instanceof Error ? caught.message : '相似度计算失败',
      };
    }
  }, [textA, textB, ignoreCase]);

  /**
   * 清空输入
   */
  const handleClear = () => {
    setTextA('');
    setTextB('');
  };

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        <Space wrap className={styles.options}>
          <Space size={4}>
            <span>忽略大小写</span>
            <Switch checked={ignoreCase} onChange={setIgnoreCase} />
          </Space>
          <Space size={4}>
            <span>编辑对齐视图</span>
            <Switch checked={showAlignment} onChange={setShowAlignment} />
          </Space>
          <span className={styles.meta}>
            {SAMPLE_OPTIONS.map((sample) => (
              <Button
                key={sample.label}
                size="small"
                type="link"
                style={{ padding: '0 4px' }}
                onClick={() => {
                  setTextA(sample.a);
                  setTextB(sample.b);
                }}
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
        <Card
          title={
            <Space>
              文本 A
              <Tag>{textA.length} 字符</Tag>
            </Space>
          }
          className={styles.card}
        >
          <Input.TextArea
            className={styles.code}
            value={textA}
            onChange={(event) => setTextA(event.target.value)}
            placeholder="输入第一段文本"
            autoSize={{ minRows: 10, maxRows: 22 }}
          />
        </Card>

        <Card
          title={
            <Space>
              文本 B
              <Tag>{textB.length} 字符</Tag>
            </Space>
          }
          className={styles.card}
        >
          <Input.TextArea
            className={styles.code}
            value={textB}
            onChange={(event) => setTextB(event.target.value)}
            placeholder="输入第二段文本"
            autoSize={{ minRows: 10, maxRows: 22 }}
          />
        </Card>
      </div>

      <Card title="相似度指标" className={styles.resultCard}>
        {error ? (
          <Alert type="error" showIcon message="无法计算" description={error} />
        ) : result ? (
          <div className={styles.metrics}>
            <MetricRow
              label="Levenshtein 相似度"
              value={`${percent(result.levenshteinRatio)}（编辑距离 ${result.levenshtein}）`}
              ratio={result.levenshteinRatio}
            />
            <MetricRow
              label="LCS 相似度（2·LCS / (|A|+|B|)）"
              value={`${percent(result.lcsRatio)}（LCS 长度 ${result.lcs}）`}
              ratio={result.lcsRatio}
            />
            <MetricRow
              label="Jaro-Winkler 相似度"
              value={percent(result.jaroWinkler)}
              ratio={result.jaroWinkler}
            />
            <MetricRow
              label="Sørensen–Dice 双字组系数"
              value={percent(result.dice)}
              ratio={result.dice}
            />
            {showAlignment ? (
              <div className={styles.alignment}>
                <div className={styles.stepHeading}>编辑对齐（从 A 变换到 B）</div>
                <div className={styles.legend}>
                  <span className={`${styles.chip} ${styles.equal}`}>相同</span>
                  <span className={`${styles.chip} ${styles.replace}`}>替换</span>
                  <span className={`${styles.chip} ${styles.delete}`}>删除</span>
                  <span className={`${styles.chip} ${styles.insert}`}>插入</span>
                </div>
                <div className={styles.chips}>
                  {result.alignment.map((op, index) => (
                    <AlignCell key={index} op={op} />
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          <p className={styles.meta}>请输入两段文本后开始计算。</p>
        )}
      </Card>
    </div>
  );
};

export default TextSimilarity;
