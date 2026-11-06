'use client';

import React, { useMemo, useState } from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Card, Collapse, Empty, Input, Radio, Space, Table, Tag, Typography } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import {
  METHOD_COMPARISONS,
  filterComparisons,
  filterMethods,
  type HttpMethod,
  type MethodGroup,
} from './utils/http-methods';
import { DATA_SOURCE_HINT, GROUP_OPTIONS, SEARCH_PLACEHOLDER, TOOL_TITLE } from './constants';
import styles from './index.module.css';

const { Text } = Typography;

type GroupFilter = MethodGroup | 'all';

/** 布尔属性标签 */
function BoolTag({ label, value }: { label: string; value: boolean }): React.ReactElement {
  return (
    <Tag color={value ? 'green' : 'default'}>
      {label}：{value ? '是' : '否'}
    </Tag>
  );
}

/** 方法详情区 */
function MethodDetail({ method }: { method: HttpMethod }): React.ReactElement {
  return (
    <div className={styles.detailBlock}>
      <div className={styles.detailRow}>
        <span className={styles.detailLabel}>语义</span>
        <span className={styles.detailText}>{method.semantics}</span>
      </div>
      <div className={styles.detailRow}>
        <span className={styles.detailLabel}>典型场景</span>
        <span className={styles.detailText}>{method.useCase}</span>
      </div>
      <div className={styles.detailRow}>
        <span className={styles.detailLabel}>RFC 来源</span>
        <span className={styles.detailText}>
          <Tag color="blue">{method.rfc}</Tag>
        </span>
      </div>
      <div className={styles.detailRow}>
        <span className={styles.detailLabel}>常见状态码</span>
        <span className={styles.detailText}>
          {method.statusCodes.map((code) => (
            <Tag key={code}>{code}</Tag>
          ))}
        </span>
      </div>
      <div className={styles.detailRow}>
        <span className={styles.detailLabel}>常见误用</span>
        <ul className={`${styles.detailText} ${styles.pitfallList}`}>
          {method.pitfalls.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
      <div className={styles.detailRow}>
        <span className={styles.detailLabel}>请求示例</span>
        <pre className={`${styles.detailText} ${styles.codeBlock}`}>{method.requestExample}</pre>
      </div>
      <div className={styles.detailRow}>
        <span className={styles.detailLabel}>响应示例</span>
        <pre className={`${styles.detailText} ${styles.codeBlock}`}>{method.responseExample}</pre>
      </div>
    </div>
  );
}

/**
 * HTTP 请求方法速查：9 个标准方法的 safe / idempotent / cacheable / 请求体属性
 * 与 RFC 来源参考表，支持关键字与分组过滤，并附 PUT vs PATCH 等专题对比，纯本地运行。
 */
const HttpMethodsReference: React.FC<ToolComponentProps> = () => {
  const [keyword, setKeyword] = useState('');
  const [group, setGroup] = useState<GroupFilter>('all');

  const methods = useMemo(() => filterMethods(keyword, group), [keyword, group]);
  const comparisons = useMemo(() => filterComparisons(keyword), [keyword]);

  return (
    <div className={styles.container}>
      <Card title={TOOL_TITLE}>
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <div className={styles.toolbar}>
            <Radio.Group
              optionType="button"
              buttonStyle="solid"
              value={group}
              onChange={(event) => setGroup(event.target.value as GroupFilter)}
              options={GROUP_OPTIONS}
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
          <p className={styles.hint}>{DATA_SOURCE_HINT}</p>
        </Space>
      </Card>

      {methods.length === 0 ? (
        <Card>
          <Empty description="没有匹配的请求方法，换个关键字（如 GET、幂等、safe）试试" />
        </Card>
      ) : (
        <Card>
          <Collapse
            items={methods.map((method) => ({
              key: method.method,
              label: (
                <span className={styles.methodHeader}>
                  <span className={styles.methodName}>{method.method}</span>
                  <span className={styles.methodNameZh}>{method.nameZh}</span>
                  <BoolTag label="Safe" value={method.safe} />
                  <BoolTag label="Idempotent" value={method.idempotent} />
                  <BoolTag label="Cacheable" value={method.cacheable} />
                  <BoolTag label="请求体" value={method.requestBody} />
                </span>
              ),
              children: <MethodDetail method={method} />,
            }))}
          />
        </Card>
      )}

      {comparisons.length > 0 && (
        <Card title="专题对比" className={styles.compareCard}>
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            {comparisons.map((comparison) => (
              <div key={comparison.title}>
                <Text strong>{comparison.title}</Text>
                <Table
                  style={{ marginTop: 8 }}
                  size="small"
                  pagination={false}
                  rowKey="aspect"
                  dataSource={comparison.rows}
                  columns={[
                    { title: '维度', dataIndex: 'aspect', key: 'aspect', width: 110 },
                    {
                      title: comparison.leftMethod,
                      dataIndex: 'left',
                      key: 'left',
                    },
                    {
                      title: comparison.rightMethod,
                      dataIndex: 'right',
                      key: 'right',
                    },
                  ]}
                />
                <pre className={styles.codeBlock} style={{ marginTop: 8 }}>
                  {comparison.bodyExample}
                </pre>
              </div>
            ))}
          </Space>
          <Alert
            style={{ marginTop: 8 }}
            type="info"
            showIcon
            message="PATCH 的幂等性由具体补丁媒体类型决定，标准本身不作保证；以上属性表反映 RFC 9110/5789 的默认定义。"
          />
        </Card>
      )}
    </div>
  );
};

export default HttpMethodsReference;
