'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Button, Card, Descriptions, Input, InputNumber, Tag, message } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import {
  convertCalendar,
  convertJulian,
  formatParts,
  type CalendarParts,
} from './utils/julian';
import { DEFAULT_JD_INPUT, DEFAULT_PARTS } from './constants';
import { copyToClipboard } from '@/lib/utils';
import styles from './index.module.css';

const JulianDateConverter: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [parts, setParts] = React.useState<CalendarParts>(DEFAULT_PARTS);
  const [jdInput, setJdInput] = React.useState(defaultInput || DEFAULT_JD_INPUT);

  const forward = React.useMemo(() => convertCalendar(parts), [parts]);
  const backward = React.useMemo(() => convertJulian(jdInput), [jdInput]);

  const patch = (key: keyof CalendarParts) => (value: number | null) => {
    setParts((prev) => ({ ...prev, [key]: value ?? 0 }));
  };

  const copy = (text: string, label: string) => {
    if (!text) {
      message.error('暂无可复制的结果');
      return;
    }
    copyToClipboard(text);
    message.success(`已复制${label}`);
  };

  return (
    <div className={styles.container}>
      <div className={styles.panels}>
        <Card className={styles.card} title="公历日期时间（UTC）→ 儒略日">
          <div className={styles.fields}>
            <InputNumber
              addonBefore="年"
              value={parts.year}
              min={1582}
              max={2100}
              precision={0}
              onChange={patch('year')}
              className={styles.fieldWide}
            />
            <InputNumber
              addonBefore="月"
              value={parts.month}
              min={1}
              max={12}
              precision={0}
              onChange={patch('month')}
              className={styles.fieldNarrow}
            />
            <InputNumber
              addonBefore="日"
              value={parts.day}
              min={1}
              max={31}
              precision={0}
              onChange={patch('day')}
              className={styles.fieldNarrow}
            />
            <InputNumber
              addonBefore="时"
              value={parts.hour}
              min={0}
              max={23}
              precision={0}
              onChange={patch('hour')}
              className={styles.fieldNarrow}
            />
            <InputNumber
              addonBefore="分"
              value={parts.minute}
              min={0}
              max={59}
              precision={0}
              onChange={patch('minute')}
              className={styles.fieldNarrow}
            />
            <InputNumber
              addonBefore="秒"
              value={parts.second}
              min={0}
              max={59.999}
              step={1}
              onChange={patch('second')}
              className={styles.fieldNarrow}
            />
          </div>

          {forward.error ? (
            <Alert type="error" showIcon message={forward.error} className={styles.alert} />
          ) : (
            <Descriptions column={1} size="small" bordered className={styles.result}>
              <Descriptions.Item label="JD（儒略日）">
                <span className={styles.mono}>{forward.jd}</span>
                <Button
                  size="small"
                  type="link"
                  icon={<CopyOutlined />}
                  onClick={() => copy(String(forward.jd), ' JD')}
                >
                  复制
                </Button>
              </Descriptions.Item>
              <Descriptions.Item label="MJD（约化儒略日）">
                <span className={styles.mono}>{forward.mjd}</span>
                <Button
                  size="small"
                  type="link"
                  icon={<CopyOutlined />}
                  onClick={() => copy(String(forward.mjd), ' MJD')}
                >
                  复制
                </Button>
              </Descriptions.Item>
              <Descriptions.Item label="Unix 时间戳（秒）">
                <span className={styles.mono}>{forward.unix}</span>
              </Descriptions.Item>
            </Descriptions>
          )}
        </Card>

        <Card className={styles.card} title="儒略日 → 公历日期时间（UTC）">
          <Input
            value={jdInput}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setJdInput(e.target.value)}
            spellCheck={false}
            className={styles.mono}
            placeholder="输入 JD，例如 2451545.0"
          />
          {backward.error || !backward.parts ? (
            <Alert
              type="error"
              showIcon
              message={backward.error ?? '输入无效'}
              className={styles.alert}
            />
          ) : (
            <Descriptions column={1} size="small" bordered className={styles.result}>
              <Descriptions.Item label="UTC 日期时间">
                <Tag color="blue">{formatParts(backward.parts)}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="MJD">
                <span className={styles.mono}>{backward.mjd}</span>
              </Descriptions.Item>
              <Descriptions.Item label="Unix 时间戳（秒）">
                <span className={styles.mono}>{backward.unix}</span>
              </Descriptions.Item>
            </Descriptions>
          )}
        </Card>
      </div>

      <Alert
        type="info"
        showIcon
        message="JD 从世界时正午起算（J2000.0 = JD 2451545.0 = 2000-01-01 12:00 UTC）；MJD = JD − 2400000.5，日界在 UTC 0 时。所有换算均在浏览器本地完成，支持 1582-10-15 至 2100-12-31（格里高利历）。"
      />
    </div>
  );
};

export default JulianDateConverter;
