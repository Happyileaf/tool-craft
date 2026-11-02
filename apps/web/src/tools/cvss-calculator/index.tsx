'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Button, Card, Input, Segmented, Space, Tag, message } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import {
  calculateCvss,
  parseVector,
  type CvssMetrics,
  type MetricCode,
} from './utils/cvss';
import {
  DEFAULT_METRICS,
  METRIC_META,
  SEVERITY_COLOR,
  SEVERITY_ZH,
} from './constants';
import { copyToClipboard } from '@/lib/utils';
import styles from './index.module.css';

const CvssCalculator: React.FC<ToolComponentProps> = () => {
  const [metrics, setMetrics] = React.useState<CvssMetrics>(DEFAULT_METRICS);
  const [vectorInput, setVectorInput] = React.useState('');
  const [parseError, setParseError] = React.useState('');

  const result = React.useMemo(() => calculateCvss(metrics), [metrics]);

  const handleMetricChange = (code: MetricCode, value: string) => {
    setMetrics((prev) => ({ ...prev, [code]: value }));
  };

  const handleCopy = () => {
    copyToClipboard(result.vector);
    message.success('向量字符串已复制');
  };

  const handleParse = () => {
    try {
      const parsed = parseVector(vectorInput);
      setMetrics(parsed);
      setParseError('');
      message.success('向量已解析并回填到指标表单');
    } catch (err) {
      setParseError(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.panels}>
        <Card className={styles.card} title="基础指标（CVSS v3.1 Base Metrics）">
          <div className={styles.metricGrid}>
            {METRIC_META.map((meta) => (
              <div key={meta.code} className={styles.metric}>
                <div className={styles.metricLabel}>{meta.zhName}</div>
                <Segmented
                  block
                  size="small"
                  value={metrics[meta.code]}
                  options={meta.options.map((option) => ({
                    value: option.value,
                    label: option.value,
                  }))}
                  onChange={(value) => handleMetricChange(meta.code, String(value))}
                />
              </div>
            ))}
          </div>
        </Card>

        <Card className={styles.card} title="评分结果">
          <div className={styles.scoreBlock}>
            <span className={styles.score}>{result.score.toFixed(1)}</span>
            <Tag color={SEVERITY_COLOR[result.severity]}>
              {SEVERITY_ZH[result.severity]} / {result.severity}
            </Tag>
          </div>
          <div className={styles.subScoreRow}>
            <span className={styles.hint}>可利用性 Exploitability</span>
            <span>{result.exploitability.toFixed(1)}</span>
          </div>
          <div className={styles.subScoreRow}>
            <span className={styles.hint}>影响分 Impact (ISC)</span>
            <span>{result.impact.toFixed(1)}</span>
          </div>
          <div className={styles.divider} />
          <Space direction="vertical" size={8} style={{ width: '100%' }}>
            <Input.TextArea
              value={result.vector}
              readOnly
              spellCheck={false}
              className={styles.editor}
              autoSize={{ minRows: 2, maxRows: 4 }}
            />
            <Button icon={<CopyOutlined />} onClick={handleCopy}>
              复制向量字符串
            </Button>
          </Space>
        </Card>
      </div>

      <Card className={styles.card} title="反向解析：粘贴已有向量回填指标">
        <Space direction="vertical" size={8} style={{ width: '100%' }}>
          <Input.TextArea
            value={vectorInput}
            onChange={(e) => setVectorInput(e.target.value)}
            spellCheck={false}
            className={styles.editor}
            autoSize={{ minRows: 2, maxRows: 4 }}
            placeholder="CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H"
          />
          <Button type="primary" onClick={handleParse}>
            解析向量
          </Button>
          {parseError ? <Alert type="error" showIcon message={parseError} /> : null}
        </Space>
      </Card>
    </div>
  );
};

export default CvssCalculator;
