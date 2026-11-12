'use client';

import { useMemo, useState } from 'react';
import {
  Alert,
  Card,
  ColorPicker,
  Divider,
  Input,
  Space,
  Statistic,
  Tag,
  Typography,
} from 'antd';
import type { Color as AggregationColor } from 'antd/es/color-picker';
import type { ToolComponentProps } from '../loaders';
import {
  apcaContrast,
  parseColor,
  recommendLevel,
  wcagContrastRatio,
  type ParsedColor,
} from './utils/apca';
import styles from './index.module.css';

const LEVELS = ['Lc90', 'Lc75', 'Lc60', 'Lc45', 'Lc30', 'Lc15', '低于 Lc15'];

const PRESETS = [
  { label: '经典黑白', text: '#000000', bg: '#ffffff' },
  { label: '深蓝浅底', text: '#1a365d', bg: '#edf2f7' },
  { label: '半透明黑', text: '#00000066', bg: '#ffffff' },
  { label: '同色（无对比）', text: '#556677', bg: '#556677' },
];

/**
 * APCA（WCAG 3 候选）感知对比度计算器。
 * 前景/背景取色后实时计算 Lc、极性、推荐等级并预览实际配色，
 * 同时给出 WCAG 2.1 比值对照；全部计算在本地完成。
 */
export default function ApcaContrastCalculator(_props: ToolComponentProps) {
  const [textInput, setTextInput] = useState('#1a365d');
  const [bgInput, setBgInput] = useState('#edf2f7');

  const textColor = useMemo(() => parseColor(textInput), [textInput]);
  const bgColor = useMemo(() => parseColor(bgInput), [bgInput]);
  const valid = textColor !== null && bgColor !== null;

  const result = useMemo(() => {
    if (!textColor || !bgColor) {
      return null;
    }
    return apcaContrast(textColor, bgColor);
  }, [textColor, bgColor]);

  const wcag = useMemo(() => {
    if (!textColor || !bgColor) {
      return null;
    }
    return wcagContrastRatio(textColor, bgColor);
  }, [textColor, bgColor]);

  const effectiveCss = (color: ParsedColor): string =>
    `rgb(${color.r}, ${color.g}, ${color.b})`;

  const onPickerChange =
    (setter: (value: string) => void) =>
    (value: AggregationColor): void => {
      const rgb = value.toRgb();
      if (rgb.a < 1) {
        const hex = Math.round(rgb.a * 255)
          .toString(16)
          .padStart(2, '0');
        setter(`${value.toHexString()}${hex}`);
      } else {
        setter(value.toHexString());
      }
    };

  const polarityTag = (): { color: string; label: string } => {
    if (!result || result.polarity === 'none') {
      return { color: 'default', label: '无对比（Lc = 0）' };
    }
    return result.polarity === 'normal'
      ? { color: 'blue', label: '正常极性：深字浅底（BoW，Lc 为正）' }
      : { color: 'purple', label: '反向极性：浅字深底（WoB，Lc 为负）' };
  };

  const activeLevel = result ? recommendLevel(result.magnitude).level : '';

  return (
    <div className={styles.container}>
      <Alert
        type="info"
        showIcon
        message="APCA 0.0.98G-4g（WCAG 3 候选）感知对比度"
        description="Lc 范围约 -108 至 +108，符号表示极性、绝对值决定可用等级。所有计算均在浏览器本地完成，颜色不会上传。"
      />

      <div className={styles.pickerRow}>
        <Card size="small" title="前景色（文字）" className={styles.pickerCard}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <ColorPicker
              value={textColor ? effectiveCss(textColor) : '#000000'}
              onChange={onPickerChange(setTextInput)}
              format="hex"
            >
              <Input readOnly value={textInput} className={styles.mono} />
            </ColorPicker>
            <Input
              value={textInput}
              onChange={(event) => setTextInput(event.target.value)}
              placeholder="#rrggbb / rgb() / rgba()"
              className={styles.mono}
              status={textColor ? '' : 'error'}
            />
          </Space>
        </Card>

        <Card size="small" title="背景色" className={styles.pickerCard}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <ColorPicker
              value={bgColor ? effectiveCss(bgColor) : '#ffffff'}
              onChange={onPickerChange(setBgInput)}
              format="hex"
            >
              <Input readOnly value={bgInput} className={styles.mono} />
            </ColorPicker>
            <Input
              value={bgInput}
              onChange={(event) => setBgInput(event.target.value)}
              placeholder="#rrggbb / rgb() / rgba()"
              className={styles.mono}
              status={bgColor ? '' : 'error'}
            />
          </Space>
        </Card>
      </div>

      <Space wrap>
        {PRESETS.map((preset) => (
          <Tag
            key={preset.label}
            color="geekblue"
            style={{ cursor: 'pointer' }}
            onClick={() => {
              setTextInput(preset.text);
              setBgInput(preset.bg);
            }}
          >
            {preset.label}
          </Tag>
        ))}
      </Space>

      {!valid && (
        <Alert
          type="error"
          showIcon
          message="颜色格式无法识别"
          description="请输入 #rgb、#rrggbb、#rrggbbaa、rgb(r,g,b) 或 rgba(r,g,b,a) 格式。"
        />
      )}

      {valid && result && textColor && bgColor && (
        <>
          <div
            className={styles.preview}
            style={{
              backgroundColor: effectiveCss(bgColor),
              color: effectiveCss(textColor),
            }}
          >
            <p className={styles.previewHeading}>Aa 感知对比度预览</p>
            <p className={styles.previewBody}>
              The quick brown fox jumps over the lazy dog. 敏捷的棕色狐狸跳过懒狗。
            </p>
            <span className={styles.previewMono}>
              {effectiveCss(textColor)} on {effectiveCss(bgColor)}
            </span>
          </div>

          <div className={styles.lcGrid}>
            <Card size="small">
              <div className={styles.lcHero}>
                <div
                  className={styles.lcValue}
                  style={{
                    color:
                      result.polarity === 'none'
                        ? '#999'
                        : result.polarity === 'normal'
                          ? '#1677ff'
                          : '#722ed1',
                  }}
                >
                  {result.lc.toFixed(1)}
                </div>
                <div className={styles.lcUnit}>Lc 感知对比度</div>
              </div>
            </Card>
            <Card size="small">
              <Statistic
                title="WCAG 2.1 比值（对照）"
                value={wcag !== null ? wcag.toFixed(2) : '-'}
                suffix=": 1"
              />
            </Card>
            <Card size="small">
              <Statistic title="前景亮度 Y" value={result.yText.toFixed(4)} />
            </Card>
            <Card size="small">
              <Statistic title="背景亮度 Y" value={result.yBackground.toFixed(4)} />
            </Card>
          </div>

          <Divider style={{ margin: '4px 0' }} />

          <Tag color={polarityTag().color}>{polarityTag().label}</Tag>

          <Card size="small" title={`推荐等级：${result.level}`}>
            <Typography.Paragraph style={{ marginBottom: 12 }}>
              {result.recommendation}
            </Typography.Paragraph>
            <div className={styles.levelList}>
              {LEVELS.map((level) => (
                <div
                  key={level}
                  className={`${styles.levelItem} ${
                    level === activeLevel ? styles.levelItemActive : ''
                  }`}
                >
                  <Tag className={styles.levelBadge} color={level === activeLevel ? 'blue' : 'default'}>
                    {level}
                  </Tag>
                  <span>{recommendLevel(level === '低于 Lc15' ? 0 : Number(level.slice(2))).recommendation}</span>
                </div>
              ))}
            </div>
          </Card>

          <p className={styles.hint}>
            说明：APCA 与 WCAG 2.1 的数学模型不同，二者数值不可直接换算。APCA 对极性、字号与字重敏感，
            等级表中的字号阈值为官方 fontLookupAPCA 分级的工程化摘要，实际选型还需结合字体与场景。
          </p>
        </>
      )}
    </div>
  );
}
