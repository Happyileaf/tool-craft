'use client';

import React from 'react';
import { Button, Card, Empty, Input, Radio, Space, Switch, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { ClearOutlined, CopyOutlined, DownloadOutlined, ReloadOutlined } from '@ant-design/icons';
import { copyToClipboard } from '@/lib/utils';
import type { ToolComponentProps } from '../loaders';
import {
  countWords,
  parseStopWords,
  sortWords,
  toCsv,
  type SortOrder,
  type TokenizeMode,
  type WordCount,
} from './utils/frequency';
import { DEFAULT_TEXT, DEFAULT_TOP_N, MODE_OPTIONS, SORT_OPTIONS } from './constants';
import styles from './index.module.css';

/**
 * 文本词频统计与高频词分析：在浏览器本地完成分词、停用词过滤、
 * 频次统计、排序与 Top N 展示，并支持导出 CSV
 *
 * @param props - 工具组件属性
 * @param props.defaultInput - 可选默认文本
 * @returns 词频统计界面
 */
const WordFrequency: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [text, setText] = React.useState<string>(defaultInput || DEFAULT_TEXT);
  const [mode, setMode] = React.useState<TokenizeMode>('latin');
  const [order, setOrder] = React.useState<SortOrder>('count-desc');
  const [topN, setTopN] = React.useState<number>(DEFAULT_TOP_N);
  const [useDefaultStopWords, setUseDefaultStopWords] = React.useState<boolean>(true);
  const [customStopWordsText, setCustomStopWordsText] = React.useState<string>('');

  const result = React.useMemo(() => {
    const custom = parseStopWords(customStopWordsText);
    return countWords(text, {
      mode,
      useDefaultStopWords,
      customStopWords: custom.size > 0 ? custom : undefined,
    });
  }, [text, mode, useDefaultStopWords, customStopWordsText]);

  const rows = React.useMemo(
    () => sortWords(result.words, order, topN),
    [result.words, order, topN],
  );

  const exportCsv = () => {
    const blob = new Blob([toCsv(rows)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'word-frequency.csv';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const columns: ColumnsType<WordCount> = [
    {
      title: '#',
      key: 'index',
      width: 56,
      render: (_value, _record, index) => index + 1,
    },
    {
      title: '词',
      dataIndex: 'word',
      key: 'word',
      className: styles.wordCell,
    },
    {
      title: '次数',
      dataIndex: 'count',
      key: 'count',
      width: 100,
      sorter: (a, b) => a.count - b.count,
      defaultSortOrder: 'descend',
      render: (value: number) => <Tag color="blue">{value}</Tag>,
    },
    {
      title: '频率',
      dataIndex: 'frequency',
      key: 'frequency',
      width: 220,
      render: (value: number) => (
        <Space size={8}>
          <div
            style={{
              width: 100,
              height: 8,
              borderRadius: 4,
              background: '#e5e7eb',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${Math.max(2, Math.round(value * 100 * (rows[0] ? 1 / rows[0].frequency : 1)))}%`,
                height: '100%',
                background: '#3b82f6',
              }}
            />
          </div>
          <span className={styles.mono}>{(value * 100).toFixed(2)}%</span>
        </Space>
      ),
    },
  ];

  return (
    <div className={styles.container}>
      <Card title="待统计文本">
        <div className={styles.formColumn}>
          <span className={styles.label}>粘贴需要统计的文本（支持中英文混合）</span>
          <Input.TextArea
            className={styles.mono}
            value={text}
            onChange={(event) => setText(event.target.value)}
            autoSize={{ minRows: 6, maxRows: 18 }}
            spellCheck={false}
          />
        </div>
        <Space wrap>
          <Tag color="geekblue">有效词次 {result.totalTokens}</Tag>
          <Tag color="purple">不同词 {result.words.length}</Tag>
          <Button
            size="small"
            icon={<ReloadOutlined />}
            onClick={() => {
              setText(defaultInput || DEFAULT_TEXT);
              setMode('latin');
              setOrder('count-desc');
              setTopN(DEFAULT_TOP_N);
              setUseDefaultStopWords(true);
              setCustomStopWordsText('');
            }}
          >
            载入示例
          </Button>
          <Button size="small" icon={<ClearOutlined />} onClick={() => setText('')}>
            清空
          </Button>
        </Space>
      </Card>

      <Card title="统计选项">
        <div className={styles.optionRow}>
          <span className={styles.label}>分词模式</span>
          <Radio.Group
            optionType="button"
            buttonStyle="solid"
            value={mode}
            onChange={(event) => setMode(event.target.value as TokenizeMode)}
            options={MODE_OPTIONS}
          />
        </div>
        <div className={styles.optionRow}>
          <span className={styles.label}>排序</span>
          <Radio.Group
            optionType="button"
            buttonStyle="solid"
            value={order}
            onChange={(event) => setOrder(event.target.value as SortOrder)}
            options={SORT_OPTIONS}
          />
          <span className={styles.switchLabel}>
            Top N
            <Input
              type="number"
              min={0}
              value={topN}
              onChange={(event) => setTopN(Math.max(0, Number(event.target.value)))}
              style={{ width: 90 }}
            />
            （0 = 全部）
          </span>
        </div>
        <div className={styles.optionRow}>
          <span className={styles.switchLabel}>
            <Switch checked={useDefaultStopWords} onChange={setUseDefaultStopWords} size="small" />
            过滤英文常用停用词（the / a / of …）
          </span>
        </div>
        <div className={styles.formColumn}>
          <span className={styles.label}>自定义停用词（逗号或空格分隔，拉丁词不区分大小写）</span>
          <Input
            value={customStopWordsText}
            onChange={(event) => setCustomStopWordsText(event.target.value)}
            placeholder="foo, bar, 的"
            spellCheck={false}
          />
        </div>
      </Card>

      <Card
        title="词频结果"
        extra={
          <Space>
            <Button
              size="small"
              icon={<CopyOutlined />}
              disabled={rows.length === 0}
              onClick={() => void copyToClipboard(toCsv(rows))}
            >
              复制 CSV
            </Button>
            <Button size="small" icon={<DownloadOutlined />} disabled={rows.length === 0} onClick={exportCsv}>
              导出 CSV
            </Button>
          </Space>
        }
      >
        {rows.length === 0 ? (
          <Empty description="输入文本后自动统计" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        ) : (
          <Table<WordCount>
            rowKey="word"
            columns={columns}
            dataSource={rows}
            size="small"
            pagination={rows.length > 20 ? { pageSize: 20, showSizeChanger: false } : false}
          />
        )}
        <div className={styles.hint}>
          分词说明：拉丁模式按 Unicode 字母 / 数字切词（支持 don&apos;t、state-of-the-art 等撇号与连字符）；
          中文支持逐字与相邻汉字二元组两种简单模式。频率按停用词过滤后的有效词次计算。全部统计在浏览器本地完成。
        </div>
      </Card>
    </div>
  );
};

export default WordFrequency;
