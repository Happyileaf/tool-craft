'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Button, Card, Collapse, Empty, Input, Space, Tag, message } from 'antd';
import { CheckCircleFilled, CloseCircleFilled, CopyOutlined } from '@ant-design/icons';
import { LANGUAGE_DIFFERENCES, type RegexSyntaxEntry } from './utils/regexSyntaxData';
import {
  filterEntries,
  groupByCategory,
  validateAllEntries,
  type EntryValidation,
} from './utils/regexSyntax';
import { QUICK_SAMPLES, SEARCH_PLACEHOLDER } from './constants';
import { copyToClipboard } from '@/lib/utils';
import styles from './index.module.css';

/** 单条语法卡片：展示语法、解释，并用原生 RegExp 实测渲染每条样例 */
function EntryCard({ validation }: { validation: EntryValidation }) {
  const { entry, constructable, error, checks } = validation;

  const handleCopyPattern = () => {
    copyToClipboard(`/${entry.pattern}/${entry.flags}`);
    message.success('已复制正则字面量');
  };

  return (
    <div className={styles.entryCard}>
      <div className={styles.entryHeader}>
        <code className={styles.syntax}>{entry.syntax}</code>
        <span className={styles.entryName}>
          {entry.name}
          <span className={styles.entryNameEn}>{entry.nameEn}</span>
        </span>
        <Button
          size="small"
          type="text"
          icon={<CopyOutlined />}
          onClick={handleCopyPattern}
          title="复制 /pattern/flags"
        />
      </div>
      <p className={styles.explanation}>{entry.explanation}</p>
      <div className={styles.patternRow}>
        <span className={styles.patternLabel}>示例正则</span>
        <code className={styles.pattern}>
          /{entry.pattern}/{entry.flags}
        </code>
      </div>
      {!constructable ? (
        <Alert type="error" showIcon message={`正则构造失败：${error}`} />
      ) : (
        <ul className={styles.checkList}>
          {checks.map((check) => (
            <li key={`${check.expectedMatch}-${check.text}`} className={styles.checkItem}>
              {check.consistent ? (
                <CheckCircleFilled className={styles.passIcon} />
              ) : (
                <CloseCircleFilled className={styles.failIcon} />
              )}
              <code className={styles.sampleText}>{check.text || '（空字符串）'}</code>
              <Tag className={styles.resultTag} color={check.actualMatch ? 'green' : 'default'}>
                {check.actualMatch ? `命中 ${check.matchedText ?? ''}` : '不命中'}
              </Tag>
              <span className={styles.expectText}>
                预期{check.expectedMatch ? '命中' : '不命中'}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/**
 * 正则表达式语法速查：内置 8 大分类 40 条 JavaScript 正则语法，
 * 支持关键字过滤与分类折叠；每条样例均由浏览器原生 RegExp 实测渲染，
 * 保证文档与运行时行为一致。全部计算本地完成、零网络请求。
 *
 * @returns 正则语法参考界面
 */
const RegexSyntaxReference: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [query, setQuery] = React.useState(defaultInput || '');

  // 模块加载时实测一次全部条目；数据为构建时常量，结果在组件生命周期内稳定
  const validations = React.useMemo(() => validateAllEntries(), []);
  const validationById = React.useMemo(() => {
    const map = new Map<string, EntryValidation>();
    for (const item of validations) {
      map.set(item.entry.id, item);
    }
    return map;
  }, [validations]);

  const filtered = React.useMemo(() => filterEntries(query), [query]);
  const groups = React.useMemo(() => groupByCategory(filtered), [filtered]);

  const inconsistentCount = validations.filter((item) => !item.allConsistent).length;

  const collapseItems = groups.map((group) => ({
    key: group.category.id,
    label: (
      <span className={styles.collapseLabel}>
        {group.category.label}
        <span className={styles.collapseLabelEn}>{group.category.labelEn}</span>
        <Tag className={styles.countTag}>{group.entries.length}</Tag>
      </span>
    ),
    children: (
      <div className={styles.entryList}>
        {group.entries.map((entry: RegexSyntaxEntry) => {
          const validation = validationById.get(entry.id);
          return validation ? <EntryCard key={entry.id} validation={validation} /> : null;
        })}
      </div>
    ),
  }));

  return (
    <div className={styles.container}>
      <Card title="正则表达式语法速查（JavaScript / ECMAScript）">
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
            命中 {filtered.length} / {validations.length} 条 · {groups.length} 个分类
          </span>
          {inconsistentCount === 0 ? (
            <Tag color="green">全部样例已通过原生 RegExp 实测</Tag>
          ) : (
            <Tag color="red">{inconsistentCount} 条样例与预期不一致</Tag>
          )}
        </div>
      </Card>

      {filtered.length === 0 ? (
        <Card className={styles.card}>
          <Empty description="没有匹配的语法条目，换个关键字试试" />
        </Card>
      ) : (
        <Collapse
          className={styles.collapse}
          items={collapseItems}
          defaultActiveKey={groups.map((group) => group.category.id)}
        />
      )}

      <Card className={styles.card} title="常见语言差异（JavaScript vs Python / Java / PCRE）">
        <div className={styles.diffList}>
          {LANGUAGE_DIFFERENCES.map((item) => (
            <div key={item.topic} className={styles.diffItem}>
              <div className={styles.diffTopic}>{item.topic}</div>
              <div className={styles.diffRow}>
                <Tag color="blue">JavaScript</Tag>
                <span>{item.javascript}</span>
              </div>
              <div className={styles.diffRow}>
                <Tag>其他语言</Tag>
                <span>{item.others}</span>
              </div>
            </div>
          ))}
        </div>
        <p className={styles.hint}>
          本工具专注语法查阅与学习，在线调试与替换请使用 regex-tester、regex-replace。
        </p>
      </Card>
    </div>
  );
};

export default RegexSyntaxReference;
