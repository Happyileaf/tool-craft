'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Button, Card, Collapse, Empty, Input, Select, Space, Tag, message } from 'antd';
import { CopyOutlined, StopOutlined } from '@ant-design/icons';
import {
  HEADER_CATEGORIES,
  HTTP_HEADERS,
  type HeaderCategoryId,
  type HeaderDirection,
  type HttpHeaderEntry,
} from './utils/httpHeadersData';
import {
  DIRECTION_LABELS,
  filterHeaders,
  validateHeaderData,
} from './utils/httpHeaders';
import { DIRECTION_OPTIONS, QUICK_SAMPLES, SEARCH_PLACEHOLDER } from './constants';
import { copyToClipboard } from '@/lib/utils';
import styles from './index.module.css';

const DIRECTION_COLOR: Record<HeaderDirection, string> = {
  request: 'blue',
  response: 'purple',
  both: 'cyan',
};

/** 单个头字段卡片 */
function HeaderCard({ entry }: { entry: HttpHeaderEntry }) {
  const handleCopy = () => {
    copyToClipboard(entry.name);
    message.success(`已复制头字段 ${entry.name}`);
  };

  return (
    <div className={styles.headerCard}>
      <div className={styles.headerTop}>
        <code className={styles.headerName}>{entry.name}</code>
        <Space size={4} wrap>
          <Tag color={DIRECTION_COLOR[entry.direction]}>{DIRECTION_LABELS[entry.direction]}</Tag>
          {entry.forbidden && (
            <Tag color="red" icon={<StopOutlined />}>
              禁止修改
            </Tag>
          )}
          {entry.deprecated && <Tag color="default">已废弃/受限</Tag>}
        </Space>
        <Button
          size="small"
          type="text"
          icon={<CopyOutlined />}
          onClick={handleCopy}
          title="复制头字段名称"
        />
      </div>
      <p className={styles.summary}>{entry.summary}</p>
      <div className={styles.metaRow}>
        <span className={styles.metaLabel}>取值语法</span>
        <code className={styles.metaCode}>{entry.syntax}</code>
      </div>
      <div className={styles.metaRow}>
        <span className={styles.metaLabel}>示例</span>
        <code className={styles.metaCode}>{entry.example}</code>
      </div>
      <div className={styles.metaRow}>
        <span className={styles.metaLabel}>标准</span>
        <span className={styles.spec}>{entry.spec}</span>
      </div>
      <ul className={styles.pitfallList}>
        {entry.pitfalls.map((text) => (
          <li key={text}>{text}</li>
        ))}
      </ul>
    </div>
  );
}

/**
 * HTTP 头字段速查：内置 8 大分类 54 个高频头字段的用途、方向、取值语法、
 * 示例与标准来源，支持名称/关键字搜索与分类、方向组合筛选，并对
 * forbidden header name 与废弃头做醒目标记。纯静态本地渲染、零网络请求。
 *
 * @returns HTTP 头字段参考界面
 */
const HttpHeadersReference: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [keyword, setKeyword] = React.useState(defaultInput || '');
  const [category, setCategory] = React.useState<HeaderCategoryId | null>(null);
  const [direction, setDirection] = React.useState<HeaderDirection | null>(null);

  const dataErrors = React.useMemo(() => validateHeaderData(), []);
  const filtered = React.useMemo(
    () => filterHeaders({ keyword, category, direction }),
    [keyword, category, direction],
  );

  const grouped = React.useMemo(
    () =>
      HEADER_CATEGORIES
        .map((cat) => ({
          category: cat,
          entries: filtered.filter((entry) => entry.category === cat.id),
        }))
        .filter((group) => group.entries.length > 0),
    [filtered],
  );

  const forbiddenCount = HTTP_HEADERS.filter((entry) => entry.forbidden).length;

  const collapseItems = grouped.map((group) => ({
    key: group.category.id,
    label: (
      <span className={styles.collapseLabel}>
        {group.category.label}
        <span className={styles.collapseLabelEn}>{group.category.labelEn}</span>
        <Tag className={styles.countTag}>{group.entries.length}</Tag>
      </span>
    ),
    children: (
      <div className={styles.cardGrid}>
        {group.entries.map((entry) => (
          <HeaderCard key={entry.name} entry={entry} />
        ))}
      </div>
    ),
  }));

  return (
    <div className={styles.container}>
      <Card title="HTTP 头字段速查（MDN / RFC 9110 系列）">
        <Input
          allowClear
          spellCheck={false}
          className={styles.search}
          placeholder={SEARCH_PLACEHOLDER}
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
        />
        <Space size={[8, 8]} wrap className={styles.filters}>
          <Select
            className={styles.select}
            value={category ?? 'all'}
            onChange={(value) => setCategory(value === 'all' ? null : (value as HeaderCategoryId))}
            options={[
              { value: 'all', label: '全部分类' },
              ...HEADER_CATEGORIES.map((cat) => ({ value: cat.id, label: cat.label })),
            ]}
          />
          <Select
            className={styles.select}
            value={direction ?? 'all'}
            onChange={(value) =>
              setDirection(value === 'all' ? null : (value as HeaderDirection))
            }
            options={DIRECTION_OPTIONS}
          />
        </Space>
        <Space size={[8, 8]} wrap className={styles.samples}>
          {QUICK_SAMPLES.map((sample) => (
            <Button key={sample} size="small" onClick={() => setKeyword(sample)}>
              {sample}
            </Button>
          ))}
        </Space>
        <div className={styles.toolbar}>
          <span className={styles.count}>
            命中 {filtered.length} / {HTTP_HEADERS.length} 个 · {grouped.length} 个分类
          </span>
          <Space size={8}>
            <Tag color="red">{forbiddenCount} 个禁止修改头</Tag>
            {dataErrors.length === 0 ? (
              <Tag color="green">必填信息完整性校验通过</Tag>
            ) : (
              <Tag color="red">{dataErrors.length} 项数据缺失</Tag>
            )}
          </Space>
        </div>
      </Card>

      {filtered.length === 0 ? (
        <Card>
          <Empty description="没有匹配的 HTTP 头字段，换个关键字或清除分类筛选" />
        </Card>
      ) : (
        <Collapse
          className={styles.collapse}
          items={collapseItems}
          defaultActiveKey={grouped.map((group) => group.category.id)}
        />
      )}
    </div>
  );
};

export default HttpHeadersReference;
