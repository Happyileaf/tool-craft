'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Button, Card, Input, Space, Table, Tag, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { CopyOutlined } from '@ant-design/icons';
import { processLines, type WeightStep } from './utils/iso6346';
import { DEFAULT_INPUT, HINT } from './constants';
import { copyToClipboard } from '@/lib/utils';
import styles from './index.module.css';

const ContainerCodeChecksum: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [input, setInput] = React.useState(defaultInput || DEFAULT_INPUT);

  const result = React.useMemo(() => processLines(input), [input]);

  const handleCopy = () => {
    if (result.output === '') {
      message.error('暂无可复制的结果');
      return;
    }
    copyToClipboard(result.output);
    message.success('已复制处理结果');
  };

  const columns: ColumnsType<WeightStep> = [
    { title: '位序', dataIndex: 'position', key: 'position', width: 64 },
    { title: '字符', dataIndex: 'char', key: 'char', width: 72, render: (v) => <strong>{v}</strong> },
    { title: '映射值', dataIndex: 'value', key: 'value', width: 88 },
    {
      title: '权重',
      dataIndex: 'weight',
      key: 'weight',
      width: 96,
      render: (v) => `2^${Math.log2(v)} = ${v}`,
    },
    { title: '乘积', dataIndex: 'contribution', key: 'contribution' },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.panels}>
        <Card className={styles.card} title="输入">
          <Input.TextArea
            value={input}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInput(e.target.value)}
            spellCheck={false}
            className={styles.editor}
            autoSize={{ minRows: 10, maxRows: 20 }}
            placeholder="每行一个集装箱箱号（10 位补全 / 11 位校验，空格与连字符会被忽略）…"
          />
        </Card>

        <Card
          className={styles.card}
          title="输出"
          extra={
            <Button size="small" icon={<CopyOutlined />} onClick={handleCopy}>
              复制
            </Button>
          }
        >
          <Input.TextArea
            value={result.output}
            readOnly
            spellCheck={false}
            className={styles.editor}
            autoSize={{ minRows: 10, maxRows: 20 }}
          />
          {result.warnings.length > 0 ? (
            <div className={styles.warnings}>
              {result.warnings.map((warning, index) => (
                <Alert
                  key={`${index}-${warning}`}
                  type="warning"
                  showIcon
                  className={styles.warningItem}
                  message={warning}
                />
              ))}
            </div>
          ) : null}
        </Card>
      </div>

      {result.detail ? (
        <Card
          className={styles.card}
          size="small"
          title={`加权计算过程${result.detailLine !== null ? `（第 ${result.detailLine} 行）` : ''}`}
        >
          <Table<WeightStep>
            columns={columns}
            dataSource={result.detail.steps}
            rowKey="position"
            size="small"
            pagination={false}
            scroll={{ x: 420 }}
          />
          <div className={styles.summary}>
            <Space size={[8, 8]} wrap>
              <Tag color="blue">加权总和：{result.detail.sum}</Tag>
              <Tag color="geekblue">{result.detail.sum} mod 11 = {result.detail.checkDigit}</Tag>
              <Tag color={result.detail.valid ? 'green' : 'red'}>
                {result.detail.givenDigit === null
                  ? `校验位：${result.detail.checkDigit}`
                  : result.detail.valid
                    ? `校验通过（末位 ${result.detail.givenDigit}）`
                    : `校验失败：给定 ${result.detail.givenDigit}，应为 ${result.detail.checkDigit}`}
              </Tag>
            </Space>
          </div>
          {result.detail.notices.map((notice) => (
            <div key={notice} className={styles.notice}>
              {notice}
            </div>
          ))}
        </Card>
      ) : null}

      <div className={styles.toolbar}>
        <Tag color="blue">ISO 6346 / BIC Code</Tag>
        <Space>
          <span className={styles.hint}>{HINT}</span>
        </Space>
      </div>
    </div>
  );
};

export default ContainerCodeChecksum;
