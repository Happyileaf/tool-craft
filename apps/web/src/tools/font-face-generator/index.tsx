'use client';

import React from 'react';
import { Alert, Button, Card, Empty, Input, message, Select } from 'antd';
import { Copy, Plus, Trash2, Type } from 'lucide-react';
import { copyToClipboard } from '@/lib/utils';
import {
  createEmptyFace,
  DEFAULT_FONT_FACES,
  FONT_DISPLAY_OPTIONS,
  FONT_FORMAT_OPTIONS,
  FONT_STYLE_OPTIONS,
  FONT_WEIGHT_OPTIONS,
} from './constants';
import {
  buildFontFaceBundle,
  validateFontFace,
  type FontFaceConfig,
  type FontSource,
} from './utils/fontFace';
import styles from './index.module.css';

const FontFaceGenerator: React.FC = () => {
  const [faces, setFaces] = React.useState<FontFaceConfig[]>(DEFAULT_FONT_FACES);

  const errors = React.useMemo(() => faces.map(validateFontFace), [faces]);
  const css = React.useMemo(() => buildFontFaceBundle(faces), [faces]);
  const firstFamily = faces[0]?.family || 'MyFont';

  const patchFace = (index: number, patch: Partial<FontFaceConfig>) => {
    setFaces((previous) =>
      previous.map((face, i) => (i === index ? { ...face, ...patch } : face)),
    );
  };

  const patchSource = (faceIndex: number, sourceIndex: number, patch: Partial<FontSource>) => {
    setFaces((previous) =>
      previous.map((face, i) => {
        if (i !== faceIndex) return face;
        const sources = face.sources.map((source, j) =>
          j === sourceIndex ? { ...source, ...patch } : source,
        );
        return { ...face, sources };
      }),
    );
  };

  const addSource = (faceIndex: number) => {
    setFaces((previous) =>
      previous.map((face, i) =>
        i === faceIndex ? { ...face, sources: [...face.sources, { url: '', format: 'woff2' }] } : face,
      ),
    );
  };

  const removeSource = (faceIndex: number, sourceIndex: number) => {
    setFaces((previous) =>
      previous.map((face, i) =>
        i === faceIndex
          ? { ...face, sources: face.sources.filter((_, j) => j !== sourceIndex) }
          : face,
      ),
    );
  };

  const addFace = () => setFaces((previous) => [...previous, createEmptyFace(firstFamily)]);

  const removeFace = (index: number) => {
    setFaces((previous) => previous.filter((_, i) => i !== index));
  };

  const reset = () => setFaces(DEFAULT_FONT_FACES);

  return (
    <div className={styles.container}>
      <Alert
        type="info"
        showIcon
        message="@font-face 声明生成器"
        description="为同一字体家族配置多个字重与多种资源格式，自动按现代格式在前的顺序拼装 src，并统一设置 font-display。所有处理均在浏览器本地完成。"
      />

      <div className={styles.layout}>
        <div>
          {faces.map((face, faceIndex) => (
            <Card
              key={faceIndex}
              size="small"
              className={styles.faceCard}
              title={
                <div className={styles.faceHeader}>
                  <span>
                    <Type size={14} style={{ marginRight: 6, verticalAlign: -2 }} />
                    字重 {faceIndex + 1}
                  </span>
                  <Button
                    size="small"
                    danger
                    icon={<Trash2 size={14} />}
                    disabled={faces.length <= 1}
                    onClick={() => removeFace(faceIndex)}
                  >
                    删除字重
                  </Button>
                </div>
              }
            >
              <div className={styles.fields}>
                <label className={styles.fieldLabel}>
                  font-family
                  <Input
                    value={face.family}
                    placeholder="例如 MyFont"
                    onChange={(e) => patchFace(faceIndex, { family: e.target.value })}
                  />
                </label>
                <label className={styles.fieldLabel}>
                  font-weight
                  <Select
                    value={face.weight}
                    options={FONT_WEIGHT_OPTIONS}
                    showSearch
                    onChange={(value) => patchFace(faceIndex, { weight: value })}
                  />
                </label>
                <label className={styles.fieldLabel}>
                  font-style
                  <Select
                    value={face.style}
                    options={FONT_STYLE_OPTIONS}
                    onChange={(value) => patchFace(faceIndex, { style: value })}
                  />
                </label>
                <label className={styles.fieldLabel}>
                  font-display
                  <Select
                    value={face.display}
                    options={FONT_DISPLAY_OPTIONS}
                    onChange={(value) => patchFace(faceIndex, { display: value })}
                  />
                </label>
              </div>

              <div style={{ marginTop: 12 }}>
                <div className={styles.fieldLabel} style={{ marginBottom: 6 }}>
                  src 资源（建议 woff2 在前，按优先级排序）
                </div>
                {face.sources.map((source, sourceIndex) => (
                  <div className={styles.sourceRow} key={sourceIndex}>
                    <Input
                      value={source.url}
                      placeholder="/fonts/MyFont.woff2"
                      onChange={(e) =>
                        patchSource(faceIndex, sourceIndex, { url: e.target.value })
                      }
                    />
                    <Select
                      value={source.format}
                      options={FONT_FORMAT_OPTIONS}
                      onChange={(value) =>
                        patchSource(faceIndex, sourceIndex, { format: value })
                      }
                    />
                    <Button
                      icon={<Trash2 size={14} />}
                      disabled={face.sources.length <= 1}
                      onClick={() => removeSource(faceIndex, sourceIndex)}
                    />
                  </div>
                ))}
                <Button size="small" icon={<Plus size={14} />} onClick={() => addSource(faceIndex)}>
                  添加格式
                </Button>
              </div>

              <div style={{ marginTop: 12 }}>
                <label className={styles.fieldLabel}>
                  unicode-range（可选，留空不输出）
                  <Input
                    value={face.unicodeRange}
                    placeholder="U+0000-00FF, U+0131"
                    onChange={(e) => patchFace(faceIndex, { unicodeRange: e.target.value })}
                  />
                </label>
              </div>

              {errors[faceIndex] ? (
                <Alert style={{ marginTop: 12 }} type="error" showIcon message={errors[faceIndex]} />
              ) : null}
            </Card>
          ))}

          <div className={styles.toolbar}>
            <Button type="primary" icon={<Plus size={14} />} onClick={addFace}>
              添加字重
            </Button>
            <Button onClick={reset}>重置示例</Button>
          </div>
        </div>

        <Card
          size="small"
          title={
            <div className={styles.faceHeader}>
              <span>生成的 CSS</span>
              <Button
                size="small"
                icon={<Copy size={14} />}
                disabled={!css}
                onClick={() => {
                  copyToClipboard(css);
                  message.success('已复制 @font-face CSS');
                }}
              >
                复制
              </Button>
            </div>
          }
        >
          {css ? (
            <div className={styles.codeBox}>
              <code className={styles.codeText}>{css}</code>
            </div>
          ) : (
            <Empty description="暂无有效配置" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          )}
          <div style={{ marginTop: 16 }}>
            <div className={styles.fieldLabel} style={{ marginBottom: 6 }}>
              应用预览（font-family: {firstFamily || '未命名'}）
            </div>
            <div className={styles.previewText} style={{ fontFamily: `"${firstFamily}", sans-serif` }}>
              The quick brown fox 你好世界 0123456789
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default FontFaceGenerator;
