'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Button, Card, Checkbox, Input, InputNumber, Radio, Space, Tag, message } from 'antd';
import { CopyOutlined, SwapOutlined } from '@ant-design/icons';
import { convertLines, type SizeStandard } from './utils/file-size';
import { DIRECTION_OPTIONS, STANDARD_OPTIONS, DEFAULT_INPUT, type SizeDirection } from './constants';
import { copyToClipboard } from '@/lib/utils';
import styles from './index.module.css';

const FileSizeConverter: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [direction, setDirection] = React.useState<SizeDirection>('format');
  const [standard, setStandard] = React.useState<SizeStandard>('iec');
  const [fixedDecimals, setFixedDecimals] = React.useState(false);
  const [decimals, setDecimals] = React.useState(2);
  const [input, setInput] = React.useState(defaultInput || DEFAULT_INPUT);

  const result = React.useMemo(
    () =>
      convertLines(input, direction, {
        standard,
        decimals: fixedDecimals ? decimals : undefined,
      }),
    [input, direction, standard, fixedDecimals, decimals],
  );

  const handleSwap = () => {
    if (result.warnings.length > 0) {
      message.error('存在无法转换的行，请先修正后再交换');
      return;
    }
    setDirection(direction === 'format' ? 'parse' : 'format');
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

  const activeStandard = STANDARD_OPTIONS.find((option) => option.value === standard);
  const inputPlaceholder =
    direction === 'format'
      ? '每行一个字节数（非负整数）…'
      : '每行一个大小，如 1.5 MB、2048 KiB、3GB…';

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
              onChange={(e) => setDirection(e.target.value as SizeDirection)}
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
        {direction === 'format' ? (
          <>
            <Radio.Group
              size="small"
              optionType="button"
              buttonStyle="solid"
              value={standard}
              options={STANDARD_OPTIONS.map((option) => ({
                value: option.value,
                label: option.label,
              }))}
              onChange={(e) => setStandard(e.target.value as SizeStandard)}
            />
            <Checkbox checked={fixedDecimals} onChange={(e) => setFixedDecimals(e.target.checked)}>
              固定小数位
            </Checkbox>
            {fixedDecimals ? (
              <InputNumber
                size="small"
                min={0}
                max={6}
                value={decimals}
                onChange={(value) => setDecimals(value ?? 2)}
                addonAfter="位"
                className={styles.decimals}
              />
            ) : null}
          </>
        ) : (
          <Tag color="blue">解析自动识别 KiB（1024）与 KB（1000）单位</Tag>
        )}
        <Button icon={<SwapOutlined />} onClick={handleSwap}>
          交换输入 / 输出方向
        </Button>
        <Space>
          <Tag color="blue">
            {DIRECTION_OPTIONS.find((option) => option.value === direction)?.label}
          </Tag>
          <span className={styles.hint}>
            {direction === 'format'
              ? activeStandard?.hint
              : '容忍空白、大小写与千分位逗号；非法行逐行标注错误'}
          </span>
        </Space>
      </div>
    </div>
  );
};

export default FileSizeConverter;
