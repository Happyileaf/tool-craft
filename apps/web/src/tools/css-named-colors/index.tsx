'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Button, Card, Empty, Input, Segmented, Space, Tag, Tooltip, message } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import {
  NAMED_COLORS,
  NAMED_COLOR_BY_NAME,
  SPECIAL_KEYWORDS,
  type NamedColor,
} from './utils/namedColorsData';
import {
  filterByName,
  findNearestNamedColors,
  formatHsl,
  formatRgb,
  parseColorInput,
  sortColors,
  type ColorSortMode,
  type NearestColor,
} from './utils/namedColors';
import { QUICK_SAMPLES, SEARCH_PLACEHOLDER } from './constants';
import { copyToClipboard } from '@/lib/utils';
import styles from './index.module.css';

/** 判断文本是否为纯名称查询（不含颜色值符号） */
function isNameQuery(text: string): boolean {
  const value = text.trim();
  return value.length > 0 && !/[#0-9(),%\s]/.test(value);
}

/** 单张颜色卡片 */
function ColorCard({ color }: { color: NamedColor }) {
  const values: { label: string; text: string }[] = [
    { label: 'HEX', text: color.hex },
    { label: 'RGB', text: formatRgb(color) },
    { label: 'HSL', text: formatHsl(color) },
  ];

  const handleCopy = (text: string) => {
    copyToClipboard(text);
    message.success(`已复制 ${text}`);
  };

  // 深色背景用白字，浅色背景用黑字，保证色块文字可读
  const luminance = (0.299 * color.rgb.r + 0.587 * color.rgb.g + 0.114 * color.rgb.b) / 255;
  const swatchTextColor = luminance > 0.6 ? 'rgba(0,0,0,0.75)' : '#ffffff';

  return (
    <div className={styles.colorCard}>
      <button
        type="button"
        className={styles.swatch}
        style={{ backgroundColor: color.hex, color: swatchTextColor }}
        onClick={() => handleCopy(color.hex)}
        title={`点击复制 ${color.hex}`}
      >
        <span>{color.hex}</span>
        {color.basic ? <span className={styles.basicBadge}>Basic</span> : null}
      </button>
      <div className={styles.colorMeta}>
        <button
          type="button"
          className={styles.colorName}
          onClick={() => handleCopy(color.name)}
          title={`点击复制名称 ${color.name}`}
        >
          {color.name}
        </button>
        {values.map((item) => (
          <button
            key={item.label}
            type="button"
            className={styles.colorValue}
            onClick={() => handleCopy(item.text)}
          >
            <span className={styles.valueLabel}>{item.label}</span>
            <span className={styles.valueText}>{item.text}</span>
            <CopyOutlined className={styles.copyIcon} />
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * CSS 命名颜色速查：内置 W3C 标准 148 个命名颜色，支持名称/值搜索、
 * 任意颜色值反查最近命名色、基础色与扩展色分区、字母/色相排序与一键复制。
 *
 * @returns CSS 命名颜色查询界面
 */
const CssNamedColors: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [query, setQuery] = React.useState(defaultInput || '');
  const [sortMode, setSortMode] = React.useState<ColorSortMode>('alphabetical');

  const parsed = React.useMemo(() => (query.trim() ? parseColorInput(query) : null), [query]);

  // 名称命中（名称查询或可解析颜色名时）
  const nameMatches = React.useMemo(() => {
    if (!query.trim()) {
      return NAMED_COLORS;
    }
    if (isNameQuery(query)) {
      return filterByName(query);
    }
    return [];
  }, [query]);

  // 反查结果：输入合法颜色值时计算最近 3 个命名色
  const nearest: NearestColor[] = React.useMemo(() => {
    if (parsed?.ok && parsed.rgb) {
      return findNearestNamedColors(parsed.rgb, 3);
    }
    return [];
  }, [parsed]);

  // 网格展示数据：名称查询用过滤结果；纯值反查时展示最近命名色；默认全量
  const gridColors = React.useMemo(() => {
    if (!query.trim()) {
      return sortColors(NAMED_COLORS, sortMode);
    }
    if (isNameQuery(query)) {
      return sortColors(nameMatches, sortMode);
    }
    if (parsed?.ok) {
      return sortColors(
        nearest.map((item) => item.color),
        sortMode,
      );
    }
    return [];
  }, [query, nameMatches, parsed, nearest, sortMode]);

  const basicColors = React.useMemo(
    () => gridColors.filter((color) => color.basic),
    [gridColors],
  );
  const extendedColors = React.useMemo(
    () => gridColors.filter((color) => !color.basic),
    [gridColors],
  );

  const exactName = query.trim().toLowerCase();
  const exactNamed = NAMED_COLOR_BY_NAME[exactName];

  return (
    <div className={styles.container}>
      <Card title="CSS 命名颜色速查（148 色，CSS Color Module Level 4）">
        <Input
          allowClear
          spellCheck={false}
          className={styles.search}
          placeholder={SEARCH_PLACEHOLDER}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <Space size={[8, 8]} wrap className={styles.samples}>
          {QUICK_SAMPLES.map((sample) => (
            <Button key={sample} size="small" onClick={() => setQuery(sample)}>
              {sample}
            </Button>
          ))}
        </Space>
        <div className={styles.toolbar}>
          <span className={styles.count}>共 {gridColors.length} 条</span>
          <Segmented
            value={sortMode}
            onChange={(value) => setSortMode(value as ColorSortMode)}
            options={[
              { label: '字母排序', value: 'alphabetical' },
              { label: '色相排序', value: 'hue' },
            ]}
          />
        </div>
        {parsed && !parsed.ok ? (
          <Alert type="error" showIcon className={styles.alert} message={parsed.error} />
        ) : null}
        {exactNamed ? (
          <Alert
            type="success"
            showIcon
            className={styles.alert}
            message={`「${exactNamed.name}」是标准命名颜色，HEX 为 ${exactNamed.hex}`}
          />
        ) : null}
      </Card>

      {parsed?.ok && nearest.length > 0 ? (
        <Card className={styles.card} title="最接近的命名颜色（RGB 欧氏距离）">
          <div className={styles.nearestList}>
            {nearest.map((item, index) => (
              <div key={item.color.name} className={styles.nearestItem}>
                <Tag color={index === 0 ? 'gold' : 'default'}>#{index + 1}</Tag>
                <span
                  className={styles.nearestSwatch}
                  style={{ backgroundColor: item.color.hex }}
                />
                <span className={styles.nearestName}>{item.color.name}</span>
                <span className={styles.muted}>{item.color.hex}</span>
                <Tooltip title="点击复制命名颜色值">
                  <Button
                    size="small"
                    icon={<CopyOutlined />}
                    onClick={() => {
                      copyToClipboard(item.color.hex);
                      message.success(`已复制 ${item.color.hex}`);
                    }}
                  >
                    复制
                  </Button>
                </Tooltip>
                <span className={styles.distance}>距离 {item.distance.toFixed(1)}</span>
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      {gridColors.length === 0 ? (
        <Card className={styles.card}>
          <Empty description="没有匹配的命名颜色" />
        </Card>
      ) : (
        <>
          {basicColors.length > 0 ? (
            <Card className={styles.card} title={`基础 16 色（${basicColors.length}）`}>
              <div className={styles.grid}>
                {basicColors.map((color) => (
                  <ColorCard key={color.name} color={color} />
                ))}
              </div>
            </Card>
          ) : null}
          {extendedColors.length > 0 ? (
            <Card className={styles.card} title={`扩展命名色（${extendedColors.length}）`}>
              <div className={styles.grid}>
                {extendedColors.map((color) => (
                  <ColorCard key={color.name} color={color} />
                ))}
              </div>
            </Card>
          ) : null}
        </>
      )}

      <Card className={styles.card} title="特殊颜色关键字（非命名色值）">
        <Space direction="vertical" size={6}>
          {SPECIAL_KEYWORDS.map((item) => (
            <div key={item.name} className={styles.specialRow}>
              <code className={styles.code}>{item.name}</code>
              <span className={styles.muted}>{item.note}</span>
            </div>
          ))}
        </Space>
        <p className={styles.hint}>全部数据内置在前端，离线可用；点击色块、名称或数值即可复制。</p>
      </Card>
    </div>
  );
};

export default CssNamedColors;
