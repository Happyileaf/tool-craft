'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Button, Card, Input, Radio, Space, Tag, message } from 'antd';
import { CopyOutlined, SwapOutlined } from '@ant-design/icons';
import {
  textToHex,
  hexToText,
  type HexResult,
  type HexCase,
  type HexSeparator,
  type HexOutputMode,
} from './utils/hex';
import {
  MODE_OPTIONS,
  CASE_OPTIONS,
  SEPARATOR_OPTIONS,
  DIRECTION_OPTIONS,
  DEFAULT_INPUT,
  type HexDirection,
} from './constants';
import { copyToClipboard } from '@/lib/utils';
import styles from './index.module.css';

const HexDumpViewer: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [direction, setDirection] = React.useState<HexDirection>('encode');
  const [hexCase, setHexCase] = React.useState<HexCase>('lower');
  const [separator, setSeparator] = React.useState<HexSeparator>('none');
  const [mode, setMode] = React.useState<HexOutputMode>('plain');
  const [input, setInput] = React.useState(defaultInput || DEFAULT_INPUT);

  const result: HexResult = React.useMemo(() => {
    if (direction === 'encode') {
      return textToHex(input, { hexCase, separator, mode });
    }
    return hexToText(input);
  }, [input, direction, hexCase, separator, mode]);

  const handleSwap = () => {
    if (result.error) {
      message.error('当前结果存在错误，无法交换为输入');
      return;
    }
    if (direction === 'encode' && mode === 'dump') {
      message.error('Hex dump 含偏移量与 ASCII 预览列，请先切换为 Hex 串模式再交换');
      return;
    }
    setDirection(direction === 'encode' ? 'decode' : 'encode');
    setInput(result.output);
  };

  const handleCopy = () => {
    if (result.error || result.output === '') {
      message.error('暂无可复制的结果');
      return;
    }
    copyToClipboard(result.output);
    message.success('已复制转换结果');
  };

  const activeMode = MODE_OPTIONS.find((option) => option.value === mode);
  const inputPlaceholder =
    direction === 'encode'
      ? '输入要编码为十六进制的文本（按 UTF-8 编码）…'
      : '粘贴十六进制内容，容忍空格 / 冒号 / 0x 前缀 / 换行…';

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
              onChange={(e) => setDirection(e.target.value as HexDirection)}
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
          {result.error ? (
            <Alert type="error" showIcon message="转换错误" description={result.error} />
          ) : (
            <Input.TextArea
              value={result.output}
              readOnly
              spellCheck={false}
              className={styles.editor}
              autoSize={{ minRows: 12, maxRows: 22 }}
            />
          )}
        </Card>
      </div>

      <div className={styles.toolbar}>
        {direction === 'encode' ? (
          <>
            <Radio.Group
              size="small"
              optionType="button"
              buttonStyle="solid"
              value={mode}
              options={MODE_OPTIONS.map((option) => ({
                value: option.value,
                label: option.label,
              }))}
              onChange={(e) => setMode(e.target.value as HexOutputMode)}
            />
            {mode === 'plain' ? (
              <>
                <Radio.Group
                  size="small"
                  optionType="button"
                  value={separator}
                  options={SEPARATOR_OPTIONS.map((option) => ({
                    value: option.value,
                    label: option.label,
                  }))}
                  onChange={(e) => setSeparator(e.target.value as HexSeparator)}
                />
                <Radio.Group
                  size="small"
                  optionType="button"
                  value={hexCase}
                  options={CASE_OPTIONS.map((option) => ({
                    value: option.value,
                    label: option.label,
                  }))}
                  onChange={(e) => setHexCase(e.target.value as HexCase)}
                />
              </>
            ) : null}
          </>
        ) : (
          <Tag color="blue">自动识别分隔符与 0x 前缀</Tag>
        )}
        <Button icon={<SwapOutlined />} onClick={handleSwap}>
          交换输入 / 输出方向
        </Button>
        <Space>
          <Tag color="blue">
            {DIRECTION_OPTIONS.find((option) => option.value === direction)?.label}
          </Tag>
          <span className={styles.hint}>
            {direction === 'encode'
              ? activeMode?.hint
              : '按 UTF-8 解码为文本，非法字节序列会报错'}
          </span>
        </Space>
      </div>
    </div>
  );
};

export default HexDumpViewer;
