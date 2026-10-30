'use client';

import React from 'react';
import { Alert, Button, Card, Input, Radio, Space, Switch, Tag } from 'antd';
import { ClearOutlined, CopyOutlined, ReloadOutlined } from '@ant-design/icons';
import { copyToClipboard } from '@/lib/utils';
import type { ToolComponentProps } from '../loaders';
import {
  buildSqlInserts,
  parseCsv,
  type CsvDelimiter,
  type IdentifierQuote,
  type NullMode,
} from './utils/csv-sql';
import {
  DEFAULT_BATCH_SIZE,
  DEFAULT_CSV,
  DEFAULT_TABLE,
  DELIMITER_OPTIONS,
  NULL_MODE_OPTIONS,
  QUOTE_OPTIONS,
} from './constants';
import styles from './index.module.css';

/**
 * CSV 转 SQL INSERT 生成器：在浏览器本地解析 CSV（RFC 4180，支持引号与转义），
 * 按自定义表名 / 列名 / 批大小 / 标识符引号风格 / NULL 策略生成 INSERT 语句
 *
 * @param props - 工具组件属性
 * @param props.defaultInput - 可选默认 CSV 输入
 * @returns CSV → SQL 生成界面
 */
const CsvToSql: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [csv, setCsv] = React.useState<string>(defaultInput || DEFAULT_CSV);
  const [table, setTable] = React.useState<string>(DEFAULT_TABLE);
  const [columnOverride, setColumnOverride] = React.useState<string>('');
  const [delimiter, setDelimiter] = React.useState<CsvDelimiter>('auto');
  const [quote, setQuote] = React.useState<IdentifierQuote>('backtick');
  const [nullMode, setNullMode] = React.useState<NullMode>('empty-to-null');
  const [nullKeyword, setNullKeyword] = React.useState<boolean>(true);
  const [batchSize, setBatchSize] = React.useState<number>(DEFAULT_BATCH_SIZE);

  const parsed = React.useMemo(() => {
    try {
      return { table: parseCsv(csv, delimiter), error: null as string | null };
    } catch (caught) {
      return { table: null, error: caught instanceof Error ? caught.message : 'CSV 解析失败' };
    }
  }, [csv, delimiter]);

  const result = React.useMemo<{ sql: string } | { error: string } | null>(() => {
    if (!parsed.table) {
      return null;
    }
    const columns = columnOverride
      .split(',')
      .map((column) => column.trim())
      .filter((column) => column.length > 0);
    try {
      const sql = buildSqlInserts(parsed.table, {
        table,
        columns: columns.length > 0 ? columns : undefined,
        batchSize,
        quote,
        nullMode,
        nullKeyword,
      });
      return { sql };
    } catch (caught) {
      return { error: caught instanceof Error ? caught.message : 'SQL 生成失败' };
    }
  }, [parsed.table, table, columnOverride, batchSize, quote, nullMode, nullKeyword]);

  const copy = async (value: string) => {
    await copyToClipboard(value);
  };

  return (
    <div className={styles.container}>
      <Card title="CSV 转 SQL INSERT 生成器">
        <div className={styles.formColumn}>
          <span className={styles.label}>CSV 内容（首行为列名，支持引号包裹与 "" 转义）</span>
          <Input.TextArea
            className={styles.inputArea}
            value={csv}
            onChange={(event) => setCsv(event.target.value)}
            autoSize={{ minRows: 6, maxRows: 16 }}
            spellCheck={false}
          />
          <Space wrap>
            <Tag color="blue">{parsed.table ? `${parsed.table.headers.length} 列` : '-'}</Tag>
            <Tag color="geekblue">{parsed.table ? `${parsed.table.rows.length} 行数据` : '-'}</Tag>
          </Space>
        </div>

        <div className={styles.optionGrid}>
          <div className={styles.optionItem}>
            <span className={styles.label}>表名</span>
            <Input value={table} onChange={(event) => setTable(event.target.value)} placeholder="users" />
          </div>
          <div className={styles.optionItem}>
            <span className={styles.label}>自定义列名（逗号分隔，留空用 CSV 首行）</span>
            <Input
              value={columnOverride}
              onChange={(event) => setColumnOverride(event.target.value)}
              placeholder="id, name, email"
            />
          </div>
          <div className={styles.optionItem}>
            <span className={styles.label}>每条 INSERT 的行数（0 = 合并为一条）</span>
            <Input
              type="number"
              min={0}
              value={batchSize}
              onChange={(event) => setBatchSize(Math.max(0, Number(event.target.value)))}
              style={{ width: 160 }}
            />
          </div>
        </div>

        <div className={styles.formColumn}>
          <span className={styles.label}>列分隔符</span>
          <Radio.Group
            optionType="button"
            buttonStyle="solid"
            value={delimiter}
            onChange={(event) => setDelimiter(event.target.value as CsvDelimiter)}
            options={DELIMITER_OPTIONS.map((item) => ({ label: item.label, value: item.value }))}
          />
        </div>
        <div className={styles.formColumn}>
          <span className={styles.label}>标识符引号风格</span>
          <Radio.Group
            optionType="button"
            buttonStyle="solid"
            value={quote}
            onChange={(event) => setQuote(event.target.value as IdentifierQuote)}
            options={QUOTE_OPTIONS.map((item) => ({ label: item.label, value: item.value }))}
          />
        </div>
        <div className={styles.formColumn}>
          <span className={styles.label}>空值处理</span>
          <Space wrap>
            <Radio.Group
              optionType="button"
              buttonStyle="solid"
              value={nullMode}
              onChange={(event) => setNullMode(event.target.value as NullMode)}
              options={NULL_MODE_OPTIONS.map((item) => ({ label: item.label, value: item.value }))}
            />
            <span className={styles.switchLabel}>
              <Switch checked={nullKeyword} onChange={setNullKeyword} size="small" /> 识别 NULL 字样
            </span>
          </Space>
        </div>

        <Space>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => {
              setCsv(defaultInput || DEFAULT_CSV);
              setTable(DEFAULT_TABLE);
              setColumnOverride('');
              setBatchSize(DEFAULT_BATCH_SIZE);
            }}
          >
            载入示例
          </Button>
          <Button icon={<ClearOutlined />} onClick={() => setCsv('')}>
            清空
          </Button>
        </Space>

        {parsed.error ? <Alert type="error" showIcon message={parsed.error} style={{ marginTop: 12 }} /> : null}
        {result && 'error' in result ? (
          <Alert type="error" showIcon message={result.error} style={{ marginTop: 12 }} />
        ) : null}
      </Card>

      <Card
        title="生成的 SQL"
        extra={
          result && 'sql' in result && result.sql ? (
            <Button size="small" icon={<CopyOutlined />} onClick={() => copy(result.sql)}>
              复制
            </Button>
          ) : null
        }
      >
        {result && 'sql' in result ? (
          result.sql ? (
            <pre className={styles.output}>{result.sql}</pre>
          ) : (
            <div className={styles.hint}>CSV 只有表头，没有数据行。</div>
          )
        ) : (
          <div className={styles.hint}>输入合法的 CSV 后自动生成 INSERT 语句。</div>
        )}
        <div className={styles.hint}>
          解析遵循 RFC 4180：支持双引号包裹字段、字段内逗号 / 换行、双引号用 "" 转义。数字保持裸字面量，
          单引号按 SQL 标准双写转义。所有数据仅在浏览器本地处理，不会上传。
        </div>
      </Card>
    </div>
  );
};

export default CsvToSql;
