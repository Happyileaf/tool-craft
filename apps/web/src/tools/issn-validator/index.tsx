'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Card, Empty, Input, Segmented, Space, Statistic, Table, Tag } from 'antd';
import { completeIssn, validateBatch, validateIssn } from './utils/issn';
import { DEFAULT_BATCH, DEFAULT_SINGLE, HINT } from './constants';
import styles from './index.module.css';

type Mode = 'validate' | 'complete' | 'batch';

const IssnValidator: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [mode, setMode] = React.useState<Mode>('validate');
  const [single, setSingle] = React.useState(defaultInput || DEFAULT_SINGLE);
  const [batchText, setBatchText] = React.useState(DEFAULT_BATCH);

  const singleResult = React.useMemo(
    () => (mode === 'complete' ? completeIssn(single) : validateIssn(single)),
    [mode, single],
  );
  const batchResult = React.useMemo(() => validateBatch(batchText), [batchText]);

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        <Tag color="purple">ISO 3297</Tag>
        <Segmented
          options={[
            { label: '单条校验', value: 'validate' },
            { label: '补全校验位', value: 'complete' },
            { label: '批量校验', value: 'batch' },
          ]}
          value={mode}
          onChange={(v) => setMode(v as Mode)}
        />
      </div>

      {mode !== 'batch' ? (
        <>
          <Card className={styles.card} title={mode === 'complete' ? '输入 7 位前缀' : '输入完整 8 位 ISSN'}>
            <Input
              className={styles.mono}
              size="large"
              value={single}
              onChange={(e) => setSingle(e.target.value)}
              placeholder={mode === 'complete' ? '如 0378595' : '如 0378-5955'}
            />
            <p className={styles.hint} style={{ marginTop: 8 }}>{HINT}</p>
          </Card>

          {single.trim() === '' ? (
            <Empty description="请输入号码" />
          ) : singleResult.ok ? (
            <Alert
              type="success"
              showIcon
              message={mode === 'complete' ? '补全成功' : '校验通过'}
              description={
                <Space direction="vertical" size={2}>
                  <span className={styles.mono} style={{ fontSize: 18, fontWeight: 600 }}>
                    {singleResult.normalized}
                  </span>
                  <span>校验位：{singleResult.checkDigit}</span>
                </Space>
              }
            />
          ) : (
            <Alert type="error" showIcon message="不合法" description={singleResult.error} />
          )}
        </>
      ) : (
        <>
          <Card className={styles.card} title="批量输入（每行一个 ISSN）">
            <Input.TextArea
              className={styles.textarea}
              rows={7}
              spellCheck={false}
              value={batchText}
              onChange={(e) => setBatchText(e.target.value)}
            />
          </Card>

          {batchResult.total === 0 ? (
            <Empty description="暂无数据" />
          ) : (
            <Card className={styles.card} title="批量结果">
              <Space size="large" wrap style={{ marginBottom: 12 }}>
                <Statistic title="总数" value={batchResult.total} />
                <Statistic title="合法" value={batchResult.valid} valueStyle={{ color: '#3f8600' }} />
                <Statistic title="非法" value={batchResult.invalid} valueStyle={{ color: '#cf1322' }} />
              </Space>
              <Table
                size="small"
                pagination={batchResult.rows.length > 20 ? { pageSize: 20 } : false}
                rowKey="index"
                dataSource={batchResult.rows}
                columns={[
                  { title: '行号', dataIndex: 'index', key: 'index', width: 70 },
                  { title: '原始输入', dataIndex: 'raw', key: 'raw', className: styles.mono },
                  {
                    title: '结果',
                    key: 'status',
                    width: 90,
                    render: (_, row) =>
                      row.ok ? <Tag color="success">合法</Tag> : <Tag color="error">非法</Tag>,
                  },
                  {
                    title: '标准格式 / 失败原因',
                    key: 'detail',
                    render: (_, row) =>
                      row.ok ? (
                        <span className={styles.mono}>{row.normalized}</span>
                      ) : (
                        <span>
                          {row.error}
                          {row.expectedCheckDigit ? `（期望校验位 ${row.expectedCheckDigit}）` : ''}
                        </span>
                      ),
                  },
                ]}
              />
            </Card>
          )}
        </>
      )}

      <Alert
        type="info"
        showIcon
        message="校验规则：前 7 位按权重 8→2 加权求和，r = 11 − (sum mod 11)；r=10 时校验位记为 X，r=11 时记为 0，标准格式在第 4 位后加连字符。"
      />
    </div>
  );
};

export default IssnValidator;
