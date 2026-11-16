'use client';

import React, { useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Descriptions,
  Input,
  Radio,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { CopyOutlined, ReloadOutlined } from '@ant-design/icons';
import { copyToClipboard } from '@/lib/utils';
import type { ToolComponentProps } from '../loaders';
import {
  DIALECT_LABEL,
  DIALECT_RADIO_OPTIONS,
  DIALECT_TAG_COLOR,
  SAMPLE_MAP,
  SAMPLE_OPTIONS,
  STACK_PLACEHOLDER,
  type SampleKey,
} from './constants';
import styles from './index.module.css';
import {
  StackParseError,
  parseErrorStack,
  stackToJson,
  type StackDialect,
  type StackFrame,
} from './utils/stack';

const { Text, Title } = Typography;
const { TextArea } = Input;

const frameColumns: ColumnsType<StackFrame> = [
  { title: '#', width: 60, render: (_value, _row, index) => index + 1 },
  {
    title: '函数',
    dataIndex: 'functionName',
    width: 220,
    render: (name: string | null, row) =>
      row.unparsed ? (
        <Tag color="default">unparsed</Tag>
      ) : (
        <Text code className={styles.mono}>{name ?? '—'}</Text>
      ),
  },
  {
    title: '文件 / URL',
    dataIndex: 'filePath',
    render: (path: string | null, row) =>
      row.unparsed ? (
        <Text type="secondary" className={styles.mono}>{row.raw}</Text>
      ) : (
        <Text className={styles.mono}>{path ?? '—'}</Text>
      ),
  },
  { title: '行', dataIndex: 'line', width: 80, render: (v: number | null) => v ?? 'null' },
  { title: '列', dataIndex: 'column', width: 80, render: (v: number | null) => v ?? 'null' },
  {
    title: '标记',
    width: 200,
    render: (_v, row) => (
      <Space size={4} wrap>
        {row.isAsync ? <Tag color="purple">async</Tag> : null}
        {row.isEval ? <Tag color="magenta">eval</Tag> : null}
        {row.isNative ? <Tag color="gold">native</Tag> : null}
        {row.isInternal ? <Tag color="cyan">node:</Tag> : null}
        {row.isNodeModules ? <Tag color="geekblue">node_modules</Tag> : null}
      </Space>
    ),
  },
];

export default function ErrorStackParserTool(_props: ToolComponentProps) {
  const [stackInput, setStackInput] = useState('');
  const [dialectHint, setDialectHint] = useState<StackDialect>('unknown');
  const [hideInternal, setHideInternal] = useState(false);
  const [userCodeOnly, setUserCodeOnly] = useState(false);

  const parsed = useMemo(() => {
    if (!stackInput.trim()) {
      return null;
    }
    try {
      return { ok: true as const, result: parseErrorStack(stackInput, dialectHint) };
    } catch (error) {
      return {
        ok: false as const,
        error: error instanceof StackParseError ? error.message : '解析失败',
      };
    }
  }, [stackInput, dialectHint]);

  const visibleFrames = useMemo(() => {
    if (!parsed?.ok) {
      return [];
    }
    return parsed.result.frames.filter((frame) => {
      if (hideInternal && frame.isInternal) {
        return false;
      }
      if (userCodeOnly && (frame.isInternal || frame.isNodeModules)) {
        return false;
      }
      return true;
    });
  }, [parsed, hideInternal, userCodeOnly]);

  const handleCopyJson = async (): Promise<void> => {
    if (!parsed?.ok) {
      return;
    }
    try {
      await copyToClipboard(stackToJson(parsed.result));
      message.success('JSON 结果已复制');
    } catch {
      message.error('复制失败，请手动选择文本复制');
    }
  };

  const result = parsed?.ok ? parsed.result : null;

  return (
    <div className={styles.container}>
      <Card size="small" title="粘贴 Error.stack 原始文本">
        <Space direction="vertical" className="w-full" size={8}>
          <TextArea
            value={stackInput}
            onChange={(event) => setStackInput(event.target.value)}
            rows={10}
            placeholder={STACK_PLACEHOLDER}
            className={styles.inputArea}
          />
          <Space wrap>
            {SAMPLE_OPTIONS.map((option) => (
              <Button
                key={option.value}
                size="small"
                icon={<ReloadOutlined />}
                onClick={() => setStackInput(SAMPLE_MAP[option.value as SampleKey])}
              >
                {option.label}
              </Button>
            ))}
            <Button size="small" onClick={() => setStackInput('')}>
              清空
            </Button>
          </Space>
        </Space>
      </Card>

      <Card size="small" title="方言与过滤">
        <Space wrap size="large">
          <Radio.Group
            value={dialectHint}
            onChange={(event) => setDialectHint(event.target.value as StackDialect)}
            optionType="button"
            buttonStyle="solid"
            options={DIALECT_RADIO_OPTIONS}
          />
          <Radio checked={hideInternal} onChange={(event) => setHideInternal(event.target.checked)}>
            隐藏 node: 内置帧
          </Radio>
          <Radio checked={userCodeOnly} onChange={(event) => setUserCodeOnly(event.target.checked)}>
            仅看用户代码（排除 node_modules 与 node:）
          </Radio>
        </Space>
      </Card>

      {parsed && !parsed.ok ? (
        <Alert type="error" showIcon message="解析失败" description={parsed.error} />
      ) : null}

      {result ? (
        <>
          {result.warnings.length > 0 ? (
            <Alert
              type="warning"
              showIcon
              message="解析提示"
              description={
                <ul className={styles.warningList}>
                  {result.warnings.map((warning) => (
                    <li key={warning}>{warning}</li>
                  ))}
                </ul>
              }
            />
          ) : null}

          <Card size="small" title="错误头">
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="方言">
                <Tag color={DIALECT_TAG_COLOR[result.dialect]}>
                  {DIALECT_LABEL[result.dialect]}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="错误名">
                <Text code>{result.name ?? '（无法识别）'}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Message">
                <Text className={styles.mono}>{result.message || '（空）'}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="帧数">
                共 {result.frames.length} 帧{visibleFrames.length !== result.frames.length
                  ? `，过滤后 ${visibleFrames.length} 帧`
                  : ''}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          <Card
            size="small"
            title="帧列表"
            extra={
              <Button size="small" icon={<CopyOutlined />} onClick={handleCopyJson}>
                复制 JSON 结果
              </Button>
            }
          >
            <Table<StackFrame>
              rowKey={(row, index) => `${index}-${row.raw}`}
              columns={frameColumns}
              dataSource={visibleFrames}
              pagination={false}
              size="small"
              scroll={{ x: 900 }}
            />
          </Card>
        </>
      ) : null}

      <Title level={5} className="!mb-0">工作原理</Title>
      <Text type="secondary" className={styles.hint}>
        三家 JS 引擎的堆栈格式互不相同：V8（Chrome/Node）使用 <Text code>at func (file:line:col)</Text>，
        Firefox 与 Safari 使用 <Text code>func@file:line:col</Text>（Safari 另含 (eval)、[native code] 标记）。
        本工具按帧特征自动投票识别方言，也可手动覆盖；行列缺省为 null，Windows 路径、file:// 与 node:
        协议及查询串均原样保留。全部为本地正则/状态机解析，不上报任何错误文本。
      </Text>
    </div>
  );
}
