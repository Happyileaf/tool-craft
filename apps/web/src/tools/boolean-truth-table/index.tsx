'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Button, Card, Input, Table, Tag, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { CopyOutlined } from '@ant-design/icons';
import {
  buildTruthTable,
  type ExpressionProperty,
  type TableRow,
} from './utils/boolean';
import { DEFAULT_INPUT } from './constants';
import { copyToClipboard } from '@/lib/utils';
import styles from './index.module.css';

interface TableData extends TableRow {
  key: number;
}

const PROPERTY_META: Record<ExpressionProperty, { label: string; color: string }> = {
  tautology: { label: '重言式（永真）', color: 'green' },
  contradiction: { label: '矛盾式（永假）', color: 'red' },
  contingent: { label: '可满足式', color: 'blue' },
};

const BooleanTruthTable: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [input, setInput] = React.useState(defaultInput || DEFAULT_INPUT);

  const result = React.useMemo(() => buildTruthTable(input), [input]);

  const dataSource: TableData[] = React.useMemo(
    () => result.rows.map((row, index) => ({ key: index, ...row })),
    [result],
  );

  const columns: ColumnsType<TableData> = React.useMemo(() => {
    const variableColumns: ColumnsType<TableData> = result.variables.map((name, index) => ({
      title: <span className={styles.varHeader}>{name}</span>,
      dataIndex: ['assignment', index],
      key: `var-${name}`,
      align: 'center',
      width: 72,
      render: (value: boolean) =>
        value ? (
          <span className={styles.tableCellTrue}>T</span>
        ) : (
          <span className={styles.tableCellFalse}>F</span>
        ),
    }));
    const expressionColumns: ColumnsType<TableData> = result.expressions.map((expression, index) => ({
      title: expression,
      dataIndex: ['results', index],
      key: `expr-${index}`,
      align: 'center',
      render: (value: boolean) =>
        value ? (
          <span className={styles.tableCellTrue}>T</span>
        ) : (
          <span className={styles.tableCellFalse}>F</span>
        ),
    }));
    return [...variableColumns, ...expressionColumns];
  }, [result]);

  const tableText = React.useMemo(() => {
    if (result.error) {
      return '';
    }
    const header = [...result.variables, ...result.expressions].join('\t');
    const body = result.rows
      .map((row) =>
        [
          ...row.assignment.map((v) => (v ? 'T' : 'F')),
          ...row.results.map((v) => (v ? 'T' : 'F')),
        ].join('\t'),
      )
      .join('\n');
    return `${header}\n${body}`;
  }, [result]);

  const handleCopy = () => {
    if (tableText === '') {
      message.error('暂无可复制的结果');
      return;
    }
    copyToClipboard(tableText);
    message.success('已复制真值表（制表符分隔）');
  };

  return (
    <div className={styles.container}>
      <div className={styles.panels}>
        <Card className={styles.card} title="输入表达式（每行一条，2–8 个变量）">
          <Input.TextArea
            value={input}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInput(e.target.value)}
            spellCheck={false}
            className={styles.editor}
            autoSize={{ minRows: 12, maxRows: 22 }}
            placeholder={'例如：\nA AND B\nA OR NOT A\n(A -> B) <-> (NOT A OR B)'}
          />
        </Card>

        <Card
          className={styles.card}
          title="真值表"
          extra={
            <Button size="small" icon={<CopyOutlined />} onClick={handleCopy}>
              复制
            </Button>
          }
        >
          {result.error ? (
            <Alert type="error" showIcon message={result.error} />
          ) : (
            <div className={styles.tableWrapper}>
              <Table<TableData>
                className={styles.table}
                columns={columns}
                dataSource={dataSource}
                pagination={false}
                size="small"
                bordered
              />
            </div>
          )}
        </Card>
      </div>

      {!result.error && result.expressions.length > 0 ? (
        <div className={styles.toolbar}>
          {result.expressions.map((expression, index) => {
            const meta = PROPERTY_META[result.properties[index] ?? 'contingent'];
            return (
              <Tag key={`${index}-${expression}`} color={meta.color}>
                {expression}：{meta.label}
              </Tag>
            );
          })}
        </div>
      ) : null}

      <div className={styles.toolbar}>
        <Tag color="geekblue">2–8 变量 · 2^n 枚举</Tag>
        <span className={styles.hint}>
          支持 AND/OR/NOT/XOR（&amp;、|、!、^ 等写法）、蕴含 -&gt;、等价 &lt;-&gt; 与括号；优先级 NOT &gt; AND
          &gt; XOR &gt; OR &gt; 蕴含 &gt; 等价，蕴含右结合；全部计算在浏览器本地完成
        </span>
      </div>
    </div>
  );
};

export default BooleanTruthTable;
