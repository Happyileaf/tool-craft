'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Button, Card, Input, Radio, Table, Tag, message } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import { processIsin, processIsinLines } from './utils/isin';
import { DEFAULT_DETAIL_ISIN, DEFAULT_INPUT, MODE_OPTIONS } from './constants';
import { copyToClipboard } from '@/lib/utils';
import styles from './index.module.css';

const IsinValidator: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [mode, setMode] = React.useState<'validate' | 'generate'>('validate');
  const [input, setInput] = React.useState(defaultInput || DEFAULT_INPUT);
  const [detailInput, setDetailInput] = React.useState(DEFAULT_DETAIL_ISIN);

  const result = React.useMemo(() => processIsinLines(input, mode), [input, mode]);
  const detail = React.useMemo(() => {
    const single = processIsin(detailInput, 'validate');
    // 详情面板无论校验模式如何都展示展开过程
    return single;
  }, [detailInput]);

  const handleCopy = () => {
    if (result.output.trim() === '') {
      message.error('暂无可复制的结果');
      return;
    }
    copyToClipboard(result.output);
    message.success('已复制处理结果');
  };

  const activeMode = MODE_OPTIONS.find((option) => option.value === mode);

  const detailRows = detail.steps.map((step, index) => ({
    key: index,
    position: index + 1,
    char: step.char,
    expanded: step.expanded,
    note: index < 2 ? '国家/地区码' : index < 11 ? '主体' : '校验位',
  }));

  return (
    <div className={styles.container}>
      <div className={styles.panels}>
        <Card
          className={styles.card}
          title="输入"
          extra={
            <Radio.Group
              size="small"
              optionType="button"
              buttonStyle="solid"
              value={mode}
              options={MODE_OPTIONS.map((option) => ({
                value: option.value,
                label: option.label,
              }))}
              onChange={(e) => setMode(e.target.value)}
            />
          }
        >
          <Input.TextArea
            value={input}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInput(e.target.value)}
            spellCheck={false}
            className={styles.editor}
            autoSize={{ minRows: 10, maxRows: 18 }}
            placeholder="每行一个 ISIN（如 US0378331005），容忍空格与连字符，自动转大写…"
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
            autoSize={{ minRows: 10, maxRows: 18 }}
          />
          {result.warnings.length > 0 ? (
            <div className={styles.warnings}>
              {result.warnings.slice(0, 6).map((warning, index) => (
                <Alert
                  key={`${index}-${warning}`}
                  type="warning"
                  showIcon
                  className={styles.warningItem}
                  message={warning}
                />
              ))}
              {result.warnings.length > 6 ? (
                <span className={styles.hint}>另有 {result.warnings.length - 6} 条告警未展开</span>
              ) : null}
            </div>
          ) : null}
        </Card>
      </div>

      <Card className={styles.card} title="展开与加权过程（Luhn mod 10）">
        <div className={styles.controls}>
          <Input
            value={detailInput}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDetailInput(e.target.value)}
            spellCheck={false}
            placeholder="输入单个 ISIN 查看逐位展开，如 US0378331005"
          />
          {detail.error && detail.expectedCheck === null ? (
            <Alert type="error" showIcon message={detail.error} />
          ) : (
            <>
              <div className={styles.detailSummary}>
                <Tag color={detail.valid ? 'green' : 'red'}>
                  {detail.valid ? '校验通过' : '校验失败'}
                </Tag>
                <span>
                  给定校验位：<b>{detail.givenCheck ?? '—'}</b>
                </span>
                <span>
                  正确校验位：<b>{detail.expectedCheck ?? '—'}</b>
                </span>
                <span>
                  加权和：<b>{detail.weightedSum ?? '—'}</b>
                  {detail.weightedSum !== null
                    ? `（mod 10 = ${detail.weightedSum % 10}，补数 ${detail.expectedCheck}）`
                    : ''}
                </span>
                <span className={styles.hint}>字母 A=10 … Z=35 展开为两位数字后从右起交替 ×2</span>
              </div>
              <Table
                size="small"
                pagination={false}
                dataSource={detailRows}
                columns={[
                  { title: '位序', dataIndex: 'position', width: 64 },
                  { title: '字符', dataIndex: 'char', width: 80 },
                  { title: '展开数字', dataIndex: 'expanded', width: 100 },
                  { title: '含义', dataIndex: 'note' },
                ]}
              />
              <Alert
                type="info"
                showIcon
                message={`展开数字串（主体 11 位）：${detail.expanded || '—'}`}
              />
              {detail.error ? <Alert type="warning" showIcon message={detail.error} /> : null}
            </>
          )}
        </div>
      </Card>

      <div className={styles.toolbar}>
        <div className={styles.stats}>
          <Tag color="green">合法 {result.validCount}</Tag>
          <Tag color={result.totalCount - result.validCount > 0 ? 'red' : 'default'}>
            非法 {result.totalCount - result.validCount}
          </Tag>
          <Tag color="blue">共 {result.totalCount} 条</Tag>
        </div>
        <span className={styles.hint}>{activeMode?.hint}</span>
      </div>
    </div>
  );
};

export default IsinValidator;
