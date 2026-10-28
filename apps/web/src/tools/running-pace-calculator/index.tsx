'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Button, Card, Input, InputNumber, Radio, Space, Statistic } from 'antd';
import { ClearOutlined, ReloadOutlined } from '@ant-design/icons';
import {
  formatDuration,
  formatPace,
  parseTimeToSeconds,
  paceToSpeed,
  solveByDurationDistance,
  solveByPaceDistance,
  solveByPaceDuration,
  speedToPace,
  type PaceResult,
} from './utils/pace';
import {
  DEFAULT_DISTANCE,
  DEFAULT_DURATION_TEXT,
  DEFAULT_PACE_TEXT,
  DISTANCE_PRESETS,
  MODE_OPTIONS,
  PaceModeEnum,
} from './constants';
import styles from './index.module.css';

/**
 * 跑步配速互算器：在配速（mm:ss/km）、完赛时间、距离与速度（km/h）之间知二求余，
 * 提供 5K / 10K / 半马 / 全马距离预设，全部运算在浏览器本地完成
 *
 * @param props - 工具组件属性
 * @param props.defaultInput - 可选默认输入（作为距离）
 * @returns 跑步配速计算交互界面
 */
const RunningPaceCalculator: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [mode, setMode] = React.useState<PaceModeEnum>(PaceModeEnum.PACE_DISTANCE_TO_DURATION);
  const [paceText, setPaceText] = React.useState<string>(DEFAULT_PACE_TEXT);
  const [durationText, setDurationText] = React.useState<string>(DEFAULT_DURATION_TEXT);
  const [distance, setDistance] = React.useState<number | null>(
    defaultInput ? Number.parseFloat(defaultInput) : DEFAULT_DISTANCE,
  );
  const [speedText, setSpeedText] = React.useState<string>('12');

  const result = React.useMemo<PaceResult | null>(() => {
    if (mode === PaceModeEnum.PACE_DISTANCE_TO_DURATION) {
      const pace = parseTimeToSeconds(paceText);
      if (pace === null) {
        return { paceSecPerKm: 0, duration: 0, distance: 0, speed: 0, error: '配速格式应为 mm:ss，如 5:00' };
      }
      if (distance === null) {
        return null;
      }
      return solveByPaceDistance(pace, distance);
    }
    if (mode === PaceModeEnum.DURATION_DISTANCE_TO_PACE) {
      const duration = parseTimeToSeconds(durationText);
      if (duration === null) {
        return { paceSecPerKm: 0, duration: 0, distance: 0, speed: 0, error: '完赛时间格式应为 mm:ss 或 h:mm:ss' };
      }
      if (distance === null) {
        return null;
      }
      return solveByDurationDistance(duration, distance);
    }
    const pace = parseTimeToSeconds(paceText);
    if (pace === null) {
      return { paceSecPerKm: 0, duration: 0, distance: 0, speed: 0, error: '配速格式应为 mm:ss，如 5:00' };
    }
    const duration = parseTimeToSeconds(durationText);
    if (duration === null) {
      return { paceSecPerKm: 0, duration: 0, distance: 0, speed: 0, error: '完赛时间格式应为 mm:ss 或 h:mm:ss' };
    }
    return solveByPaceDuration(pace, duration);
  }, [mode, paceText, durationText, distance]);

  const onSpeedChange = (value: string): void => {
    setSpeedText(value);
    const speed = Number.parseFloat(value);
    if (Number.isFinite(speed) && speed > 0) {
      const pace = speedToPace(speed);
      if (pace !== null) {
        setPaceText(formatPace(pace));
      }
    }
  };

  const onPaceChange = (value: string): void => {
    setPaceText(value);
    const pace = parseTimeToSeconds(value);
    if (pace !== null && pace > 0) {
      const speed = paceToSpeed(pace);
      if (speed !== null) {
        setSpeedText(speed.toFixed(2));
      }
    }
  };

  const resetSample = (): void => {
    setMode(PaceModeEnum.PACE_DISTANCE_TO_DURATION);
    setPaceText(DEFAULT_PACE_TEXT);
    setDurationText(DEFAULT_DURATION_TEXT);
    setDistance(DEFAULT_DISTANCE);
    setSpeedText('12');
  };

  const paceInput = (
    <>
      <span className={styles.label}>配速（mm:ss /km）：</span>
      <Input
        value={paceText}
        onChange={(event) => onPaceChange(event.target.value)}
        placeholder="如 5:00"
        style={{ width: 140 }}
      />
      <span className={styles.label}>速度（km/h）：</span>
      <Input
        value={speedText}
        onChange={(event) => onSpeedChange(event.target.value)}
        placeholder="如 12"
        style={{ width: 110 }}
        inputMode="decimal"
      />
    </>
  );

  return (
    <div className={styles.container}>
      <Card title="跑步配速计算器（配速 / 完赛时间 / 距离 / 速度互算）">
        <div className={styles.toolbar}>
          <Radio.Group
            value={mode}
            onChange={(event) => setMode(event.target.value as PaceModeEnum)}
            optionType="button"
            buttonStyle="solid"
            options={MODE_OPTIONS}
          />
        </div>

        <div className={styles.formRow}>
          {mode !== PaceModeEnum.DURATION_DISTANCE_TO_PACE ? paceInput : null}
        </div>

        {mode !== PaceModeEnum.PACE_DURATION_TO_DISTANCE ? (
          <div className={styles.formRow}>
            <span className={styles.label}>距离（公里）：</span>
            <InputNumber<number>
              value={distance}
              onChange={(value) => setDistance(value)}
              min={0}
              step={1}
              style={{ width: 140 }}
              placeholder="如 10"
            />
            <Space wrap style={{ marginLeft: 12 }}>
              {DISTANCE_PRESETS.map((preset) => (
                <Button key={preset.label} onClick={() => setDistance(preset.value)}>
                  {preset.label}
                </Button>
              ))}
            </Space>
          </div>
        ) : null}

        {mode !== PaceModeEnum.PACE_DISTANCE_TO_DURATION ? (
          <div className={styles.formRow}>
            <span className={styles.label}>完赛时间（mm:ss 或 h:mm:ss）：</span>
            <Input
              value={durationText}
              onChange={(event) => setDurationText(event.target.value)}
              placeholder="如 45:00 或 1:30:00"
              style={{ width: 200 }}
            />
          </div>
        ) : null}

        <Space>
          <Button icon={<ReloadOutlined />} onClick={resetSample}>
            载入示例
          </Button>
          <Button
            icon={<ClearOutlined />}
            onClick={() => {
              setPaceText('');
              setDurationText('');
              setDistance(null);
              setSpeedText('');
            }}
          >
            清空
          </Button>
        </Space>
      </Card>

      <Card title="计算结果">
        {result?.error ? (
          <Alert type="error" showIcon message="无法计算" description={result.error} />
        ) : result ? (
          <div className={styles.resultGrid}>
            <Statistic title="平均配速" value={formatPace(result.paceSecPerKm)} suffix="/km" />
            <Statistic title="完赛时间" value={formatDuration(result.duration)} />
            <Statistic title="距离（公里）" value={result.distance} precision={4} />
            <Statistic title="速度（km/h）" value={result.speed} precision={2} />
          </div>
        ) : (
          <Alert type="info" showIcon message="请输入两个已知量以计算其余结果" />
        )}
        <div className={styles.hint}>
          关系：配速（秒 / 公里）= 完赛时间 ÷ 距离；速度（km/h）= 3600 ÷ 配速秒数。半马按 21.0975
          公里、全马按 42.195 公里计。结果仅供训练与比赛规划参考。
        </div>
      </Card>
    </div>
  );
};

export default RunningPaceCalculator;
