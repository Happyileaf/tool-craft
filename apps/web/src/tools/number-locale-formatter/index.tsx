'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Card, Checkbox, Input, InputNumber, Radio, Select } from 'antd';
import {
  COMMON_CURRENCIES,
  DEFAULT_NUMBER,
  DEFAULT_SELECTED_LOCALES,
  LOCALE_OPTIONS,
  NotationEnum,
  NOTATION_LABELS,
  NumberFormatModeEnum,
  NUMBER_FORMAT_MODE_LABELS,
} from './constants';
import {
  formatNumberAcrossLocales,
  parseNumberInput,
  type LocaleFormatResult,
} from './utils/formatter';
import styles from './index.module.css';

/**
 * 数字千分位与货币格式化：把同一数值按多个区域设置渲染成本地化排版，
 * 支持数字 / 货币 / 百分比模式、紧凑记法、小数位、分组与负数括号，
 * 全部基于浏览器原生 Intl.NumberFormat 在本地实时完成
 *
 * @returns 数字区域化格式化交互界面
 */
const NumberLocaleFormatter: React.FC<ToolComponentProps> = () => {
  const [rawValue, setRawValue] = React.useState(DEFAULT_NUMBER);
  const [mode, setMode] = React.useState<NumberFormatModeEnum>(NumberFormatModeEnum.DECIMAL);
  const [currency, setCurrency] = React.useState<string>('CNY');
  const [notation, setNotation] = React.useState<NotationEnum>(NotationEnum.STANDARD);
  const [useGrouping, setUseGrouping] = React.useState(true);
  const [negativeParentheses, setNegativeParentheses] = React.useState(false);
  const [fixedFractions, setFixedFractions] = React.useState(false);
  const [fractionDigits, setFractionDigits] = React.useState<number>(2);
  const [selectedLocales, setSelectedLocales] = React.useState<string[]>([
    ...DEFAULT_SELECTED_LOCALES,
  ]);

  const output = React.useMemo<
    | { valid: false; reason: 'empty' | 'invalid' }
    | { valid: true; results: LocaleFormatResult[] }
  >(() => {
    const parsed = parseNumberInput(rawValue);
    if (parsed === 'empty' || parsed === 'invalid') {
      return { valid: false, reason: parsed };
    }
    if (selectedLocales.length === 0) {
      return { valid: true, results: [] };
    }
    const results = formatNumberAcrossLocales(parsed, selectedLocales, {
      mode,
      currency,
      notation,
      useGrouping,
      negativeParentheses,
      minimumFractionDigits: fixedFractions ? fractionDigits : undefined,
      maximumFractionDigits: fixedFractions ? fractionDigits : undefined,
    });
    return { valid: true, results };
  }, [
    rawValue,
    mode,
    currency,
    notation,
    useGrouping,
    negativeParentheses,
    fixedFractions,
    fractionDigits,
    selectedLocales,
  ]);

  return (
    <div className={styles.container}>
      <Card title="数字千分位与货币格式化">
        <Input
          value={rawValue}
          onChange={(event) => setRawValue(event.target.value)}
          addonBefore="数值"
          placeholder="输入数字，如 1234567.89"
          style={{ maxWidth: 320 }}
        />

        <div className={styles.row}>
          <Radio.Group
            value={mode}
            onChange={(event) => setMode(event.target.value as NumberFormatModeEnum)}
            optionType="button"
            buttonStyle="solid"
            options={[
              {
                label: NUMBER_FORMAT_MODE_LABELS[NumberFormatModeEnum.DECIMAL],
                value: NumberFormatModeEnum.DECIMAL,
              },
              {
                label: NUMBER_FORMAT_MODE_LABELS[NumberFormatModeEnum.CURRENCY],
                value: NumberFormatModeEnum.CURRENCY,
              },
              {
                label: NUMBER_FORMAT_MODE_LABELS[NumberFormatModeEnum.PERCENT],
                value: NumberFormatModeEnum.PERCENT,
              },
            ]}
          />
          {mode === NumberFormatModeEnum.CURRENCY ? (
            <Select
              value={currency}
              onChange={setCurrency}
              style={{ minWidth: 160 }}
              showSearch
              options={COMMON_CURRENCIES.map((item) => ({
                value: item.value,
                label: item.label,
              }))}
            />
          ) : null}
          <Radio.Group
            value={notation}
            onChange={(event) => setNotation(event.target.value as NotationEnum)}
            optionType="button"
            options={[
              {
                label: NOTATION_LABELS[NotationEnum.STANDARD],
                value: NotationEnum.STANDARD,
              },
              {
                label: NOTATION_LABELS[NotationEnum.COMPACT],
                value: NotationEnum.COMPACT,
              },
            ]}
          />
        </div>

        <div className={styles.row}>
          <Checkbox checked={useGrouping} onChange={(event) => setUseGrouping(event.target.checked)}>
            千分位分组
          </Checkbox>
          <Checkbox
            checked={negativeParentheses}
            onChange={(event) => setNegativeParentheses(event.target.checked)}
          >
            负数括号写法
          </Checkbox>
          <Checkbox
            checked={fixedFractions}
            onChange={(event) => setFixedFractions(event.target.checked)}
          >
            固定小数位
          </Checkbox>
          {fixedFractions ? (
            <InputNumber
              value={fractionDigits}
              onChange={(value) => setFractionDigits(value ?? 0)}
              min={0}
              max={20}
              addonBefore="位"
              style={{ width: 110 }}
            />
          ) : null}
        </div>

        <div className={styles.row}>
          <span className={styles.label}>对比区域</span>
          <Select
            mode="multiple"
            value={selectedLocales}
            onChange={setSelectedLocales}
            style={{ minWidth: 320, maxWidth: 640, flex: 1 }}
            options={LOCALE_OPTIONS.map((item) => ({ value: item.value, label: item.label }))}
            placeholder="选择一个或多个区域设置"
          />
        </div>

        {!output.valid ? (
          <Alert
            style={{ marginTop: 16 }}
            type="info"
            showIcon
            message={output.reason === 'empty' ? '请输入数值' : '无法解析为数字'}
            description={
              output.reason === 'empty'
                ? '输入一个有限数字后即可查看各区域排版。'
                : '请输入合法数字（不要带千分位逗号），例如 -1234.5 或 1e6。'
            }
          />
        ) : output.results.length === 0 ? (
          <Alert
            style={{ marginTop: 16 }}
            type="info"
            showIcon
            message="请至少选择一个区域设置"
          />
        ) : (
          <div className={styles.resultList}>
            {output.results.map((result) => {
              const option = LOCALE_OPTIONS.find((item) => item.value === result.locale);
              return (
                <div key={result.locale} className={styles.resultLine}>
                  <span className={styles.localeName}>{option?.label ?? result.locale}</span>
                  <span className={styles.resultValue}>{result.text}</span>
                </div>
              );
            })}
            <span className={styles.subtle}>
              结果由当前浏览器内置的 Intl.NumberFormat（ICU）渲染，不同浏览器 / ICU 版本可能存在细微差异。
            </span>
          </div>
        )}
      </Card>
    </div>
  );
};

export default NumberLocaleFormatter;
