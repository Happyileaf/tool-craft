'use client';

import React from 'react';
import { Alert, Button, Card, Checkbox, InputNumber, message, Slider } from 'antd';
import { Copy, RotateCcw, ScrollText } from 'lucide-react';
import { copyToClipboard } from '@/lib/utils';
import {
  DEFAULT_SCROLLBAR,
  RADIUS_MAX,
  RADIUS_MIN,
  SCROLLBAR_PRESETS,
  WIDTH_MAX,
  WIDTH_MIN,
  WIDTH_STEP,
} from './constants';
import {
  buildScrollbarCss,
  validateScrollbar,
  type ScrollbarConfig,
} from './utils/scrollbar';
import styles from './index.module.css';

const CssScrollbarGenerator: React.FC = () => {
  const [config, setConfig] = React.useState<ScrollbarConfig>(DEFAULT_SCROLLBAR);

  const error = React.useMemo(() => validateScrollbar(config), [config]);
  const css = React.useMemo(() => buildScrollbarCss(config), [config]);

  const patch = (partial: Partial<ScrollbarConfig>) =>
    setConfig((previous) => ({ ...previous, ...partial }));

  // 仅作用于预览容器的局部样式（含 WebKit 伪元素，无法用 CSS Module 表达动态值）
  const previewStyle = `
    .preview-scroll::-webkit-scrollbar { width: ${config.width}px; height: ${config.width}px; }
    .preview-scroll::-webkit-scrollbar-track { background: ${config.trackColor}; border-radius: ${config.trackRadius}px; }
    .preview-scroll::-webkit-scrollbar-thumb { background: ${config.thumbColor}; border-radius: ${config.thumbRadius}px; }
    .preview-scroll::-webkit-scrollbar-thumb:hover { background: ${config.thumbHoverColor}; }
    .preview-scroll { scrollbar-width: ${config.width <= 8 ? 'thin' : 'auto'}; scrollbar-color: ${config.thumbColor} ${config.trackColor}; }
  `;

  return (
    <div className={styles.container}>
      <style>{previewStyle}</style>
      <Alert
        type="info"
        showIcon
        message="CSS Scrollbar 滚动条样式生成器"
        description="同时输出两套 CSS：WebKit 私有伪元素（Chrome/Edge/Safari）与标准 scrollbar-width、scrollbar-color（Firefox）。所有配色与尺寸均在浏览器本地处理。"
      />

      <div className={styles.layout}>
        <Card
          size="small"
          title={
            <span>
              <ScrollText size={14} style={{ marginRight: 6, verticalAlign: -2 }} />
              参数配置
            </span>
          }
        >
          <div className={styles.presets} style={{ marginBottom: 16 }}>
            {SCROLLBAR_PRESETS.map((preset) => (
              <Button
                key={preset.key}
                size="small"
                onClick={() =>
                  patch({
                    trackColor: preset.trackColor,
                    thumbColor: preset.thumbColor,
                    thumbHoverColor: preset.thumbHoverColor,
                  })
                }
              >
                <span className={styles.presetDot}>
                  <span className={styles.dot} style={{ background: preset.thumbColor }} />
                  {preset.label}
                </span>
              </Button>
            ))}
          </div>

          <label className={styles.fieldLabel} style={{ marginBottom: 12 }}>
            滚动条宽度（WebKit 像素）：{config.width}px
            <Slider
              min={WIDTH_MIN}
              max={WIDTH_MAX}
              step={WIDTH_STEP}
              value={config.width}
              onChange={(value) => patch({ width: value })}
            />
          </label>

          <div className={styles.fields}>
            <label className={styles.fieldLabel}>
              轨道颜色 track
              <span className={styles.colorRow}>
                <input
                  type="color"
                  className={styles.colorSwatch}
                  value={config.trackColor}
                  onChange={(e) => patch({ trackColor: e.target.value })}
                />
                <code>{config.trackColor}</code>
              </span>
            </label>
            <label className={styles.fieldLabel}>
              滑块颜色 thumb
              <span className={styles.colorRow}>
                <input
                  type="color"
                  className={styles.colorSwatch}
                  value={config.thumbColor}
                  onChange={(e) => patch({ thumbColor: e.target.value })}
                />
                <code>{config.thumbColor}</code>
              </span>
            </label>
            <label className={styles.fieldLabel}>
              滑块 hover 颜色
              <span className={styles.colorRow}>
                <input
                  type="color"
                  className={styles.colorSwatch}
                  value={config.thumbHoverColor}
                  onChange={(e) => patch({ thumbHoverColor: e.target.value })}
                />
                <code>{config.thumbHoverColor}</code>
              </span>
            </label>
            <label className={styles.fieldLabel}>
              显示两端按钮（WebKit）
              <Checkbox
                checked={config.showButtons}
                onChange={(e) => patch({ showButtons: e.target.checked })}
              >
                启用 scrollbar-button
              </Checkbox>
            </label>
          </div>

          <div className={styles.fields} style={{ marginTop: 12 }}>
            <label className={styles.fieldLabel}>
              滑块圆角（px）
              <InputNumber
                min={RADIUS_MIN}
                max={RADIUS_MAX}
                value={config.thumbRadius}
                onChange={(value) => patch({ thumbRadius: value ?? 0 })}
                style={{ width: '100%' }}
              />
            </label>
            <label className={styles.fieldLabel}>
              轨道圆角（px）
              <InputNumber
                min={RADIUS_MIN}
                max={RADIUS_MAX}
                value={config.trackRadius}
                onChange={(value) => patch({ trackRadius: value ?? 0 })}
                style={{ width: '100%' }}
              />
            </label>
          </div>

          {error ? (
            <Alert style={{ marginTop: 12 }} type="error" showIcon message={error} />
          ) : null}

          <Button style={{ marginTop: 12 }} icon={<RotateCcw size={14} />} onClick={() => setConfig(DEFAULT_SCROLLBAR)}>
            重置默认
          </Button>

          <div style={{ marginTop: 16 }}>
            <div className={styles.fieldLabel} style={{ marginBottom: 6 }}>
              实时预览（滚动查看效果）
            </div>
            <div className={`${styles.previewBox} preview-scroll`}>
              {Array.from({ length: 12 }, (_, i) => (
                <div key={i} className={styles.previewLine}>
                  预览内容行 {i + 1}：滚动容器内的真实滚动条效果
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card
          size="small"
          title={
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>生成的 CSS</span>
              <Button
                size="small"
                icon={<Copy size={14} />}
                disabled={Boolean(error)}
                onClick={() => {
                  copyToClipboard(css);
                  message.success('已复制滚动条 CSS');
                }}
              >
                复制
              </Button>
            </div>
          }
        >
          <div className={styles.codeBox}>
            <code className={styles.codeText}>{css}</code>
          </div>
          <Alert
            style={{ marginTop: 12 }}
            type="warning"
            showIcon
            message="兼容性说明"
            description="::-webkit-scrollbar 为 WebKit/Blink 私有属性，Chrome、Edge、Safari 支持；scrollbar-width 与 scrollbar-color 为 W3C 标准，Firefox 支持。两套同时输出可获得最广覆盖。"
          />
        </Card>
      </div>
    </div>
  );
};

export default CssScrollbarGenerator;
