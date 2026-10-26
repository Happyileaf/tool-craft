'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Button, Card, Checkbox, Input, Radio, Space, Tag, message } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import { numberToWords, type NumberWordsMode } from './utils/numberWords';
import { DEFAULT_INPUT, MODE_HINTS, MODE_OPTIONS, MODE_PLACEHOLDERS } from './constants';
import { copyToClipboard } from '@/lib/utils';
import styles from './index.module.css';

/**
 * 数字英文读法转换器：将整数或金额数字转换为规范的英文基数词、序数词与美元支票读法，
 * 采用短级差（thousand / million / billion / trillion），支持负数、千分位逗号、
 * 小数逐位读法与 twenty-one 连字符开关。全部运算在浏览器本地完成。
 *
 * @param props - 工具组件属性
 * @param props.defaultInput - 可选默认输入
 * @returns 数字英文读法交互界面
 */
const NumberToWords: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [input, setInput] = React.useState<string>(defaultInput || DEFAULT_INPUT);
  const [mode, setMode] = React.useState<NumberWordsMode>('cardinal');
  const [hyphenate, setHyphenate] = React.useState<boolean>(true);

  const result = React.useMemo<{ words: string } | { error: string } | null>(() => {
    const trimmed = input.trim();
    if (!trimmed) {
      return null;
    }
    try {
      return numberToWords(trimmed, mode, { hyphenate });
    } catch (error) {
      return { error: error instanceof Error ? error.message : '无法转换该数字' };
    }
  }, [input, mode, hyphenate]);

  /**
   * 复制英文读法结果
   */
  const handleCopy = async () => {
    if (result === null || 'error' in result) {
      return;
    }
    await copyToClipboard(result.words);
    message.success('复制成功');
  };

  return (
    <div className={styles.container}>
      <Card className={styles.card} title="数字英文读法转换器（Number to Words）">
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Radio.Group
            optionType="button"
            buttonStyle="solid"
            value={mode}
            onChange={(event) => setMode(event.target.value as NumberWordsMode)}
            options={MODE_OPTIONS.map((option) => ({ label: option.label, value: option.value }))}
          />

          <Input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder={MODE_PLACEHOLDERS[mode]}
            spellCheck={false}
            className={styles.monoInput}
            size="large"
          />

          <Checkbox
            checked={hyphenate}
            onChange={(event) => setHyphenate(event.target.checked)}
          >
            复合词使用连字符（twenty-one；关闭则写作 twenty one）
          </Checkbox>

          {result === null && (
            <Alert type="info" showIcon message="输入数字后将显示规范英文读法" />
          )}

          {result !== null && 'error' in result && (
            <Alert type="error" showIcon message="无法转换" description={result.error} />
          )}

          {result !== null && !('error' in result) && (
            <>
              <Alert
                type="success"
                showIcon
                message={
                  <Space direction="vertical" size={4} style={{ width: '100%' }}>
                    <Tag color="blue" className={styles.modeTag}>
                      {MODE_OPTIONS.find((option) => option.value === mode)?.label}
                    </Tag>
                    <span className={styles.wordsOutput}>{result.words}</span>
                  </Space>
                }
              />
              <Button icon={<CopyOutlined />} onClick={handleCopy}>
                复制英文读法
              </Button>
            </>
          )}

          <div className={styles.hint}>
            {MODE_HINTS[mode]} 大数采用短级差（short scale）：每 3 位一组，依次为 thousand、million、billion、trillion，
            支持绝对值小于 10¹⁵ 的整数。所有转换均在浏览器本地完成，不上传任何内容。
          </div>
        </Space>
      </Card>
    </div>
  );
};

export default NumberToWords;
