'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Card, Collapse, Divider, Empty, Input, Radio, Tag } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import {
  STATUS_CLASSES,
  filterStatuses,
  groupByCategory,
  type HttpStatus,
  type StatusClass,
} from './utils/http-status';
import {
  CATEGORY_OPTIONS,
  CATEGORY_TAG_COLOR,
  CATEGORY_TITLE,
  SEARCH_PLACEHOLDER,
} from './constants';
import styles from './index.module.css';

type CategoryFilter = StatusClass | 'all';

/** 重试建议标签 */
const RETRY_TAG: Record<'yes' | 'no' | 'maybe', { color: string; text: string }> = {
  yes: { color: 'green', text: '可安全重试' },
  no: { color: 'red', text: '不应直接重试' },
  maybe: { color: 'default', text: '视情况 / 不适用' },
};

/**
 * 展开条目详情（典型场景、排错建议、重试建议）。
 *
 * @param status - 状态码条目
 * @returns 详情区域
 */
function renderDetail(status: HttpStatus) {
  const retryKey =
    status.retryable === true ? 'yes' : status.retryable === false ? 'no' : 'maybe';
  const tag = RETRY_TAG[retryKey];
  return (
    <div className={styles.detailBlock}>
      <div className={styles.detailRow}>
        <span className={styles.detailLabel}>典型场景</span>
        <span className={styles.detailText}>{status.scenario}</span>
      </div>
      <div className={styles.detailRow}>
        <span className={styles.detailLabel}>排错建议</span>
        <span className={styles.detailText}>{status.troubleshooting}</span>
      </div>
      <div className={styles.detailRow}>
        <span className={styles.detailLabel}>重试建议</span>
        <span className={styles.detailText}>
          <Tag color={tag.color}>{tag.text}</Tag>
        </span>
      </div>
    </div>
  );
}

/**
 * HTTP 状态码速查：按 1xx–5xx 分类浏览 IANA 常见标准状态码，
 * 支持编号前缀（404、4）与中英文关键词（not found、重定向、网关）实时检索，
 * 点击条目可展开典型场景与排错建议。全部数据内置、纯本地检索。
 *
 * @returns HTTP 状态码速查交互界面
 */
const HttpStatusCodes: React.FC<ToolComponentProps> = () => {
  const [keyword, setKeyword] = React.useState('');
  const [category, setCategory] = React.useState<CategoryFilter>('all');

  const grouped = React.useMemo(() => {
    const matched = filterStatuses(keyword, category);
    return groupByCategory(matched);
  }, [keyword, category]);

  const total = STATUS_CLASSES.reduce((sum, key) => sum + grouped[key].length, 0);

  return (
    <div className={styles.container}>
      <Card title="HTTP 状态码速查（100–511）">
        <div className={styles.toolbar}>
          <Radio.Group
            optionType="button"
            buttonStyle="solid"
            value={category}
            onChange={(event) => setCategory(event.target.value as CategoryFilter)}
            options={CATEGORY_OPTIONS}
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
          共收录 {total} 个状态码；纯数字按编号前缀过滤（如 404 或 4），其他输入按中英文关键词检索；点击任意条目展开详情。
        </p>
      </Card>

      {total === 0 ? (
        <Card className={styles.card}>
          <Empty description="没有匹配的状态码，换个编号或关键词试试" />
        </Card>
      ) : (
        STATUS_CLASSES.filter((key) => grouped[key].length > 0).map((key) => (
          <Card key={key} className={styles.card}>
            <Divider titlePlacement="left" style={{ marginTop: 0, marginBottom: 12 }}>
              <span className={styles.groupTitle}>
                {CATEGORY_TITLE[key]}
                <span className={styles.groupCount}>（{grouped[key].length}）</span>
              </span>
            </Divider>
            <Collapse
              items={grouped[key].map((status) => ({
                key: status.code,
                label: (
                  <span className={styles.groupTitle}>
                    <span className={styles.statusCode}>{status.code}</span>
                    <Tag color={CATEGORY_TAG_COLOR[key]}>{status.category}</Tag>
                    <span className={styles.statusName}>{status.nameZh}</span>
                    <span className={styles.statusNameEn}>{status.name}</span>
                  </span>
                ),
                children: renderDetail(status),
              }))}
            />
          </Card>
        ))
      )}
    </div>
  );
};

export default HttpStatusCodes;
