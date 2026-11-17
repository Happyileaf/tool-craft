'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Button, Card, Descriptions, Input, Select, Space, Table, Tabs, Tag, message } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import { copyToClipboard } from '@/lib/utils';
import {
  GS1_TYPES,
  explainSs1ExtensionDigit,
  processGs1Batch,
  processGs1Code,
  type Gs1Kind,
} from './utils/gs1';
import { DEFAULT_BATCH_TEXT, KIND_OPTIONS } from './constants';
import styles from './index.module.css';

/** 单条计算：类型选择 + 编码输入，补全或核对校验位并展示 AI 包装 */
const SinglePanel: React.FC = () => {
  const [kind, setKind] = React.useState<Gs1Kind>('SSCC');
  const [value, setValue] = React.useState('00123456000000001');
  const result = React.useMemo(() => processGs1Code(kind, value), [kind, value]);
  const spec = GS1_TYPES[kind];
  const extensionHint = kind === 'SSCC' ? explainSs1ExtensionDigit(result.normalized || value) : null;

  const handleCopy = async (text: string, label: string) => {
    await copyToClipboard(text);
    message.success(`${label}已复制`);
  };

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <Space size="large" wrap style={{ display: 'flex' }}>
        <Select
          value={kind}
          onChange={setKind}
          options={KIND_OPTIONS.map((option) => ({ label: option.label, value: option.value }))}
          style={{ minWidth: 320 }}
        />
        <Input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder={`输入 ${spec.bodyLength} 位补全或 ${spec.fullLength} 位核对`}
          spellCheck={false}
          className={styles.mono}
          style={{ width: 320 }}
        />
      </Space>

      {result.errors.map((error) => (
        <Alert key={error} type="error" showIcon message={error} />
      ))}
      {result.errors.length === 0 && result.valid === false && (
        <Alert type="error" showIcon message="完整编码校验未通过" />
      )}
      {result.errors.length === 0 && result.valid === true && (
        <Alert type="success" showIcon message={`${spec.label}校验通过，末位校验位 ${result.checkDigit} 正确`} />
      )}
      {result.errors.length === 0 && result.valid === null && (
        <Alert type="info" showIcon message={`已按 GS1 Mod 10 补全校验位 ${result.checkDigit}`} />
      )}
      {extensionHint && <Alert type="warning" showIcon message={extensionHint} />}

      {result.errors.length === 0 && (
        <Card size="small" title="计算结果">
          <Descriptions column={1} size="small" bordered>
            <Descriptions.Item label="完整编码（含校验位）">
              <Space>
                <span className={styles.codeOutput}>
                  {result.normalized.slice(0, -1)}
                  <span className={styles.checkDigit}>{result.checkDigit}</span>
                </span>
                <Button size="small" icon={<CopyOutlined />} onClick={() => handleCopy(result.normalized, '完整编码')}>
                  复制
                </Button>
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label="校验位">
              <Tag color="blue">{result.checkDigit}</Tag>
            </Descriptions.Item>
            {spec.ai && (
              <>
                <Descriptions.Item label="GS1-128 数据载体（AI 前缀）">
                  <Space>
                    <span className={styles.mono}>{result.aiForm}</span>
                    <Button size="small" icon={<CopyOutlined />} onClick={() => handleCopy(result.aiForm, 'AI 形式')}>
                      复制
                    </Button>
                  </Space>
                </Descriptions.Item>
                <Descriptions.Item label="人类可读形式">
                  <span className={styles.mono}>{result.humanReadable}</span>
                </Descriptions.Item>
              </>
            )}
          </Descriptions>
        </Card>
      )}
    </Space>
  );
};

/** 批量模式：每行「类型,编码」，表格逐行展示结果 */
const BatchPanel: React.FC = () => {
  const [raw, setRaw] = React.useState(DEFAULT_BATCH_TEXT);
  const batch = React.useMemo(() => processGs1Batch(raw, 'GTIN13'), [raw]);

  const columns = [
    { title: '行号', dataIndex: 'line', width: 70 },
    { title: '类型', dataIndex: 'kind', width: 100 },
    {
      title: '输入',
      dataIndex: 'rawInput',
      render: (text: string) => <span className={styles.mono}>{text}</span>,
    },
    {
      title: '结果',
      width: 100,
      render: (_: unknown, row: (typeof batch.rows)[number]) =>
        row.errors.length === 0 ? (
          <Tag color="success">{row.valid === null ? '已补全' : '校验通过'}</Tag>
        ) : (
          <Tag color="error">失败</Tag>
        ),
    },
    {
      title: '完整编码 / AI 形式',
      render: (_: unknown, row: (typeof batch.rows)[number]) =>
        row.errors.length === 0 ? (
          <span className={styles.mono}>{row.humanReadable}</span>
        ) : (
          <span style={{ color: '#cf1322' }}>{row.errors.join('；')}</span>
        ),
    },
  ];

  const handleCopyAll = async () => {
    const text = batch.rows.filter((row) => row.errors.length === 0).map((row) => row.aiForm).join('\n');
    await copyToClipboard(text);
    message.success(`已复制 ${batch.okCount} 条结果`);
  };

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <Alert
        type="info"
        showIcon
        message="每行格式：类型,编码（类型可取 SSCC / GTIN14 / GTIN13 / GTIN12 / GTIN8）；无类型前缀时按 GTIN-13 处理"
      />
      <Input.TextArea
        value={raw}
        onChange={(event) => setRaw(event.target.value)}
        autoSize={{ minRows: 5, maxRows: 12 }}
        spellCheck={false}
        className={styles.mono}
      />
      <Space>
        <Tag color="blue">总计 {batch.total}</Tag>
        <Tag color="success">成功 {batch.okCount}</Tag>
        <Tag color="error">失败 {batch.failCount}</Tag>
        <Button size="small" icon={<CopyOutlined />} onClick={handleCopyAll} disabled={batch.okCount === 0}>
          复制全部 AI 形式
        </Button>
      </Space>
      <Table size="small" rowKey={(row) => `${row.line}`} columns={columns} dataSource={batch.rows} pagination={false} />
    </Space>
  );
};

/**
 * GS1 SSCC / GTIN 校验位计算器：本地完成 Mod 10 加权校验位补全与核对，
 * 覆盖 SSCC(AI 00)、GTIN-14(AI 01) 与 GTIN-13/12/8，并输出 GS1-128 包装。
 *
 * @param _props - 工具组件属性（本工具使用内置样例）
 * @returns 工具交互界面
 */
const Gs1ChecksumCalculator: React.FC<ToolComponentProps> = (_props) => (
  <div className={styles.container}>
    <Card className={styles.card}>
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <Tag color="blue">纯浏览器本地计算，依据 GS1 General Specifications Mod 10 算法，编码不上传</Tag>
        <Tabs
          items={[
            { key: 'single', label: '单条计算', children: <SinglePanel /> },
            { key: 'batch', label: '批量处理', children: <BatchPanel /> },
          ]}
        />
      </Space>
    </Card>
  </div>
);

export default Gs1ChecksumCalculator;
