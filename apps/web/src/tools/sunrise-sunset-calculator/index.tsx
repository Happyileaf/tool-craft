'use client';

import { Alert, Card, Input, InputNumber, Select, Space, Tag, message, Button } from 'antd';
import { useMemo, useState } from 'react';
import { CITY_PRESETS, DEFAULT_SUN_INPUT, TIMEZONE_OPTIONS } from './constants';
import {
  calculateSunTimes,
  formatDuration,
  formatLocalTime,
  formatUtcTime,
  type SolarEvent,
  type SunTimesResult,
} from './utils/sun';
import styles from './index.module.css';

const STATUS_TEXT: Record<string, string> = {
  'always-above': '极昼（全天不落）',
  'always-below': '极夜（全天不升）',
};

function renderEvent(event: SolarEvent, timezoneOffset: number): string {
  if (event.status !== 'ok' || event.utcMinutes === null) {
    return STATUS_TEXT[event.status] ?? '--';
  }
  return formatLocalTime(event.utcMinutes, timezoneOffset);
}

function renderUtc(event: SolarEvent): string {
  if (event.status !== 'ok' || event.utcMinutes === null) {
    return STATUS_TEXT[event.status] ?? '--';
  }
  return formatUtcTime(event.utcMinutes);
}

export default function SunriseSunsetCalculatorTool() {
  const [date, setDate] = useState(DEFAULT_SUN_INPUT.date);
  const [latitude, setLatitude] = useState(DEFAULT_SUN_INPUT.latitude);
  const [longitude, setLongitude] = useState(DEFAULT_SUN_INPUT.longitude);
  const [timezoneOffset, setTimezoneOffset] = useState(DEFAULT_SUN_INPUT.timezoneOffset);

  const result = useMemo<{ data: SunTimesResult | null; error: string | null }>(() => {
    try {
      return {
        data: calculateSunTimes({ date, latitude, longitude, timezoneOffset }),
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : '计算失败',
      };
    }
  }, [date, latitude, longitude, timezoneOffset]);

  const applyPreset = (index: number) => {
    const preset = CITY_PRESETS[index];
    if (!preset) {
      return;
    }
    setLatitude(preset.latitude);
    setLongitude(preset.longitude);
    setTimezoneOffset(preset.timezoneOffset);
  };

  const data = result.data;

  const handleCopy = async () => {
    if (!data) {
      message.warning('当前没有可复制的结果');
      return;
    }
    const lines = [
      `日期：${date}`,
      `坐标：${latitude}, ${longitude}（UTC${timezoneOffset >= 0 ? '+' : ''}${timezoneOffset}）`,
      `日出：${renderEvent(data.sunrise, timezoneOffset)}`,
      `太阳正午：${renderEvent(data.solarNoon, timezoneOffset)}`,
      `日落：${renderEvent(data.sunset, timezoneOffset)}`,
      `昼长：${formatDuration(data.dayLengthMinutes)}`,
      `民用晨光：${renderEvent(data.civilDawn, timezoneOffset)} / 暮光：${renderEvent(data.civilDusk, timezoneOffset)}`,
      `航海晨光：${renderEvent(data.nauticalDawn, timezoneOffset)} / 暮光：${renderEvent(data.nauticalDusk, timezoneOffset)}`,
      `天文晨光：${renderEvent(data.astronomicalDawn, timezoneOffset)} / 暮光：${renderEvent(data.astronomicalDusk, timezoneOffset)}`,
    ];
    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      message.success('已复制结果');
    } catch {
      message.error('复制失败，请手动选择复制');
    }
  };

  return (
    <div className={styles.container}>
      <Card title="观测参数">
        <div className={styles.grid}>
          <label className={styles.field}>
            <span className={styles.label}>日期</span>
            <Input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>城市预设</span>
            <Select
              placeholder="选择城市快速填充"
              options={CITY_PRESETS.map((city, index) => ({
                label: `${city.label}（UTC${city.timezoneOffset >= 0 ? '+' : ''}${city.timezoneOffset}）`,
                value: index,
              }))}
              onChange={applyPreset}
            />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>纬度（-90 – 90）</span>
            <InputNumber
              className={styles.number}
              value={latitude}
              min={-89.99}
              max={89.99}
              step={0.0001}
              onChange={(value) => setLatitude(value ?? 0)}
            />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>经度（-180 – 180，东经为正）</span>
            <InputNumber
              className={styles.number}
              value={longitude}
              min={-180}
              max={180}
              step={0.0001}
              onChange={(value) => setLongitude(value ?? 0)}
            />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>时区偏移</span>
            <Select
              options={TIMEZONE_OPTIONS}
              value={timezoneOffset}
              onChange={setTimezoneOffset}
            />
          </label>
        </div>
      </Card>

      {result.error && <Alert type="error" showIcon message={result.error} />}

      {data && (
        <>
          <Card
            title="核心时刻"
            extra={
              <Space>
                <Tag color="blue">太阳赤纬 {data.declination.toFixed(2)}°</Tag>
                <Tag color="geekblue">时差 {data.equationOfTime.toFixed(2)} 分</Tag>
                <Button onClick={handleCopy}>复制结果</Button>
              </Space>
            }
          >
            <div className={styles.stats}>
              <div className={styles.stat}>
                <span className={styles.statLabel}>日出</span>
                <span className={styles.statValue}>{renderEvent(data.sunrise, timezoneOffset)}</span>
                <span className={styles.statSub}>UTC {renderUtc(data.sunrise)}</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statLabel}>太阳正午</span>
                <span className={styles.statValue}>
                  {renderEvent(data.solarNoon, timezoneOffset)}
                </span>
                <span className={styles.statSub}>UTC {renderUtc(data.solarNoon)}</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statLabel}>日落</span>
                <span className={styles.statValue}>{renderEvent(data.sunset, timezoneOffset)}</span>
                <span className={styles.statSub}>UTC {renderUtc(data.sunset)}</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statLabel}>昼长</span>
                <span className={styles.statValue}>{formatDuration(data.dayLengthMinutes)}</span>
                <span className={styles.statSub}>± 约 1 分钟</span>
              </div>
            </div>
          </Card>

          <Card title="晨昏时刻（本地时间）">
            <div className={styles.twilight}>
              <div className={styles.twilightHeader}>
                <span>阶段</span>
                <span>晨光</span>
                <span>暮光</span>
              </div>
              {[
                { label: '民用（太阳 -6°）', dawn: data.civilDawn, dusk: data.civilDusk },
                { label: '航海（太阳 -12°）', dawn: data.nauticalDawn, dusk: data.nauticalDusk },
                { label: '天文（太阳 -18°）', dawn: data.astronomicalDawn, dusk: data.astronomicalDusk },
              ].map((row) => (
                <div className={styles.twilightRow} key={row.label}>
                  <span className={styles.twilightLabel}>{row.label}</span>
                  <span>{renderEvent(row.dawn, timezoneOffset)}</span>
                  <span>{renderEvent(row.dusk, timezoneOffset)}</span>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
