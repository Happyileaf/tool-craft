'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Button, Card, Input, Radio, Table, Tag, message } from 'antd';
import { CopyOutlined, SearchOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { CATEGORY_OPTIONS, LOOKUP_PLACEHOLDER, TABLE_PAGE_SIZE } from './constants';
import {
  lookupAscii,
  filterAscii,
  getCtrlCombos,
  getCommonKeys,
  formatEntryForCopy,
  type AsciiEntry,
} from './utils/ascii';
import styles from './index.module.css';

type CategoryFilter = 'all' | 'control' | 'printable' | 'delete';

const KIND_LABELS: Record<string, string> = {
  char: '按字符识别',
  dec: '按十进制码位识别',
  hex: '按十六进制码位识别',
};

/**
 * ASCII 码表查询器：字符 ↔ 码位双向检索、分类 / 关键字筛选、
 * Ctrl 组合键速查，全部在浏览器本地完成
 *
 * @returns ASCII 码表交互界面
 */
const AsciiTable: React.FC<ToolComponentProps> = () => {
  const [lookupInput, setLookupInput] = React.useState('A');
  const [category, setCategory] = React.useState<CategoryFilter>('all');
  const [keyword, setKeyword] = React.useState('');

  const lookupResult = React.useMemo(() => lookupAscii(lookupInput), [lookupInput]);
  const filteredRows = React.useMemo(() => filterAscii(category, keyword), [category, keyword]);
  const ctrlCombos = React.useMemo(() => getCtrlCombos(), []);
  const commonKeys = React.useMemo(() => getCommonKeys(), []);

  const copyText = (text: string, successMessage = '已复制到剪贴板') => {
    navigator.clipboard
      .writeText(text)
      .then(() => message.success(successMessage))
      .catch(() => message.error('复制失败，请手动选择复制'));
  };

  const columns: ColumnsType<AsciiEntry> = [
    { title: 'Dec', dataIndex: 'dec', width: 70, sorter: (a, b) => a.dec - b.dec, defaultSortOrder: 'ascend' },
    {
      title: 'Hex',
      dataIndex: 'hex',
      width: 80,
      render: (hex: string) => <span className={styles.monoCell}>0x{hex}</span>,
    },
    { title: 'Oct', dataIndex: 'oct', width: 80, render: (oct: string) => <span className={styles.monoCell}>{oct}</span> },
    { title: 'Bin', dataIndex: 'bin', width: 100, render: (bin: string) => <span className={styles.monoCell}>{bin}</span> },
    {
      title: 'Char',
      dataIndex: 'display',
      width: 90,
      render: (display: string, record) => (
        <span className={styles.charCell}>{record.category === 'printable' ? record.char || '␠' : display}</span>
      ),
    },
    {
      title: '缩写',
      dataIndex: 'abbr',
      width: 90,
      render: (abbr: string) => (abbr ? <Tag>{abbr}</Tag> : null),
    },
    { title: '说明', dataIndex: 'description' },
  ];

  return (
    <div className={styles.container}>
      <Card title="字符 / 码位双向检索">
        <Input
          size="large"
          allowClear
          prefix={<SearchOutlined />}
          value={lookupInput}
          onChange={(event) => setLookupInput(event.target.value)}
          placeholder={LOOKUP_PLACEHOLDER}
        />
        <p className={styles.hint}>支持单个字符（含空格）、十进制（65）、十六进制（0x41 或 41h）；范围限 US-ASCII 0–127。</p>

        {lookupResult.error ? (
          <Alert type="warning" showIcon message="无法检索" description={lookupResult.error} />
        ) : lookupResult.entry ? (
          <div className={styles.lookupResult}>
            <span className={styles.charCell} style={{ fontSize: 28, minWidth: 48, textAlign: 'center' }}>
              {lookupResult.entry.category === 'printable' ? lookupResult.entry.char || '␠' : lookupResult.entry.abbr}
            </span>
            <span className={styles.lookupField}>
              识别方式
              <strong>{lookupResult.kind ? KIND_LABELS[lookupResult.kind] : ''}</strong>
            </span>
            <span className={styles.lookupField}>
              十进制 Dec
              <strong>{lookupResult.entry.dec}</strong>
            </span>
            <span className={styles.lookupField}>
              十六进制 Hex
              <strong>0x{lookupResult.entry.hex}</strong>
            </span>
            <span className={styles.lookupField}>
              八进制 Oct
              <strong>{lookupResult.entry.oct}</strong>
            </span>
            <span className={styles.lookupField}>
              二进制 Bin
              <strong>{lookupResult.entry.bin}</strong>
            </span>
            <span className={styles.lookupField}>
              说明
              <strong style={{ fontFamily: 'inherit' }}>{lookupResult.entry.description}</strong>
            </span>
            <Button
              size="small"
              icon={<CopyOutlined />}
              onClick={() => copyText(formatEntryForCopy(lookupResult.entry as AsciiEntry))}
            >
              复制
            </Button>
          </div>
        ) : null}
      </Card>

      <Card title="常用控制键与 Ctrl 组合速查">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
          {commonKeys.map((entry) => (
            <Tag
              key={entry.dec}
              color="blue"
              style={{ cursor: 'pointer', fontFamily: 'ui-monospace, monospace' }}
              onClick={() => copyText(formatEntryForCopy(entry))}
            >
              {entry.abbr} 0x{entry.hex}（{entry.dec}）
            </Tag>
          ))}
        </div>
        <p className={styles.hint}>Ctrl+A…Ctrl+Z 对应码位 1–26（字母码位与 0x1F 按位与），点击标签可复制：</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {ctrlCombos.map((combo) => (
            <Tag
              key={combo.combo}
              style={{ cursor: 'pointer', fontFamily: 'ui-monospace, monospace' }}
              onClick={() => copyText(`${combo.combo} -> 0x${combo.code.toString(16).toUpperCase().padStart(2, '0')} (${combo.code})`)}
            >
              {combo.combo}=0x{combo.code.toString(16).toUpperCase().padStart(2, '0')}
            </Tag>
          ))}
        </div>
      </Card>

      <Card title="标准 ASCII 码表（0–127）">
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
            placeholder="搜索缩写 / 说明 / 字符 / 码位（如 CR、换行、65、0x41）"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
          />
        </div>
        <p className={styles.hint}>共 {filteredRows.length} 行；点击任意行可复制该字符的完整码位信息。空格以 ␠ 显示。</p>
        <Table<AsciiEntry>
          rowKey="dec"
          size="small"
          columns={columns}
          dataSource={filteredRows}
          pagination={{ pageSize: TABLE_PAGE_SIZE, showSizeChanger: false, showTotal: (total) => `共 ${total} 行` }}
          onRow={(record) => ({
            className: styles.clickableRow,
            onClick: () => copyText(formatEntryForCopy(record)),
          })}
        />
      </Card>
    </div>
  );
};

export default AsciiTable;
