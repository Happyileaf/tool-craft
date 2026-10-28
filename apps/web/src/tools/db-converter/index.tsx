'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Button, Card, Input, Radio, Space, Statistic } from 'antd';
import { ClearOutlined, ReloadOutlined } from '@ant-design/icons';
import {
  cascadeDb,
  dbToRatio,
  DbModeEnum,
  parseGainList,
  ratioToDb,
  validateRatio,
} from './utils/db';
import {
  DB_PRESETS,
  DEFAULT_CASCADE_TEXT,
  DEFAULT_DB_TEXT,
  DEFAULT_MODE,
  DEFAULT_RATIO_TEXT,
  MODE_OPTIONS,
} from './constants';
import styles from './index.module.css';

/**
 * 将 dB 数值格式化为展示文本，-Infinity 显示为 -∞
 *
 * @param db - dB 值
 * @returns 展示文本
 */
function formatDb(db: number): string {
  if (db === Number.NEGATIVE_INFINITY) {
    return '-∞';
  }
  if (!Number.isFinite(db)) {
    return '--';
  }
  return String(Number.parseFloat(db.toFixed(6)));
}

/**
 * 分贝（dB）与线性倍数互转器，区分功率量（×10）与场量（×20）两种定义，
 * 支持常用 dB 参考值速查与多级增益级联求和，全部运算在浏览器本地完成
 *
 * @param props - 工具组件属性
 * @param props.defaultInput - 可选默认输入（作为 dB 值）
 * @returns 分贝换算交互界面
 */
const DbConverter: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [mode, setMode] = React.useState<DbModeEnum>(DEFAULT_MODE);
  const [dbText, setDbText] = React.useState<string>(defaultInput || DEFAULT_DB_TEXT);
  const [ratioText, setRatioText] = React.useState<string>(DEFAULT_RATIO_TEXT);
  const [cascadeText, setCascadeText] = React.useState<string>(DEFAULT_CASCADE_TEXT);

  const isPower = mode === DbModeEnum.POWER;

  const onDbChange = (text: string): void => {
    setDbText(text);
    const db = Number(text);
    if (text.trim() !== '' && Number.isFinite(db)) {
      setRatioText(String(Number.parseFloat(dbToRatio(db, mode).toFixed(8))));
    }
  };

  const onRatioChange = (text: string): void => {
    setRatioText(text);
    const ratio = Number(text);
    if (text.trim() !== '' && ratio >= 0 && Number.isFinite(ratio)) {
      setDbText(formatDb(ratioToDb(ratio, mode)));
    }
  };

  const switchMode = (nextMode: DbModeEnum): void => {
    setMode(nextMode);
    const db = Number(dbText);
    if (dbText.trim() !== '' && Number.isFinite(db)) {
      setRatioText(String(Number.parseFloat(dbToRatio(db, nextMode).toFixed(8))));
    }
  };

  const cascade = React.useMemo(() => parseGainList(cascadeText), [cascadeText]);
  const cascadeTotal = cascadeDb(cascade.gains);

  const resetSample = (): void => {
    setMode(DEFAULT_MODE);
    setDbText(DEFAULT_DB_TEXT);
    setRatioText(DEFAULT_RATIO_TEXT);
    setCascadeText(DEFAULT_CASCADE_TEXT);
  };

  const ratioError = (() => {
    const ratio = Number(ratioText);
    if (ratioText.trim() === '') {
      return null;
    }
    if (!Number.isFinite(ratio)) {
      return '倍数必须是有效数字';
    }
    return validateRatio(ratio);
  })();

  const dbError = (() => {
    if (dbText.trim() === '') {
      return null;
    }
    const db = Number(dbText);
    return Number.isFinite(db) ? null : 'dB 必须是有效数字（0 倍对应 -∞）';
  })();

  return (
    <div className={styles.container}>
      <Card title="分贝 dB 与增益 / 衰减倍数互转">
        <div className={styles.toolbar}>
          <Radio.Group
            value={mode}
            onChange={(event) => switchMode(event.target.value as DbModeEnum)}
            optionType="button"
            buttonStyle="solid"
            options={MODE_OPTIONS}
          />
        </div>

        <div className={styles.formRow}>
          <span className={styles.label}>增益 / 衰减（dB）：</span>
          <Input
            value={dbText}
            onChange={(event) => onDbChange(event.target.value)}
            placeholder="如 3"
            style={{ width: 160 }}
            status={dbError ? 'error' : ''}
          />
          <Space wrap>
            {DB_PRESETS.map((preset) => (
              <Button key={preset} size="small" onClick={() => onDbChange(String(preset))}>
                {preset} dB
              </Button>
            ))}
          </Space>
        </div>

        <div className={styles.formRow}>
          <span className={styles.label}>线性倍数（×）：</span>
          <Input
            value={ratioText}
            onChange={(event) => onRatioChange(event.target.value)}
            placeholder="如 2"
            style={{ width: 200 }}
            status={ratioError ? 'error' : ''}
          />
        </div>

        {dbError || ratioError ? (
          <Alert type="error" showIcon message={dbError || ratioError} style={{ marginBottom: 12 }} />
        ) : null}

        <Space>
          <Button icon={<ReloadOutlined />} onClick={resetSample}>
            载入示例
          </Button>
          <Button
            icon={<ClearOutlined />}
            onClick={() => {
              setDbText('');
              setRatioText('');
            }}
          >
            清空
          </Button>
        </Space>

        <div className={styles.hint}>
          {isPower
            ? '功率量公式：dB = 10·log₁₀(P/P₀)，倍数 = 10^(dB/10)。+3 dB ≈ ×2、10 dB = ×10、−10 dB = ×0.1、−∞ dB = 0。'
            : '场量公式：dB = 20·log₁₀(V/V₀)，倍数 = 10^(dB/20)。+6 dB ≈ ×2、+20 dB = ×10、−6 dB ≈ ×0.501、−∞ dB = 0。'}
        </div>
      </Card>

      <Card title="多级增益级联（dB 相加 = 倍数相乘）">
        <Input.TextArea
          value={cascadeText}
          onChange={(event) => setCascadeText(event.target.value)}
          placeholder="输入各级 dB，用逗号、空格或换行分隔，如 3, 3, -3"
          autoSize={{ minRows: 3, maxRows: 8 }}
        />
        {cascade.error ? (
          <Alert type="error" showIcon message={cascade.error} style={{ marginTop: 12 }} />
        ) : cascadeTotal !== null ? (
          <div className={styles.resultGrid} style={{ marginTop: 16 }}>
            <Statistic title="级数" value={cascade.gains.length} />
            <Statistic title="总增益（dB）" value={formatDb(cascadeTotal)} />
            <Statistic
              title={isPower ? '等效功率倍数（×）' : '等效场量倍数（×）'}
              value={Number.parseFloat(dbToRatio(cascadeTotal, mode).toFixed(8))}
              precision={6}
            />
          </div>
        ) : (
          <Alert type="info" showIcon message="请输入至少一级 dB 增益" style={{ marginTop: 12 }} />
        )}
      </Card>
    </div>
  );
};

export default DbConverter;
