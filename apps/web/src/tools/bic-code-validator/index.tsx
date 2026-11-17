'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Button, Card, Input, Space, Table, Tabs, Tag, message } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import { copyToClipboard } from '@/lib/utils';
import { SAMPLE_BICS, validateBic, validateBicBatch } from './utils/bic';
import { DEFAULT_BATCH_TEXT } from './constants';
import styles from './index.module.css';

/** 单条校验：输入即校验，展示四段结构与语义 */
const SinglePanel: React.FC = () => {
  const [value, setValue] = React.useState('DEUTDEFF500');
  const result = React.useMemo(() => validateBic(value), [value]);

  const segments = result.parsed
    ? [
        { label: '银行代码 Bank', value: result.parsed.bankCode },
        { label: '国家码 Country', value: result.parsed.countryCode },
        { label: '地区码 Location', value: result.parsed.locationCode },
        { label: '分行码 Branch', value: result.parsed.branchCode },
      ]
    : [];

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <Input
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="输入 8 位或 11 位 BIC，如 DEUTDEFF / DEUTDEFF500"
        spellCheck={false}
        className={styles.mono}
        size="large"
      />
      {result.valid ? (
        <Alert type="success" showIcon message={`${result.parsed!.normalized} 结构合法（ISO 9362）`} />
      ) : (
        value.trim() && <Alert type="error" showIcon message="BIC 结构不合法" description={result.errors.join('；')} />
      )}
      {result.warnings.map((warning) => (
        <Alert key={warning} type="warning" showIcon message={warning} />
      ))}
      {result.parsed && (
        <Card size="small" title="结构化解析">
          <div className={styles.structured}>
            {segments.map((segment) => (
              <div key={segment.label} className={styles.segment}>
                <div className={styles.segmentValue}>{segment.value}</div>
                <div className={styles.segmentLabel}>{segment.label}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 12 }}>
            <Tag color="geekblue">{result.parsed.hasBranch ? '11 位完整代码（含分行码）' : '8 位主代码（分行码视为 XXX）'}</Tag>
            <Tag>{result.parsed.locationSemantics}</Tag>
          </div>
        </Card>
      )}
      <Card size="small" title="公开示例（点击填充）">
        <Space wrap>
          {SAMPLE_BICS.map((sample) => (
            <Button key={sample.bic} size="small" onClick={() => setValue(sample.bic)}>
              <span className={styles.mono}>{sample.bic}</span>
              <span style={{ color: 'rgb(0 0 0 / 45%)', marginLeft: 6 }}>{sample.note}</span>
            </Button>
          ))}
        </Space>
      </Card>
    </Space>
  );
};

/** 批量校验：每行一个 BIC，表格逐行展示状态与解析字段 */
const BatchPanel: React.FC = () => {
  const [raw, setRaw] = React.useState(DEFAULT_BATCH_TEXT);
  const batch = React.useMemo(() => validateBicBatch(raw), [raw]);

  const columns = [
    { title: '行号', dataIndex: 'line', width: 70 },
    {
      title: '输入',
      dataIndex: 'input',
      render: (text: string) => <span className={styles.mono}>{text}</span>,
    },
    {
      title: '结果',
      dataIndex: 'valid',
      width: 100,
      render: (valid: boolean) => (valid ? <Tag color="success">合法</Tag> : <Tag color="error">非法</Tag>),
    },
    {
      title: '规范化 / 错误信息',
      render: (_: unknown, row: (typeof batch.rows)[number]) =>
        row.parsed ? (
          <span className={styles.mono}>
            {row.parsed.bankCode} {row.parsed.countryCode} {row.parsed.locationCode} {row.parsed.branchCode}
          </span>
        ) : (
          <span style={{ color: '#cf1322' }}>{row.errors.join('；')}</span>
        ),
    },
  ];

  const handleCopyValid = async () => {
    const text = batch.rows.filter((row) => row.valid).map((row) => row.parsed!.normalized).join('\n');
    await copyToClipboard(text);
    message.success(`已复制 ${batch.validCount} 条合法 BIC`);
  };

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <Input.TextArea
        value={raw}
        onChange={(event) => setRaw(event.target.value)}
        autoSize={{ minRows: 5, maxRows: 12 }}
        spellCheck={false}
        className={styles.mono}
        placeholder="每行一个 BIC 代码"
      />
      <Space>
        <Tag color="blue">总计 {batch.total}</Tag>
        <Tag color="success">合法 {batch.validCount}</Tag>
        <Tag color="error">非法 {batch.invalidCount}</Tag>
        <Button size="small" icon={<CopyOutlined />} onClick={handleCopyValid} disabled={batch.validCount === 0}>
          复制全部合法 BIC
        </Button>
      </Space>
      <Table size="small" rowKey={(row) => `${row.line}-${row.input}`} columns={columns} dataSource={batch.rows} pagination={false} />
    </Space>
  );
};

/**
 * ISO 9362 BIC / SWIFT 代码结构校验器：本地校验 8/11 位代码的银行码、
 * ISO 3166-1 alpha-2 国家码、地区码与分行码，解析结构并支持批量核对。
 *
 * @param _props - 工具组件属性（本工具使用内置样例）
 * @returns 工具交互界面
 */
const BicCodeValidator: React.FC<ToolComponentProps> = (_props) => (
  <div className={styles.container}>
    <Card className={styles.card}>
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <Tag color="blue">纯浏览器本地校验，代码不上传，依据 ISO 9362 结构规则（不联网查询机构名录）</Tag>
        <Tabs
          items={[
            { key: 'single', label: '单条校验', children: <SinglePanel /> },
            { key: 'batch', label: '批量校验', children: <BatchPanel /> },
          ]}
        />
      </Space>
    </Card>
  </div>
);

export default BicCodeValidator;
