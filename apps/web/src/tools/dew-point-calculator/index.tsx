'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Button, Card, InputNumber, Space, Statistic, Table, Tag, message } from 'antd';
import {
  psychrometrics,
  altitudeToPressure,
  pressureToAltitude,
  P0_HPA,
} from './utils/psychrometrics';
import { WEATHER_PRESETS } from './constants';
import { copyToClipboard } from '@/lib/utils';
import styles from './index.module.css';

function round(value: number, digits = 2): string {
  return String(parseFloat(value.toFixed(digits)));
}

const DewPointCalculator: React.FC<ToolComponentProps> = () => {
  const [temperature, setTemperature] = React.useState<number | null>(20);
  const [humidity, setHumidity] = React.useState<number | null>(50);
  const [pressure, setPressure] = React.useState<number | null>(845);
  const [altitude, setAltitude] = React.useState<number | null>(1500);

  const psychro = React.useMemo(() => {
    try {
      if (temperature === null || humidity === null) return { ok: true as const };
      return { ok: true as const, value: psychrometrics(temperature, humidity) };
    } catch (error) {
      return { ok: false as const, error: error instanceof Error ? error.message : String(error) };
    }
  }, [temperature, humidity]);

  // 气压 -> 海拔（以当前气温作基准）
  const altFromPressure = React.useMemo(() => {
    if (pressure === null || temperature === null) return undefined;
    try {
      return pressureToAltitude(pressure, temperature);
    } catch {
      return undefined;
    }
  }, [pressure, temperature]);

  // 海拔 -> 标准气压
  const pressureFromAlt = React.useMemo(() => {
    if (altitude === null) return undefined;
    try {
      return altitudeToPressure(altitude);
    } catch {
      return undefined;
    }
  }, [altitude]);

  const handleCopy = () => {
    if (!psychro.ok || !psychro.value) {
      message.warning('暂无可复制的结果');
      return;
    }
    const v = psychro.value;
    copyToClipboard(
      [
        `气温 ${temperature} °C，相对湿度 ${humidity}%`,
        `露点 ${round(v.dewPoint)} °C，湿球（Stull）${round(v.wetBulb)} °C，结露温差 ${round(v.spread)} °C`,
      ].join('\n'),
    );
    message.success('结果已复制');
  };

  const riskTag = psychro.ok && psychro.value
    ? (() => {
        const td = psychro.value.dewPoint;
        if (td >= 20) return <Tag color="red">高湿 / 结霉风险</Tag>;
        if (td >= 12) return <Tag color="orange">略潮湿</Tag>;
        if (td >= 0) return <Tag color="green">舒适至干燥</Tag>;
        return <Tag color="blue">严寒干燥（可能结霜）</Tag>;
      })()
    : null;

  return (
    <div className={styles.container}>
      <Card
        title="露点 / 湿球温度与气压-海拔换算"
        extra={
          <Button size="small" onClick={handleCopy}>
            复制结果
          </Button>
        }
      >
        <p className={styles.hint}>
          露点（Magnus 公式）反映空气达到饱和时需冷却到的温度，湿球温度（Stull 2011 经验式）近似湿球温度计读数；
          气压与海拔之间按国际标准大气（ISA）对流层压高公式互算。全部计算在本地完成。
        </p>

        <div className={styles.fieldGrid}>
          <div className={styles.fieldCard}>
            <div className={styles.fieldLabel}>气温（°C）</div>
            <InputNumber
              style={{ width: '100%' }}
              value={temperature}
              onChange={(value) => setTemperature(value === null ? null : Number(value))}
            />
          </div>
          <div className={styles.fieldCard}>
            <div className={styles.fieldLabel}>相对湿度（%）</div>
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              max={100}
              value={humidity}
              onChange={(value) => setHumidity(value === null ? null : Number(value))}
            />
          </div>
        </div>

        <Space wrap style={{ marginTop: 16 }}>
          <span className={styles.hint}>示例：</span>
          {WEATHER_PRESETS.map((preset) => (
            <Button
              key={preset.name}
              size="small"
              onClick={() => {
                setTemperature(preset.temperatureC);
                setHumidity(preset.humidity);
              }}
            >
              {preset.name}
            </Button>
          ))}
        </Space>

        {!psychro.ok ? (
          <Alert style={{ marginTop: 16 }} type="warning" showIcon message="无法计算" description={psychro.error} />
        ) : psychro.value ? (
          <div style={{ marginTop: 16 }}>
            <Space wrap size="large">
              <Statistic title="露点温度" value={round(psychro.value.dewPoint)} suffix="°C" />
              <Statistic title="湿球温度（Stull）" value={round(psychro.value.wetBulb)} suffix="°C" />
              <Statistic title="结露温差 T−Td" value={round(psychro.value.spread)} suffix="°C" />
              <span>{riskTag}</span>
            </Space>
            {psychro.value.warnings.length > 0 ? (
              <Alert
                style={{ marginTop: 12 }}
                type="info"
                showIcon
                message="适用范围提示"
                description={psychro.value.warnings.map((text) => (
                  <div key={text}>{text}</div>
                ))}
              />
            ) : null}
          </div>
        ) : null}
      </Card>

      <Card title="气压 ↔ 海拔（国际标准大气）">
        <div className={styles.fieldGrid}>
          <div className={styles.fieldCard}>
            <div className={styles.fieldLabel}>站点气压（hPa）→ 海拔（m）</div>
            <Space>
              <InputNumber
                value={pressure}
                onChange={(value) => setPressure(value === null ? null : Number(value))}
                addonAfter="hPa"
              />
              <span className={styles.mono}>≈ {altFromPressure === undefined ? '—' : round(altFromPressure, 0)} m</span>
            </Space>
            <p className={styles.hint} style={{ marginTop: 8 }}>
              以当前气温作为海平面基准温度，标准海平面气压 {P0_HPA} hPa
            </p>
          </div>
          <div className={styles.fieldCard}>
            <div className={styles.fieldLabel}>海拔（m）→ 标准气压（hPa）</div>
            <Space>
              <InputNumber
                value={altitude}
                onChange={(value) => setAltitude(value === null ? null : Number(value))}
                addonAfter="m"
              />
              <span className={styles.mono}>≈ {pressureFromAlt === undefined ? '—' : round(pressureFromAlt, 1)} hPa</span>
            </Space>
            <p className={styles.hint} style={{ marginTop: 8 }}>对流层（≤11000 m）压高公式，L = 0.0065 K/m</p>
          </div>
        </div>
        <Table
          style={{ marginTop: 16 }}
          size="small"
          pagination={false}
          dataSource={[
            { h: 0, p: altitudeToPressure(0) },
            { h: 1500, p: altitudeToPressure(1500) },
            { h: 3000, p: altitudeToPressure(3000) },
            { h: 5500, p: altitudeToPressure(5500) },
            { h: 8848, p: altitudeToPressure(8848) },
          ]}
          rowKey="h"
          columns={[
            { title: '海拔 (m)', dataIndex: 'h', key: 'h' },
            {
              title: '标准气压 (hPa)',
              dataIndex: 'p',
              key: 'p',
              render: (value: number) => <span className={styles.mono}>{round(value, 1)}</span>,
            },
          ]}
        />
      </Card>
    </div>
  );
};

export default DewPointCalculator;
