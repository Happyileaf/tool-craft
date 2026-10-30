'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Button, Card, Input, Radio, Tag, message } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import { numberToChinese, type ChineseVariant } from './utils/chinese';
import { parseChineseNumber } from './utils/parse-chinese';
import {
  CHINESE_SAMPLES,
  DEFAULT_CHINESE_INPUT,
  DEFAULT_NUMBER_INPUT,
  NUMBER_SAMPLES,
  VARIANT_OPTIONS,
} from './constants';
import { copyToClipboard } from '@/lib/utils';
import styles from './index.module.css';

type Direction = 'toChinese' | 'toNumber';

interface ConvertOutput {
  text: string;
  error: string | null;
  notes: string[];
}

const ChineseNumberConverter: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [direction, setDirection] = React.useState<Direction>('toChinese');
  const [variant, setVariant] = React.useState<ChineseVariant>('simple');
  const [numberInput, setNumberInput] = React.useState(
    defaultInput || DEFAULT_NUMBER_INPUT,
  );
  const [chineseInput, setChineseInput] = React.useState(DEFAULT_CHINESE_INPUT);

  const output: ConvertOutput = React.useMemo(() => {
    try {
      if (direction === 'toChinese') {
        return {
          text: numberToChinese(numberInput, { variant }),
          error: null,
          notes: [],
        };
      }
      const parsed = parseChineseNumber(chineseInput, { mode: 'auto' });
      return { text: parsed.value, error: null, notes: parsed.notes };
    } catch (e) {
      return { text: '', error: (e as Error).message, notes: [] };
    }
  }, [direction, variant, numberInput, chineseInput]);

  const handleCopy = () => {
    if (output.error || output.text === '') {
      message.error('暂无可复制的结果');
      return;
    }
    copyToClipboard(output.text);
    message.success('已复制转换结果');
  };

  const handleSwap = () => {
    if (output.error || output.text === '') {
      message.error('当前结果无效，无法填入反向输入');
      return;
    }
    if (direction === 'toChinese') {
      setChineseInput(output.text);
      setDirection('toNumber');
    } else {
      setNumberInput(output.text);
      setDirection('toChinese');
    }
  };

  const activeVariant = VARIANT_OPTIONS.find((option) => option.value === variant);

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        <Radio.Group
          optionType="button"
          buttonStyle="solid"
          value={direction}
          options={[
            { value: 'toChinese', label: '数字 → 中文' },
            { value: 'toNumber', label: '中文 → 数字' },
          ]}
          onChange={(e) => setDirection(e.target.value as Direction)}
        />
        {direction === 'toChinese' ? (
          <Radio.Group
            optionType="button"
            value={variant}
            options={VARIANT_OPTIONS.map((option) => ({
              value: option.value,
              label: option.label,
            }))}
            onChange={(e) => setVariant(e.target.value as ChineseVariant)}
          />
        ) : (
          <Tag color="blue">自动识别小写 / 大写 / 金额用字</Tag>
        )}
        <Button size="small" onClick={handleSwap}>
          结果填入反向
        </Button>
      </div>

      <div className={styles.panels}>
        <Card className={styles.card} title={direction === 'toChinese' ? '数字输入' : '中文输入'}>
          {direction === 'toChinese' ? (
            <>
              <Input
                value={numberInput}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setNumberInput(e.target.value)
                }
                spellCheck={false}
                className={styles.editor}
                placeholder="输入阿拉伯数字，如 12345、-3.14、1,234.56"
              />
              <div className={styles.samples}>
                {NUMBER_SAMPLES.map((sample) => (
                  <Button key={sample} size="small" onClick={() => setNumberInput(sample)}>
                    {sample}
                  </Button>
                ))}
              </div>
            </>
          ) : (
            <>
              <Input.TextArea
                value={chineseInput}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setChineseInput(e.target.value)
                }
                spellCheck={false}
                className={styles.editor}
                autoSize={{ minRows: 4, maxRows: 10 }}
                placeholder="输入中文数字，如「一万二千三百四十五」「壹佰贰拾叁元肆角伍分」"
              />
              <div className={styles.samples}>
                {CHINESE_SAMPLES.map((sample) => (
                  <Button
                    key={sample}
                    size="small"
                    onClick={() => setChineseInput(sample)}
                  >
                    {sample}
                  </Button>
                ))}
              </div>
            </>
          )}
        </Card>

        <Card
          className={styles.card}
          title="转换结果"
          extra={
            <Button size="small" icon={<CopyOutlined />} onClick={handleCopy}>
              复制
            </Button>
          }
        >
          {output.error ? (
            <Alert type="error" showIcon message={output.error} />
          ) : (
            <div className={styles.result}>{output.text}</div>
          )}
          {output.notes.map((note) => (
            <Alert
              key={note}
              type="warning"
              showIcon
              className={styles.noteItem}
              message={note}
            />
          ))}
        </Card>
      </div>

      <p className={styles.hint}>
        {direction === 'toChinese'
          ? activeVariant?.hint
          : '支持小写与财务大写字形混用、万 / 亿 / 万亿节、负数与「点 / 角 / 分」小数；范围为 16 位整数（千万亿）以内，纯浏览器本地运算。'}
      </p>
    </div>
  );
};

export default ChineseNumberConverter;
