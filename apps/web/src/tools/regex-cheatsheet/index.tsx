'use client';

import React, { useMemo, useState } from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Card, Collapse, Empty, Input, Radio, Space, Tag, Typography } from 'antd';
import { CheckCircleFilled, CloseCircleFilled } from '@ant-design/icons';
import {
  CATEGORY_LABELS,
  ENGINE_DIFFERENCES,
  type RegexCategory,
  type RegexEntry,
} from './utils/regex-data';
import {
  filterEntries,
  getCoverageStats,
  verifyAllEntries,
  type VerifiedEntry,
} from './utils/regex-verify';
import { ALL_CATEGORY, DATA_SOURCE_HINT, SEARCH_PLACEHOLDER, TOOL_TITLE } from './constants';
import styles from './index.module.css';

const { Text, Paragraph } = Typography;

/** 渲染单个样例的实测结果（命中 / 未命中 + 匹配文本） */
function SampleTag({
  text,
  expectedMatch,
  matched,
  matchText,
}: {
  text: string;
  expectedMatch: boolean;
  matched: boolean;
  matchText: string | null;
}): React.ReactElement {
  const ok = expectedMatch === matched;
  return (
    <div className={`${styles.sample} ${expectedMatch ? styles.sampleMatch : styles.sampleReject}`}>
      {ok ? (
        <CheckCircleFilled style={{ color: '#52c41a' }} />
      ) : (
        <CloseCircleFilled style={{ color: '#ff4d4f' }} />
      )}
      <span className={styles.sampleText}>{text === '' ? '（空字符串）' : text}</span>
      {matched && matchText !== null && expectedMatch && (
        <Tag className={styles.matchMark} color="success">
          命中：{matchText === '' ? '零宽' : matchText}
        </Tag>
      )}
    </div>
  );
}

/** 单条语法卡片 */
function EntryCard({ verified }: { verified: VerifiedEntry }): React.ReactElement {
  const { entry } = verified;
  return (
    <div className={styles.entryCard}>
      <div className={styles.entryHeader}>
        <span className={styles.syntax}>{entry.syntax}</span>
        <span className={styles.entryName}>{entry.name}</span>
        <Tag>{CATEGORY_LABELS[entry.category]}</Tag>
        {!verified.allExpectationsMet && <Tag color="error">示例校验异常</Tag>}
      </div>
      <p className={styles.description}>{entry.description}</p>
      <div className={styles.patternBlock}>
        <Text type="secondary">示例：</Text>
        <code className={styles.patternCode}>
          /{entry.pattern}/{entry.flags ?? ''}
        </code>
      </div>
      <div className={styles.sampleGrid}>
        {verified.matchChecks.map((check) => (
          <SampleTag
            key={`match-${check.text}`}
            text={check.text}
            expectedMatch
            matched={check.matched}
            matchText={check.matchText}
          />
        ))}
        {verified.rejectChecks.map((check) => (
          <SampleTag
            key={`reject-${check.text}`}
            text={check.text}
            expectedMatch={false}
            matched={check.matched}
            matchText={check.matchText}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * 正则表达式语法速查：可搜索、可按分类折叠的参考表，
 * 全部样例经原生 RegExp 实测渲染，纯本地运行。
 */
const RegexCheatsheet: React.FC<ToolComponentProps> = () => {
  const [keyword, setKeyword] = useState('');
  const [category, setCategory] = useState<RegexCategory | typeof ALL_CATEGORY>(ALL_CATEGORY);

  const stats = useMemo(() => getCoverageStats(), []);
  const allVerified = useMemo(() => verifyAllEntries(), []);
  const verifiedMap = useMemo(() => {
    const map = new Map<string, VerifiedEntry>();
    allVerified.forEach((item) => map.set(item.entry.id, item));
    return map;
  }, [allVerified]);

  const filtered = useMemo(() => filterEntries(keyword, category), [keyword, category]);

  /** 按分类分组（保持数据集中的分类顺序） */
  const grouped = useMemo(() => {
    const order = Object.keys(CATEGORY_LABELS) as RegexCategory[];
    return order
      .map((cat) => ({
        category: cat,
        entries: filtered.filter((entry) => entry.category === cat),
      }))
      .filter((group) => group.entries.length > 0);
  }, [filtered]);

  const abnormalCount = allVerified.filter((item) => !item.allExpectationsMet).length;

  const categoryOptions = [
    { value: ALL_CATEGORY, label: '全部分类' },
    ...(Object.entries(CATEGORY_LABELS) as [RegexCategory, string][]).map(([value, label]) => ({
      value,
      label,
    })),
  ];

  return (
    <div className={styles.container}>
      <Card title={TOOL_TITLE}>
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <Input.Search
            className={styles.searchInput}
            size="large"
            allowClear
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder={SEARCH_PLACEHOLDER}
          />
          <Radio.Group
            optionType="button"
            buttonStyle="solid"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            options={categoryOptions}
          />
          <div className={styles.stats}>
            <Tag color="blue">{stats.entries} 个语法条目</Tag>
            <Tag color="geekblue">{stats.categories} 个分类</Tag>
            <Tag color={abnormalCount === 0 ? 'success' : 'error'}>
              原生 RegExp 实测{abnormalCount === 0 ? '全部通过' : `${abnormalCount} 条异常`}
            </Tag>
          </div>
          <p className={styles.hint}>{DATA_SOURCE_HINT}</p>
        </Space>
      </Card>

      {filtered.length === 0 ? (
        <Card>
          <Empty description="没有匹配的语法条目，试试其他关键字（如 look、量词、\p）" />
        </Card>
      ) : (
        <Collapse
          defaultActiveKey={grouped.map((group) => group.category)}
          items={grouped.map((group) => ({
            key: group.category,
            label: (
              <Space>
                <strong>{CATEGORY_LABELS[group.category]}</strong>
                <Tag>{group.entries.length}</Tag>
              </Space>
            ),
            children: (
              <Space direction="vertical" size={12} style={{ width: '100%' }}>
                {group.entries.map((entry: RegexEntry) => (
                  <EntryCard key={entry.id} verified={verifiedMap.get(entry.id)!} />
                ))}
              </Space>
            ),
          }))}
        />
      )}

      <Card title="JavaScript 与其他语言 / 引擎的典型差异（文档说明）">
        <Alert
          type="info"
          showIcon
          message="本工具仅使用浏览器原生 JavaScript RegExp 运行示例，以下差异仅作文档说明，不提供多语言执行。"
          style={{ marginBottom: 12 }}
        />
        {ENGINE_DIFFERENCES.map((diff) => (
          <div key={diff.topic} className={styles.diffRow}>
            <span className={styles.diffTopic}>{diff.topic}</span>
            <div>
              <Tag color="blue">JavaScript</Tag>
              <Text>{diff.javascript}</Text>
            </div>
            <div>
              <Tag color="purple">Python / Java / PCRE 等</Tag>
              <Text type="secondary">{diff.others}</Text>
            </div>
          </div>
        ))}
        <Paragraph className={styles.hint} style={{ marginBottom: 0 }}>
          需要在线调试或替换正则时，可使用站内 regex-tester 与 regex-replace；本工具专注语法查阅与学习。
        </Paragraph>
      </Card>
    </div>
  );
};

export default RegexCheatsheet;
