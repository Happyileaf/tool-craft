'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Button, Card, Input, Radio, Space, Tag, message } from 'antd';
import { CopyOutlined, SwapOutlined } from '@ant-design/icons';
import { convertLines, type BatchResult, type ExcelDirection } from './utils/excel-column';
import { DIRECTION_OPTIONS, DEFAULT_INPUT, RANGE_HINT } from './constants';
import { copyToClipboard } from '@/lib/utils';
import styles from './index.module.css';

const ExcelColumnConverter: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [direction, setDirection] = React.useState<ExcelDirection>('toNumber');
  const [input, setInput] = React.useState(defaultInput || DEFAULT_INPUT);

  const result: BatchResult = React.useMemo(
    () => convertLines(input, direction),
    [input, direction],
  );

  const handleSwap = () => {
    if (result.warnings.length > 0) {
      message.error('存在无法转换的行，请先修正后再交换');
      return;
    }
    setDirection(direction === 'toNumber' ? 'toColumn' : 'toNumber');
    setInput(result.output);
  };

  const handleCopy = () => {
    if (result.output === '') {
      message.error('暂无可复制的结果');
      return;
    }
    copyToClipboard(result.output);
    message.success('已复制转换结果');
  };

  const inputPlaceholder =
    direction === 'toNumber'
      ? '每行一个字母列名，如 A、Z、AA、XFD…'
      : '每行一个列序号，如 1、26、27、16384…';

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
              value={direction}
              options={DIRECTION_OPTIONS.map((option) => ({
                value: option.value,
                label: option.label,
              }))}
              onChange={(e) => setDirection(e.target.value as ExcelDirection)}
            />
          }
        >
          <Input.TextArea
            value={input}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInput(e.target.value)}
            spellCheck={false}
            className={styles.editor}
            autoSize={{ minRows: 12, maxRows: 22 }}
            placeholder={inputPlaceholder}
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
            autoSize={{ minRows: 12, maxRows: 22 }}
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

      <div className={styles.toolbar}>
        <Button icon={<SwapOutlined />} onClick={handleSwap}>
          交换输入 / 输出方向
        </Button>
        <Space>
          <Tag color="blue">
            {DIRECTION_OPTIONS.find((option) => option.value === direction)?.label}
          </Tag>
          <span className={styles.hint}>{RANGE_HINT}，非法行将逐行标注错误</span>
        </Space>
      </div>
    </div>
  );
};

export default ExcelColumnConverter;
