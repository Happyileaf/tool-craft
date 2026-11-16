'use client';

import React from 'react';
import { Alert, Button, Card, Input, Select, Space, Table, Tag, Typography, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { CopyOutlined } from '@ant-design/icons';
import type { ToolComponentProps } from '../loaders';
import { AUTO_DETECT, DEFAULT_SAMPLE, STYLE_OPTIONS, type PlaceholderStyle } from './constants';
import { convertPlaceholders, type ParamEntry } from './utils/sql';
import { copyToClipboard } from '@/lib/utils';
import styles from './index.module.css';

const { Text } = Typography;

const kindColor: Record<string, string> = {
  positional: 'gold',
  numbered: 'blue',
  named: 'green',
};

const columns: ColumnsType<ParamEntry> = [
  { title: '序号', dataIndex: 'index', width: 80, align: 'center' },
  { title: '参数名', dataIndex: 'name', width: 200 },
  { title: '绑定次数', dataIndex: 'bindings', width: 100, align: 'center' },
];

/**
 * SQL 参数占位符风格转换器
 *
 * 词法扫描 SQL 中的参数占位符，在 ? / %s / $n / :n / @pN / :name / @name /
 * %(name)s / {{name}} 九种风格之间互转，自动跳过字符串字面量、标识符与注释，
 * 全部处理在浏览器本地完成，不上传 SQL。
 */
const SqlParameterPlaceholderConverter: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [source, setSource] = React.useState<PlaceholderStyle | typeof AUTO_DETECT>(AUTO_DETECT);
  const [target, setTarget] = React.useState<PlaceholderStyle>('dollar-number');
  const [prefix, setPrefix] = React.useState('p');
  const [input, setInput] = React.useState(defaultInput || DEFAULT_SAMPLE);

  const result = React.useMemo(
    () => convertPlaceholders(input, source, target, prefix),
    [input, source, target, prefix],
  );

  const handleCopy = () => {
    if (result.error || result.sql === '') {
      message.error('暂无可复制的结果');
      return;
    }
    copyToClipboard(result.sql);
    message.success('已复制转换后的 SQL');
  };

  const selectOptions = [
    { value: AUTO_DETECT, label: '自动识别（仅单一风格）' },
    ...STYLE_OPTIONS.map((meta) => ({ value: meta.style, label: `${meta.label}（${meta.sample}）` })),
  ];

  return (
    <div className={styles.container}>
      <Card className={styles.card} title="输入 SQL（占位符在本地词法扫描，不上传）">
        <div className={styles.controls}>
          <Space wrap size="middle">
            <span className={styles.controlLabel}>源风格</span>
            <Select
              value={source}
              style={{ width: 300 }}
              options={selectOptions}
              onChange={(value) => setSource(value as PlaceholderStyle | typeof AUTO_DETECT)}
            />
            <span className={styles.controlLabel}>目标风格</span>
            <Select
              value={target}
              style={{ width: 300 }}
              options={STYLE_OPTIONS.map((meta) => ({ value: meta.style, label: meta.label }))}
              onChange={(value) => setTarget(value as PlaceholderStyle)}
            />
            <span className={styles.controlLabel}>命名前缀</span>
            <Input
              value={prefix}
              style={{ width: 120 }}
              placeholder="p"
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPrefix(e.target.value)}
            />
            <Button size="small" onClick={() => setInput(DEFAULT_SAMPLE)}>
              示例
            </Button>
            <Button size="small" onClick={() => setInput('')}>
              清空
            </Button>
          </Space>
        </div>
        <Input.TextArea
          value={input}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInput(e.target.value)}
          spellCheck={false}
          className={styles.editor}
          autoSize={{ minRows: 10, maxRows: 20 }}
          placeholder="粘贴含参数占位符的 SQL，支持字符串、注释、美元引用等语法…"
        />
      </Card>

      {result.error ? (
        <Alert type="error" showIcon className={styles.alert} message="转换失败" description={result.error} />
      ) : (
        <Card
          className={styles.card}
          title="转换结果"
          extra={
            <Button size="small" icon={<CopyOutlined />} onClick={handleCopy}>
              复制 SQL
            </Button>
          }
        >
          <Input.TextArea
            value={result.sql}
            readOnly
            spellCheck={false}
            className={styles.editor}
            autoSize={{ minRows: 10, maxRows: 20 }}
          />
          <div className={styles.meta}>
            <Space wrap>
              {result.detectedStyle ? (
                <Tag color="purple">
                  源风格：{STYLE_OPTIONS.find((m) => m.style === result.detectedStyle)?.label}
                </Tag>
              ) : null}
              <Tag color={kindColor[STYLE_OPTIONS.find((m) => m.style === target)?.kind ?? 'positional']}>
                目标类别：{STYLE_OPTIONS.find((m) => m.style === target)?.kind}
              </Tag>
              <Tag>逻辑参数 {result.params.length} 项</Tag>
              <Tag>占位符绑定 {result.totalBindings} 次</Tag>
            </Space>
          </div>
          {result.warnings.length > 0
            ? result.warnings.map((warning, index) => (
                <Alert
                  key={`${index}-${warning}`}
                  type="warning"
                  showIcon
                  className={styles.alert}
                  message={warning}
                />
              ))
            : null}
          <Table<ParamEntry>
            className={styles.table}
            rowKey="index"
            size="small"
            pagination={false}
            columns={columns}
            dataSource={result.params}
          />
          <Text type="secondary" className={styles.footnote}>
            位置式与编号式占位符按出现顺序生成参数名（前缀 + 序号）；命名式同名重复复用同一逻辑参数；
            转换为位置式时每次绑定独立展开。字符串字面量、引号标识符、行 / 块注释与美元引用内的符号不会被改写。
          </Text>
        </Card>
      )}
    </div>
  );
};

export default SqlParameterPlaceholderConverter;
