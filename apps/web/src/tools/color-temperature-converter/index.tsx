'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Button, Card, Input, InputNumber, Radio, Slider, Tag, message } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import {
  colorInputToCct,
  kelvinToRgb,
  MAX_KELVIN,
  MIN_KELVIN,
  rgbToHex,
} from './utils/color-temperature';
import {
  DEFAULT_COLOR,
  DEFAULT_KELVIN,
  describeKelvin,
  KELVIN_PRESETS,
  MODE_OPTIONS,
} from './constants';
import { copyToClipboard } from '@/lib/utils';
import styles from './index.module.css';

type Mode = 'kelvin-to-color' | 'color-to-kelvin';

const ColorTemperatureConverter: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [mode, setMode] = React.useState<Mode>('kelvin-to-color');
  const [kelvin, setKelvin] = React.useState<number>(
    defaultInput ? Number(defaultInput) || DEFAULT_KELVIN : DEFAULT_KELVIN,
  );
  const [colorText, setColorText] = React.useState(DEFAULT_COLOR);

  const rgb = React.useMemo(() => kelvinToRgb(kelvin), [kelvin]);
  const hex = React.useMemo(() => rgbToHex(rgb), [rgb]);
  const rgbCss = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;

  const cctResult = React.useMemo(() => colorInputToCct(colorText), [colorText]);

  const handleCopy = (text: string, label: string) => {
    copyToClipboard(text);
    message.success(`已复制${label}`);
  };

  const activeMode = MODE_OPTIONS.find((option) => option.value === mode);

  return (
    <div className={styles.container}>
      <Radio.Group
        optionType="button"
        buttonStyle="solid"
        value={mode}
        options={MODE_OPTIONS.map((option) => ({ value: option.value, label: option.label }))}
        onChange={(e) => setMode(e.target.value as Mode)}
      />

      {mode === 'kelvin-to-color' ? (
        <div className={styles.panels}>
          <Card className={styles.card} title="色温输入（开尔文 K）">
            <div className={styles.controls}>
              <InputNumber
                min={MIN_KELVIN}
                max={MAX_KELVIN}
                step={100}
                value={kelvin}
                onChange={(value) => {
                  if (typeof value === 'number') setKelvin(value);
                }}
                addonAfter="K"
                style={{ width: '100%' }}
              />
              <Slider
                min={MIN_KELVIN}
                max={MAX_KELVIN}
                step={50}
                value={kelvin}
                onChange={(value) => setKelvin(value)}
                tooltip={{ formatter: (value) => `${value} K` }}
              />
              <div className={styles.presets}>
                {KELVIN_PRESETS.map((preset) => (
                  <Button
                    key={preset.kelvin}
                    size="small"
                    type={kelvin === preset.kelvin ? 'primary' : 'default'}
                    onClick={() => setKelvin(preset.kelvin)}
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
              <Alert
                type="info"
                showIcon
                message={
                  <>
                    有效范围 {MIN_KELVIN}–{MAX_KELVIN}K（Tanner Helland 黑体辐射近似），超出自动裁剪到边界
                  </>
                }
              />
            </div>
          </Card>

          <Card className={styles.card} title="对应颜色">
            <div className={styles.swatch} style={{ backgroundColor: hex }} />
            <div className={styles.swatchMeta}>
              <Tag color="orange">{describeKelvin(kelvin)}</Tag>
              <div className={styles.metaRow}>
                <span className={styles.hint}>HEX</span>
                <span className={styles.metaValue}>{hex}</span>
                <Button
                  size="small"
                  icon={<CopyOutlined />}
                  onClick={() => handleCopy(hex, 'HEX 值')}
                >
                  复制
                </Button>
              </div>
              <div className={styles.metaRow}>
                <span className={styles.hint}>RGB</span>
                <span className={styles.metaValue}>{rgbCss}</span>
                <Button
                  size="small"
                  icon={<CopyOutlined />}
                  onClick={() => handleCopy(rgbCss, 'RGB 值')}
                >
                  复制
                </Button>
              </div>
            </div>
          </Card>
        </div>
      ) : (
        <div className={styles.panels}>
          <Card className={styles.card} title="颜色输入">
            <div className={styles.controls}>
              <Input
                value={colorText}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setColorText(e.target.value)}
                spellCheck={false}
                placeholder="#RRGGBB、#RGB 或 rgb(r, g, b)"
              />
              <div className={styles.presets}>
                {KELVIN_PRESETS.map((preset) => {
                  const presetHex = rgbToHex(kelvinToRgb(preset.kelvin));
                  return (
                    <Button
                      key={preset.kelvin}
                      size="small"
                      onClick={() => setColorText(presetHex)}
                    >
                      {preset.label}
                    </Button>
                  );
                })}
              </div>
              <Alert
                type="info"
                showIcon
                message="按 McCamy (1992) 公式估算相关色温（CCT）：sRGB 先解伽马转为线性，再经 CIE XYZ 色度坐标计算"
              />
            </div>
          </Card>

          <Card className={styles.card} title="相关色温（CCT）">
            {cctResult.error ? (
              <Alert type="error" showIcon message={cctResult.error} />
            ) : (
              <>
                <div
                  className={styles.swatch}
                  style={{ backgroundColor: colorText.trim().toLowerCase() }}
                />
                <div className={styles.swatchMeta}>
                  <div className={styles.kelvinResult}>{cctResult.cct} K</div>
                  <Tag color="blue">
                    {describeKelvin(
                      Math.min(MAX_KELVIN, Math.max(MIN_KELVIN, cctResult.cct ?? 0)),
                    )}
                  </Tag>
                  <Button
                    size="small"
                    icon={<CopyOutlined />}
                    onClick={() => handleCopy(String(cctResult.cct), '色温值')}
                  >
                    复制色温值
                  </Button>
                  <span className={styles.hint}>
                    结果为近似值；对远离黑体轨迹的颜色（如品红、高饱和绿）物理意义较弱
                  </span>
                </div>
              </>
            )}
          </Card>
        </div>
      )}

      <div className={styles.toolbar}>
        <span className={styles.hint}>{activeMode?.hint}</span>
      </div>
    </div>
  );
};

export default ColorTemperatureConverter;
