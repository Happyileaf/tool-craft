'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Button, Card, Descriptions, Input, Radio, Space, Tag, message } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import {
  decimalToFraction,
  fractionToDecimal,
  fractionToPercent,
  parseFraction,
  percentToFraction,
} from './utils/rational';
import { DEFAULT_INPUTS, MODE_OPTIONS, MODE_PLACEHOLDERS, type ConvertMode } from './constants';
import { copyToClipboard } from '@/lib/utils';
import styles from './index.module.css';

interface ConvertResult {
  title: string;
  value: string;
  tags: { color: string; text: string }[];
  steps: string[];
}

/**
 * 小数、分数与百分数精确互转器：基于 BigInt 有理数运算，支持有限小数与循环小数（圆括号记法）
 * 与最简分数互转、分数与百分数互转、带分数与假分数互化，并展示约分过程。全部运算在浏览器本地完成。
 *
 * @param props - 工具组件属性
 * @param props.defaultInput - 可选默认输入，作为「小数 → 分数」模式初值
 * @returns 小数分数互转交互界面
 */
const DecimalFractionConverter: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [mode, setMode] = React.useState<ConvertMode>('decimalToFraction');
  const [inputs, setInputs] = React.useState<Record<ConvertMode, string>>({
    decimalToFraction: defaultInput || DEFAULT_INPUTS.decimalToFraction,
    fractionToDecimal: DEFAULT_INPUTS.fractionToDecimal,
    percentToFraction: DEFAULT_INPUTS.percentToFraction,
    fractionToPercent: DEFAULT_INPUTS.fractionToPercent,
    mixedFraction: DEFAULT_INPUTS.mixedFraction,
  });

  const raw = inputs[mode];

  const result = React.useMemo<ConvertResult | null>(() => {
    if (!raw.trim()) {
      return null;
    }
    if (mode === 'decimalToFraction') {
      const conversion = decimalToFraction(raw);
      const { fraction } = conversion;
      return {
        title: '最简分数',
        value: `${fraction.numerator.toString()}/${fraction.denominator.toString()}`,
        tags: conversion.mixed
          ? [{ color: 'blue', text: `带分数：${conversion.mixed}` }]
          : [{ color: 'green', text: '真分数或整数' }],
        steps: conversion.steps,
      };
    }
    if (mode === 'fractionToDecimal') {
      const fraction = parseFraction(raw);
      const expansion = fractionToDecimal(fraction);
      return {
        title: '小数展开',
        value: expansion.text,
        tags: expansion.isTerminating
          ? [{ color: 'green', text: '有限小数' }]
          : [
              { color: 'orange', text: '循环小数' },
              { color: 'blue', text: `循环节：(${expansion.repeating ?? ''})` },
            ],
        steps: [
          `长除法：每次余数乘 10 后除以分母，记录商；余数重复出现即进入循环。`,
          expansion.isTerminating
            ? '余数最终为 0，小数除尽，为有限小数。'
            : `余数在小数点后第 ${(expansion.nonRepeating.length || 0) + 1} 位起重复，循环节长度为 ${(expansion.repeating ?? '').length} 位。`,
        ],
      };
    }
    if (mode === 'percentToFraction') {
      const conversion = percentToFraction(raw);
      const { fraction } = conversion;
      return {
        title: '最简分数',
        value: `${fraction.numerator.toString()}/${fraction.denominator.toString()}`,
        tags: conversion.mixed
          ? [{ color: 'blue', text: `带分数：${conversion.mixed}` }]
          : [{ color: 'green', text: '真分数或整数' }],
        steps: conversion.steps,
      };
    }
    if (mode === 'fractionToPercent') {
      return {
        title: '百分数',
        value: fractionToPercent(raw),
        tags: [{ color: 'blue', text: '循环部分以圆括号表示' }],
        steps: ['分数 × 100% 后做长除法，除不尽时标出循环节。'],
      };
    }
    const isMixedInput = /^[+-]?\d+\s+\d+\s*\/\s*\d+$/.test(raw.trim());
    const fraction = parseFraction(raw);
    const absNumerator = fraction.numerator < BigInt(0) ? -fraction.numerator : fraction.numerator;
    const whole = absNumerator / fraction.denominator;
    const remainder = absNumerator % fraction.denominator;
    const signPrefix = fraction.numerator < BigInt(0) ? '-' : '';

    if (isMixedInput) {
      return {
        title: '假分数',
        value: `${fraction.numerator.toString()}/${fraction.denominator.toString()}`,
        tags: [{ color: 'blue', text: '带分数 → 假分数' }],
        steps: [
          `带分数化假分数：整数部分 × 分母 + 真分数部分的分子作为新分子，分母不变，得到 ${fraction.numerator.toString()}/${fraction.denominator.toString()}。`,
        ],
      };
    }
    if (fraction.denominator === BigInt(1)) {
      return {
        title: '该分数本身就是整数',
        value: fraction.numerator.toString(),
        tags: [{ color: 'default', text: '无需互化' }],
        steps: [`约分后分母为 1，值为整数 ${fraction.numerator.toString()}。`],
      };
    }
    if (whole === BigInt(0)) {
      return {
        title: '真分数（无需互化）',
        value: `${fraction.numerator.toString()}/${fraction.denominator.toString()}`,
        tags: [{ color: 'default', text: '分子小于分母，整数部分为 0' }],
        steps: [
          `${fraction.numerator.toString()} < ${fraction.denominator.toString()}，这是真分数，没有非零整数部分；对应带分数为 0 又 ${fraction.numerator.toString()}/${fraction.denominator.toString()}，通常不写。`,
        ],
      };
    }
    return {
      title: '带分数',
      value: `${signPrefix}${whole.toString()} 又 ${remainder.toString()}/${fraction.denominator.toString()}`,
      tags: [{ color: 'blue', text: '假分数 → 带分数' }],
      steps: [
        `假分数 ${fraction.numerator.toString()}/${fraction.denominator.toString()} 的整数部分为 ${whole.toString()}，余数为 ${remainder.toString()}，写作「整数 又 余数/分母」。`,
      ],
    };
  }, [raw, mode]);

  /**
   * 复制转换结果
   */
  const handleCopy = async () => {
    if (!result) {
      return;
    }
    await copyToClipboard(result.value);
    message.success('复制成功');
  };

  return (
    <div className={styles.container}>
      <Card className={styles.card} title="小数 · 分数 · 百分数精确互转">
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Radio.Group
            optionType="button"
            buttonStyle="solid"
            value={mode}
            onChange={(event) => setMode(event.target.value as ConvertMode)}
            options={MODE_OPTIONS.map((option) => ({ label: option.label, value: option.value }))}
          />
          <Input
            value={raw}
            onChange={(event) => setInputs((previous) => ({ ...previous, [mode]: event.target.value }))}
            placeholder={MODE_PLACEHOLDERS[mode]}
            spellCheck={false}
            className={styles.monoOutput}
          />

          {result ? (
            <>
              <Descriptions bordered column={1} size="small">
                <Descriptions.Item label={result.title}>
                  <Space size={12} wrap>
                    <span className={styles.resultValue}>{result.value}</span>
                    {result.tags.map((tag) => (
                      <Tag key={tag.text} color={tag.color}>
                        {tag.text}
                      </Tag>
                    ))}
                    <Button size="small" icon={<CopyOutlined />} onClick={handleCopy}>
                      复制结果
                    </Button>
                  </Space>
                </Descriptions.Item>
              </Descriptions>
              <Alert type="info" showIcon message="计算过程" description={
                <ul className={styles.stepsList}>
                  {result.steps.map((step, index) => (
                    <li key={index}>{step}</li>
                  ))}
                </ul>
              } />
            </>
          ) : (
            <Alert type="info" showIcon message="输入数值后将显示精确转换结果与计算过程" />
          )}

          <div className={styles.hint}>
            循环小数用圆括号标注循环节，如 0.(3) = 0.333…、0.1(6) = 0.1666…；分数支持 3/4、-5/2 与带分数写法
            「1 1/2」。所有运算基于 BigInt 有理数，避免浮点误差，全部在浏览器本地完成。
          </div>
        </Space>
      </Card>
    </div>
  );
};

export default DecimalFractionConverter;
