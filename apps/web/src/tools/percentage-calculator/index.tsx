'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Card, Input, Radio, Tag } from 'antd';
import {
  PercentageModeEnum,
  PERCENTAGE_MODE_LABELS,
  DEFAULT_BASE,
  DEFAULT_FROM,
  DEFAULT_PERCENT,
  DEFAULT_TO,
  DEFAULT_X,
  DEFAULT_Y,
} from './constants';
import {
  formatResult,
  parseNumeric,
  percentOf,
  percentageChange,
  percentageRatio,
} from './utils/percentage';
import styles from './index.module.css';

/**
 * 百分比计算器，提供「X 的 Y%」「X 是 Y 的百分之几」「X 较 Y 变化百分之几」
 * 三类常用百分比运算，输入实时联动，全部运算在浏览器本地完成
 *
 * @param props - 工具组件属性
 * @param props.defaultInput - 可选默认输入，未使用（本工具为多输入结构）
 * @returns 百分比计算器交互界面
 */
const PercentageCalculator: React.FC<ToolComponentProps> = () => {
  const [mode, setMode] = React.useState<PercentageModeEnum>(
    PercentageModeEnum.PERCENT_OF,
  );
  const [base, setBase] = React.useState(DEFAULT_BASE);
  const [percent, setPercent] = React.useState(DEFAULT_PERCENT);
  const [x, setX] = React.useState(DEFAULT_X);
  const [y, setY] = React.useState(DEFAULT_Y);
  const [from, setFrom] = React.useState(DEFAULT_FROM);
  const [to, setTo] = React.useState(DEFAULT_TO);

  const output = React.useMemo(() => {
    if (mode === PercentageModeEnum.PERCENT_OF) {
      const baseValue = parseNumeric(base);
      const percentValue = parseNumeric(percent);
      if (baseValue === null || percentValue === null) {
        return null;
      }
      return { value: percentOf(baseValue, percentValue), suffix: '', kind: 'value' as const };
    }
    if (mode === PercentageModeEnum.RATIO) {
      const xValue = parseNumeric(x);
      const yValue = parseNumeric(y);
      if (xValue === null || yValue === null) {
        return null;
      }
      const result = percentageRatio(xValue, yValue);
      if (result === null) {
        return { divideByZero: true as const };
      }
      return { value: result, suffix: '%', kind: 'ratio' as const };
    }
    const fromValue = parseNumeric(from);
    const toValue = parseNumeric(to);
    if (fromValue === null || toValue === null) {
      return null;
    }
    const result = percentageChange(fromValue, toValue);
    if (result === null) {
      return { divideByZero: true as const };
    }
    return { value: result, suffix: '%', kind: 'change' as const };
  }, [mode, base, percent, x, y, from, to]);

  return (
    <div className={styles.container}>
      <Card title="百分比计算器">
        <Radio.Group
          value={mode}
          onChange={(event) => setMode(event.target.value as PercentageModeEnum)}
          optionType="button"
          buttonStyle="solid"
          options={[
            { label: PERCENTAGE_MODE_LABELS[PercentageModeEnum.PERCENT_OF], value: PercentageModeEnum.PERCENT_OF },
            { label: PERCENTAGE_MODE_LABELS[PercentageModeEnum.RATIO], value: PercentageModeEnum.RATIO },
            { label: PERCENTAGE_MODE_LABELS[PercentageModeEnum.CHANGE], value: PercentageModeEnum.CHANGE },
          ]}
        />

        {mode === PercentageModeEnum.PERCENT_OF ? (
          <div className={styles.row} style={{ marginTop: 16 }}>
            <Input
              value={base}
              onChange={(event) => setBase(event.target.value)}
              addonAfter="的"
              style={{ maxWidth: 180 }}
            />
            <Input
              value={percent}
              onChange={(event) => setPercent(event.target.value)}
              addonAfter="% 是多少"
              style={{ maxWidth: 200 }}
            />
          </div>
        ) : mode === PercentageModeEnum.RATIO ? (
          <div className={styles.row} style={{ marginTop: 16 }}>
            <Input
              value={x}
              onChange={(event) => setX(event.target.value)}
              addonAfter="是"
              style={{ maxWidth: 180 }}
            />
            <Input
              value={y}
              onChange={(event) => setY(event.target.value)}
              addonAfter="的百分之几"
              style={{ maxWidth: 200 }}
            />
          </div>
        ) : (
          <div className={styles.row} style={{ marginTop: 16 }}>
            <Input
              value={to}
              onChange={(event) => setTo(event.target.value)}
              addonBefore="变化后"
              style={{ maxWidth: 200 }}
            />
            <span className={styles.label}>较</span>
            <Input
              value={from}
              onChange={(event) => setFrom(event.target.value)}
              addonBefore="变化前"
              style={{ maxWidth: 200 }}
            />
          </div>
        )}

        {output === null ? (
          <Alert
            style={{ marginTop: 16 }}
            type="info"
            showIcon
            message="请输入有效数字"
            description="支持整数、小数与负数；任一输入为空或非法时暂不计算。"
          />
        ) : 'divideByZero' in output && output.divideByZero ? (
          <Alert
            style={{ marginTop: 16 }}
            type="warning"
            showIcon
            message="除数为 0，无法计算百分比"
          />
        ) : (
          <div className={styles.result}>
            <span className={styles.resultValue}>{formatResult(output.value)}</span>
            <span className={styles.resultSuffix}>{output.suffix}</span>
            {output.kind === 'change' && (
              <Tag
                className={styles.changeTag}
                color={output.value > 0 ? 'green' : output.value < 0 ? 'orange' : 'default'}
              >
                {output.value > 0 ? '增长' : output.value < 0 ? '下降' : '无变化'}
              </Tag>
            )}
          </div>
        )}
      </Card>
    </div>
  );
};

export default PercentageCalculator;
