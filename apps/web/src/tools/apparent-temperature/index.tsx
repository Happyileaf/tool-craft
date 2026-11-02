'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Button, Card, InputNumber, Radio, Tag } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import {
  apparentTemperature,
  type CalcMode,
  type TempUnit,
} from './utils/apparent-temperature';
import {
  DEFAULT_HEAT_HUMIDITY,
  DEFAULT_HEAT_TEMP_C,
  DEFAULT_HEAT_TEMP_F,
  DEFAULT_WIND_SPEED_KMH,
  DEFAULT_WIND_SPEED_MPH,
  DEFAULT_WIND_TEMP_C,
  DEFAULT_WIND_TEMP_F,
  HEAT_PRESETS,
  MODE_OPTIONS,
  UNIT_OPTIONS,
  WIND_PRESETS,
} from './constants';
import { copyToClipboard } from '@/lib/utils';
import { message } from 'antd';
import styles from './index.module.css';

const ApparentTemperatureCalculator: React.FC<ToolComponentProps> = () => {
  const [mode, setMode] = React.useState<CalcMode>('heat-index');
  const [unit, setUnit] = React.useState<TempUnit>('C');
  const [tempC, setTempC] = React.useState<number>(DEFAULT_HEAT_TEMP_C);
  const [humidity, setHumidity] = React.useState<number>(DEFAULT_HEAT_HUMIDITY);
  const [windKmh, setWindKmh] = React.useState<number>(DEFAULT_WIND_SPEED_KMH);
  const [tempF, setTempF] = React.useState<number>(DEFAULT_HEAT_TEMP_F);
  const [windMph, setWindMph] = React.useState<number>(DEFAULT_WIND_SPEED_MPH);

  const handleModeChange = (next: CalcMode) => {
    setMode(next);
    if (next === 'heat-index') {
      setTempC(DEFAULT_HEAT_TEMP_C);
      setTempF(DEFAULT_HEAT_TEMP_F);
    } else {
      setTempC(DEFAULT_WIND_TEMP_C);
      setTempF(DEFAULT_WIND_TEMP_F);
    }
  };

  const result = React.useMemo(
    () =>
      apparentTemperature(mode, {
        temperature: unit === 'C' ? tempC : tempF,
        humidity,
        windSpeed: unit === 'C' ? windKmh : windMph,
        unit,
      }),
    [mode, unit, tempC, tempF, humidity, windKmh, windMph],
  );

  const tempValue = unit === 'C' ? tempC : tempF;
  const windValue = unit === 'C' ? windKmh : windMph;

  const handleCopy = () => {
    if (result.error) {
      message.error('当前无有效结果可复制');
      return;
    }
    copyToClipboard(result.apparent.toFixed(1));
    message.success('已复制体感温度');
  };

  const activeMode = MODE_OPTIONS.find((option) => option.value === mode);
  const unitSuffix = unit === 'C' ? '°C' : '°F';
  const windSuffix = unit === 'C' ? 'km/h' : 'mph';

  return (
    <div className={styles.container}>
      <Radio.Group
        optionType="button"
        buttonStyle="solid"
        value={mode}
        options={MODE_OPTIONS.map((option) => ({ value: option.value, label: option.label }))}
        onChange={(e) => handleModeChange(e.target.value as CalcMode)}
      />

      <div className={styles.panels}>
        <Card className={styles.card} title="输入参数">
          <div className={styles.controls}>
            <div>
              <div className={styles.fieldLabel}>
                <span>单位制</span>
              </div>
              <Radio.Group
                optionType="button"
                buttonStyle="solid"
                size="small"
                value={unit}
                options={UNIT_OPTIONS}
                onChange={(e) => setUnit(e.target.value as TempUnit)}
              />
            </div>

            <div>
              <div className={styles.fieldLabel}>
                <span>气温</span>
                <span>{unitSuffix}</span>
              </div>
              <InputNumber
                value={tempValue}
                onChange={(value) => {
                  if (typeof value !== 'number') return;
                  if (unit === 'C') setTempC(value);
                  else setTempF(value);
                }}
                step={1}
                addonAfter={unitSuffix}
                style={{ width: '100%' }}
              />
            </div>

            {mode === 'heat-index' ? (
              <div>
                <div className={styles.fieldLabel}>
                  <span>相对湿度</span>
                  <span>%</span>
                </div>
                <InputNumber
                  min={0}
                  max={100}
                  value={humidity}
                  onChange={(value) => {
                    if (typeof value === 'number') setHumidity(value);
                  }}
                  step={1}
                  addonAfter="%RH"
                  style={{ width: '100%' }}
                />
              </div>
            ) : (
              <div>
                <div className={styles.fieldLabel}>
                  <span>风速</span>
                  <span>{windSuffix}（开阔地面 10m 高度风速）</span>
                </div>
                <InputNumber
                  min={0}
                  value={windValue}
                  onChange={(value) => {
                    if (typeof value !== 'number') return;
                    if (unit === 'C') setWindKmh(value);
                    else setWindMph(value);
                  }}
                  step={1}
                  addonAfter={windSuffix}
                  style={{ width: '100%' }}
                />
              </div>
            )}

            <div className={styles.presets}>
              {(mode === 'heat-index' ? HEAT_PRESETS : WIND_PRESETS).map((preset) => (
                <Button
                  key={preset.label}
                  size="small"
                  onClick={() => {
                    if (mode === 'heat-index' && 'humidity' in preset) {
                      setTempC(preset.tempC);
                      setHumidity(preset.humidity);
                      setUnit('C');
                    } else if ('windKmh' in preset) {
                      setTempC(preset.tempC);
                      setWindKmh(preset.windKmh);
                      setUnit('C');
                    }
                  }}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          </div>
        </Card>

        <Card className={styles.card} title="体感温度">
          {result.error ? (
            <Alert type="warning" showIcon message={result.error} />
          ) : (
            <div className={styles.resultHero}>
              <div className={styles.resultValue}>
                {result.apparent.toFixed(1)} {unitSuffix}
              </div>
              <Tag color={result.level.color}>{result.level.label}</Tag>
              <div className={styles.levelDesc}>{result.level.description}</div>
              <div className={styles.resultSub}>
                同时为 {result.apparentF.toFixed(1)} °F
              </div>
              <div className={styles.method}>算法：{result.method}</div>
              <div className={styles.resultActions}>
                <Button size="small" icon={<CopyOutlined />} onClick={handleCopy}>
                  复制体感温度
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>

      <div className={styles.toolbar}>
        <span className={styles.hint}>{activeMode?.hint}</span>
      </div>
    </div>
  );
};

export default ApparentTemperatureCalculator;
