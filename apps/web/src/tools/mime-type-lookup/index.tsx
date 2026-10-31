'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Card, Collapse, Divider, Empty, Input, Radio, Tag } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import {
  MIME_ENTRIES,
  groupByPrimary,
  searchMime,
  type MimeEntry,
  type MimePrimaryType,
} from './utils/mime';
import {
  PRIMARY_OPTIONS,
  PRIMARY_ORDER,
  PRIMARY_TAG_COLOR,
  PRIMARY_TITLE,
  SEARCH_PLACEHOLDER,
} from './constants';
import styles from './index.module.css';

type PrimaryFilter = MimePrimaryType | 'all';

/**
 * 展开条目详情（推荐扩展名、别名、charset 示例、可否内联）。
 *
 * @param entry - MIME 条目
 * @returns 详情区域
 */
function renderDetail(entry: MimeEntry) {
  const aliases = entry.extensions.slice(1);
  return (
    <div className={styles.detailBlock}>
      <div className={styles.detailRow}>
        <span className={styles.detailLabel}>推荐扩展名</span>
        <span className={styles.detailText}>
          {entry.extensions.length > 0 ? (
            <Tag color="blue" className={styles.extTag}>
              .{entry.extensions[0]}
            </Tag>
          ) : (
            '—（无文件扩展名，用于协议内容类型）'
          )}
        </span>
      </div>
      {aliases.length > 0 && (
        <div className={styles.detailRow}>
          <span className={styles.detailLabel}>其他扩展名</span>
          <span className={styles.detailText}>
            {aliases.map((ext) => (
              <Tag key={ext} className={styles.extTag}>
                .{ext}
              </Tag>
            ))}
          </span>
        </div>
      )}
      <div className={styles.detailRow}>
        <span className={styles.detailLabel}>charset 示例</span>
        <span className={styles.detailText}>
          {entry.charset ? (
            <span>
              Content-Type: {entry.type}; charset={entry.charset}
            </span>
          ) : (
            '—（该类型通常不带 charset 参数）'
          )}
        </span>
      </div>
      <div className={styles.detailRow}>
        <span className={styles.detailLabel}>浏览器内联</span>
        <span className={styles.detailText}>
          {entry.inlineSafe ? (
            <Tag color="green">可安全内联展示</Tag>
          ) : (
            <Tag>默认下载 / 需谨慎内联</Tag>
          )}
        </span>
      </div>
    </div>
  );
}

/**
 * MIME 类型速查与识别：扩展名 ↔ MIME 双向互查，
 * 按主类型（text/image/audio/video/application 等）分组浏览，
 * 支持中英文关键词模糊检索，点击条目展开扩展名、charset 与内联安全信息。
 * 全部数据内置、纯本地检索。
 *
 * @returns MIME 类型速查交互界面
 */
const MimeTypeLookup: React.FC<ToolComponentProps> = () => {
  const [keyword, setKeyword] = React.useState('');
  const [primary, setPrimary] = React.useState<PrimaryFilter>('all');

  const grouped = React.useMemo(() => {
    const matched = searchMime(keyword).filter(
      (entry) => primary === 'all' || entry.primary === primary,
    );
    return groupByPrimary(matched);
  }, [keyword, primary]);

  const total = PRIMARY_ORDER.reduce(
    (sum, key) => sum + (grouped[key]?.length ?? 0),
    0,
  );

  return (
    <div className={styles.container}>
      <Card title={`MIME 类型速查（内置 ${MIME_ENTRIES.length} 个常用类型）`}>
        <div className={styles.toolbar}>
          <Radio.Group
            optionType="button"
            buttonStyle="solid"
            value={primary}
            onChange={(event) => setPrimary(event.target.value as PrimaryFilter)}
            options={PRIMARY_OPTIONS}
          />
          <Input
            className={styles.searchInput}
            allowClear
            prefix={<SearchOutlined />}
            placeholder={SEARCH_PLACEHOLDER}
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
          />
        </div>
        <p className={styles.hint}>
          输入扩展名（如 .jpg、json）按扩展名精确反查，输入 MIME 片段（如 image/webp）或中英文关键词（图片、pdf、字体）模糊检索；点击任意条目展开详情。
        </p>
      </Card>

      {total === 0 ? (
        <Card className={styles.card}>
          <Empty description="没有匹配的 MIME 类型，换个扩展名或关键词试试" />
        </Card>
      ) : (
        PRIMARY_ORDER.filter((key) => (grouped[key]?.length ?? 0) > 0).map((key) => (
          <Card key={key} className={styles.card}>
            <Divider titlePlacement="left" style={{ marginTop: 0, marginBottom: 12 }}>
              <span className={styles.groupTitle}>
                {PRIMARY_TITLE[key]}
                <span className={styles.groupCount}>（{grouped[key]?.length}）</span>
              </span>
            </Divider>
            <Collapse
              items={(grouped[key] ?? []).map((entry) => ({
                key: entry.type,
                label: (
                  <span className={styles.groupTitle}>
                    <Tag color={PRIMARY_TAG_COLOR[key]}>{entry.primary}</Tag>
                    <span className={styles.mimeType}>{entry.type}</span>
                    <span className={styles.mimeName}>{entry.nameZh}</span>
                    <span className={styles.mimeNameEn}>{entry.nameEn}</span>
                  </span>
                ),
                children: renderDetail(entry),
              }))}
            />
          </Card>
        ))
      )}
    </div>
  );
};

export default MimeTypeLookup;
