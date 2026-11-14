'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Card, Empty, Input, Space, Statistic, Tabs, Tag, Typography } from 'antd';
import { parseGedcom, buildRelationships, renderTree } from './utils/gedcom';
import { DEFAULT_INPUT } from './constants';
import styles from './index.module.css';

const GedcomViewer: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [input, setInput] = React.useState(defaultInput || DEFAULT_INPUT);

  const parsed = React.useMemo(() => parseGedcom(input), [input]);
  const view = React.useMemo(() => buildRelationships(parsed), [parsed]);
  const tree = React.useMemo(() => renderTree(parsed.roots), [parsed.roots]);

  const nameOf = React.useCallback(
    (xref: string | null): string => {
      if (!xref) return '—';
      const person = view.individuals.find((p) => p.xref === xref);
      return person?.name ?? xref;
    },
    [view.individuals],
  );

  return (
    <div className={styles.container}>
      <div className={styles.panels}>
        <Card className={styles.card} title="GEDCOM 5.5.1 源文本（纯本地解析，不上传）">
          <Input.TextArea
            value={input}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInput(e.target.value)}
            spellCheck={false}
            className={styles.editor}
            autoSize={{ minRows: 16, maxRows: 28 }}
          />
        </Card>

        <Card className={styles.card} title="层级结构树">
          <div className={styles.tree}>{tree || '（暂无内容）'}</div>
        </Card>
      </div>

      <Space className={styles.stats}>
        <Statistic title="非空行数" value={parsed.counts.totalLines} />
        <Statistic title="顶层记录" value={parsed.counts.records} />
        <Statistic title="人物 INDI" value={parsed.counts.individuals} />
        <Statistic title="家庭 FAM" value={parsed.counts.families} />
        {parsed.charEncoding ? <Tag color="blue">CHAR: {parsed.charEncoding}</Tag> : null}
      </Space>

      {parsed.issues.length > 0 ? (
        <Alert
          type="warning"
          showIcon
          message={`解析告警/错误 ${parsed.issues.length} 条（不中断后续解析）`}
          description={
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {parsed.issues.slice(0, 20).map((issue, i) => (
                <li key={i}>
                  第 {issue.line} 行 [{issue.level}]：{issue.message}
                </li>
              ))}
            </ul>
          }
        />
      ) : null}

      {view.dangling.length > 0 ? (
        <Alert
          type="error"
          showIcon
          message={`悬空指针 ${view.dangling.length} 处`}
          description={
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {view.dangling.map((d, i) => (
                <li key={i}>
                  第 {d.line} 行：{d.message}
                </li>
              ))}
            </ul>
          }
        />
      ) : null}

      <Tabs
        items={[
          {
            key: 'people',
            label: `人物（${view.individuals.length}）`,
            children:
              view.individuals.length === 0 ? (
                <Empty description="未解析到 INDI 记录" />
              ) : (
                <div className={styles.personGrid}>
                  {view.individuals.map((person) => (
                    <div key={person.xref} className={styles.person}>
                      <span className={styles.personName}>{person.name ?? '（未命名）'}</span>
                      <span className={styles.xref}>{person.xref}</span>
                      <div className={styles.personMeta}>
                        <span>性别：{person.sex ?? '—'}</span>
                        <span>
                          出生：{person.birth.date ?? '—'}
                          {person.birth.place ? `，${person.birth.place}` : ''}
                        </span>
                        <span>
                          逝世：{person.death.date ?? '—'}
                          {person.death.place ? `，${person.death.place}` : ''}
                        </span>
                        <span>父母家庭：{person.familyAsChild.join(', ') || '—'}</span>
                        <span>配偶家庭：{person.familyAsSpouse.join(', ') || '—'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ),
          },
          {
            key: 'families',
            label: `家庭（${view.families.length}）`,
            children:
              view.families.length === 0 ? (
                <Empty description="未解析到 FAM 记录" />
              ) : (
                view.families.map((family) => (
                  <div key={family.xref} className={styles.familyItem}>
                    <Typography.Text strong>{family.xref}</Typography.Text>
                    <div>丈夫：{nameOf(family.husband)}</div>
                    <div>妻子：{nameOf(family.wife)}</div>
                    <div>
                      子女：
                      {family.children.length === 0
                        ? '—'
                        : family.children.map((c) => nameOf(c)).join('、')}
                    </div>
                  </div>
                ))
              ),
          },
        ]}
      />

      <div>
        <Tag color="orange">GEDCOM 5.5.1</Tag>
        <span className={styles.hint}>
          纯浏览器本地解析、零依赖；支持 CONC/CONT 续行、层级跳号与悬空指针定位，ANSEL 转码不在本期
        </span>
      </div>
    </div>
  );
};

export default GedcomViewer;
