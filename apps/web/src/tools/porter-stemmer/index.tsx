'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Button, Card, Empty, Input, Space, Statistic, Table, Tag, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  COLUMN_TITLES,
  COPY_CSV_BUTTON_TEXT,
  COPY_SUCCESS_MESSAGE,
  CSV_FILE_NAME,
  CLEAR_BUTTON_TEXT,
  DOWNLOAD_CSV_BUTTON_TEXT,
  HINT,
  PAGE_SIZE,
  SAMPLE_BUTTON_TEXT,
  SAMPLE_TEXT,
  STAT_TITLES,
  TEXTAREA_PLACEHOLDER,
} from './constants';
import { groupsToCsv, stemText, type StemGroup } from './utils/stemmer';
import styles from './index.module.css';

/** 表格数据行（带 Table 需要的 key） */
interface StemRow extends StemGroup {
  key: string;
}

/** 归并结果表格列定义 */
const COLUMNS: ColumnsType<StemRow> = [
  {
    title: COLUMN_TITLES.STEM,
    dataIndex: 'stem',
    key: 'stem',
    width: 180,
    render: (value: string) => <span className={styles.mono}>{value}</span>,
  },
  {
    title: COLUMN_TITLES.COUNT,
    dataIndex: 'count',
    key: 'count',
    width: 110,
    align: 'right',
    sorter: (a, b) => a.count - b.count,
    defaultSortOrder: 'descend',
    render: (value: number) => <span className={styles.mono}>{value}</span>,
  },
  {
    title: COLUMN_TITLES.FORMS,
    dataIndex: 'forms',
    key: 'forms',
    render: (forms: string[]) => (
      <div className={styles.forms}>
        {forms.map((form) => (
          <Tag key={form} className={styles.mono}>
            {form}
          </Tag>
        ))}
      </div>
    ),
  },
];

/**
 * 英文 Porter 词干提取器：对输入文本做词干提取与词形归并，
 * 输出词干分组、出现次数与原始词形，支持 CSV 导出。
 *
 * @returns Porter 词干提取交互界面
 */
const PorterStemmer: React.FC<ToolComponentProps> = () => {
  const [text, setText] = React.useState<string>(SAMPLE_TEXT);
  const [messageApi, contextHolder] = message.useMessage();

  /** 派生归并结果，输入变化时重新计算 */
  const result = React.useMemo(() => stemText(text), [text]);

  const rows = React.useMemo<StemRow[]>(
    () => result.groups.map((group) => ({ ...group, key: group.stem })),
    [result],
  );

  /** 复制 CSV 到剪贴板 */
  const handleCopyCsv = async () => {
    if (rows.length === 0) {
      return;
    }
    await navigator.clipboard.writeText(groupsToCsv(result.groups));
    messageApi.success(COPY_SUCCESS_MESSAGE);
  };

  /** 下载 CSV 文件 */
  const handleDownloadCsv = () => {
    if (rows.length === 0) {
      return;
    }
    const blob = new Blob([groupsToCsv(result.groups)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = CSV_FILE_NAME;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={styles.container}>
      {contextHolder}
      <div className={styles.toolbar}>
        <Tag color="geekblue">Porter 1980</Tag>
        <span className={styles.hint}>{HINT}</span>
      </div>

      <Card className={styles.card} title="英文文本输入" size="small">
        <Input.TextArea
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder={TEXTAREA_PLACEHOLDER}
          autoSize={{ minRows: 6, maxRows: 16 }}
          spellCheck={false}
        />
        <div className={styles.actions}>
          <Space>
            <Button size="small" onClick={() => setText(SAMPLE_TEXT)}>
              {SAMPLE_BUTTON_TEXT}
            </Button>
            <Button size="small" onClick={() => setText('')}>
              {CLEAR_BUTTON_TEXT}
            </Button>
          </Space>
        </div>
      </Card>

      <Card className={styles.card} title="归并统计">
        <div className={styles.stats}>
          <Statistic title={STAT_TITLES.TOTAL_TOKENS} value={result.totalTokens} />
          <Statistic title={STAT_TITLES.UNIQUE_STEMS} value={result.uniqueStems} />
        </div>
        <div className={styles.actions}>
          <Space>
            <Button size="small" disabled={rows.length === 0} onClick={handleCopyCsv}>
              {COPY_CSV_BUTTON_TEXT}
            </Button>
            <Button size="small" disabled={rows.length === 0} onClick={handleDownloadCsv}>
              {DOWNLOAD_CSV_BUTTON_TEXT}
            </Button>
          </Space>
        </div>
      </Card>

      <Card className={styles.card} title={`词干归并结果（${rows.length} 组）`}>
        {rows.length === 0 ? (
          <Empty description="暂无可提取的英文单词" />
        ) : (
          <Table<StemRow>
            columns={COLUMNS}
            dataSource={rows}
            pagination={{ pageSize: PAGE_SIZE, showSizeChanger: false, size: 'small' }}
            size="small"
            scroll={{ y: 420 }}
          />
        )}
        <Alert
          className={styles.notice}
          type="info"
          showIcon
          message="词干不等于词典词形：Porter 采用规则化后缀剥离，结果可能是无语义的语干（如 relational → relat），适用于检索与文本归并而非还原正确拼写。"
        />
      </Card>
    </div>
  );
};

export default PorterStemmer;
