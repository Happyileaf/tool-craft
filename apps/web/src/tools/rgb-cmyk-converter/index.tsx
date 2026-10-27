'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Card, Input, InputNumber, Slider, Space, Tag, Typography } from 'antd';
import {
  cmykToRgb,
  fromCmyk,
  fromRgb,
  parseHex,
  rgbToCmyk,
  rgbToHex,
  rgbToHsl,
  type CmykColor,
  type RgbColor,
} from './utils/color';
import { CMYK_CHANNELS, DEFAULT_HEX, RGB_CHANNELS } from './constants';
import styles from './index.module.css';

type Source = 'rgb' | 'cmyk';

/** 安全的整数解析：空值或非法值返回 null */
function parseChannel(value: number | null): number | null {
  if (value === null || !Number.isFinite(value)) {
    return null;
  }
  return value;
}

/**
 * RGB / HEX ↔ CMYK 印刷四色双向转换器。
 *
 * 任一通道改动实时联动：RGB / HEX 侧采用标准 black-generation
 * （K = 1 − max(R,G,B)）换算 CMYK；CMYK 侧按 R = 255·(1−C)·(1−K)
 * 还原 RGB，并同步输出 HEX、HSL 与色块预览。全部计算在浏览器本地完成。
 *
 * @returns 颜色转换交互界面
 */
const RgbCmykConverter: React.FC<ToolComponentProps> = () => {
  const [source, setSource] = React.useState<Source>('rgb');
  const [rgb, setRgb] = React.useState<RgbColor>(() => parseHex(DEFAULT_HEX));
  const [hexText, setHexText] = React.useState<string>(DEFAULT_HEX);
  const [hexError, setHexError] = React.useState<string>('');
  const [cmyk, setCmyk] = React.useState<CmykColor>(() => rgbToCmyk(parseHex(DEFAULT_HEX)));
  const [cmykError, setCmykError] = React.useState<string>('');

  // 以“最后编辑侧”为准推导展示值
  const derived = React.useMemo(() => {
    if (source === 'rgb') {
      return fromRgb(rgb);
    }
    return fromCmyk(cmyk);
  }, [source, rgb, cmyk]);

  const hsl = rgbToHsl(derived.rgb);

  /** 更新 RGB 通道（滑块 / 数字框） */
  const updateRgb = (channel: keyof RgbColor, value: number | null) => {
    const next = parseChannel(value);
    if (next === null) {
      return;
    }
    const clamped = Math.min(255, Math.max(0, next));
    setSource('rgb');
    const nextRgb = { ...rgb, [channel]: clamped };
    setRgb(nextRgb);
    setHexText(rgbToHex(nextRgb));
    setHexError('');
  };

  /** HEX 文本输入：合法时同步 RGB */
  const updateHex = (text: string) => {
    setHexText(text);
    setSource('rgb');
    try {
      const parsed = parseHex(text);
      setRgb(parsed);
      setHexError('');
    } catch (error) {
      setHexError(error instanceof Error ? error.message : 'HEX 格式无效');
    }
  };

  /** 更新 CMYK 通道（百分比） */
  const updateCmyk = (channel: keyof CmykColor, value: number | null) => {
    const next = parseChannel(value);
    if (next === null) {
      return;
    }
    const clamped = Math.min(100, Math.max(0, next));
    setSource('cmyk');
    const nextCmyk = { ...cmyk, [channel]: clamped };
    setCmyk(nextCmyk);
    try {
      cmykToRgb(nextCmyk);
      setCmykError('');
    } catch (error) {
      setCmykError(error instanceof Error ? error.message : 'CMYK 数值无效');
    }
  };

  return (
    <div className={styles.container}>
      <Card title="RGB / HEX ↔ CMYK 印刷四色双向转换">
        <div className={styles.hint}>
          任一通道改动实时联动：RGB→CMYK 采用标准 black-generation（K = 1 − max(R,G,B)），CMYK→RGB 按
          R = 255·(1−C)·(1−K) 还原；白色为 0/0/0/0、纯黑为 0/0/0/100、纯红为 0/100/100/0。全部计算在浏览器本地完成。
        </div>
      </Card>

      <div className={styles.panels}>
        {/* 屏幕色侧 */}
        <Card
          title="屏幕色 RGB / HEX"
          className={styles.card}
          extra={
            source === 'rgb' ? <Tag color="blue">当前输入</Tag> : <Tag>联动输出</Tag>
          }
        >
          {RGB_CHANNELS.map(({ key, label, min, max }) => (
            <div className={styles.channelRow} key={key}>
              <span className={styles.channelLabel}>{label}</span>
              <Slider
                className={styles.channelSlider}
                min={min}
                max={max}
                value={rgb[key]}
                onChange={(value) => updateRgb(key, value)}
              />
              <InputNumber
                className={styles.channelInput}
                min={min}
                max={max}
                value={rgb[key]}
                onChange={(value) => updateRgb(key, value)}
              />
            </div>
          ))}

          <div className={styles.hexRow}>
            <span className={styles.channelLabel}>HEX</span>
            <Input
              className={styles.hexInput}
              value={hexText}
              onChange={(event) => updateHex(event.target.value)}
              placeholder="#3B82F6"
            />
            <input
              type="color"
              className={styles.picker}
              value={rgbToHex(derived.rgb)}
              onChange={(event) => updateHex(event.target.value.toUpperCase())}
              aria-label="取色器"
            />
          </div>
          {hexError && (
            <Alert
              style={{ marginTop: 12 }}
              type="error"
              showIcon
              message={hexError}
            />
          )}
        </Card>

        {/* 印刷色侧 */}
        <Card
          title="印刷四色 CMYK（%）"
          className={styles.card}
          extra={
            source === 'cmyk' ? <Tag color="blue">当前输入</Tag> : <Tag>联动输出</Tag>
          }
        >
          {CMYK_CHANNELS.map(({ key, label, color }) => (
            <div className={styles.channelRow} key={key}>
              <span className={styles.channelLabel}>
                <Space size={6}>
                  <span
                    style={{
                      display: 'inline-block',
                      width: 10,
                      height: 10,
                      borderRadius: 2,
                      background: color,
                      border: '1px solid rgba(0,0,0,0.15)',
                    }}
                  />
                  {label}
                </Space>
              </span>
              <Slider
                className={styles.channelSlider}
                min={0}
                max={100}
                step={0.1}
                value={cmyk[key]}
                onChange={(value) => updateCmyk(key, value)}
              />
              <InputNumber
                className={styles.channelInput}
                min={0}
                max={100}
                step={0.1}
                precision={1}
                value={cmyk[key]}
                onChange={(value) => updateCmyk(key, value)}
              />
            </div>
          ))}
          {cmykError && (
            <Alert
              style={{ marginTop: 12 }}
              type="error"
              showIcon
              message={cmykError}
            />
          )}
        </Card>
      </div>

      <Card title="预览与同步输出">
        <div className={styles.swatchRow}>
          <span className={styles.swatch} style={{ backgroundColor: derived.hex }} />
          <div className={styles.values}>
            <Typography.Text strong style={{ fontSize: 16 }}>
              <span className={styles.mono}>{derived.hex}</span>
            </Typography.Text>
            <span className={styles.mono}>
              RGB({derived.rgb.r}, {derived.rgb.g}, {derived.rgb.b})
            </span>
            <span className={styles.mono}>
              CMYK({derived.cmyk.c}%, {derived.cmyk.m}%, {derived.cmyk.y}%,{' '}
              {derived.cmyk.k}%)
            </span>
            <span className={styles.mono}>
              HSL({hsl.h}°, {hsl.s}%, {hsl.l}%)
            </span>
          </div>
        </div>
        <div className={styles.hint}>
          注意：CMYK 为印刷减色模型，部分屏幕色（尤其高亮荧光色）超出普通 CMYK 色域，转换结果仅为标准公式下的理论值，实际印刷以打样为准。
        </div>
      </Card>
    </div>
  );
};

export default RgbCmykConverter;
