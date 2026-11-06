'use client';

import React, { useMemo, useState } from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Card, Empty, Input, Radio, Space, Tag, Typography } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import {
  CATEGORY_LABELS,
  filterHeaders,
  filterPractices,
  type HeaderCategory,
  type HeaderDirection,
  type HttpHeader,
} from './utils/http-headers';
import {
  CATEGORY_OPTIONS,
  DATA_SOURCE_HINT,
  DIRECTION_OPTIONS,
  SEARCH_PLACEHOLDER,
  TOOL_TITLE,
} from './constants';
import styles from './index.module.css';

const { Text } = Typography;

type CategoryFilter = HeaderCategory | 'all';
type DirectionFilter = HeaderDirection | 'all';

const DIRECTION_LABEL: Record<HeaderDirection, { text: string; color: string }> = {
  request: { text: '请求头', color: 'blue' },
  response: { text: '响应头', color: 'green' },
  both: { text: '请求 / 响应', color: 'purple' },
};

/** 单条头字段卡片 */
function HeaderCardItem({ header }: { header: HttpHeader }): React.ReactElement {
  const direction = DIRECTION_LABEL[header.direction];
  return (
    <Card size="small" className={styles.headerCard}>
      <div className={styles.headerTitle}>
        <span className={styles.headerName}>{header.name}</span>
        <span className={styles.headerNameZh}>{header.nameZh}</span>
        <Tag color={direction.color}>{direction.text}</Tag>
        <Tag>{CATEGORY_LABELS[header.category]}</Tag>
        {header.hopByHop && <Tag color="orange">逐跳 hop-by-hop</Tag>}
        {header.forbidden && <Tag color="red">禁止修改</Tag>}
      </div>
      <div className={styles.tagRow}>
        <Tag color="geekblue">{header.rfc}</Tag>
      </div>
      <Space direction="vertical" size={8} style={{ width: '100%' }}>
        <div className={styles.detailRow}>
          <span className={styles.detailLabel}>含义</span>
          <span className={styles.detailText}>{header.description}</span>
        </div>
        <div className={styles.detailRow}>
          <span className={styles.detailLabel}>示例</span>
          <pre className={`${styles.detailText} ${styles.codeBlock}`}>{header.example}</pre>
        </div>
        {header.securityNote ? (
          <Alert type="warning" showIcon message={`安全注意：${header.securityNote}`} />
        ) : null}
      </Space>
    </Card>
  );
}

/**
 * HTTP 头字段速查：7 大类 51 个常用头的方向、逐跳 / 禁止修改属性、RFC 来源、
 * 示例与安全注意事项，支持关键字、分类与方向三维过滤，并附安全实践专题，纯本地运行。
 */
const HttpHeadersReference: React.FC<ToolComponentProps> = () => {
  const [keyword, setKeyword] = useState('');
  const [category, setCategory] = useState<CategoryFilter>('all');
  const [direction, setDirection] = useState<DirectionFilter>('all');

  const headers = useMemo(
    () => filterHeaders(keyword, category, direction),
    [keyword, category, direction],
  );
  const practices = useMemo(() => filterPractices(keyword), [keyword]);

  return (
    <div className={styles.container}>
      <Card title={TOOL_TITLE}>
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <div className={styles.toolbar}>
            <Input
              className={styles.searchInput}
              allowClear
              prefix={<SearchOutlined />}
              placeholder={SEARCH_PLACEHOLDER}
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
            />
          </div>
          <Radio.Group
            optionType="button"
            buttonStyle="solid"
            value={category}
            onChange={(event) => setCategory(event.target.value as CategoryFilter)}
            options={CATEGORY_OPTIONS}
          />
          <Radio.Group
            optionType="button"
            value={direction}
            onChange={(event) => setDirection(event.target.value as DirectionFilter)}
            options={DIRECTION_OPTIONS}
          />
          <p className={styles.hint}>{DATA_SOURCE_HINT}</p>
        </Space>
      </Card>

      {headers.length === 0 ? (
        <Card>
          <Empty description="没有匹配的头字段，换个关键字（如 Content-Type、缓存、csp、cookie）试试" />
        </Card>
      ) : (
        <Card>
          <Text type="secondary">共 {headers.length} 个头字段</Text>
          <div style={{ marginTop: 12 }}>
            {headers.map((header) => (
              <HeaderCardItem key={header.name} header={header} />
            ))}
          </div>
        </Card>
      )}

      {practices.length > 0 && (
        <Card title="安全实践专题" className={styles.practiceCard}>
          {practices.map((practice) => (
            <div key={practice.title} className={styles.practiceItem}>
              <Space direction="vertical" size={8} style={{ width: '100%' }}>
                <Text strong>{practice.title}</Text>
                <div className={styles.tagRow}>
                  {practice.headers.map((name) => (
                    <Tag key={name} color="volcano">
                      {name}
                    </Tag>
                  ))}
                </div>
                <Text>{practice.guidance}</Text>
                <pre className={styles.codeBlock}>{practice.example}</pre>
              </Space>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
};

export default HttpHeadersReference;
