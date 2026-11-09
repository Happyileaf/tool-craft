'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Button, Card, Empty, Input, Radio, Space, Statistic, Table, Tag, message } from 'antd';
import { ClearOutlined, CopyOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import {
  parseLogfmt,
  formatLogfmt,
  type LogfmtField,
  type ParsedLogfmtLine,
} from './utils/logfmt';
import {
  DEFAULT_INPUT,
  DEFAULT_JSON_INPUT,
  INPUT_ROWS,
  MAX_TABLE_ROWS,
  MODE_OPTIONS,
  TYPE_LABELS,
  TYPE_TAG_COLORS,
  VIEW_OPTIONS,
  type ParseView,
  type ToolMode,
} from './constants';
import { copyToClipboard } from '@/lib/utils';
import styles from './index.module.css';

/** 字段筛选：返回该记录内是否包含名称含关键字的字段 */
function lineMatchesKeyword(line: ParsedLogfmtLine, keyword: string): boolean {
  if (keyword === '') {
    return true;
  }
  return line.fields.some((field) => field.key.toLowerCase().includes(keyword));
}

/** 展开行内的字段表格列定义 */
const fieldColumns: ColumnsType<LogfmtField> = [
  {
    title: '字段名',
    dataIndex: 'key',
    width: 200,
    render: (key: string) => <span className={styles.fieldKey}>{key}</span>,
  },
  {
    title: '原始值',
    dataIndex: 'rawValue',
    render: (rawValue: string) => <span className={styles.fieldValue}>{rawValue || '（空）'}</span>,
  },
  {
    title: '推断类型',
    dataIndex: 'type',
    width: 120,
    render: (type: string) => (
      <Tag color={TYPE_TAG_COLORS[type] ?? 'default'}>{TYPE_LABELS[type] ?? type}</Tag>
    ),
  },
];

/**
 * logfmt 日志解析与格式化工具：key=value 双向转换与轻量类型推断，
 * 全部在浏览器本地完成，不发起任何网络请求
 *
 * @param props - 工具组件属性
 * @param props.defaultInput - 可选默认输入
 * @returns logfmt 解析 / 格式化交互界面
 */
const LogfmtParserFormatter: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [mode, setMode] = React.useState<ToolMode>('parse');
  const [parseInput, setParseInput] = React.useState<string>(defaultInput || DEFAULT_INPUT);
  const [formatInput, setFormatInput] = React.useState<string>(DEFAULT_JSON_INPUT);
  const [view, setView] = React.useState<ParseView>('table');
  const [keyword, setKeyword] = React.useState<string>('');

  const parseResult = React.useMemo(() => parseLogfmt(parseInput), [parseInput]);
  const formatResult = React.useMemo(() => formatLogfmt(formatInput), [formatInput]);

  const normalizedKeyword = keyword.trim().toLowerCase();
  const filteredLines = React.useMemo(
    () => parseResult.lines.filter((line) => lineMatchesKeyword(line, normalizedKeyword)),
    [parseResult.lines, normalizedKeyword],
  );

  const handleCopy = (text: string, label: string) => {
    if (text.trim() === '') {
      message.error('暂无可复制的结果');
      return;
    }
    copyToClipboard(text);
    message.success(`已复制${label}`);
  };

  const recordColumns: ColumnsType<ParsedLogfmtLine> = [
    {
      title: '#',
      dataIndex: 'lineNo',
      width: 64,
    },
    {
      title: '字段数',
      width: 90,
      render: (_, record) => record.fields.length,
    },
    {
      title: '字段预览',
      render: (_, record) => (
        <Space size={[4, 4]} wrap>
          {record.fields.slice(0, 6).map((field, index) => (
            <Tag key={`${field.key}-${index}`}>
              {field.key}
              {field.value === true ? '' : `=${field.rawValue}`}
            </Tag>
          ))}
          {record.fields.length > 6 ? <Tag>+{record.fields.length - 6}</Tag> : null}
        </Space>
      ),
    },
    {
      title: '状态',
      dataIndex: 'errors',
      width: 96,
      render: (errors: string[]) =>
        errors.length > 0 ? <Tag color="red">异常</Tag> : <Tag color="green">正常</Tag>,
    },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        <Radio.Group
          optionType="button"
          buttonStyle="solid"
          value={mode}
          options={MODE_OPTIONS.map((option) => ({ value: option.value, label: option.label }))}
          onChange={(event) => setMode(event.target.value as ToolMode)}
        />
        <span className={styles.hint}>
          {MODE_OPTIONS.find((option) => option.value === mode)?.hint}
        </span>
      </div>

      {mode === 'parse' ? (
        <>
          <Card
            title="logfmt 输入"
            extra={
              <Space>
                <Button size="small" onClick={() => setParseInput(DEFAULT_INPUT)}>
                  载入示例
                </Button>
                <Button
                  size="small"
                  icon={<CopyOutlined />}
                  onClick={() => handleCopy(parseInput, '输入内容')}
                >
                  复制原文
                </Button>
                <Button
                  size="small"
                  icon={<ClearOutlined />}
                  onClick={() => setParseInput('')}
                >
                  清空
                </Button>
              </Space>
            }
          >
            <Input.TextArea
              value={parseInput}
              onChange={(event) => setParseInput(event.target.value)}
              rows={INPUT_ROWS}
              spellCheck={false}
              className={styles.editor}
              placeholder="粘贴 logfmt 日志，每行一条 key=value 记录，支持引号值与反斜杠转义"
            />
            <p className={styles.hint}>
              裸键（无等号）视为布尔 true；key= 后直接为空格或行尾视为空字符串；解析失败的行会逐行标注且不影响其他行。
            </p>
          </Card>

          <div className={styles.statGrid}>
            <div className={styles.statCard}>
              <Statistic title="记录行数" value={parseResult.summary.total} />
            </div>
            <div className={styles.statCard}>
              <Statistic title="字段总数" value={parseResult.summary.fieldCount} />
            </div>
            <div className={styles.statCard}>
              <Statistic title="异常行数" value={parseResult.summary.errorLines} />
            </div>
          </div>

          {parseResult.warnings.length > 0 ? (
            <div className={styles.warnings}>
              {parseResult.warnings.map((warning, index) => (
                <Alert
                  key={`${index}-${warning}`}
                  type="warning"
                  showIcon
                  className={styles.warningItem}
                  message={warning}
                />
              ))}
            </div>
          ) : null}

          <Card
            title="解析结果"
            extra={
              <Space>
                <Radio.Group
                  size="small"
                  optionType="button"
                  buttonStyle="solid"
                  value={view}
                  options={VIEW_OPTIONS}
                  onChange={(event) => setView(event.target.value as ParseView)}
                />
                <Button
                  size="small"
                  icon={<CopyOutlined />}
                  onClick={() =>
                    handleCopy(
                      view === 'json' ? parseResult.jsonOutput : parseInput,
                      view === 'json' ? 'JSON 结果' : '输入内容',
                    )
                  }
                >
                  复制
                </Button>
              </Space>
            }
          >
            {view === 'json' ? (
              <Input.TextArea
                value={parseResult.jsonOutput}
                readOnly
                spellCheck={false}
                className={styles.editor}
                autoSize={{ minRows: 10, maxRows: 22 }}
              />
            ) : (
              <>
                <div className={styles.filterBar} style={{ marginBottom: 12 }}>
                  <Input
                    allowClear
                    size="small"
                    style={{ width: 260 }}
                    placeholder="按字段名筛选包含该 key 的记录"
                    value={keyword}
                    onChange={(event) => setKeyword(event.target.value)}
                  />
                  <span className={styles.hint}>
                    命中 {filteredLines.length} / {parseResult.lines.length} 条记录
                  </span>
                </div>
                {parseResult.lines.length > MAX_TABLE_ROWS ? (
                  <Alert
                    type="warning"
                    showIcon
                    style={{ marginBottom: 12 }}
                    message={`结果超过 ${MAX_TABLE_ROWS} 行，表格仅渲染前 ${MAX_TABLE_ROWS} 行；解析与统计仍覆盖全部输入。`}
                  />
                ) : null}
                {filteredLines.length === 0 ? (
                  <Empty description="暂无匹配记录" />
                ) : (
                  <Table<ParsedLogfmtLine>
                    rowKey="lineNo"
                    size="small"
                    scroll={{ x: 720 }}
                    columns={recordColumns}
                    dataSource={filteredLines.slice(0, MAX_TABLE_ROWS)}
                    pagination={{ pageSize: 20, showSizeChanger: false }}
                    expandable={{
                      expandedRowRender: (record) => (
                        <div>
                          {record.errors.length > 0 ? (
                            <Alert
                              type="error"
                              showIcon
                              style={{ marginBottom: 8 }}
                              message={record.errors.join('；')}
                            />
                          ) : null}
                          <Table<LogfmtField>
                            rowKey={(field, index) => `${field.key}-${index}`}
                            size="small"
                            columns={fieldColumns}
                            dataSource={record.fields}
                            pagination={false}
                          />
                          <pre className={styles.rawText}>{record.raw}</pre>
                        </div>
                      ),
                    }}
                  />
                )}
              </>
            )}
          </Card>
        </>
      ) : (
        <Card
          title="JSON 输入（对象数组，或每行一个对象的 NDJSON）"
          extra={
            <Space>
              <Button size="small" onClick={() => setFormatInput(DEFAULT_JSON_INPUT)}>
                载入示例
              </Button>
              <Button
                size="small"
                icon={<CopyOutlined />}
                onClick={() => handleCopy(formatResult.output, 'logfmt 结果')}
                disabled={formatResult.error !== null}
              >
                复制结果
              </Button>
              <Button size="small" icon={<ClearOutlined />} onClick={() => setFormatInput('')}>
                清空
              </Button>
            </Space>
          }
        >
          <Input.TextArea
            value={formatInput}
            onChange={(event) => setFormatInput(event.target.value)}
            rows={INPUT_ROWS}
            spellCheck={false}
            className={styles.editor}
            placeholder='[{"key": "value"}]，或每行一个 JSON 对象'
          />
          <p className={styles.hint}>
            值含空格、引号、等号或为空时自动加双引号并转义；布尔 true 输出为裸键（key），false 输出 key=false。
          </p>
          {formatResult.error ? (
            <Alert type="error" showIcon message="JSON 解析错误" description={formatResult.error} />
          ) : (
            <Input.TextArea
              value={formatResult.output}
              readOnly
              spellCheck={false}
              className={styles.editor}
              autoSize={{ minRows: 10, maxRows: 22 }}
              style={{ marginTop: 12 }}
            />
          )}
        </Card>
      )}
    </div>
  );
};

export default LogfmtParserFormatter;
