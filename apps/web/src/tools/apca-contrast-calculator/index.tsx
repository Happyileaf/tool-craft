'use client';

import React from 'react';
import { Alert, Button, Card, Input, Statistic, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { ToolComponentProps } from '../loaders';
import {
  DEFAULT_BACKGROUND_COLOR,
  DEFAULT_TEXT_COLOR,
  LEVEL_REFERENCE,
  PRESET_PAIRS,
} from './constants';
import {
  apcaContrast,
  getReadabilityLevel,
  parseHexColor,
  toHex,
  validateColorPair,
} from './utils/apca';
import styles from './index.module.css';

/** 分级参考表行 */
interface LevelRow {
  key: string;
  grade: string;
  range: string;
  usage: string;
}

const LEVEL_COLUMNS: ColumnsType<LevelRow> = [
  { title: '等级', dataIndex: 'grade', key: 'grade', width: 120 },
  { title: '|Lc| 区间', dataIndex: 'range', key: 'range', width: 180 },
  { title: '推荐用途', dataIndex: 'usage', key: 'usage' },
];

/** 颜色输入组：原生取色器 + 十六进制文本框 */
function ColorField(props: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}): React.ReactElement {
  const { label, value, onChange } = props;
  return (
    <span className={styles.option}>
      <span className={styles.label}>{label}</span>
      <input
        type="color"
        className={styles.colorPicker}
        value={value}
        onChange={(event) => onChange(event.target.value.toUpperCase())}
        aria-label={`${label}取色器`}
      />
      <Input
        className={styles.hexInput}
        size="small"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="#RRGGBB"
      />
    </span>
  );
}

/**
 * APCA（WCAG 3）感知对比度计算器：输入文字与背景颜色，输出带符号 Lc 与可读性分级，全程本地运算
 *
 * @returns APCA 对比度交互界面
 */
const ApcaContrastCalculator: React.FC<ToolComponentProps> = () => {
  const [textHex, setTextHex] = React.useState<string>(DEFAULT_TEXT_COLOR);
  const [backgroundHex, setBackgroundHex] = React.useState<string>(DEFAULT_BACKGROUND_COLOR);

  const error = validateColorPair(textHex, backgroundHex);

  const contrast = React.useMemo(() => {
    if (error !== null) {
      return null;
    }
    const text = parseHexColor(textHex);
    const background = parseHexColor(backgroundHex);
    return {
      lc: apcaContrast(text, background),
      text,
      background,
    };
  }, [textHex, backgroundHex, error]);

  const level = contrast ? getReadabilityLevel(contrast.lc) : null;
  const polarity = contrast
    ? contrast.lc >= 0
      ? '深色文字 / 浅色背景（正常极性）'
      : '浅色文字 / 深色背景（反转极性）'
    : '';

  const levelRows: LevelRow[] = LEVEL_REFERENCE.map((item) => ({
    key: item.grade,
    ...item,
  }));

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        <Tag color="blue">APCA WCAG 3</Tag>
        <span className={styles.hint}>
          基于 sRGB 线性化与感知亮度加权计算 L^c 对比度，带符号输出，全程本地运算
        </span>
      </div>

      <Card className={styles.card} title="颜色输入" size="small">
        <div className={styles.options}>
          <ColorField label="文字颜色" value={textHex} onChange={setTextHex} />
          <ColorField label="背景颜色" value={backgroundHex} onChange={setBackgroundHex} />
        </div>
        <div className={styles.presets}>
          {PRESET_PAIRS.map((preset) => (
            <Button
              key={preset.label}
              size="small"
              onClick={() => {
                setTextHex(preset.text);
                setBackgroundHex(preset.background);
              }}
            >
              {preset.label}
            </Button>
          ))}
          <Button
            size="small"
            onClick={() => {
              setTextHex(backgroundHex);
              setBackgroundHex(textHex);
            }}
          >
            交换前景 / 背景
          </Button>
        </div>
        {error !== null ? (
          <Alert className={styles.notice} type="error" showIcon message={error} />
        ) : null}
      </Card>

      {contrast && level ? (
        <>
          <Card className={styles.card} title="对比度结果" size="small">
            <div
              className={styles.preview}
              style={{
                color: toHex(contrast.text),
                backgroundColor: toHex(contrast.background),
              }}
            >
              感知对比度预览 APCA Contrast Preview 0123456789
            </div>
            <div className={styles.stats}>
              <Statistic
                title="APCA L^c 对比度"
                value={contrast.lc}
                precision={1}
                valueStyle={{ color: level.color, fontFamily: 'ui-monospace, monospace' }}
              />
              <Statistic title="极性" value={polarity} />
              <Statistic
                title="可读性分级"
                value={level.grade}
                valueStyle={{ color: level.color }}
              />
            </div>
            <Alert
              className={styles.notice}
              type="info"
              showIcon
              message={`推荐用途：${level.usage}`}
            />
          </Card>

          <Card className={styles.card} title="APCA 可读性等级参考" size="small">
            <Table<LevelRow>
              columns={LEVEL_COLUMNS}
              dataSource={levelRows}
              pagination={false}
              size="small"
            />
          </Card>
        </>
      ) : null}
    </div>
  );
};

export default ApcaContrastCalculator;
