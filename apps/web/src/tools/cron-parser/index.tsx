'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Button, Card, Input, Select, Space } from 'antd';
import { ClearOutlined } from '@ant-design/icons';
import {
  CRON_FIELD_ORDER,
  describeCron,
  describeField,
  getNextRuns,
  parseCron,
  type ParsedCron,
  type ParsedCronField,
} from './utils/cron';
import {
  CRON_SAMPLES,
  DEFAULT_CRON_EXPRESSION,
  DEFAULT_PREVIEW_COUNT,
  PREVIEW_COUNT_OPTIONS,
} from './constants';
import styles from './index.module.css';

/** 星期中文名，用于格式化执行时间 */
const WEEKDAY_LABELS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

/**
 * 把时刻格式化为「YYYY-MM-DD HH:mm 周X」形式（按本地时区）
 *
 * @param date - 待格式化的时刻
 * @returns 本地时区下的可读时间文本
 */
function formatDateTime(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  const weekday = WEEKDAY_LABELS[date.getDay()] ?? '';
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())} ${weekday}`;
}

/**
 * 格式化字段展开取值，取值过多时以区间形式概览
 *
 * @param field - 字段解析结果
 * @returns 供展示的取值文本
 */
function formatValues(field: ParsedCronField): string {
  if (field.values.length > 8) {
    const first = field.values[0] ?? 0;
    const last = field.values[field.values.length - 1] ?? 0;
    return `共 ${field.values.length} 项（${first} - ${last}）`;
  }
  return field.values.join('、');
}

/**
 * CRON 表达式解析工具，校验表达式、展示逐字段解析结果并预览后续执行时间，
 * 全部计算基于浏览器本地时区，不发起任何网络请求
 *
 * @param props - 工具组件属性
 * @param props.defaultInput - 可选默认表达式
 * @returns CRON 解析交互界面
 */
const CronParser: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [expression, setExpression] = React.useState<string>(
    defaultInput || DEFAULT_CRON_EXPRESSION,
  );
  const [count, setCount] = React.useState<number>(DEFAULT_PREVIEW_COUNT);
  const [parsed, setParsed] = React.useState<ParsedCron | null>(null);
  const [runs, setRuns] = React.useState<Date[]>([]);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    try {
      const nextParsed = parseCron(expression);
      setParsed(nextParsed);
      setRuns(getNextRuns(expression, count, new Date()));
      setError(null);
    } catch (caught) {
      setParsed(null);
      setRuns([]);
      setError(caught instanceof Error ? caught.message : 'CRON 表达式解析失败');
    }
  }, [expression, count]);

  /**
   * 清空表达式输入
   */
  const handleClear = () => {
    setExpression('');
  };

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        <Space wrap>
          {CRON_SAMPLES.map((sample) => (
            <Button key={sample.value} size="small" onClick={() => setExpression(sample.value)}>
              {sample.label}
            </Button>
          ))}
        </Space>
        <Space>
          <span>预览条数：</span>
          <Select
            value={count}
            onChange={setCount}
            options={PREVIEW_COUNT_OPTIONS.map((value) => ({ label: `${value} 条`, value }))}
            style={{ width: 100 }}
          />
          <Button icon={<ClearOutlined />} onClick={handleClear}>
            清空
          </Button>
        </Space>
      </div>

      <div className={styles.input}>
        <Input
          value={expression}
          onChange={(event) => setExpression(event.target.value)}
          placeholder="输入 CRON 表达式，例如 */15 9-17 * * MON-FRI"
          allowClear
        />
      </div>

      <div className={styles.panels}>
        <Card title="解析结果" className={styles.card}>
          {error ? (
            <Alert type="error" showIcon message="表达式非法" description={error} />
          ) : parsed ? (
            <>
              <div className={styles.summary}>{describeCron(parsed)}</div>
              {CRON_FIELD_ORDER.map((key) => (
                <div key={key} className={styles.fieldRow}>
                  <span className={styles.fieldLabel}>{parsed[key].label}</span>
                  <code className={styles.fieldRaw}>{parsed[key].raw}</code>
                  <span className={styles.fieldValues}>
                    {describeField(key, parsed[key])}
                    {'　取值：'}
                    {formatValues(parsed[key])}
                  </span>
                </div>
              ))}
            </>
          ) : null}
        </Card>

        <Card title="执行时间预览" className={styles.card}>
          {error ? (
            <Alert type="warning" showIcon message="请先修正表达式后再预览执行时间" />
          ) : runs.length === 0 ? (
            <Alert
              type="info"
              showIcon
              message="在可搜索范围内未找到匹配的执行时间"
              description="该表达式可能在日历上不可达（例如 2 月 30 日），请检查日与月字段。"
            />
          ) : (
            <ul className={styles.runList}>
              {runs.map((date, index) => (
                <li key={date.getTime()}>{`${index + 1}. ${formatDateTime(date)}`}</li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
};

export default CronParser;
