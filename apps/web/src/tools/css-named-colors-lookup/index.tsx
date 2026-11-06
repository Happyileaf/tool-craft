'use client';

import React, { useMemo, useState } from 'react';
import type { ToolComponentProps } from '../loaders';
import {
  Alert,
  Card,
  Empty,
  Input,
  Radio,
  Segmented,
  Space,
  Tag,
  Tooltip,
  Typography,
  message,
} from 'antd';
import {
  NAMED_COLORS,
  SPECIAL_KEYWORDS,
  type NamedColor,
} from './utils/named-colors';
import {
  findNearestColors,
  lookupByHex,
  parseColorInput,
  rgbToHsl,
  searchByName,
  sortByHue,
  toHslString,
} from './utils/color-search';
import {
  DATA_SOURCE_HINT,
  GROUP_OPTIONS,
  SEARCH_PLACEHOLDER,
  SORT_OPTIONS,
  TOOL_TITLE,
  type GroupKey,
  type SortKey,
} from './constants';
import styles from './index.module.css';

const { Text, Paragraph } = Typography;

/** 判断 HEX 颜色的前景文字应用黑还是白（相对亮度阈值） */
function readableTextColor(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? 'rgba(0,0,0,0.85)' : '#ffffff';
}

/** 单个色卡：点击复制 HEX */
function ColorSwatch({ color, onCopy }: { color: NamedColor; onCopy: (value: string) => void }): React.ReactElement {
  const foreground = readableTextColor(color.hex);
  const [, s, l] = rgbToHsl(color.rgb);
  return (
    <Tooltip title="点击复制 HEX 值">
      <div
        className={styles.swatchCard}
        role="button"
        tabIndex={0}
        onClick={() => onCopy(color.hex)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            onCopy(color.hex);
          }
        }}
      >
        <div className={styles.swatchBlock} style={{ background: color.hex, color: foreground }}>
          <span>{color.hex}</span>
          {color.basic && <span className={styles.basicBadge}>基础</span>}
        </div>
        <div className={styles.swatchMeta}>
          <span className={styles.colorName}>{color.name}</span>
          <span className={styles.colorValue}>
            rgb({color.rgb[0]}, {color.rgb[1]}, {color.rgb[2]}) · S{s}% L{l}%
          </span>
        </div>
      </div>
    </Tooltip>
  );
}

/**
 * CSS 命名颜色速查：名称 / 值双模式搜索、色卡浏览与最近命名色反查，
 * 所有计算在浏览器本地完成。
 */
const CssNamedColorsLookup: React.FC<ToolComponentProps> = () => {
  const [keyword, setKeyword] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('alpha');
  const [groupKey, setGroupKey] = useState<GroupKey>('all');
  const [messageApi, contextHolder] = message.useMessage();

  const parsedInput = useMemo(() => (keyword.trim() ? parseColorInput(keyword) : null), [keyword]);

  /** 按名称搜索的色卡列表（应用分组与排序） */
  const listedColors = useMemo(() => {
    const byName = searchByName(keyword.startsWith('#') || keyword.includes('(') ? '' : keyword);
    const grouped = byName.filter((color) => {
      if (groupKey === 'basic') {
        return color.basic;
      }
      if (groupKey === 'extended') {
        return !color.basic;
      }
      return true;
    });
    return sortKey === 'hue' ? sortByHue(grouped) : grouped;
  }, [keyword, groupKey, sortKey]);

  /** 输入颜色值时的精确命中与反查结果 */
  const valueLookup = useMemo(() => {
    if (!parsedInput || !parsedInput.ok || !parsedInput.rgb) {
      return null;
    }
    const exactHex = lookupByHex(`#${parsedInput.rgb.map((v) => v.toString(16).padStart(2, '0')).join('')}`);
    return {
      rgb: parsedInput.rgb,
      exact: exactHex,
      nearest: findNearestColors(parsedInput.rgb, 5),
    };
  }, [parsedInput]);

  const handleCopy = (value: string): void => {
    void navigator.clipboard
      .writeText(value)
      .then(() => messageApi.success(`已复制 ${value}`))
      .catch(() => messageApi.error('复制失败，请手动选择文本复制'));
  };

  return (
    <div className={styles.container}>
      {contextHolder}
      <Card title={TOOL_TITLE}>
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <Input.Search
            className={styles.searchInput}
            size="large"
            allowClear
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder={SEARCH_PLACEHOLDER}
            enterButton="搜索"
          />
          <div className={styles.toolbar}>
            <Radio.Group
              optionType="button"
              buttonStyle="solid"
              value={groupKey}
              onChange={(event) => setGroupKey(event.target.value as GroupKey)}
              options={GROUP_OPTIONS.map((item) => ({ value: item.value, label: item.label }))}
            />
            <Segmented
              value={sortKey}
              onChange={(value) => setSortKey(value as SortKey)}
              options={SORT_OPTIONS.map((item) => ({ value: item.value, label: item.label }))}
            />
          </div>
          <p className={styles.hint}>{DATA_SOURCE_HINT}</p>
        </Space>
      </Card>

      {parsedInput && !parsedInput.ok && (
        <Alert type="warning" showIcon message="颜色值解析提示" description={parsedInput.error} />
      )}

      {valueLookup && (
        <Card
          title={
            <Space>
              <span>颜色值反查</span>
              <span
                className={styles.nearestSwatch}
                style={{
                  background: `rgb(${valueLookup.rgb[0]}, ${valueLookup.rgb[1]}, ${valueLookup.rgb[2]})`,
                  display: 'inline-block',
                }}
              />
              <Text code>
                rgb({valueLookup.rgb[0]}, {valueLookup.rgb[1]}, {valueLookup.rgb[2]})
              </Text>
              <Text code>{toHslString(valueLookup.rgb)}</Text>
            </Space>
          }
        >
          {valueLookup.exact ? (
            <Alert
              type="success"
              showIcon
              message={`精确命中命名颜色「${valueLookup.exact.name}」`}
              style={{ marginBottom: 12 }}
            />
          ) : (
            <Alert
              type="info"
              showIcon
              message="该值不是任何命名颜色，以下是 RGB 空间中最接近的 5 个命名颜色"
              style={{ marginBottom: 12 }}
            />
          )}
          {valueLookup.nearest.map((item) => (
            <div className={styles.nearestRow} key={item.color.name}>
              <span
                className={styles.nearestSwatch}
                style={{ background: item.color.hex }}
                onClick={() => handleCopy(item.color.hex)}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    handleCopy(item.color.hex);
                  }
                }}
              />
              <div>
                <div className={styles.nearestName}>
                  {item.color.name}
                  {item.distance === 0 && <Tag color="success" style={{ marginInlineStart: 8 }}>完全一致</Tag>}
                </div>
                <div className={styles.nearestDetail}>
                  {item.color.hex} · rgb({item.color.rgb[0]}, {item.color.rgb[1]}, {item.color.rgb[2]}) ·
                  距离 {item.distance.toFixed(2)}
                </div>
              </div>
            </div>
          ))}
        </Card>
      )}

      <Card title={`颜色列表（${listedColors.length}）`}>
        {listedColors.length === 0 ? (
          <Empty description="没有匹配的命名颜色" />
        ) : (
          <div className={styles.grid}>
            {listedColors.map((color) => (
              <ColorSwatch key={color.name} color={color} onCopy={handleCopy} />
            ))}
          </div>
        )}
      </Card>

      <Card title="非数值型颜色关键字">
        <div className={styles.specialList}>
          {SPECIAL_KEYWORDS.map((item) => (
            <div key={item.name}>
              <Text className={styles.specialName} code>
                {item.name}
              </Text>
              <Text type="secondary">{item.note}</Text>
            </div>
          ))}
        </div>
        <Paragraph className={styles.hint} style={{ marginBottom: 0 }}>
          这些关键字没有固定 RGB 值，因此不收录进 148 色表；颜色名称在 CSS 中大小写不敏感（如 RED 与 red 等价）。
        </Paragraph>
      </Card>
    </div>
  );
};

export default CssNamedColorsLookup;
