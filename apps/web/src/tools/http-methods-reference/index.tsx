'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Button, Card, Empty, Input, Space, Table, Tag, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { CheckOutlined, CloseOutlined, CopyOutlined } from '@ant-design/icons';
import {
  HTTP_METHODS,
  type HttpMethodEntry,
  type MethodComparison,
} from './utils/httpMethodsData';
import { bodySupportLabel, filterMethods, validateMethodInvariants } from './utils/httpMethods';
import { QUICK_SAMPLES, SEARCH_PLACEHOLDER } from './constants';
import { copyToClipboard } from '@/lib/utils';
import styles from './index.module.css';

/** 布尔属性单元格：醒目标签可视化 */
function BoolTag({ value }: { value: boolean }) {
  return value ? (
    <Tag color="green" icon={<CheckOutlined />}>
      是
    </Tag>
  ) : (
    <Tag icon={<CloseOutlined />}>否</Tag>
  );
}

/** 方法详情：请求 / 响应示例与常见状态码、误用提示 */
function MethodDetail({ entry }: { entry: HttpMethodEntry }) {
  const copy = (text: string, label: string) => {
    copyToClipboard(text);
    message.success(`已复制${label}`);
  };

  return (
    <div className={styles.detail}>
      <p className={styles.semantics}>{entry.semantics}</p>
      <div className={styles.exampleGrid}>
        <div className={styles.exampleBlock}>
          <div className={styles.exampleHeader}>
            <span>请求示例</span>
            <Button size="small" type="text" icon={<CopyOutlined />} onClick={() => copy(entry.requestExample, '请求示例')} />
          </div>
          <pre className={styles.code}>{entry.requestExample}</pre>
        </div>
        <div className={styles.exampleBlock}>
          <div className={styles.exampleHeader}>
            <span>响应示例</span>
            <Button size="small" type="text" icon={<CopyOutlined />} onClick={() => copy(entry.responseExample, '响应示例')} />
          </div>
          <pre className={styles.code}>{entry.responseExample}</pre>
        </div>
      </div>
      <div className={styles.detailRow}>
        <span className={styles.detailLabel}>常见状态码</span>
        <Space size={4} wrap>
          {entry.commonStatuses.map((code) => (
            <Tag key={code} color="blue">
              {code}
            </Tag>
          ))}
        </Space>
      </div>
      <div className={styles.detailRow}>
        <span className={styles.detailLabel}>典型场景</span>
        <span>{entry.useCases.join('；')}</span>
      </div>
      <div className={styles.detailRow}>
        <span className={styles.detailLabel}>注意事项</span>
        <ul className={styles.pitfallList}>
          {entry.pitfalls.map((text) => (
            <li key={text}>{text}</li>
          ))}
        </ul>
      </div>
      <div className={styles.detailRow}>
        <span className={styles.detailLabel}>RFC</span>
        <span>{entry.rfc}</span>
      </div>
    </div>
  );
}

/** 专题对比区块 */
function ComparisonCard({ comparison }: { comparison: MethodComparison }) {
  return (
    <div className={styles.comparison}>
      <div className={styles.comparisonTitle}>
        {comparison.title}
        <span className={styles.comparisonTitleEn}>{comparison.titleEn}</span>
      </div>
      <p className={styles.comparisonSummary}>{comparison.summary}</p>
      <div className={styles.sideGrid}>
        {[comparison.sideA, comparison.sideB].map((side) => (
          <div key={side.label} className={styles.sideBlock}>
            <div className={styles.sideLabel}>{side.label}</div>
            <ul className={styles.sidePoints}>
              {side.points.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
            <pre className={styles.code}>{side.example}</pre>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * HTTP 请求方法速查：依据 RFC 9110/9111/5789 内置 9 个标准方法的
 * safe / idempotent / cacheable / 请求体属性矩阵，支持关键字搜索、
 * 展开详情与专题对比。纯静态本地渲染，不发起任何网络请求。
 *
 * @returns HTTP 方法参考界面
 */
const HttpMethodsReference: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [query, setQuery] = React.useState(defaultInput || '');
  const result = React.useMemo(() => filterMethods(query), [query]);
  const invariantErrors = React.useMemo(() => validateMethodInvariants(), []);

  const columns: ColumnsType<HttpMethodEntry> = [
    {
      title: '方法',
      dataIndex: 'method',
      key: 'method',
      width: 120,
      render: (method: string, entry) => (
        <div>
          <code className={styles.methodName}>{method}</code>
          <div className={styles.methodCn}>{entry.name}</div>
        </div>
      ),
    },
    { title: 'Safe', dataIndex: 'safe', key: 'safe', width: 90, render: (value: boolean) => <BoolTag value={value} /> },
    { title: 'Idempotent', dataIndex: 'idempotent', key: 'idempotent', width: 110, render: (value: boolean) => <BoolTag value={value} /> },
    { title: '可缓存', dataIndex: 'cacheable', key: 'cacheable', width: 90, render: (value: boolean) => <BoolTag value={value} /> },
    {
      title: '请求体',
      dataIndex: 'body',
      key: 'body',
      width: 90,
      render: (body: HttpMethodEntry['body']) => (
        <Tag color={body === 'yes' ? 'geekblue' : body === 'no' ? 'default' : 'orange'}>{bodySupportLabel(body)}</Tag>
      ),
    },
    { title: 'RFC 来源', dataIndex: 'rfc', key: 'rfc', width: 150 },
    {
      title: '语义',
      dataIndex: 'semantics',
      key: 'semantics',
      render: (text: string) => <span className={styles.tableSemantics}>{text}</span>,
    },
  ];

  return (
    <div className={styles.container}>
      <Card title="HTTP 请求方法速查（RFC 9110 / 9111 / 5789）">
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
          <span className={styles.count}>
            命中方法 {result.methods.length} / {HTTP_METHODS.length} · 对比 {result.comparisons.length}
          </span>
          {invariantErrors.length === 0 ? (
            <Tag color="green">属性矩阵已通过 RFC 9110 不变量校验</Tag>
          ) : (
            <Tag color="red">{invariantErrors.length} 项属性与 RFC 不一致</Tag>
          )}
        </div>
      </Card>

      {result.methods.length === 0 ? (
        <Card>
          <Empty description="没有匹配的 HTTP 方法，换个关键字试试" />
        </Card>
      ) : (
        <Card className={styles.card}>
          <Table<HttpMethodEntry>
            rowKey="method"
            size="middle"
            columns={columns}
            dataSource={result.methods}
            pagination={false}
            expandable={{
              expandedRowRender: (entry) => <MethodDetail entry={entry} />,
              rowExpandable: () => true,
            }}
          />
        </Card>
      )}

      {result.comparisons.length > 0 && (
        <Card className={styles.card} title="专题对比">
          <div className={styles.comparisonList}>
            {result.comparisons.map((comparison) => (
              <ComparisonCard key={comparison.id} comparison={comparison} />
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

export default HttpMethodsReference;
