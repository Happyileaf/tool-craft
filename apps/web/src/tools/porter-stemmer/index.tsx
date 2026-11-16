'use client';

import React from 'react';
import { Alert, Button, Card, Empty, Input, Space, Statistic, Switch, Table, Tabs, Tag, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { ClearOutlined, CopyOutlined, ReloadOutlined } from '@ant-design/icons';
import { copyToClipboard } from '@/lib/utils';
import type { ToolComponentProps } from '../loaders';
import { groupByStem, stemText, type StemEntry, type StemGroup } from './utils/porter';
import { DEFAULT_TEXT } from './constants';
import styles from './index.module.css';

/** 归并表复制为 TSV 文本 */
function groupsToTsv(groups: StemGroup[]): string {
  const header = 'stem\tforms\tcount';
  const rows = groups.map((group) => `${group.stem}\t${group.forms.join('|')}\t${group.count}`);
  return [header, ...rows].join('\n');
}

/** 明细表复制为 TSV 文本 */
function entriesToTsv(entries: StemEntry[]): string {
  const header = 'index\toriginal\tstem';
  const rows = entries.map((entry) => `${entry.index}\t${entry.original}\t${entry.stem}`);
  return [header, ...rows].join('\n');
}

/**
 * Porter 词干提取与词形归并批处理：在浏览器本地对英文文本逐词执行
 * Porter 1980 规则式词干提取，并按词干归并同根词形
 *
 * @param props - 工具组件属性
 * @param props.defaultInput - 可选默认文本
 * @returns Porter Stemmer 工具界面
 */
const PorterStemmer: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [text, setText] = React.useState<string>(defaultInput || DEFAULT_TEXT);
  const [caseSensitive, setCaseSensitive] = React.useState<boolean>(false);

  const entries = React.useMemo(() => stemText(text), [text]);
  const groups = React.useMemo(
    () => groupByStem(entries, { caseSensitive }),
    [entries, caseSensitive],
  );

  const groupColumns: ColumnsType<StemGroup> = [
    {
      title: '#',
      key: 'order',
      width: 56,
      render: (_value, _record, index) => index + 1,
    },
    {
      title: '词干 stem',
      dataIndex: 'stem',
      key: 'stem',
      className: styles.stemCell,
    },
    {
      title: '原始词形 forms',
      dataIndex: 'forms',
      key: 'forms',
      render: (forms: string[]) => (
        <span className={styles.formTags}>
          {forms.map((form) => (
            <Tag key={form} color="geekblue">
              {form}
            </Tag>
          ))}
        </span>
      ),
    },
    {
      title: '次数 count',
      dataIndex: 'count',
      key: 'count',
      width: 110,
      sorter: (a, b) => a.count - b.count,
      defaultSortOrder: 'descend',
      render: (value: number) => <Tag color="blue">{value}</Tag>,
    },
  ];

  const entryColumns: ColumnsType<StemEntry> = [
    {
      title: 'index',
      dataIndex: 'index',
      key: 'index',
      width: 90,
    },
    {
      title: 'original',
      dataIndex: 'original',
      key: 'original',
      className: styles.stemCell,
    },
    {
      title: 'stem',
      dataIndex: 'stem',
      key: 'stem',
      className: styles.stemCell,
    },
  ];

  const copyGroups = () => {
    if (groups.length === 0) {
      return;
    }
    void copyToClipboard(groupsToTsv(groups));
    message.success('已复制词干归并表（TSV）');
  };

  const copyEntries = () => {
    if (entries.length === 0) {
      return;
    }
    void copyToClipboard(entriesToTsv(entries));
    message.success('已复制逐词明细表（TSV）');
  };

  return (
    <div className={styles.container}>
      <Alert
        type="info"
        showIcon
        message="Porter Stemming Algorithm（Porter, 1980）"
        description={
          <div>
            经典规则式英语词干提取器，依据后缀剥离的五步骤（1a/1b/1c、2、3、4、5a/5b）将同根词形归并到同一词干，
            全程不依赖词典，因此可能产生并非真实单词的词干（如 triplicate → triplic、biliti → bil）。
            它与词形还原（lemmatization）不同：后者借助词典与词性返回真实词条（如 better → good），Porter 只做确定性的后缀归并。
            所有计算均在浏览器本地完成，文本不会上传，可放心处理敏感内容。
          </div>
        }
      />

      <Card title="待处理文本">
        <div className={styles.formColumn}>
          <span className={styles.label}>粘贴英文文本，结果随输入实时计算</span>
          <Input.TextArea
            className={styles.mono}
            value={text}
            onChange={(event) => setText(event.target.value)}
            autoSize={{ minRows: 6, maxRows: 18 }}
            spellCheck={false}
            placeholder="Paste English text here…"
          />
        </div>
        <Space wrap>
          <span className={styles.switchLabel}>
            <Switch checked={caseSensitive} onChange={setCaseSensitive} size="small" />
            区分大小写归并（关闭时 Dog / dog 视为同一词形）
          </span>
          <Button
            size="small"
            icon={<ReloadOutlined />}
            onClick={() => {
              setText(defaultInput || DEFAULT_TEXT);
              setCaseSensitive(false);
            }}
          >
            载入样例
          </Button>
          <Button size="small" icon={<ClearOutlined />} onClick={() => setText('')}>
            清空
          </Button>
        </Space>
      </Card>

      <Card title="统计">
        <div className={styles.statRow}>
          <Statistic title="Token 总数" value={entries.length} />
          <Statistic title="唯一词干数" value={new Set(entries.map((entry) => entry.stem)).size} />
          <Statistic title="归并组数" value={groups.length} />
        </div>
      </Card>

      <Card title="提取结果">
        {entries.length === 0 ? (
          <Empty description="未发现任何英文单词，请输入包含字母的文本" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        ) : (
          <Tabs
            items={[
              {
                key: 'groups',
                label: `词干归并表（${groups.length}）`,
                children: (
                  <>
                    <Space style={{ marginBottom: 12 }}>
                      <Button size="small" icon={<CopyOutlined />} onClick={copyGroups}>
                        复制归并结果
                      </Button>
                    </Space>
                    <Table<StemGroup>
                      rowKey="stem"
                      columns={groupColumns}
                      dataSource={groups}
                      size="small"
                      pagination={groups.length > 20 ? { pageSize: 20, showSizeChanger: false } : false}
                    />
                  </>
                ),
              },
              {
                key: 'entries',
                label: `逐词明细表（${entries.length}）`,
                children: (
                  <>
                    <Space style={{ marginBottom: 12 }}>
                      <Button size="small" icon={<CopyOutlined />} onClick={copyEntries}>
                        复制明细结果
                      </Button>
                    </Space>
                    <Table<StemEntry>
                      rowKey={(record) => `${record.index}-${record.original}`}
                      columns={entryColumns}
                      dataSource={entries}
                      size="small"
                      pagination={entries.length > 20 ? { pageSize: 20, showSizeChanger: false } : false}
                    />
                  </>
                ),
              },
            ]}
          />
        )}
        <div className={styles.hint}>
          归并表按 count 降序排列，count 相同时按词干在文本中的首次出现顺序排列；forms 已去重并保留首次出现的大小写形式。
        </div>
      </Card>
    </div>
  );
};

export default PorterStemmer;
