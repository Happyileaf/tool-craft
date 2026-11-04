'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import {
  Alert,
  Button,
  Card,
  Input,
  Radio,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  message,
} from 'antd';
import { ClearOutlined, CopyOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import {
  DEFAULT_DDL_OPTIONS,
  generateDdl,
  inferColumns,
  parseJsonRecords,
  type ColumnInference,
  type DdlOptions,
  type SqlDialect,
} from './utils/ddl';
import {
  DEFAULT_JSON_INPUT,
  DEFAULT_TABLE_NAME,
  DIALECT_OPTIONS,
  TEXT_THRESHOLD_OPTIONS,
} from './constants';
import { copyToClipboard } from '@/lib/utils';
import styles from './index.module.css';

/** 推断结果表格行 */
interface ColumnRow {
  /** 行键 */
  key: string;
  /** 原始字段名 */
  sourceName: string;
  /** 列名 */
  columnName: string;
  /** 逻辑类型 */
  kind: string;
  /** VARCHAR 长度 */
  maxLength: string;
  /** 是否 NOT NULL */
  notNull: boolean;
}

/**
 * 把推断结果转换为表格行
 *
 * @param columns - 列推断结果
 * @returns 表格行
 */
function toRows(columns: ColumnInference[]): ColumnRow[] {
  return columns.map((column) => ({
    key: column.sourceName,
    sourceName: column.sourceName,
    columnName: column.columnName,
    kind: column.kind,
    maxLength: column.maxLength === null ? '—' : String(column.maxLength),
    notNull: column.notNull,
  }));
}

const COLUMN_TABLE_COLUMNS: ColumnsType<ColumnRow> = [
  { title: 'JSON 字段', dataIndex: 'sourceName', key: 'sourceName' },
  { title: 'SQL 列名', dataIndex: 'columnName', key: 'columnName' },
  { title: '推断类型', dataIndex: 'kind', key: 'kind' },
  { title: '长度', dataIndex: 'maxLength', key: 'maxLength', align: 'right' },
  {
    title: '可空性',
    dataIndex: 'notNull',
    key: 'notNull',
    render: (notNull: boolean) =>
      notNull ? <Tag color="green">NOT NULL</Tag> : <Tag>NULL</Tag>,
  },
];

/**
 * JSON → SQL CREATE TABLE（DDL）生成器
 *
 * 粘贴单条对象或对象数组，自动推断列类型、长度、可空性与 snake_case 列名，
 * 按 MySQL / PostgreSQL / SQLite 方言生成可直接执行的建表语句。
 * 全部推断与生成在浏览器本地完成，不发起任何网络请求。
 *
 * @param props - 工具组件属性
 * @returns DDL 生成交互界面
 */
const JsonToSqlDdl: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [jsonInput, setJsonInput] = React.useState<string>(defaultInput || DEFAULT_JSON_INPUT);
  const [dialect, setDialect] = React.useState<SqlDialect>('mysql');
  const [tableName, setTableName] = React.useState<string>(DEFAULT_TABLE_NAME);
  const [withPrimaryKey, setWithPrimaryKey] = React.useState<boolean>(true);
  const [snakeCase, setSnakeCase] = React.useState<boolean>(true);
  const [varcharPadding, setVarcharPadding] = React.useState<boolean>(true);
  const [useTextThreshold, setUseTextThreshold] = React.useState<number | null>(500);
  const [ifNotExists, setIfNotExists] = React.useState<boolean>(false);
  const [dropTable, setDropTable] = React.useState<boolean>(false);
  const [withComments, setWithComments] = React.useState<boolean>(true);
  const [columns, setColumns] = React.useState<ColumnInference[]>([]);
  const [ddl, setDdl] = React.useState<string>('');
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (jsonInput.trim() === '') {
      setColumns([]);
      setDdl('');
      setError('请输入 JSON 内容');
      return;
    }
    try {
      const records = parseJsonRecords(jsonInput);
      const inferred = inferColumns(records, snakeCase, useTextThreshold, varcharPadding);
      const options: DdlOptions = {
        ...DEFAULT_DDL_OPTIONS,
        dialect,
        tableName: tableName.trim() === '' ? DEFAULT_TABLE_NAME : tableName,
        withPrimaryKey,
        snakeCase,
        varcharPadding,
        useTextThreshold,
        ifNotExists,
        dropTable,
        withComments,
      };
      setColumns(inferred);
      setDdl(generateDdl(inferred, options));
      setError(null);
    } catch (caught) {
      setColumns([]);
      setDdl('');
      setError(caught instanceof Error ? caught.message : '生成失败');
    }
  }, [
    jsonInput,
    dialect,
    tableName,
    withPrimaryKey,
    snakeCase,
    varcharPadding,
    useTextThreshold,
    ifNotExists,
    dropTable,
    withComments,
  ]);

  /**
   * 复制生成的 DDL
   */
  const handleCopy = async () => {
    if (error || ddl === '') {
      message.warning('请先修正输入后再复制');
      return;
    }
    await copyToClipboard(ddl);
    message.success('DDL 已复制');
  };

  return (
    <div className={styles.container}>
      <div className={styles.controls}>
        <div className={styles.controlItem}>
          <span className={styles.controlLabel}>SQL 方言</span>
          <Radio.Group
            value={dialect}
            onChange={(event) => setDialect(event.target.value as SqlDialect)}
            optionType="button"
            buttonStyle="solid"
            options={DIALECT_OPTIONS}
          />
        </div>
        <div className={styles.controlItem}>
          <span className={styles.controlLabel}>表名</span>
          <Input
            value={tableName}
            onChange={(event) => setTableName(event.target.value)}
            placeholder="my_table"
            style={{ width: 200 }}
          />
        </div>
        <div className={styles.controlItem}>
          <span className={styles.controlLabel}>长字符串处理</span>
          <Select
            value={useTextThreshold}
            onChange={(value) => setUseTextThreshold(value)}
            options={TEXT_THRESHOLD_OPTIONS}
            style={{ width: 240 }}
          />
        </div>
        <Space>
          <Button icon={<ClearOutlined />} onClick={() => setJsonInput('')}>
            清空
          </Button>
          <Button type="primary" icon={<CopyOutlined />} onClick={handleCopy}>
            复制 DDL
          </Button>
        </Space>
      </div>

      <div className={styles.switchRow}>
        <Space>
          <span>自增主键</span>
          <Switch checked={withPrimaryKey} onChange={setWithPrimaryKey} size="small" />
        </Space>
        <Space>
          <span>snake_case 命名</span>
          <Switch checked={snakeCase} onChange={setSnakeCase} size="small" />
        </Space>
        <Space>
          <span>VARCHAR 长度余量</span>
          <Switch checked={varcharPadding} onChange={setVarcharPadding} size="small" />
        </Space>
        <Space>
          <span>IF NOT EXISTS</span>
          <Switch checked={ifNotExists} onChange={setIfNotExists} size="small" />
        </Space>
        <Space>
          <span>DROP TABLE 前缀</span>
          <Switch checked={dropTable} onChange={setDropTable} size="small" />
        </Space>
        <Space>
          <span>列注释</span>
          <Switch checked={withComments} onChange={setWithComments} size="small" />
        </Space>
      </div>

      {error ? <Alert type="error" showIcon message="无法生成 DDL" description={error} style={{ marginBottom: 16 }} /> : null}

      <div className={styles.panels}>
        <Card title="JSON 样本输入（对象或对象数组）" className={styles.panel}>
          <Input.TextArea
            className={styles.editor}
            value={jsonInput}
            onChange={(event) => setJsonInput(event.target.value)}
            autoSize={{ minRows: 16, maxRows: 28 }}
            spellCheck={false}
          />
        </Card>
        <Card
          title="生成的 DDL"
          className={styles.panel}
          extra={
            columns.length > 0 ? (
              <Tag className={styles.summaryTag} color="blue">
                {columns.length} 列
              </Tag>
            ) : null
          }
        >
          <pre className={styles.ddlOutput}>{error ? '' : ddl}</pre>
        </Card>
      </div>

      {columns.length > 0 ? (
        <Card title="类型推断明细" style={{ marginTop: 16 }}>
          <Table<ColumnRow>
            columns={COLUMN_TABLE_COLUMNS}
            dataSource={toRows(columns)}
            pagination={false}
            size="small"
          />
        </Card>
      ) : null}
    </div>
  );
};

export default JsonToSqlDdl;
