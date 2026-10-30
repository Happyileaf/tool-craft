'use client';

import React from 'react';
import { Alert, Button, Card, InputNumber, Radio, Space, Tag } from 'antd';
import { AimOutlined, SwapOutlined } from '@ant-design/icons';
import type { ToolComponentProps } from '../loaders';
import {
  calculateGreatCircle,
  compassPoint,
  type GreatCircleResult,
  type LatLon,
} from './utils/geo';
import { CITY_PRESETS, DEFAULT_FROM, DEFAULT_TO } from './constants';
import styles from './index.module.css';

/** 经纬度输入的小数精度与步长 */
const COORDINATE_STEP = 0.0001;

/** 格式化数值输出 */
function formatNumber(value: number, fractionDigits = 2): string {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
}

/** 单个坐标点输入组 */
interface PointInputProps {
  title: string;
  point: LatLon;
  onChange: (point: LatLon) => void;
}

const PointInput: React.FC<PointInputProps> = ({ title, point, onChange }) => (
  <div className={styles.pointItem}>
    <span className={styles.label}>{title}（十进制度，北纬 / 东经为正）</span>
    <Space wrap>
      <InputNumber
        addonBefore="纬度"
        min={-90}
        max={90}
        step={COORDINATE_STEP}
        precision={6}
        value={point.lat}
        onChange={(value) => onChange({ ...point, lat: typeof value === 'number' ? value : NaN })}
        style={{ width: 190 }}
      />
      <InputNumber
        addonBefore="经度"
        min={-180}
        max={180}
        step={COORDINATE_STEP}
        precision={6}
        value={point.lon}
        onChange={(value) => onChange({ ...point, lon: typeof value === 'number' ? value : NaN })}
        style={{ width: 190 }}
      />
    </Space>
  </div>
);

/**
 * 大圆距离与方位角计算器：基于 WGS-84 椭球平均半径的 Haversine 公式，
 * 在浏览器本地计算两点之间的大圆距离（km / mi / nmi）与初始、终点、反方位角
 *
 * @returns 大圆计算界面
 */
const GreatCircle: React.FC<ToolComponentProps> = () => {
  const [from, setFrom] = React.useState<LatLon>(DEFAULT_FROM);
  const [to, setTo] = React.useState<LatLon>(DEFAULT_TO);
  const [presetTarget, setPresetTarget] = React.useState<'from' | 'to'>('from');

  const outcome = React.useMemo<{ result: GreatCircleResult; error: null } | { result: null; error: string }>(() => {
    try {
      return { result: calculateGreatCircle(from, to), error: null };
    } catch (caught) {
      return { result: null, error: caught instanceof Error ? caught.message : '计算失败' };
    }
  }, [from, to]);

  const applyPreset = (point: LatLon) => {
    if (presetTarget === 'from') {
      setFrom(point);
    } else {
      setTo(point);
    }
  };

  return (
    <div className={styles.container}>
      <Card title="大圆距离与方位角计算器">
        <div className={styles.pointGrid}>
          <PointInput title="起点" point={from} onChange={setFrom} />
          <PointInput title="终点" point={to} onChange={setTo} />
        </div>

        <Space wrap style={{ marginTop: 12 }}>
          <Radio.Group
            optionType="button"
            buttonStyle="solid"
            value={presetTarget}
            onChange={(event) => setPresetTarget(event.target.value as 'from' | 'to')}
            options={[
              { label: '预设填入起点', value: 'from' },
              { label: '预设填入终点', value: 'to' },
            ]}
          />
          <Button
            icon={<SwapOutlined />}
            onClick={() => {
              setFrom(to);
              setTo(from);
            }}
          >
            交换起终点
          </Button>
        </Space>
        <div className={styles.presetRow}>
          {CITY_PRESETS.map((city) => (
            <Button key={city.label} size="small" onClick={() => applyPreset(city.point)}>
              {city.label}
            </Button>
          ))}
        </div>

        {outcome.error ? <Alert type="error" showIcon message={outcome.error} style={{ marginTop: 12 }} /> : null}
      </Card>

      <Card title="计算结果">
        {outcome.result ? (
          <>
            <div className={styles.statGrid}>
              <div className={styles.statCard}>
                <div className={styles.statValue}>
                  {formatNumber(outcome.result.km)}
                  <span className={styles.statUnit}>km</span>
                </div>
                <div className={styles.statLabel}>大圆距离（公里）</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statValue}>
                  {formatNumber(outcome.result.mi)}
                  <span className={styles.statUnit}>mi</span>
                </div>
                <div className={styles.statLabel}>大圆距离（英里）</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statValue}>
                  {formatNumber(outcome.result.nmi)}
                  <span className={styles.statUnit}>nmi</span>
                </div>
                <div className={styles.statLabel}>大圆距离（海里）</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statValue}>
                  <span className={styles.bearingValue}>{formatNumber(outcome.result.initialBearing, 1)}°</span>{' '}
                  <Tag color="blue">
                    <AimOutlined /> {compassPoint(outcome.result.initialBearing)}
                  </Tag>
                </div>
                <div className={styles.statLabel}>初始方位角（起点航向）</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statValue}>
                  <span className={styles.bearingValue}>{formatNumber(outcome.result.finalBearing, 1)}°</span>{' '}
                  <Tag color="geekblue">{compassPoint(outcome.result.finalBearing)}</Tag>
                </div>
                <div className={styles.statLabel}>终点方位角（到达航向）</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statValue}>
                  <span className={styles.bearingValue}>{formatNumber(outcome.result.backBearing, 1)}°</span>{' '}
                  <Tag color="purple">{compassPoint(outcome.result.backBearing)}</Tag>
                </div>
                <div className={styles.statLabel}>反方位角（返程航向）</div>
              </div>
            </div>
            <div className={styles.hint}>
              距离采用 Haversine 公式与 WGS-84 平均地球半径 6,371,008.8 m 计算，把地球近似为球体，误差通常小于 0.5%。
              方位角以正北为 0°、顺时针增加；坐标与计算全部在浏览器本地完成，不会上传任何数据。
            </div>
          </>
        ) : (
          <div className={styles.hint}>请输入合法的纬度（-90 ~ 90）与经度（-180 ~ 180）。</div>
        )}
      </Card>
    </div>
  );
};

export default GreatCircle;
