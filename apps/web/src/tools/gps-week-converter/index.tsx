import React, { useMemo, useState } from 'react';
import { Alert, Button, Card, InputNumber, Radio, Space, Table, Tag, Typography, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { CopyOutlined, ThunderboltOutlined } from '@ant-design/icons';
import ToolMetaHeader from '../../components/ToolMetaHeader';
import ToolDocSection from '../../components/ToolDocSection';
import { GPS_DIRECTION_OPTIONS, GPS_ROLLOVER_OPTIONS, GPS_SAMPLE_DATE } from './constants';
import styles from './index.module.css';
import {
  ROLLOVER_LABELS,
  SECONDS_PER_WEEK,
  continuousToLnavWeek,
  formatTowClock,
  gpsToUtcMs,
  inferRolloverCount,
  isValidLnavWeek,
  isValidTow,
  leapSecondsAtUtc,
  lnavToContinuousWeek,
  utcMsToGps,
} from './utils/gpsTime';

const { Text } = Typography;

type Direction = 'utc-to-gps' | 'gps-to-utc';

interface ResultRow {
  key: string;
  label: string;
  value: string;
}

const columns: ColumnsType<ResultRow> = [
  { title: '字段', dataIndex: 'label', key: 'label', width: 240 },
  {
    title: '值',
    dataIndex: 'value',
    key: 'value',
    render: (value: string) => (
      <Text copyable={{ text: value, tooltips: false }} style={{ wordBreak: 'break-all' }}>
        {value}
      </Text>
    ),
  },
];

const copyText = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
    message.success('已复制到剪贴板');
  } catch {
    message.error('复制失败，请手动选择文本复制');
  }
};

const formatUtc = (unixMs: number) => new Date(unixMs).toISOString().replace(/\.\d{3}Z$/, 'Z');

const GpsWeekConverter: React.FC<{ defaultInput?: string }> = ({ defaultInput }) => {
  const [direction, setDirection] = useState<Direction>('utc-to-gps');
  const [dateInput, setDateInput] = useState(defaultInput ?? GPS_SAMPLE_DATE);
  const [weekInput, setWeekInput] = useState<number | null>(2303);
  const [towInput, setTowInput] = useState<number | null>(432018);
  const [inputMode, setInputMode] = useState<'continuous' | 'lnav'>('continuous');
  const [rollover, setRollover] = useState(2);

  const utcToGpsResult = useMemo(() => {
    const ms = Date.parse(dateInput);
    if (Number.isNaN(ms)) {
      return { error: '无法解析日期：请输入 ISO 8601 格式，如 2024-03-01T00:00:00Z 或 2024-03-01 08:00:00+08:00' as const };
    }
    const gps = utcMsToGps(ms);
    const lnav = continuousToLnavWeek(gps.week);
    const count = inferRolloverCount(gps.week);
    return {
      rows: [
        { key: 'utc', label: 'UTC 时间', value: formatUtc(ms) },
        { key: 'unix', label: 'Unix 秒', value: String(ms / 1000) },
        { key: 'gpsw', label: 'GPS 连续周数（CNAV，13 位）', value: String(gps.week) },
        { key: 'lnav', label: 'LNAV WN（10 位，0–1023）', value: String(lnav) },
        { key: 'cycle', label: 'WN 所在回卷周期', value: `第 ${count + 1} 周期（边界 ${ROLLOVER_LABELS[count - 1] ?? '—'}）` },
        { key: 'tow', label: '周内秒 TOW', value: gps.tow.toFixed(3).replace(/\.?0+$/, '') },
        { key: 'towclock', label: 'TOW 时钟表示', value: formatTowClock(gps.tow) },
        { key: 'leap', label: '当前闰秒（GPS − UTC）', value: `${leapSecondsAtUtc(Math.floor(ms / 1000))} 秒` },
      ] as ResultRow[],
    };
  }, [dateInput]);

  const gpsToUtcResult = useMemo(() => {
    if (weekInput === null || towInput === null) {
      return { error: '请输入周数与周内秒' as const };
    }
    if (inputMode === 'lnav' && !isValidLnavWeek(weekInput)) {
      return { error: 'LNAV WN 必须是 0–1023 的整数；连续周数请切换到 CNAV 输入模式' as const };
    }
    if (!isValidTow(towInput)) {
      return { error: `周内秒 TOW 必须在 [0, ${SECONDS_PER_WEEK}) 范围内` as const };
    }
    const continuousWeek = inputMode === 'lnav' ? lnavToContinuousWeek(weekInput, rollover) : weekInput;
    const ms = gpsToUtcMs({ week: continuousWeek, tow: towInput });
    if (!Number.isFinite(ms)) {
      return { error: '换算结果超出日期范围' as const };
    }
    return {
      rows: [
        { key: 'in', label: '输入解释', value: inputMode === 'lnav'
          ? `LNAV WN ${weekInput} @ 第 ${rollover + 1} 周期 = 连续周 ${continuousWeek}`
          : `连续周 ${continuousWeek}` },
        { key: 'utc', label: 'UTC 时间', value: formatUtc(ms) },
        { key: 'beijing', label: '北京时间（UTC+8）', value: new Date(ms).toLocaleString('zh-CN', {
          timeZone: 'Asia/Shanghai', hour12: false, year: 'numeric', month: '2-digit', day: '2-digit',
          hour: '2-digit', minute: '2-digit', second: '2-digit',
        }).replace(/\//g, '-') },
        { key: 'unix', label: 'Unix 秒', value: String(ms / 1000) },
        { key: 'lnav', label: '对应 LNAV WN', value: String(continuousToLnavWeek(continuousWeek)) },
        { key: 'towclock', label: 'TOW 时钟表示', value: formatTowClock(towInput) },
        { key: 'leap', label: '该时刻闰秒（GPS − UTC）', value: `${leapSecondsAtUtc(Math.floor(ms / 1000 - 30))} 秒` },
      ] as ResultRow[],
    };
  }, [weekInput, towInput, inputMode, rollover]);

  return (
    <div className={styles.container}>
      <ToolMetaHeader slug="gps-week-converter" defaultInput={defaultInput} />

      <Card>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Radio.Group
            optionType="button"
            buttonStyle="solid"
            value={direction}
            onChange={(event) => setDirection(event.target.value as Direction)}
            options={GPS_DIRECTION_OPTIONS}
          />
          <Alert
            type="info"
            showIcon
            message="GPS 时起点为 1980-01-06 UTC，周内秒 TOW 从每周日 00:00 起算（0–604799）。LNAV 周数为 10 位，每 1024 周回卷；CNAV 连续周数不回卷。GPS 不跳闰秒，2017 年以来比 UTC 快 18 秒。"
          />

          {direction === 'utc-to-gps' ? (
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <div>
                <Text strong>UTC 日期</Text>
                <input
                  className={styles.nativeInput}
                  value={dateInput}
                  onChange={(event) => setDateInput(event.target.value)}
                  placeholder="2024-03-01T00:00:00Z"
                />
              </div>
              <Space wrap>
                <Button size="small" icon={<ThunderboltOutlined />} onClick={() => setDateInput(GPS_SAMPLE_DATE)}>
                  示例 2024-03-01
                </Button>
                <Button size="small" icon={<ThunderboltOutlined />} onClick={() => setDateInput(new Date().toISOString().replace(/\.\d{3}Z$/, 'Z'))}>
                  当前 UTC
                </Button>
                <Button size="small" icon={<CopyOutlined />} onClick={() => copyText(dateInput)}>
                  复制输入
                </Button>
              </Space>
              {'error' in utcToGpsResult && utcToGpsResult.error ? (
                <Alert type="error" showIcon message={utcToGpsResult.error} />
              ) : (
                <Table<ResultRow> columns={columns} dataSource={utcToGpsResult.rows} pagination={false} size="small" bordered />
              )}
            </Space>
          ) : (
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <Space wrap size="large">
                <div>
                  <Text strong>周数输入方式</Text>
                  <div style={{ marginTop: 8 }}>
                    <Radio.Group
                      optionType="button"
                      buttonStyle="solid"
                      size="small"
                      value={inputMode}
                      onChange={(event) => setInputMode(event.target.value)}
                      options={[
                        { label: '连续周（CNAV）', value: 'continuous' },
                        { label: 'LNAV WN（0–1023）', value: 'lnav' },
                      ]}
                    />
                  </div>
                </div>
                {inputMode === 'lnav' && (
                  <div>
                    <Text strong>回卷周期</Text>
                    <div style={{ marginTop: 8 }}>
                      <Radio.Group
                        optionType="button"
                        buttonStyle="solid"
                        size="small"
                        value={rollover}
                        onChange={(event) => setRollover(Number(event.target.value))}
                        options={GPS_ROLLOVER_OPTIONS}
                      />
                    </div>
                  </div>
                )}
              </Space>
              <Space wrap size="large">
                <div>
                  <Text strong>{inputMode === 'lnav' ? 'LNAV WN（0–1023）' : '连续周数'}</Text>
                  <div style={{ marginTop: 8 }}>
                    <InputNumber
                      min={0}
                      max={inputMode === 'lnav' ? 1023 : 9999}
                      precision={0}
                      style={{ width: 180 }}
                      value={weekInput}
                      onChange={(value) => setWeekInput(value)}
                    />
                  </div>
                </div>
                <div>
                  <Text strong>周内秒 TOW（0–604799）</Text>
                  <div style={{ marginTop: 8 }}>
                    <InputNumber
                      min={0}
                      max={SECONDS_PER_WEEK - 1}
                      precision={3}
                      style={{ width: 200 }}
                      value={towInput}
                      onChange={(value) => setTowInput(value)}
                    />
                  </div>
                </div>
              </Space>
              <Space wrap>
                <Tag color="blue">示例：周 2303 / TOW 432018（CNAV）= 2024-03-01 UTC</Tag>
                <Button
                  size="small"
                  icon={<ThunderboltOutlined />}
                  onClick={() => {
                    setInputMode('continuous');
                    setWeekInput(2303);
                    setTowInput(432018);
                  }}
                >
                  填入示例
                </Button>
              </Space>
              {'error' in gpsToUtcResult && gpsToUtcResult.error ? (
                <Alert type="error" showIcon message={gpsToUtcResult.error} />
              ) : (
                <Table<ResultRow> columns={columns} dataSource={gpsToUtcResult.rows} pagination={false} size="small" bordered />
              )}
            </Space>
          )}
        </Space>
      </Card>

      <Card>
        <ToolDocSection slug="gps-week-converter" />
      </Card>
    </div>
  );
};

export default GpsWeekConverter;
