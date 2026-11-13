'use client';

import React from 'react';
import { Alert, Button, Card, Checkbox, Empty, message, Slider } from 'antd';
import { Copy, Plus, Trash2, Wand2 } from 'lucide-react';
import { copyToClipboard } from '@/lib/utils';
import {
  BLUR_MAX,
  BLUR_MIN,
  createEmptyLayer,
  DEFAULT_LAYERS,
  LIGHT_BG,
  OFFSET_MAX,
  OFFSET_MIN,
  PREVIEW_BACKGROUNDS,
  PREVIEW_TEXT,
  TEXT_SHADOW_PRESETS,
} from './constants';
import {
  buildTextShadow,
  buildTextShadowDeclaration,
  validateLayer,
  type TextShadowLayer,
} from './utils/textShadow';
import styles from './index.module.css';

const TextShadowGenerator: React.FC = () => {
  const [layers, setLayers] = React.useState<TextShadowLayer[]>(DEFAULT_LAYERS);
  const [bg, setBg] = React.useState(LIGHT_BG);

  const errors = React.useMemo(() => layers.map(validateLayer), [layers]);
  const shadowValue = React.useMemo(() => buildTextShadow(layers), [layers]);
  const declaration = React.useMemo(() => buildTextShadowDeclaration(layers), [layers]);
  const isDark = bg !== LIGHT_BG;

  const patchLayer = (index: number, patch: Partial<TextShadowLayer>) => {
    setLayers((previous) =>
      previous.map((layer, i) => (i === index ? { ...layer, ...patch } : layer)),
    );
  };

  const addLayer = () => setLayers((previous) => [...previous, createEmptyLayer()]);

  const removeLayer = (index: number) => {
    setLayers((previous) => previous.filter((_, i) => i !== index));
  };

  const applyPreset = (key: string) => {
    const preset = TEXT_SHADOW_PRESETS.find((item) => item.key === key);
    if (preset) setLayers(preset.layers.map((layer) => ({ ...layer })));
  };

  return (
    <div className={styles.container}>
      <Alert
        type="info"
        showIcon
        message="CSS text-shadow 多层文字阴影生成器"
        description="叠加多层文字阴影，分别调节水平/垂直偏移、模糊半径与颜色，实时预览并复制 text-shadow CSS。与盒阴影（box-shadow）不同，text-shadow 不支持扩散半径与 inset。"
      />

      <div className={styles.layout}>
        <div>
          <div className={styles.presets}>
            {TEXT_SHADOW_PRESETS.map((preset) => (
              <Button key={preset.key} size="small" onClick={() => applyPreset(preset.key)}>
                <Wand2 size={13} style={{ marginRight: 4, verticalAlign: -2 }} />
                {preset.label}
              </Button>
            ))}
          </div>

          {layers.map((layer, index) => (
            <Card
              key={index}
              size="small"
              className={styles.layerCard}
              title={
                <div className={styles.layerHeader}>
                  <Checkbox
                    checked={layer.enabled}
                    onChange={(e) => patchLayer(index, { enabled: e.target.checked })}
                  >
                    阴影层 {index + 1}
                  </Checkbox>
                  <Button
                    size="small"
                    danger
                    icon={<Trash2 size={14} />}
                    disabled={layers.length <= 1}
                    onClick={() => removeLayer(index)}
                  >
                    删除
                  </Button>
                </div>
              }
            >
              <div className={styles.sliderRow}>
                <label className={styles.sliderField}>
                  X 偏移：{layer.offsetX}px
                  <Slider
                    min={OFFSET_MIN}
                    max={OFFSET_MAX}
                    value={layer.offsetX}
                    onChange={(value) => patchLayer(index, { offsetX: value })}
                  />
                </label>
                <label className={styles.sliderField}>
                  Y 偏移：{layer.offsetY}px
                  <Slider
                    min={OFFSET_MIN}
                    max={OFFSET_MAX}
                    value={layer.offsetY}
                    onChange={(value) => patchLayer(index, { offsetY: value })}
                  />
                </label>
                <label className={styles.sliderField}>
                  模糊：{layer.blur}px
                  <Slider
                    min={BLUR_MIN}
                    max={BLUR_MAX}
                    value={layer.blur}
                    onChange={(value) => patchLayer(index, { blur: value })}
                  />
                </label>
              </div>
              <div className={styles.colorRow}>
                <input
                  type="color"
                  className={styles.colorSwatch}
                  value={layer.color.length === 7 ? layer.color : '#000000'}
                  onChange={(e) => patchLayer(index, { color: e.target.value })}
                />
                <code>{layer.color}</code>
              </div>
              {errors[index] ? (
                <Alert style={{ marginTop: 10 }} type="error" showIcon message={errors[index]} />
              ) : null}
            </Card>
          ))}

          <Button type="primary" icon={<Plus size={14} />} onClick={addLayer}>
            添加阴影层
          </Button>
        </div>

        <Card size="small" title="预览与输出">
          <div className={styles.bgSwitch}>
            {PREVIEW_BACKGROUNDS.map((item) => (
              <Button
                key={item.key}
                size="small"
                type={bg === item.value ? 'primary' : 'default'}
                onClick={() => setBg(item.value)}
              >
                {item.label}
              </Button>
            ))}
          </div>
          <div className={styles.preview} style={{ background: bg }}>
            <span
              className={styles.previewText}
              style={{
                color: isDark ? '#f8fafc' : '#1e293b',
                textShadow: shadowValue || 'none',
              }}
            >
              {PREVIEW_TEXT}
            </span>
          </div>

          <div style={{ marginTop: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span>生成的 CSS</span>
              <Button
                size="small"
                icon={<Copy size={14} />}
                disabled={!declaration}
                onClick={() => {
                  copyToClipboard(declaration);
                  message.success('已复制 text-shadow CSS');
                }}
              >
                复制
              </Button>
            </div>
            {declaration ? (
              <div className={styles.codeBox}>
                <code className={styles.codeText}>{declaration}</code>
              </div>
            ) : (
              <Empty description="暂无启用的阴影层" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default TextShadowGenerator;
